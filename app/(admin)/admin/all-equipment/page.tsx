import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { EquipmentActions } from "@/components/table-actions";
import { Pagination } from "@/components/pagination";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiEquipment } from "@/lib/api-types";
import type { Metadata } from "next";

export const instant = false;
export const metadata: Metadata = { title: "All Equipment" };

type EquipmentRow = {
  name: string;
  category: string;
  price: number;
  rentalType: string;
  status: string;
  owner: string;
  id: string;
};

type AllEquipmentPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AllEquipmentPage({ searchParams }: AllEquipmentPageProps) {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);
  const { page: pageParam } = await searchParams;
  const page = Math.max(parseInt(pageParam || "1", 10), 1);
  const limit = 6;

  let equipment: EquipmentRow[] = [];
  let totalPages = 1;
  try {
    const res = await apiFetch(`/api/equipment?page=${page}&limit=${limit}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      const items: ApiEquipment[] = Array.isArray(data.equipment) ? data.equipment : [];
      equipment = items.map((e: ApiEquipment) => ({
        name: e.name || "Untitled",
        category: e.category || "Uncategorized",
        price: Number(e.rentalPrice || 0),
        rentalType: e.rentalType || "Daily",
        status: e.status || "pending",
        owner: e.ownerName || "Unknown",
        id: e._id || e.id || "",
      }));
      totalPages = data.totalPages ?? 1;
    } else if (data && !res.ok) {
      console.error("[AllEquipmentPage] /api/equipment failed:", res.status, data);
    }
  } catch (error) {
    console.error("[AllEquipmentPage] /api/equipment fetch error:", error);
  }

  const columns = [
    { key: "name", label: "Equipment" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "status", label: "Status" },
    { key: "owner", label: "Owner" },
    { key: "action", label: "Actions" },
  ];

  const statusVariants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  };

  const periodLabel = (rentalType: string): string => {
    switch (rentalType) {
      case "Daily":
        return "day";
      case "Weekly":
        return "week";
      case "Monthly":
        return "month";
      case "Hourly":
        return "hour";
      default:
        return (rentalType || "Daily").toLowerCase() || "day";
    }
  };

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Equipment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Approve, reject, update, or remove equipment listings.
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
            if (key === "price") {
              const r = row as unknown as EquipmentRow;
              return `$${Number(value || 0)} / ${periodLabel(r.rentalType)}`;
            }
            if (key === "action") {
              const e = row as unknown as EquipmentRow;
              return (
                <EquipmentActions
                  id={e.id}
                  status={e.status}
                  name={e.name}
                  canApprove
                  canTerminate
                />
              );
            }
            return value as React.ReactNode;
          }}
        />

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/all-equipment" />
        )}
      </div>
    </DashboardLayout>
  );
}
