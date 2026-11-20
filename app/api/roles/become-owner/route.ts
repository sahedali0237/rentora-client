import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardPath, hasRole, type Role } from "@/lib/roles";
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
    console.log("[AUTH] roles/become-owner: unauthenticated request");
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const { user } = session;
  const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = currentRoles.includes("admin");

  console.log(
    "[AUTH] roles/become-owner:",
    { id: user.id, email: user.email, roles: currentRoles, activeRole: user.activeRole },
  );

  if (isAdmin) {
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

  const newRoles: Role[] = hasRole(currentRoles, "owner")
    ? currentRoles as Role[]
    : ([...currentRoles, "owner"] as Role[]);

  return NextResponse.json({
    success: true,
    roles: newRoles,
    activeRole: "owner",
    dashboardPath: getDashboardPath("owner"),
  });
}
