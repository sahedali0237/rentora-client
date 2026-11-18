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
  if (!currentRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: `You do not have the "${role}" role.` },
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
