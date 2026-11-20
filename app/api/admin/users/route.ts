import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole, hasRole, type Role } from "@/lib/roles";
import { userIdFilter, usersCollection } from "@/lib/users";

/**
 * GET /api/admin/users
 * Lists all users (admin only).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] admin/users GET: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = getActiveRole(session.user);
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  console.log(
    "[AUTH] admin/users GET:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (!hasRole(roles, "admin") || activeRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await usersCollection()
    .find(
      {},
      { projection: { name: 1, email: 1, roles: 1, activeRole: 1, createdAt: 1 } },
    )
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ users });
}

/**
 * PATCH /api/admin/users
 * Body: { userId, role } — role must be "owner" or "renter".
 *
 * The admin role can ONLY be granted via scripts/make-admin.ts — never
 * through this API, and never from the frontend. Prevents an admin from
 * demoting themselves or granting admin through the UI.
 */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] admin/users PATCH: unauthenticated request");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const activeRole = getActiveRole(session.user);
  const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
  console.log(
    "[AUTH] admin/users PATCH:",
    { id: session.user.id, email: session.user.email, activeRole, roles },
  );

  if (!hasRole(roles, "admin") || activeRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role } = body as { userId?: string; role?: string };

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  // The admin role can only be granted via make-admin.ts — never through this API.
  if (!["owner", "renter"].includes(role)) {
    return NextResponse.json({ error: "Invalid role. Use 'owner' or 'renter'." }, { status: 400 });
  }

  // Prevent an admin from changing their own role via this endpoint.
  const sessionUserId = session.user.id;
  if (userId === sessionUserId) {
    return NextResponse.json(
      { error: "Cannot change your own role via this endpoint." },
      { status: 403 },
    );
  }

  // Verify the target user exists.
  const targetUser = await usersCollection().findOne({
    _id: userIdFilter(userId),
  });
  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  const targetRoles: string[] = Array.isArray(targetUser.roles) ? targetUser.roles : [];
  const nextRoles: string[] = [role];

  await usersCollection().updateOne(
    { _id: userIdFilter(userId) },
    { $set: { roles: nextRoles, activeRole: role } },
  );

  console.log(
    `[AUTH] admin/users PATCH: changed user ${userId} roles to ${JSON.stringify(nextRoles)}, activeRole: ${role}`,
  );

  return NextResponse.json({ success: true });
}