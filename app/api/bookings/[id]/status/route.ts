import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import { userIdFilter, resolveCanonicalUserId, userRefFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");
const equipmentCollection = () => db.collection("equipment");

const ALLOWED_STATUSES = ["pending", "confirmed", "rejected"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const { status } = body as { status?: string };

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const activeRole = getActiveRole(session.user);
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  const userId = await resolveCanonicalUserId(session.user.id);
  const isAdmin = hasRole(roles, "admin") && activeRole === "admin";
  console.log(
    "[AUTH] bookings/[id]/status PATCH:",
    { id: session.user.id, email: session.user.email, activeRole, roles, targetId: id },
  );

  // Find the booking first
  const booking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorization: only the owner of the equipment can confirm/reject
  if (activeRole === "owner") {
    const equipment = await equipmentCollection().findOne({
      _id: userIdFilter(booking.equipmentId),
      ownerId: userRefFilter(userId),
    } as Record<string, unknown>);

    if (!equipment) {
      return NextResponse.json(
        { error: "Not authorized to update this booking" },
        { status: 403 },
      );
    }
  } else if (activeRole === "renter") {
    return NextResponse.json(
      { error: "Renters cannot update booking status" },
      { status: 403 },
    );
  } else if (activeRole === "admin") {
    // Admin can update any booking
  } else {
    return NextResponse.json(
      { error: "Not authorized to update this booking" },
      { status: 403 },
    );
  }

  const result = await bookingsCollection().updateOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
    { $set: { status, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const updatedBooking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );

  return NextResponse.json({ success: true, booking: updatedBooking });
}