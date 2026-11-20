import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardPath, hasRole, type Role } from "@/lib/roles";
import { userIdFilter, usersCollection } from "@/lib/users";

/**
 * POST /api/roles/switch
 * Body: { role: "owner" | "renter" }
 *
 * Switches the signed-in user's activeRole between roles they already hold.
 * "admin" is rejected outright. The target role must already be present on
 * the user's roles array. The user id always comes from the session — never
 * from the client.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.log("[AUTH] roles/switch: unauthenticated request");
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const { user } = session;
  const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = currentRoles.includes("admin");

  console.log(
    "[AUTH] roles/switch:",
    { id: user.id, email: user.email, roles: currentRoles, activeRole: user.activeRole },
  );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const role =
    typeof body === "object" && body !== null && "role" in body
      ? (body as { role: unknown }).role
      : undefined;

  if (role === "admin") {
    return NextResponse.json(
      {
        success: false,
        error: "Admin mode cannot be selected as an active role.",
      },
      { status: 403 },
    );
  }

  if (role !== "owner" && role !== "renter") {
    return NextResponse.json(
      { success: false, error: 'Invalid role. Use "owner" or "renter".' },
      { status: 400 },
    );
  }

  const targetRole = role as Role;

  // The target role must already be present on the account. "renter" is the
  // default for every account, but we still verify rather than assume.
  if (!hasRole(currentRoles, targetRole)) {
    return NextResponse.json(
      {
        success: false,
        error: `You do not have the "${targetRole}" role.`,
      },
      { status: 403 },
    );
  }

  // Admin accounts cannot switch away from admin mode via this endpoint.
  if (targetRole === "renter" && isAdmin) {
    return NextResponse.json(
      { success: false, error: "Admin accounts cannot switch to Renter mode." },
      { status: 403 },
    );
  }

  const result = await usersCollection().updateOne(
    { _id: { $in: [user.id, userIdFilter(user.id)] } },
    { $set: { activeRole: targetRole } },
  );

  console.log(
    "[AUTH] roles/switch: updateOne",
    {
      id: user.id,
      role: targetRole,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
  );

  return NextResponse.json({
    success: true,
    activeRole: targetRole,
    dashboardPath: getDashboardPath(targetRole),
  });
}
