import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";
import {
  resolveCanonicalUserId,
  userRefFilter,
} from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");
const equipmentCollection = () => db.collection("equipment");

/**
 * GET /api/owner/bookings
 *
 * Returns bookings for the signed-in owner's listed equipment.
 *
 * Booking documents store `renterId`/`equipmentId` but NO `ownerId`, so an
 * owner's bookings are resolved by scoping through their equipment:
 *   owner -> equipment (where ownerId == user) -> booking (equipmentId in ...)
 *
 * This replaces the previous proxy to the external Express backend, which
 * could not resolve owner bookings correctly and returned an empty list.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = getActiveRole(session.user);
  if (activeRole !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  // Canonical Mongo _id (as string) of the current user.
  const userId = await resolveCanonicalUserId(session.user.id);

  // Find the equipment this owner lists, then bookings referencing it.
  const ownerEquipment = await equipmentCollection()
    .find({ ownerId: userRefFilter(userId) })
    .project({ _id: 1 })
    .toArray();
  const equipmentIds = ownerEquipment.map((eq) => eq._id.toString());

  let bookings: Array<Record<string, unknown>> = [];
  if (equipmentIds.length > 0) {
    bookings = await bookingsCollection()
      .find({ equipmentId: { $in: equipmentIds } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  return NextResponse.json({ bookings });
}
