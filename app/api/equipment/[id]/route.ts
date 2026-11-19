import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole } from "@/lib/session";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";
import { ApiEquipment } from "@/lib/api-types";

const equipmentCollection = () => db.collection("equipment");

/**
 * GET /api/equipment/[id]
 * Returns a single equipment item.
 * - Admins can view any listing.
 * - Owners can view their own listings regardless of approval status
 *   (so they can manage pending/rejected items).
 * - Everyone else (renters/public) can only view approved equipment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const isAdmin = session?.user ? getActiveRole(session.user) === "admin" : false;

  const equipment = (await equipmentCollection().findOne({
    _id: userIdFilter(id),
  } as Record<string, unknown>)) as ApiEquipment | null;

  if (!equipment) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  const isOwner =
    !!userId &&
    (equipment.ownerId === userId ||
      equipment.ownerId?.toString() === userId.toString());

  const status = String(equipment.status ?? "pending").toLowerCase();
  if (!isAdmin && !isOwner && status !== "approved") {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ equipment });
}

/**
 * PATCH /api/equipment/[id]
 * Updates a single equipment item.
 * - Admins can update any listing.
 * - Owners can update only their own listings.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;
  const { id: _ignored, ...safeUpdates } = updates;
  const userId = session.user.id;
  const isAdmin = getActiveRole(session.user) === "admin";

  // Fetch the listing first so we can authorize on *ownership*, not just
  // active role. An owner can edit their own listing whether their active
  // role is "owner" or not; admins can edit anything; everyone else 403.
  const doc = (await equipmentCollection().findOne({
    _id: userIdFilter(id),
  } as Record<string, unknown>)) as ApiEquipment | null;

  if (!doc) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  const isOwner =
    !!userId &&
    (doc.ownerId === userId || doc.ownerId?.toString() === userId.toString());

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You are not allowed to edit this listing." },
      { status: 403 },
    );
  }

  const result = await equipmentCollection().updateOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
    { $set: { ...safeUpdates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
