"use client";

import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
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

  const refetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const fresh: ApiBooking[] = data.bookings || [];
      // Map the fresh bookings back into rows, preserving the row status
      // normalization from the initial page (the server RSC did this for
      // us on first load).
      setRows((prev) =>
        fresh.map((b) => {
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
        }),
      );
    } catch {
      // Fail silently — the table will keep showing the last-known state.
    }
  }, []);

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

  return (
    <DataTable
      columns={columns}
      data={rows as unknown as Record<string, unknown>[]}
      cellRenderer={(key, value, row) => {
        const rentalRow = row as unknown as RentalRow;
        const b = rentalRow.booking;
        const equipmentId = b.equipmentId || "";
        const equipment = allEquipment.find(
          (e) => (e._id || e.id || "") === equipmentId,
        );

        if (key === "equipment") {
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {b.equipmentName || b.name || "Untitled"}
              </span>
              {equipment && (equipment.img || equipment.image) && (
                <img
                  src={equipment.img || equipment.image}
                  alt={b.equipmentName || b.name || "Equipment"}
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
        if (key === "amount") return `$${b.amount || 0}`;
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
          const isUnpaid = payment !== "paid";
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

          const showPay = payment === "unpaid" && status !== "cancelled";
          const showReview = isConfirmed;

          if (!showPay && !showReview) {
            // Unpaid but not confirmed yet — nothing actionable besides
            // paying, which is covered below.
            return null;
          }

          return (
            <div className="flex items-center gap-2">
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
  );
}
