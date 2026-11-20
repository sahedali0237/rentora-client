/**
 * Role definitions shared by server and client code.
 *
 * A single account can hold both "renter" and "owner" roles and switch its
 * activeRole between them. "admin" is a separate role that can only be
 * granted by the scripts/make-admin.ts tooling — never self-assigned.
 */
export type Role = "admin" | "owner" | "renter";

export const DASHBOARD_PATH: Record<Role, string> = {
  admin: "/admin",
  owner: "/owner",
  renter: "/renter",
} as const;

export function getDashboardPath(role: Role): string {
  return DASHBOARD_PATH[role];
}

/**
 * Normalize a raw role value into a known Role. Unknown/missing values fall
 * back to "renter" as a safe default. This is a display/fallback helper only
 * — it does NOT validate that the user actually holds the role.
 */
export function normalizeRole(value: string | null | undefined): Role {
  return value === "owner" || value === "admin" ? value : "renter";
}

/**
 * Return true if the given role is present in the user's roles array.
 * This is the source of truth for what a user is allowed to do.
 */
export function hasRole(roles: string[] | undefined, role: Role): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

/**
 * Resolve the user's effective active role.
 *
 * The database's `activeRole` is the source of truth for which mode the
 * account is currently in. When it is explicitly set to "admin" or "owner",
 * trust it — even if the `roles` array is temporarily out of sync (for
 * example after a direct DB change via `scripts/make-admin.ts`). The
 * server-side `requireRole()` guard still re-validates that the role is
 * present in `roles` before granting access, so route protection is never
 * weakened.
 *
 * When `activeRole` is missing, "renter", or unrecognized, fall back to the
 * highest role the account actually holds (admin > owner > renter).
 */
export function getActiveRole(user: {
  activeRole?: string | null;
  roles?: string[] | null;
}): Role {
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];

  // Trust an explicitly-set activeRole as the current mode. This covers
  // "admin", "owner", and "renter" — a user whose DB record has
  // activeRole: "renter" must be treated as renter even when their roles
  // array also contains "owner". Falling through to the roles-based fallback
  // here would force "owner" whenever roles includes "owner", which is the
  // stale-mode bug that bounces a freshly-switched renter back to /owner.
  if (user.activeRole === "admin" || user.activeRole === "owner") {
    return user.activeRole;
  }
  if (user.activeRole === "renter") {
    return "renter";
  }

  // activeRole is missing or unrecognized — fall back to the highest granted role.
  if (roles.includes("admin")) return "admin";
  if (roles.includes("owner")) return "owner";
  return "renter";
}

/** Roles a user is allowed to switch to. "admin" is never switchable. */
export const SWITCHABLE_ROLES: readonly Exclude<Role, "admin">[] = [
  "owner",
  "renter",
] as const;
