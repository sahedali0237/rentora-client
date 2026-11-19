import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { FavoriteRemoveButton } from "@/components/table-actions";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiFavorite } from "@/lib/api-types";

export const instant = false;

type FavoriteRow = {
  equipmentId: string;
  equipmentName: string;
  createdAt: string;
  id: string;
};

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  const res = await apiFetch("/api/favorites");
  const data = await res.json();
  const favorites: FavoriteRow[] = (data.favorites || []).map((f: ApiFavorite) => ({
    equipmentId: f.equipmentId ?? "",
    equipmentName: f.equipmentName || "Untitled Equipment",
    createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "-",
    id: f._id || f.id || "",
  }));

  const columns = [
    { key: "equipmentName", label: "Equipment" },
    { key: "createdAt", label: "Added On" },
    { key: "action", label: "Actions" },
  ];

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your saved equipment. Click Remove to unfavorite an item.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={favorites}
          cellRenderer={(key, value, row) => {
            if (key === "action") {
              const f = row as unknown as FavoriteRow;
              return <FavoriteRemoveButton equipmentId={f.equipmentId} />;
            }
            return value as React.ReactNode;
          }}
        />
      </div>
    </DashboardLayout>
  );
}