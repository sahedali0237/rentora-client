import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

/**
 * GET /api/bookings/:id
 *
 * Returns the booking referenced by `id` when the signed-in user owns it
 * (renterId matches) or is an admin. Used by the payment cancel page to
 * render the "amount due" card for a specific booking without exposing
 * every booking the user has.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const booking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const roles: string[] = Array.isArray(session.user.roles)
    ? session.user.roles
    : [];
  const isAdmin = roles.includes("admin");

  // Renters can only fetch their own bookings; admins can fetch any.
  if (!isAdmin) {
    const renterId = String(booking.renterId ?? "");
    if (renterId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this booking." },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ booking });
}
