import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDashboardPath,
  getActiveRole,
  hasRole,
  type Role,
} from "@/lib/roles";

// Re-exported for backward compatibility — many pages import this from
// @/lib/session. The implementation now lives in @/lib/roles and validates
// that activeRole is actually present in the user's roles array.
export { getActiveRole } from "@/lib/roles";

type FullSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type UserSession = FullSession;
export type SessionUser = FullSession["user"];

/**
 * Resolve the user's effective active role from the session user object.
 * Validates that activeRole is actually present in the user's roles array,
 * so a corrupted or stale activeRole can never grant a role the account
 * does not possess.
 */
export function getSessionActiveRole(user: Pick<
  SessionUser,
  "activeRole" | "roles"
>): Role {
  return getActiveRole(user);
}

export async function getSession(): Promise<UserSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    // Debug: log authenticated identity (no secrets/tokens).
    console.log(
      "[AUTH] Authenticated user:",
      { id: session.user.id, email: session.user.email },
    );
    console.log(
      "[AUTH] Authenticated roles:",
      session.user.roles,
      "activeRole:",
      session.user.activeRole,
    );
  }
  return session;
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
 * Requires the user to be signed in AND to hold the requested role in their
 * roles array AND have it as their active role.
 *
 * On failure, redirects to the dashboard of the user's effective active role.
 * `routePath` is logged for debugging but is not used for authorization.
 */
export async function requireRole(
  role: Role,
  routePath?: string,
): Promise<UserSession> {
  const session = await requireUser();
  const activeRole = getSessionActiveRole(session.user);
  const roles: string[] = Array.isArray(session.user.roles)
    ? session.user.roles
    : [];

  console.log(
    `[AUTH] Protecting route: ${routePath ?? "unknown"} | required: ${role} | activeRole: ${activeRole} | roles: ${JSON.stringify(
      roles,
    )}`,
  );

  // The user must both possess the role and have it active.
  if (!hasRole(roles, role) || activeRole !== role) {
    redirect(getDashboardPath(activeRole));
  }

  return session;
}
