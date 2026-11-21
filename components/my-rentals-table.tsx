"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, XCircle } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookingReviewButton } from "@/components/booking-review-button";
import { PayButton } from "@/components/pay-button";
import { toast } from "react-toastify";
import type {
  ApiBooking,
  ApiEquipment,
  BookingStatus,
} from "@/lib/api-types";

export type RentalRow = {
  booking: ApiBooking;
  status: BookingStatus;
  reviewed: boolean;
};

/**
 * Client component that renders the My Rentals table with payment and
 * review actions. Kept as a separate client component so that the parent
 * page (a RSC) doesn't have to be a client component.
 *
 * When the row data is replaced (e.g. after a cancel refetch), a
 * `rentals:rows` window event is dispatched so sibling live status
 * counters (the Pending/Cancelled stat cards) update without a page
 * reload.
 */
export function MyRentalsTable({
  initialRows,
  userReviewBookingIds,
  allEquipment,
}: {
  initialRows: RentalRow[];
  userReviewBookingIds: string[];
  allEquipment: ApiEquipment[];
}) {
  const [rows, setRows] = useState<RentalRow[]>(initialRows);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(
    () => new Set(userReviewBookingIds),
  );
  // Tracks the last row data the parent was notified about, so a refetch
  // that returns an identical list (e.g. the delayed payment retry) does
  // not re-render the parent's counters pointlessly.
  const lastNotified = useRef<string | null>(null);

  // Booking currently open in the cancel confirmation dialog, or null.
  const [cancelTarget, setCancelTarget] = useState<ApiBooking | null>(null);
  // Booking id the cancel request is in flight for (disables the dialog).
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleReviewed = useCallback((bookingId: string) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      next.add(bookingId);
      return next;
    });
    setRows((prev) =>
      prev.map((row) =>
        row.booking._id === bookingId || row.booking.id === bookingId
          ? { ...row, reviewed: true }
          : row,
      ),
    );
  }, []);

  /**
   * Handle Stripe Checkout return: when the URL has ?paid=1, show a
   * "Payment successful" toast, refetch the bookings so the badges and
   * actions update to the paid/confirmed state, and clean up the query
   * param. Because the Stripe webhook may take a moment to mark the
   * booking as paid on the backend, if the refetched rows are still
   * showing an unpaid booking, schedule one more refetch ~2s later.
   */
  const [fetchedOnce, setFetchedOnce] = useState(false);

  /** Report fresh rows to the live status counters in the page. */
  const notifyRows = useCallback((next: RentalRow[]) => {
    const signature = JSON.stringify(
      next.map((r) => [r.booking._id ?? r.booking.id, r.status]),
    );
    if (signature === lastNotified.current) return;
    lastNotified.current = signature;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rentals:rows", { detail: next }));
    }
  }, []);

  const refetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const fresh: ApiBooking[] = data.bookings || [];
      // Map the fresh bookings back into rows, preserving the row status
      // normalization from the initial page (the server RSC did this for
      // us on first load).
      setRows((prev) => {
        const next = fresh.map((b) => {
          const rawStatus = String(b.status || "").toLowerCase();
          const status: BookingStatus =
            rawStatus === "pending" ||
            rawStatus === "confirmed" ||
            rawStatus === "active" ||
            rawStatus === "completed" ||
            rawStatus === "cancelled"
              ? rawStatus
              : "pending";
          const existing = prev.find(
            (r) => r.booking._id === b._id || r.booking.id === b.id,
          );
          return {
            booking: b,
            status,
            reviewed: existing?.reviewed ?? false,
          };
        });
        // Report the fresh rows to the live status counters so the
        // Pending/Cancelled stat cards refresh immediately after a cancel.
        notifyRows(next);
        return next;
      });
    } catch {
      // Fail silently — the table will keep showing the last-known state.
    }
  }, [notifyRows]);

  useEffect(() => {
    if (fetchedOnce) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    setFetchedOnce(true);

    toast.success("Payment successful");

    // Clean the query param without a full reload so the user doesn't
    // re-trigger this flow.
    const url = new URL(window.location.href);
    url.searchParams.delete("paid");
    window.history.replaceState({}, "", url.toString());

    // First refetch: by the time the redirect lands, the webhook has
    // usually already fired, but not always.
    void refetchBookings();
    // Second refetch ~2s later to cover the slow webhook case.
    const timer = setTimeout(() => {
      void refetchBookings();
    }, 2000);
    return () => clearTimeout(timer);
  }, [fetchedOnce, refetchBookings]);

  /**
   * Confirm the cancel via PATCH /api/bookings/:id/cancel, then refresh the
   * list so the row badges and the Pending/Cancelled counters update.
   */
  const handleCancelBooking = async (booking: ApiBooking) => {
    const id = booking._id || booking.id;
    if (!id) return;
    setCancellingId(id);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(id)}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(
          err?.error || "Failed to cancel booking. Please try again.",
        );
        return;
      }
      toast.success("Booking cancelled successfully.");
      await refetchBookings();
    } catch {
      toast.error("Network error: could not cancel booking.");
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  const columns = [
    { key: "equipment", label: "Equipment" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "bookingDate", label: "Booked On" },
    { key: "amount", label: "Total" },
    { key: "paymentStatus", label: "Payment" },
    { key: "bookingStatus", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const cancelBookingTitle =
    cancelTarget?.equipmentName ||
    (cancelTarget?.name as string | undefined) ||
    "this equipment";

  return (
    <>
      <DataTable
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        cellRenderer={(key, value, row) => {
          const rentalRow = row as unknown as RentalRow;
          const b = rentalRow.booking as ApiBooking & {
            totalPrice?: number | string;
            equipment?: {
              rentalPrice?: number | string;
              price?: number | string;
            };
          };
          // Total price with fallbacks so older records (amount only) and
          // newer ones (totalPrice, or a populated equipment object
          // carrying the price) all display properly.
          const total =
            b.totalPrice ??
            b.amount ??
            b.equipment?.rentalPrice ??
            b.equipment?.price ??
            0;
          const equipmentId = b.equipmentId || "";
          const equipment = allEquipment.find(
            (e) => (e._id || e.id || "") === equipmentId,
          );

          if (key === "equipment") {
            const title =
              b.equipmentName ||
              b.name ||
              equipment?.name ||
              "Untitled";
            const eq = equipment as unknown as
              | (ApiEquipment & { images?: unknown })
              | undefined;
            // Images with fallbacks so both older records (booking's
            // equipmentImage or flat img/image fields) and newer ones
            // (a populated equipment object with an images array) render.
            const image =
              b.equipmentImage ||
              (Array.isArray(eq?.images) ? (eq.images as string[])[0] : undefined) ||
              eq?.img ||
              eq?.image;
            return (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {title}
                </span>
                {image && (
                  <img
                    src={image}
                    alt={title}
                    className="h-8 w-8 rounded-lg object-cover bg-gray-100 dark:bg-zinc-800"
                    loading="lazy"
                  />
                )}
              </div>
            );
          }
          if (key === "startDate") return b.startDate || "-";
          if (key === "endDate") return b.endDate || "-";
          if (key === "bookingDate")
            return b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-";
          if (key === "amount") return `$${Number(total) || 0}`;
          if (key === "paymentStatus") {
            // Read the actual payment status from the booking (the column key
            // does not map to a property on the row object). Default to
            // "unpaid" when missing so we never show "undefined".
            const payment = String(b.paymentStatus || "unpaid").toLowerCase();
            const variant = payment === "paid" ? "success" : "secondary";
            return (
              <Badge variant={variant}>
                <span>{payment}</span>
              </Badge>
            );
          }
          if (key === "bookingStatus") {
            // Read the actual booking status from the row (the column key does
            // not map to a property on the row object). The row always carries
            // a normalized BookingStatus, so this can never be "undefined".
            const status = String(rentalRow.status || "").toLowerCase();
            const statusMap: Record<
              string,
              "default" | "secondary" | "destructive" | "success" | "warning"
            > = {
              pending: "warning",
              confirmed: "success",
              active: "success",
              completed: "success",
              cancelled: "destructive",
              canceled: "destructive",
              rejected: "destructive",
            };
            const variant = statusMap[status] || "secondary";
            return (
              <Badge variant={variant}>
                <span>{status}</span>
              </Badge>
            );
          }
          if (key === "actions") {
            const payment = String(b.paymentStatus || "unpaid").toLowerCase();
            const status = String(rentalRow.status || "").toLowerCase();
            const isCancelled =
              status === "cancelled" || status === "canceled";
            const isConfirmed = status === "confirmed";

            // Cancelled bookings show no actions.
            if (isCancelled) {
              return null;
            }

            const isReviewed =
              (b._id ? reviewedIds.has(b._id) : false) ||
              (b.id ? reviewedIds.has(b.id) : false) ||
              rentalRow.reviewed;

            // Pending, unpaid bookings can be cancelled right before paying.
            const showCancel =
              status === "pending" &&
              payment === "unpaid" &&
              Boolean(b._id || b.id);
            const showPay = payment === "unpaid" && status !== "cancelled";
            const showReview = isConfirmed;

            if (!showPay && !showReview && !showCancel) {
              // Nothing actionable for this booking.
              return null;
            }

            return (
              <div className="flex items-center gap-2">
                {showCancel && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => setCancelTarget(b)}
                    className="gap-1.5 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}
                {showPay && <PayButton booking={b} />}
                {showReview && (
                  <BookingReviewButton
                    booking={b}
                    equipment={equipment}
                    reviewed={isReviewed}
                    status={rentalRow.status}
                    onReviewed={handleReviewed}
                  />
                )}
              </div>
            );
          }
          return value as React.ReactNode;
        }}
      />

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <AlertDialog
          open={cancelTarget !== null}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
        >
          <AlertDialogBody>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
              <AlertDialogDescription>
                Cancel the booking for{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  "{cancelBookingTitle}"
                </span>{" "}
                ? This will mark the booking as cancelled and cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setCancelTarget(null)}
                disabled={cancellingId !== null}
              >
                Keep Booking
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  if (cancelTarget) void handleCancelBooking(cancelTarget);
                }}
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling…
                  </span>
                ) : (
                  "Cancel Booking"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogBody>
        </AlertDialog>
      )}
    </>
  );
}
