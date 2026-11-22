import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, db } from "@/lib/auth";
import { getActiveRole, hasRole } from "@/lib/roles";
import { userIdFilter, resolveCanonicalUserId } from "@/lib/users";
import { ApiEquipment } from "@/lib/api-types";

const equipmentCollection = () => db.collection("equipment");

/** Return true when the id is a valid 24-char hex ObjectId. */
function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}

/**
 * Parse a route id into the Mongo value to query with. Invalid ObjectIds
 * return null so callers can answer 404 instead of crashing.
 */
function objectIdValue(id: string): ObjectId | string | null {
  return isValidObjectId(id) ? userIdFilter(id) : null;
}

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

  // Invalid ObjectIds must return 404, not crash the request.
  const targetId = objectIdValue(id);
  if (!targetId) {
    return NextResponse.json(
      { error: "Equipment not found" },
      { status: 404 },
    );
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    // If session lookup fails (e.g. transient DB hiccup), treat as public user.
    session = null;
  }
  const userId = session?.user?.id ?? null;
  const isAdmin = session?.user ? getActiveRole(session.user) === "admin" : false;

  const equipment = (await equipmentCollection().findOne({
    _id: targetId,
  } as Record<string, unknown>)) as ApiEquipment | null;

  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const canonicalOwnerId = await resolveCanonicalUserId(
    String(equipment.ownerId ?? ""),
  ).catch(() => equipment.ownerId?.toString() ?? "");

  const isOwner =
    !!userId &&
    !!canonicalOwnerId &&
    (userId === canonicalOwnerId ||
      userIdFilter(userId)?.toString() === canonicalOwnerId?.toString());

  const status = String(equipment.status ?? "pending").toLowerCase();
  if (!isAdmin && !isOwner && status !== "approved") {
    // Hide non-approved listings from everyone but owner/admin — report 404
    // rather than 403 so the UI cannot enumerate pending listings.
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json({ equipment });
}

/**
 * PATCH /api/equipment/[id]
 * Updates a single equipment item.
 * - Admins can update any listing (moderation fields like status).
 * - Owners can update only their own listings.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const targetId = objectIdValue(id);
  if (!targetId) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] equipment/[id] PATCH: unauthenticated request");
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;
  const { id: _ignored, ...safeUpdates } = updates;
  const userId = await resolveCanonicalUserId(session.user.id);
  const roles: string[] = Array.isArray(session.user.roles)
    ? session.user.roles
    : [];
  const activeRole = getActiveRole(session.user);
  const isAdmin = hasRole(roles, "admin") && activeRole === "admin";
  console.log(
    "[AUTH] equipment/[id] PATCH:",
    {
      id: session.user.id,
      email: session.user.email,
      activeRole,
      roles,
      targetId: id,
    },
  );

  // Fetch the listing first so we can authorize on *ownership*, not just
  // active role. An owner can edit their own listing whether their active
  // role is "owner" or not; admins can edit anything; everyone else 403.
  const doc = (await equipmentCollection().findOne({
    _id: targetId,
  } as Record<string, unknown>)) as ApiEquipment | null;

  if (!doc) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const isOwner =
    !!userId &&
    !!doc.ownerId &&
    (doc.ownerId === userId ||
      doc.ownerId?.toString() === userId ||
      userIdFilter(doc.ownerId as string)?.toString() ===
        userIdFilter(userId)?.toString());

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "You are not allowed to edit this listing." },
      { status: 403 },
    );
  }

  const result = await equipmentCollection().updateOne(
    { _id: targetId } as Record<string, unknown>,
    { $set: { ...safeUpdates, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
