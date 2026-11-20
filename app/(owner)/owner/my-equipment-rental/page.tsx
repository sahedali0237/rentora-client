"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, X } from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import type { ApiBooking } from "@/lib/api-types";

type RentalRow = {
  _id: string;
  equipmentId: string;
  equipmentName: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate: string;
  quantity: number;
  amount: number | string;
  notes: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export default function MyEquipmentRentalPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [bookings, setBookings] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which booking the cancel AlertDialog is open for (one at a time)
  const [cancelTarget, setCancelTarget] = useState<RentalRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = "/api/owner/bookings";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load rental requests.");
      }
      const data = await res.json();

      setBookings((data.bookings || []).map((b: ApiBooking) => ({
        _id: b._id || b.id || "",
        equipmentId: b.equipmentId || "",
        equipmentName: b.equipmentName || b.name || "Untitled",
        renterId: b.renterId || "",
        renterName: b.renterName || "Unknown",
        startDate: b.startDate || "-",
        endDate: b.endDate || "-",
        quantity: b.quantity || 1,
        amount: b.amount ?? 0,
        notes: b.notes || "",
        status: String(b.status || "pending").toLowerCase(),
        paymentStatus: String(b.paymentStatus || "unpaid").toLowerCase(),
        createdAt: b.createdAt || new Date().toISOString(),
      })));
    } catch (err) {
      console.error("Error loading owner bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load rental requests.");
      toast.error(err instanceof Error ? err.message : "Failed to load rental requests.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: "confirmed" | "rejected") => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${newStatus} booking.`);
      }

      const data = await res.json();
      const updatedBooking = data.booking;

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? { ...b, status: updatedBooking?.status || newStatus }
            : b,
        ),
      );

      toast.success(`Booking ${newStatus} successfully.`);
    } catch (err) {
      console.error(`Error ${newStatus}ing booking:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to ${newStatus} booking.`);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}/cancel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to cancel booking.");
      }

      const data = await res.json();
      const updatedBooking = data.booking;

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                status: String(
                  updatedBooking?.status ?? "cancelled",
                ).toLowerCase(),
              }
            : b,
        ),
      );

      toast.success("Booking cancelled successfully.");
      setCancelTarget(null);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel booking.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const statusVariant = (status: string): "default" | "secondary" | "destructive" | "success" | "warning" => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "confirmed":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const paymentVariant = (paymentStatus: string): "default" | "secondary" | "destructive" | "success" | "warning" => {
    switch (paymentStatus.toLowerCase()) {
      case "paid":
        return "success";
      case "unpaid":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <DashboardLayout
      role={session?.user?.activeRole === "owner" ? "owner" : "owner"}
      userName={session?.user?.name ?? ""}
      userEmail={session?.user?.email ?? ""}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Equipment Rentals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track bookings for your listed equipment.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-gray-500 dark:text-gray-400">Loading rental requests...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-gray-500 dark:text-gray-400 text-center">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No rental requests found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isPending = booking.status === "pending";
              const isPaid = booking.paymentStatus === "paid";

              return (
                <div
                  key={booking._id}
                  className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.equipmentName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">
                        <strong className="text-gray-900 dark:text-white">Renter:</strong>{" "}
                        {booking.renterName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        <strong className="text-gray-900 dark:text-white">Rental period:</strong>{" "}
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-end w-full md:w-auto text-right md:text-left">
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        <strong className="text-gray-900 dark:text-white block">Quantity:</strong>{" "}
                        {booking.quantity}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        <strong className="text-gray-900 dark:text-white block">Amount:</strong>{" "}
                        ৳{booking.amount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        <strong className="text-gray-900 dark:text-white block">Booking date:</strong>{" "}
                        {formatDate(booking.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(booking.status)}>
                        {String(booking.status).charAt(0).toUpperCase() + String(booking.status).slice(1)}
                      </Badge>
                      <Badge variant={paymentVariant(booking.paymentStatus)}>
                        {String(booking.paymentStatus).charAt(0).toUpperCase() + String(booking.paymentStatus).slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <>
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> <span>Paid</span>
                          </div>
                          <Badge variant="success" className="text-xs px-2 py-0.5">
                            Paid
                          </Badge>
                        </>
                      ) : (
                        <>
                          {booking.status !== "cancelled" &&
                            booking.status !== "canceled" && (
                              <Button
                                onClick={() =>
                                  setCancelTarget(booking)
                                }
                                variant="destructive"
                                size="sm"
                                className="px-3 py-1.5 text-xs"
                                disabled={cancelling}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                            )}
                          {isPending && (
                            <>
                              <Button
                                onClick={() => handleStatusChange(booking._id, "confirmed")}
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(booking._id, "rejected")}
                                variant="destructive"
                                size="sm"
                                className="px-3 py-1.5 text-xs"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                <AlertDialogTitle>
                  Cancel booking?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cancel the booking for{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    "{cancelTarget.equipmentName}"
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cancelTarget.renterName}
                  </span>
                  ? This will mark the booking as cancelled and cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                >
                  Keep Booking
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => handleCancelBooking(cancelTarget._id)}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel Booking"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogBody>
          </AlertDialog>
        )}
      </div>
    </DashboardLayout>
  );
}