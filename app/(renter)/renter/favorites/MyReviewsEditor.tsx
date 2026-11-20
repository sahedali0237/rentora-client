"use client";

import { useState } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export type MyReview = {
  id: string;
  equipmentId: string;
  renterName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

/** Read-only star display (non-interactive). */
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

/** Interactive star selector used while editing. */
function editStars(selected: number, onSelect: (n: number) => void) {
  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onSelect(star)}
          aria-label={`Set rating to ${star} stars`}
          className="p-1 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800/50 rounded"
        >
          <Star
            className={`h-4 w-4 ${star <= selected ? "fill-yellow-400" : "text-gray-300"}`}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

export default function MyReviewsEditor({
  initialReviews,
  userId,
}: {
  initialReviews: MyReview[];
  userId?: string;
}) {
  const [reviews, setReviews] = useState<MyReview[]>(initialReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const startEdit = (review: MyReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment("");
  };

  const saveEdit = async () => {
    if (editingId === null) return;

    const review = reviews.find((r) => r.id === editingId);
    if (!review) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        rating: editRating,
        comment: editComment,
      };
      if (userId) body.userId = userId;

      const res = await fetch(
        `/api/reviews/${encodeURIComponent(review.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        },
      );

      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        /* ignore malformed error bodies */
      }

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id
              ? {
                  ...r,
                  rating: (data.rating ?? editRating) as number,
                  comment: (data.comment ?? editComment) as string,
                  updatedAt: (data.updatedAt ?? r.updatedAt) as string,
                }
              : r,
          ),
        );
        setEditingId(null);
        toast.success("Review updated successfully.");
      } else {
        toast.error((data.error as string) || "Failed to update review.");
      }
    } catch {
      toast.error("Failed to update review.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (review: MyReview) => {
    setDeletingId(review.id);
    setConfirmingDelete(true);
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setConfirmingDelete(false);
  };

  const performDelete = async () => {
    if (deletingId === null) return;

    const review = reviews.find((r) => r.id === deletingId);
    if (!review) return;

    setConfirmingDelete(false);
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id }),
        credentials: "include",
      });

      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        /* ignore malformed error bodies */
      }

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        setDeletingId(null);
        toast.success("Review deleted successfully.");
      } else {
        setDeletingId(null);
        toast.error((data.error as string) || "Failed to delete review.");
      }
    } catch {
      setDeletingId(null);
      toast.error("Failed to delete review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => {
        const isEditing = editingId === review.id;

        return (
          <div
            key={review.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col"
          >
            <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-800 dark:text-amber-400 font-semibold text-sm">
                    {review.renterName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {review.renterName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-zinc-500">
                      {review.createdAt}
                    </span>
                  </div>
                </div>
                {!isEditing ? renderStars(review.rating) : null}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <span className="text-yellow-500" aria-label="rating">
                      ★
                    </span>
                    Rating
                  </div>
                  {editStars(editRating, setEditRating)}
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white p-3 focus:ring-2 focus:ring-amber-500 outline-none"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={
                        saving || editComment.trim() === "" || editRating < 1
                      }
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
                  {review.comment || "No comment."}
                </p>
              )}

              {review.equipmentId && (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-xs text-gray-500 dark:text-zinc-500">
                    Equipment: {review.equipmentId}
                  </span>
                </div>
              )}
            </div>

            {!isEditing && !confirmingDelete && (
              <div className="flex items-center justify-between px-4 pb-3">
                <button
                  type="button"
                  onClick={() => startEdit(review)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400"
                >
                  <Pencil className="h-4 w-4" aria-hidden /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => confirmDelete(review)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                </button>
              </div>
            )}

            {confirmingDelete && deletingId === review.id && (
              <div className="px-4 pb-3 flex items-center justify-between gap-2">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Delete this review?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={performDelete}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
