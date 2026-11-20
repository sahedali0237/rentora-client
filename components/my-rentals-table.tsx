"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { BookingReviewButton } from "@/components/booking-review-button";
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
 * Client component that renders the My Rentals table with review buttons.
 * Kept as a separate client component so that the parent page (a RSC)
 * doesn't have to be a client component.
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
          const variant = value === "paid" ? "success" : "warning";
          return (
            <Badge variant={variant}>
              <span>
                {String(value)
                  .charAt(0)
                  .toUpperCase() + String(value).slice(1)}
              </span>
            </Badge>
          );
        }
        if (key === "bookingStatus") {
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
          };
          const variant = statusMap[String(value).toLowerCase()] || "secondary";
          return (
            <Badge variant={variant}>
              <span>
                {String(value)
                  .charAt(0)
                  .toUpperCase() + String(value).slice(1)}
              </span>
            </Badge>
          );
        }
        if (key === "actions") {
          return (
            <BookingReviewButton
              booking={b}
              equipment={equipment}
              reviewed={
                (b._id ? reviewedIds.has(b._id) : false) ||
                (b.id ? reviewedIds.has(b.id) : false) ||
                rentalRow.reviewed
              }
              status={rentalRow.status}
              onReviewed={handleReviewed}
            />
          );
        }
        return value as React.ReactNode;
      }}
    />
  );
}
