import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/roles";
import { userIdFilter, usersCollection } from "@/lib/users";

/**
 * POST /api/roles/become-owner
 *
 * Grants the "owner" role to the signed-in user (no duplicates via
 * $addToSet) and makes it the active role. Admin accounts are not
 * allowed to call this endpoint. The user id always comes from the
 * session — never from the client.
 */
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const { user } = session;

  const currentRoles = Array.isArray(user.roles) ? user.roles : [];
  if (currentRoles.includes("admin")) {
    return NextResponse.json(
      { success: false, error: "Admin accounts cannot become owners." },
      { status: 403 },
    );
  }

  await usersCollection().updateOne(
    { _id: userIdFilter(user.id) },
    {
      $addToSet: { roles: "owner" },
      $set: { activeRole: "owner" },
    },
  );

  return NextResponse.json({
    success: true,
    roles: currentRoles.includes("owner")
      ? currentRoles
      : [...currentRoles, "owner"],
    activeRole: "owner",
    dashboardPath: getDashboardPath("owner"),
  });
}
