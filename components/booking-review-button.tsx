"use client";

import { useState } from "react";
import { CheckCircle, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiBooking, ApiEquipment, BookingStatus } from "@/lib/api-types";
import { ReviewDialog } from "@/components/review-dialog";

interface BookingReviewButtonProps {
  booking: ApiBooking;
  equipment?: ApiEquipment;
  reviewed: boolean;
  status: BookingStatus;
  onReviewed?: (bookingId: string) => void;
}

/**
 * A row-level "Write a Review" action.
 *
 * - Shown for any booking (renters can review equipment at any time, even
 *   before a rental is completed).
 * - If the equipment has already been reviewed, a read-only "Reviewed" chip
 *   is shown instead.
 * - Clicking opens the ReviewDialog which POSTs to /api/reviews and updates
 *   the review state after success.
 */
export function BookingReviewButton({
  booking,
  equipment,
  reviewed,
  status,
  onReviewed,
}: BookingReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Already reviewed — show a compact read-only chip.
  if (reviewed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
        aria-label="Reviewed"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Reviewed
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="xs"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
      >
        <PenLine className="h-3.5 w-3.5" />
        Write a Review
      </Button>

      <ReviewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        booking={booking}
        equipment={equipment}
        onSubmitted={() => {
          const id = booking._id || booking.id || "";
          onReviewed?.(id);
        }}
      />
    </>
  );
}
