import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardPath, normalizeRole, type Role } from "@/lib/roles";

type FullSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type UserSession = FullSession;
export type SessionUser = FullSession["user"];

/**
 * Returns the user's active role with defensive normalization so legacy
 * accounts without the fields still resolve to "renter".
 */
export function getActiveRole(user: Pick<SessionUser, "activeRole">): Role {
  return normalizeRole(user.activeRole);
}

/** Raw session lookup for the current request. Returns null when signed out. */
export async function getSession(): Promise<UserSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Requires any signed-in user; redirects to /sign-in otherwise. */
export async function requireUser(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Requires a signed-in user whose activeRole matches the given role.
 * Mismatches are redirected to the dashboard of the user's active role,
 * so a renter poking at /owner lands on /renter and vice versa.
 */
export async function requireRole(role: Role): Promise<UserSession> {
  const session = await requireUser();
  const activeRole = getActiveRole(session.user);
  if (activeRole !== role) {
    redirect(getDashboardPath(activeRole));
  }
  return session;
}
