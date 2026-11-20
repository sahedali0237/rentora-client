import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveRole, type Role } from "@/lib/roles";
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

  // Authorize on the effective active role (trusts activeRole: "admin" even
  // when `roles` is ["renter", "owner"], e.g. after make-admin.ts set it
  // directly in the DB). roles.includes("admin") is the fallback.
  if (getActiveRole(session.user) !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let users;
  try {
    users = await usersCollection()
      .find(
        {},
        { projection: { name: 1, email: 1, roles: 1, activeRole: 1, createdAt: 1 } },
      )
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[AUTH] admin/users GET: DB error", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }

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

  if (getActiveRole(session.user) !== "admin") {
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
  let targetUser;
  try {
    targetUser = await usersCollection().findOne({
      _id: userIdFilter(userId),
    });
  } catch (error) {
    console.error("[AUTH] admin/users PATCH: DB error", error);
    return NextResponse.json({ error: "Failed to load target user" }, { status: 500 });
  }
  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  const targetRoles: string[] = Array.isArray(targetUser.roles) ? targetUser.roles : [];
  const nextRoles: string[] = [role];

  try {
    await usersCollection().updateOne(
      { _id: userIdFilter(userId) },
      { $set: { roles: nextRoles, activeRole: role } },
    );
  } catch (error) {
    console.error("[AUTH] admin/users PATCH: DB error", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  console.log(
    `[AUTH] admin/users PATCH: changed user ${userId} roles to ${JSON.stringify(nextRoles)}, activeRole: ${role}`,
  );

  return NextResponse.json({ success: true });
}