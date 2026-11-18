import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/roles";
import { userIdFilter, usersCollection } from "@/lib/users";

/**
 * POST /api/roles/switch
 * Body: { role: "owner" | "renter" }
 *
 * Switches the signed-in user's activeRole. "admin" is rejected outright,
 * and the target role must already be present on the user's roles array.
 * The user id always comes from the session — never from the client.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const { user } = session;

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

  const currentRoles = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = currentRoles.includes("admin");

  // "admin" can never be selected as an active role (handled above).
  // "renter" is the default role every account starts with, so any
  // non-admin user can switch into Renter mode. "owner" is a granted
  // privilege and must already be present on the account.
  if (role === "owner" && !currentRoles.includes("owner")) {
    return NextResponse.json(
      { success: false, error: 'You do not have the "owner" role.' },
      { status: 403 },
    );
  }
  if (role === "renter" && isAdmin) {
    return NextResponse.json(
      { success: false, error: "Admin accounts cannot switch to Renter mode." },
      { status: 403 },
    );
  }

  await usersCollection().updateOne(
    { _id: userIdFilter(user.id) },
    { $set: { activeRole: role } },
  );

  return NextResponse.json({
    success: true,
    activeRole: role,
    dashboardPath: getDashboardPath(role),
  });
}
