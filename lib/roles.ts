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

export function normalizeRole(value: string | null | undefined): Role {
  return value === "owner" || value === "admin" ? value : "renter";
}

/** Roles a user is allowed to switch to. "admin" is never switchable. */
export const SWITCHABLE_ROLES: readonly Exclude<Role, "admin">[] = [
  "owner",
  "renter",
] as const;
