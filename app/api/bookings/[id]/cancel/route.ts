import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";
import { userIdFilter, resolveCanonicalUserId, userRefFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");
const equipmentCollection = () => db.collection("equipment");

/**
 * PATCH /api/bookings/:id/cancel
 * Cancels a booking. Owners must not be able to cancel a booking once its
 * paymentStatus is 'Paid'. Next.js 15: `params` is a Promise.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = getActiveRole(session.user);
  const userId = await resolveCanonicalUserId(session.user.id);

  const booking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Guard: owners cannot cancel a booking that has already been paid.
  if (
    activeRole === "owner" &&
    String(booking.paymentStatus || "").toLowerCase() === "paid"
  ) {
    return NextResponse.json(
      { error: "Cannot cancel a booking that has already been paid for." },
      { status: 403 },
    );
  }

  let authorized = false;

  if (activeRole === "owner") {
    const equipment = await equipmentCollection().findOne({
      _id: userIdFilter(String(booking.equipmentId)),
      ownerId: userRefFilter(userId),
    } as Record<string, unknown>);
    authorized = !!equipment;
  } else if (activeRole === "renter") {
    authorized = booking.renterId === userId || booking.renterId === session.user.id;
  } else if (activeRole === "admin") {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json(
      { error: "Not authorized to cancel this booking" },
      { status: 403 },
    );
  }

  const result = await bookingsCollection().updateOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
    { $set: { status: "cancelled", updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
