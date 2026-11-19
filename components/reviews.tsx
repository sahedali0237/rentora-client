"use client";

import { Star, User, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ApiReview, ApiReviewStats } from "@/lib/api-types";

interface ReviewItemProps {
  review: ApiReview;
  currentUserId: string | null;
  onDelete?: (reviewId: string) => void;
  onRatingChange?: () => void;
}

export function ReviewItem({
  review,
  currentUserId,
  onDelete,
  onRatingChange,
}: ReviewItemProps) {
  const isOwner = currentUserId && review.renterId === currentUserId;
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editRating, setEditRating] = useState(Number(review.rating) || 0);
  const [editComment, setEditComment] = useState(review.comment || "");

  const rating = Number(review.rating) || 0;
  const createdAt = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handleSaveEdit = async () => {
    if (!editComment.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: review._id || review.id,
          rating: editRating,
          comment: editComment,
        }),
      });

      if (res.ok) {
        toast.success("Review updated.");
        setEditing(false);
        onRatingChange?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to update review.");
      }
    } catch {
      toast.error("Failed to update review.");
    }
  };

  const handleDeleteClick = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    try {
      const res = await fetch(
        `/api/reviews?id=${encodeURIComponent(review._id || review.id || "")}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Review deleted.");
        setConfirmingDelete(false);
        onDelete?.(review._id || review.id || "");
        onRatingChange?.();
      } else {
        setConfirmingDelete(false);
        toast.error("Failed to delete review.");
      }
    } catch {
      setConfirmingDelete(false);
      toast.error("Failed to delete review.");
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };

  return (
    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-800 dark:text-amber-400 font-semibold text-sm">
            {(review.renterName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {review.renterName || "Anonymous"}
            </span>
            <span className="text-xs text-gray-500 dark:text-zinc-500">
              {createdAt}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-yellow-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${star <= rating ? "fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 text-xs">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setEditing(true)}
              className="text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 p-1"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleDeleteClick}
              className={`text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 ${confirmingDelete ? "ring-2 ring-red-500" : ""}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {confirmingDelete && (
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCancelDelete}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={handleDeleteClick}
              className="text-xs"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
        {review.comment}
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
              Rating
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditRating(s)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-4 w-4 ${
                      s <= editRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            rows={3}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Write your review..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="text-sm">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReviewStatsProps {
  stats: ApiReviewStats;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const average = Number(stats.averageRating) || 0;
  const total = Number(stats.totalReviews) || 0;
  const breakdown = stats.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {average.toFixed(1)}
        </span>
        <div className="flex items-center gap-1 text-yellow-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${star <= Math.round(average) ? "fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-zinc-500">
          ({total} {total === 1 ? "review" : "reviews"})
        </span>
      </div>

      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = Number(breakdown[star]) || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-4 text-xs text-gray-600 dark:text-zinc-400">
                {star} ★
              </span>
              <div
                className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-gray-600 dark:text-zinc-400">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ReviewListProps {
  equipmentId: string;
  currentUserId: string | null;
  initialReviews: ApiReview[];
  initialStats: ApiReviewStats;
  canSubmit: boolean;
  userHasRented: boolean;
  onReviewSubmitted?: () => void;
}

export function ReviewList({
  equipmentId,
  currentUserId,
  initialReviews,
  initialStats,
  canSubmit,
  userHasRented,
  onReviewSubmitted,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ApiReview[]>(initialReviews);
  const [stats, setStats] = useState<ApiReviewStats>(initialStats);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Find the current user's existing review
  const existingReview =
    reviews.find((r) => r.renterId === currentUserId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || rating < 1 || rating > 5) {
      toast.error("Please provide a rating and comment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId, rating, comment }),
      });

      if (res.ok) {
        toast.success("Review submitted.");
        setComment("");
        setRating(0);
        onReviewSubmitted?.();
        // Refresh
        const data = await fetch(
          `/api/reviews?equipmentId=${encodeURIComponent(equipmentId)}`,
        );
        const result = await data.json();
        setReviews(result.reviews || []);
        setStats(result.stats || { averageRating: 0, totalReviews: 0 });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to submit review.");
      }
    } catch {
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingChange = () => {
    fetch(`/api/reviews?equipmentId=${encodeURIComponent(equipmentId)}`)
      .then((r) => r.json())
      .then((result: any) => {
        setReviews(result.reviews || []);
        setStats(result.stats || { averageRating: 0, totalReviews: 0 });
      });
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
    setStats((prev) => ({
      ...prev,
      totalReviews: Math.max(0, Number(prev.totalReviews) - 1),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <ReviewStats stats={stats} />

        <div className="flex flex-col gap-4 lg:flex-row items-end">
          {canSubmit && !existingReview && userHasRented ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full lg:w-80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Your Rating
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          s <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your rental experience..."
              />
              <Button type="submit" disabled={submitting || !rating || !comment.trim()} className="w-full text-sm">
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          ) : existingReview ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <User className="h-4 w-4" />
              <span>You already reviewed this equipment.</span>
            </div>
          ) : !userHasRented ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Reviews are only available after you have rented this equipment.
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Customer Reviews ({stats.totalReviews || 0})
      </h3>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <p className="text-gray-500 dark:text-zinc-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {reviews.map((review) => (
            <ReviewItem
              key={review._id || review.id}
              review={review}
              currentUserId={currentUserId}
              onDelete={handleDeleteReview}
              onRatingChange={handleRatingChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
