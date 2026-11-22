import { DashboardLayout } from "@/components/dashboard-layout";
import { Star } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiFavorite } from "@/lib/api-types";

export const instant = false;

function formatDate(value: string | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  // My Favorites: equipment the logged-in renter has saved.
  const favRes = await apiFetch("/api/favorites");
  const favData = await favRes.json().catch(() => null);
  const favorites: ApiFavorite[] = (favData?.favorites ?? []).map(
    (f: ApiFavorite) => ({
      id: f._id || f.id || "",
      equipmentId: f.equipmentId || "",
      createdAt: formatDate(f.createdAt),
    }),
  );

  return (
    <DashboardLayout
      role={role}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Equipment you've saved. Click "View Details" to open a listing.
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Star className="h-10 w-10 text-gray-400 dark:text-zinc-500 mb-3" aria-hidden />
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              You haven't favorited any equipment yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Saved equipment
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      {formatDate(fav.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/equipment/${encodeURIComponent(fav.equipmentId ?? "")}`}
                    className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
