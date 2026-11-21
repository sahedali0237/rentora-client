"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import type { ApiReview } from "@/lib/api-types";

const STAR_FILTERS = [
  { value: null as number | null, label: "All" },
  { value: 5, label: "5★" },
  { value: 4, label: "4★" },
  { value: 3, label: "3★" },
  { value: 2, label: "2★" },
  { value: 1, label: "1★" },
];

function formatDate(value: string | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400" : "text-gray-300"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
  }>({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
  const [filter, setFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Retry up to 2 times with short backoff on non-ok or network errors.
      let res: Response | null = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const r = await fetch("/api/reviews", { cache: "no-store" });
          if (r.ok) {
            res = r;
            break;
          }
        } catch {
          /* network error – treat as retryable */
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      if (cancelled) return;

      if (!res) {
        setFailed(true);
        setLoading(false);
        return;
      }

      try {
        const data = await res.json();
        if (cancelled) return;
        setReviews(data.reviews || []);
        setStats(
          data.stats || {
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: {},
          },
        );
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const average = Number(stats.averageRating) || 0;
  const total = Number(stats.totalReviews) || 0;
  const filteredReviews =
    filter === null
      ? reviews
      : reviews.filter((r) => Number(r.rating) === filter);

  return (
    <div className="space-y-6 px-[6%] py-[4%]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Reviews
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            What renters are saying about Rentora.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Average rating"
          value={average.toFixed(1)}
          subtitle={`${total} ${total === 1 ? "review" : "reviews"} total`}
          icon={Star}
          color="amber"
        />
        <StatCard
          title="Total reviews"
          value={total}
          subtitle="Across all equipment"
          icon={User}
          color="blue"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STAR_FILTERS.map(({ value, label }) => {
          const isSelected = filter === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                isSelected
                  ? "bg-amber-500 text-white border-amber-500 dark:bg-amber-900/20 dark:border-amber-500"
                  : "border-gray-200 bg-white text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white hover:border-amber-500 dark:hover:border-amber-500/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {failed ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Star
              className="h-12 w-12 text-gray-400 dark:text-zinc-500 mb-3"
              aria-hidden
            />
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Couldn't load reviews. Please refresh the page to try again.
            </p>
          </div>
        ) : filteredReviews.length === 0 && !loading ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Star
              className="h-12 w-12 text-gray-400 dark:text-zinc-500 mb-3"
              aria-hidden
            />
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              {filter === null
                ? "No reviews yet."
                : "No reviews with this rating."}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review._id || review.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col"
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-800 dark:text-amber-400 font-semibold text-sm">
                      {(review.renterName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {review.renterName || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-zinc-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  {renderStars(Number(review.rating) || 0)}
                </div>

                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
                  {review.comment || "No comment."}
                </p>

                {review.equipmentId && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-xs text-gray-500 dark:text-zinc-500">
                      Equipment {review.equipmentId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
