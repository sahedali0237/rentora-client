"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Star, X, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { ApiBooking, ApiEquipment } from "@/lib/api-types";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ApiBooking;
  equipment?: ApiEquipment;
  onSubmitted?: () => void;
}

/**
 * A styled modal for submitting a review of an equipment item.
 * Replaces browser confirm() with an accessible, themed dialog.
 * Reuses Better Auth's `authClient.useSession()` for the signed-in user.
 *
 * No booking-status gate: renters can review at any time (pending, active,
 * completed, or even before a rental finishes).
 */
export function ReviewDialog({
  isOpen,
  onClose,
  booking,
  equipment,
  onSubmitted,
}: ReviewDialogProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Reset state each time the dialog opens (new booking)
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverStar(0);
      setComment("");
      setSubmitting(false);
      submittingRef.current = false;
      // A fresh dialog = a fresh idempotency key for this booking
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  }, [isOpen, booking._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Validation: missing auth ---
    if (!session?.user) {
      toast.error("You must be logged in to submit a review.");
      router.push("/sign-in");
      return;
    }

    // --- Validation: missing IDs ---
    const equipmentId =
      equipment?._id || equipment?.id || booking.equipmentId || "";
    if (!equipmentId) {
      toast.error("Missing equipment ID — cannot submit review.");
      return;
    }

    // --- Validation: rating must be 1–5 ---
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    // Guard: prevent double-submit
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    try {
      // The current /api/reviews POST only reads { equipmentId, rating, comment }
      // and pulls renter identity from the Better Auth session. We keep the
      // booking context for client-side duplicate tracking but the API does
      // not persist it. (See backend field-mismatch notes.)
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          equipmentId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Review submitted successfully. Thank you!");
        onSubmitted?.();
        onClose();
        // NOTE: submittingRef stays true — button remains disabled.
        // The dialog closes on success so the button is not visible.
      } else {
        // Try to surface a server error message; fall back to a generic one.
        let message = "Failed to submit review.";
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
          else if (err?.message) message = err.message;
        } catch {
          /* body was not JSON */
        }
        if (res.status === 401 || res.status === 403) {
          message = "You are not authorized to submit a review.";
        }
        if (res.status === 409 || /already/i.test(message)) {
          message = "This booking has already been reviewed.";
        }
        toast.error(message);
        // Re-enable on error so the user can retry.
        setSubmitting(false);
        submittingRef.current = false;
      }
    } catch {
      toast.error("Network error: could not reach the server.");
      // Re-enable on error so the user can retry.
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h3
              id="review-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Review Equipment
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Equipment info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
              {equipment?.img || equipment?.image ? (
                <img
                  src={equipment.img || equipment.image}
                  alt={equipment.name || "Equipment"}
                  className="h-14 w-14 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {equipment?.name || booking.equipmentName || "Equipment"}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {equipment?.category || "General"}
                </p>
              </div>
            </div>

            {/* Rating section */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                How was your rental?
              </p>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active =
                    star <= (hoverStar || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={star === rating}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      className="p-1 focus:outline-none focus:ring-2 focus:ring-amber-500/40 rounded-lg"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          active
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                  {rating} / 5 stars
                </p>
              )}
            </div>

            {/* Comment textarea */}
            <div>
              <label
                htmlFor="review-comment"
                className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
              >
                Tell us about your experience{" "}
                <span className="text-gray-400 dark:text-zinc-500">
                  (optional)
                </span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us about your experience..."
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
