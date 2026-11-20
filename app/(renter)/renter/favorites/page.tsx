import { DashboardLayout } from "@/components/dashboard-layout";
import { Star } from "lucide-react";
import { getSession, getActiveRole } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiReview } from "@/lib/api-types";
import MyReviewsEditor, { type MyReview } from "./MyReviewsEditor";

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

  // My Reviews: only the logged-in renter's reviews, looked up by email.
  const email = session.user.email ?? "";
  const myReviewsRes = await apiFetch(
    `/api/reviews?email=${encodeURIComponent(email)}`,
  );
  const myReviewsData = await myReviewsRes.json();
  const myReviews: MyReview[] = (myReviewsData.reviews || []).map(
    (r: ApiReview) => ({
      id: r._id || r.id || "",
      equipmentId: r.equipmentId || "",
      renterName: r.renterName || "Anonymous",
      rating: Number(r.rating) || 0,
      comment: r.comment || "",
      createdAt: formatDate(r.createdAt),
      updatedAt: formatDate(r.updatedAt ?? r.createdAt),
    }),
  );

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <div className="space-y-6">
        {/* My Reviews */}
        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Reviews
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reviews you've written, newest first.
              </p>
            </div>
          </div>

          {myReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <Star className="h-10 w-10 text-gray-400 dark:text-zinc-500 mb-3" aria-hidden />
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                You haven't written any reviews yet.
              </p>
            </div>
          ) : (
            <MyReviewsEditor initialReviews={myReviews} userId={session.user.id} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}