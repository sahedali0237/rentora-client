import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ChangeRoleButton } from "@/components/table-actions";
import { Pagination } from "@/components/pagination";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiUser } from "@/lib/api-types";
import type { Metadata } from "next";

export const instant = false;
export const metadata: Metadata = { title: "All Users" };

type UserRow = {
  name: string;
  email: string;
  role: string;
  registered: string;
  id: string;
};

type AllUsersPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AllUsersPage({ searchParams }: AllUsersPageProps) {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);
  const { page: pageParam } = await searchParams;
  const page = Math.max(parseInt(pageParam || "1", 10), 1);
  const limit = 6;

  let users: UserRow[] = [];
  let totalPages = 1;
  try {
    const res = await apiFetch(`/api/admin/users?page=${page}&limit=${limit}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      const items: ApiUser[] = Array.isArray(data.users) ? data.users : [];
      users = items.map((u: ApiUser) => ({
        name: u.name || "Unknown",
        email: u.email || "-",
        role: u.activeRole || u.roles?.[0] || "renter",
        registered: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-",
        id: u._id || u.id || "",
      }));
      totalPages = data.totalPages ?? 1;
    } else if (data && !res.ok) {
      console.error("[AllUsersPage] /api/admin/users failed:", res.status, res.statusText, data);
    }
  } catch (error) {
    console.error("[AllUsersPage] /api/admin/users fetch error:", error);
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "registered", label: "Registered" },
    { key: "action", label: "Actions" },
  ];

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage accounts, inspect roles, and control user access.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users}
          cellRenderer={(key, value, row) => {
            if (key === "role") {
              const roleValue = value as string;
              const variant: "destructive" | "warning" | "secondary" = roleValue === "admin" ? "destructive" : roleValue === "owner" ? "warning" : "secondary";
              return (
                <Badge variant={variant} className="capitalize">
                  <span>{roleValue}</span>
                </Badge>
              );
            }
            if (key === "action") {
              const u = row as unknown as UserRow;
              const currentRole = u.role;
              return <ChangeRoleButton userId={u.id} currentRole={currentRole} />;
            }
            return value as React.ReactNode;
          }}
        />

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/all-users" />
        )}
      </div>
    </DashboardLayout>
  );
}