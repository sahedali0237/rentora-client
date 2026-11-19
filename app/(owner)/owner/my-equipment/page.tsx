import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { EquipmentActions } from "@/components/table-actions";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiEquipment } from "@/lib/api-types";

export const instant = false;

type EquipmentRow = {
  name: string;
  category: string;
  price: string;
  quantity: string;
  status: string;
  id: string;
};

export default async function MyEquipmentPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  const res = await apiFetch("/api/equipment");
  const data = await res.json();
  const equipment: EquipmentRow[] = (data.equipment || [])
    .filter((e: ApiEquipment) => e.ownerId === session.user.id)
    .map((e: ApiEquipment) => ({
      name: e.name || "Untitled",
      category: e.category || "Uncategorized",
      price: `$${e.rentalPrice ?? e.price ?? 0}`,
      quantity: String(e.availableQuantity || 0),
      status: e.status || "pending",
      id: e._id || e.id || "",
    }));

  const columns = [
    { key: "name", label: "Equipment" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "quantity", label: "Qty" },
    { key: "status", label: "Status" },
    { key: "action", label: "Actions" },
  ];

  const statusVariants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  };

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Equipment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View, update, or delete your equipment listings.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={equipment}
          cellRenderer={(key, value, row) => {
            if (key === "status") {
              const variant = statusVariants[value as string] || "secondary";
              return <Badge variant={variant} className="capitalize"><span>{String(value)}</span></Badge>;
            }
            if (key === "action") {
              const e = value as EquipmentRow;
              return <EquipmentActions id={e.id} status={e.status} label="Update" />;
            }
            return value as React.ReactNode;
          }}
        />
      </div>
    </DashboardLayout>
  );
}