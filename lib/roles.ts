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
 * Resolve the user's effective active role. Trusts activeRole only when it is
 * actually present in the user's roles array; otherwise falls back to the
 * user's highest granted role (admin > owner > renter). Never returns a role
 * the account does not possess.
 */
export function getActiveRole(user: {
  activeRole?: string | null;
  roles?: string[] | null;
}): Role {
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const normalized = normalizeRole(user.activeRole ?? null);

  if (roles.includes(normalized)) {
    return normalized;
  }

  // activeRole is missing or not in the account's roles — fall back to the
  // highest role the account actually holds.
  if (roles.includes("admin")) return "admin";
  if (roles.includes("owner")) return "owner";
  return "renter";
}

/** Roles a user is allowed to switch to. "admin" is never switchable. */
export const SWITCHABLE_ROLES: readonly Exclude<Role, "admin">[] = [
  "owner",
  "renter",
] as const;
