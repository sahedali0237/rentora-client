import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ChangeRoleButton } from "@/components/table-actions";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";

export const instant = false;

type UserRow = {
  name: string;
  email: string;
  roles: string[];
  activeRole: string;
  createdAt: string;
};

export default async function AllUsersPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  const res = await apiFetch("/api/admin/users");
  const data = await res.json();
  const users: UserRow[] = data.users || [];

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
          data={users.map((u) => ({
            name: u.name,
            email: u.email,
            role: u.activeRole || u.roles?.[0] || "renter",
            registered: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-",
            action: u,
          }))}
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
              const u = value as { _id?: string; id?: string };
              return <ChangeRoleButton userId={u._id ?? u.id ?? ""} />;
            }
            return value as React.ReactNode;
          }}
        />
      </div>
    </DashboardLayout>
  );
}