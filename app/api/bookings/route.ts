import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole, hasRole, type Role } from "@/lib/roles";
import { userIdFilter, resolveCanonicalUserId, userRefFilter, usersCollection } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");
const equipmentCollection = () => db.collection("equipment");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  // If email is provided, find bookings by user email (no auth required)
  if (email) {
    try {
      // Find user by email in the "user" collection
      const user = await usersCollection().findOne({ email });
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Convert user's _id to string (renterId in bookings is stored as string)
      const userIdString = user._id?.toString();

      if (!userIdString) {
        return NextResponse.json({ error: "User ID not found" }, { status: 404 });
      }

      // Find bookings where renterId matches the user's _id string
      const bookings = await bookingsCollection()
        .find({ renterId: userIdString })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({ bookings });
    } catch (error) {
      console.error("Error fetching bookings by email:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Original session-based logic (requires authentication)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] bookings GET: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  // Canonical Mongo _id (as string) of the current user.
  const userId = await resolveCanonicalUserId(session.user.id);
  // The raw session id. Older rows may have been written with this value
  // before we started canonicalizing, so match on both to stay inclusive.
  const sessionId = session.user.id;

  console.log(
    "[AUTH] bookings GET:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  // Bookings store renterId/ownerId as the user's `_id` string; include the
  // ObjectId form too so legacy rows written with ObjectId still match.
  const match: Array<ObjectId | string> = [userId, userIdFilter(userId)];
  if (sessionId !== userId) {
    match.push(sessionId, userIdFilter(sessionId));
  }

  const filter: Record<string, unknown> = {};

  if (activeRole === "owner") {
    // Bookings reference equipment via `equipmentId` (string) — there is no
    // ownerId on booking documents. Scope through the owner's equipment:
    // owner -> equipment -> booking.
    const ownerEquipment = await equipmentCollection()
      .find({ ownerId: userRefFilter(userId) })
      .project({ _id: 1 })
      .toArray();
    const equipmentIds = ownerEquipment.map((eq) => eq._id.toString());
    if (equipmentIds.length === 0) {
      return NextResponse.json({ bookings: [] });
    }
    filter.equipmentId = { $in: equipmentIds };
  } else if (activeRole === "renter") {
    filter.renterId = { $in: match };
  }
  // Admins see all bookings (no filter)

  const bookings = await bookingsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] bookings POST: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  console.log(
    "[AUTH] bookings POST:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  // Gate on the *effective* role only — the same rule the owner-side
  // booking endpoints use. A dual-role account (e.g. renter + owner, or an
  // admin also holding renter) may have activeRole "owner"/"admin" while
  // still carrying the "renter" role; those users are booking as renters,
  // so `roles.includes("renter")` alone is sufficient.
  if (!roles.includes("renter")) {
    return NextResponse.json({ error: "Renter access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // equipmentId is required and must reference a real listing so the
  // booking can be priced and attributed.
  const equipmentId =
    typeof data.equipmentId === "string"
      ? data.equipmentId.trim()
      : typeof data.equipmentId === "number"
        ? String(data.equipmentId)
        : "";

  if (!equipmentId) {
    return NextResponse.json(
      { error: "equipmentId is required" },
      { status: 400 },
    );
  }

  const startDate = typeof data.startDate === "string" ? data.startDate : null;
  const endDate = typeof data.endDate === "string" ? data.endDate : null;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  if (startDate < new Date().toISOString().split("T")[0]) {
    return NextResponse.json({ error: "Start date cannot be before today" }, { status: 400 });
  }

  if (endDate < startDate) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  // Contact number is required so the owner can reach the renter; accept the
  // common Bangladesh formats (01XXXXXXXXX / +8801XXXXXXXXX) and store it
  // normalized to 01XXXXXXXXX.
  const rawContact =
    typeof data.contactNumber === "string" ? data.contactNumber.trim() : "";
  if (!rawContact) {
    return NextResponse.json(
      { error: "Contact number is required" },
      { status: 400 },
    );
  }
  const normalizedContact = rawContact.replace(/[\s()+-]/g, "").replace(/^880/, "0");
  if (!/^01\d{9}$/.test(normalizedContact)) {
    return NextResponse.json(
      { error: "Invalid contact number (expected Bangladesh format, e.g. 01XXXXXXXXX)" },
      { status: 400 },
    );
  }

  const deliveryAddress =
    typeof data.deliveryAddress === "string" ? data.deliveryAddress.trim() : "";
  if (!deliveryAddress) {
    return NextResponse.json(
      { error: "Delivery address is required" },
      { status: 400 },
    );
  }

  // Price/name/image are always sourced from the equipment document so the
  // client can never set the amount. Newer records carry totalPrice plus
  // populated equipmentName/equipmentImage; older ones only carry amount.
  const equipment = await equipmentCollection().findOne({
    _id: userIdFilter(equipmentId),
  } as Record<string, unknown>);
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const qty = Math.max(1, Number(data.quantity) || 1);
  const price = Number(equipment.rentalPrice ?? equipment.price ?? 0);
  const totalPrice = price > 0 ? price * qty : 0;

  const doc = {
    ...data,
    equipmentId,
    contactNumber: normalizedContact,
    deliveryAddress,
    equipmentName:
      typeof equipment.name === "string" ? equipment.name : undefined,
    equipmentImage:
      typeof equipment.img === "string"
        ? equipment.img
        : typeof equipment.image === "string"
          ? equipment.image
          : undefined,
    quantity: qty,
    totalPrice,
    amount: totalPrice,
    renterId: await resolveCanonicalUserId(session.user.id),
    renterName: session.user.name,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await bookingsCollection().insertOne(doc);

  return NextResponse.json({ success: true, id: result.insertedId });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...updates } = body as { id?: string; [key: string]: unknown };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const activeRole = getActiveRole(session.user);
  const userId = await resolveCanonicalUserId(session.user.id);
  const isAdmin = hasRole(roles, "admin") && activeRole === "admin";
  console.log(
    "[AUTH] bookings PATCH:",
    { id: session.user.id, email: session.user.email, activeRole, roles, targetId: id },
  );

  // First, find the booking to verify ownership/authorization
  const booking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let authorized = false;

  if (activeRole === "owner") {
    // Owner can only update bookings for their own equipment
    // Verify by checking if the equipment belongs to this owner
    const equipment = await equipmentCollection().findOne(
      {
        _id: userIdFilter(String(booking.equipmentId)),
        ownerId: userRefFilter(userId),
      } as Record<string, unknown>,
    );
    authorized = !!equipment;

    // Owners can only update status (confirm/reject), not paymentStatus
    if (authorized && updates.status) {
      const allowedStatuses = ["pending", "confirmed", "rejected"];
      if (!allowedStatuses.includes(String(updates.status))) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      // Prevent owner from changing paymentStatus
      delete updates.paymentStatus;
    } else if (authorized) {
      // Owner trying to update other fields - restrict to status only
      const allowedKeys = ["status"];
      const updateKeys = Object.keys(updates);
      const invalidKeys = updateKeys.filter((k) => !allowedKeys.includes(k));
      if (invalidKeys.length > 0) {
        return NextResponse.json(
          { error: `Owner can only update status. Invalid fields: ${invalidKeys.join(", ")}` },
          { status: 400 },
        );
      }
    }
  } else if (activeRole === "renter") {
    // Renter can only update their own bookings
    authorized = booking.renterId === userId || booking.renterId === session.user.id;
    // Renters should not be able to change status manually (only cancel maybe)
    if (updates.status) {
      return NextResponse.json({ error: "Renters cannot update booking status" }, { status: 403 });
    }
  } else if (activeRole === "admin") {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not authorized to update this booking" }, { status: 403 });
  }

  const result = await bookingsCollection().updateOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
    { $set: { ...updates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Return the updated booking
  const updatedBooking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );
  return NextResponse.json({ success: true, booking: updatedBooking });
}