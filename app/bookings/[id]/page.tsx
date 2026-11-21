"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PayButton } from "@/components/pay-button";
import { PaymentVerifier } from "@/components/payment-verifier";

export default function BookingPage() {
  const { id } = useParams();
  const bookingId = Array.isArray(id) ? id[0] : id || "";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: session } = authClient.useSession();
  const userEmail = session?.user.email ?? "";

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !userEmail) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await fetch(
          `/api/bookings?email=${encodeURIComponent(userEmail)}`,
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) {
          setBooking(null);
          return;
        }
        const data = await res.json();
        const list: any[] = data.bookings || [];
        const b = list.find((x) => (x._id || x.id) === bookingId);
        setBooking(b || null);
      } catch {
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchBooking();
  }, [bookingId, userEmail, sessionId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <p className="text-gray-500 dark:text-zinc-500">Booking not found.</p>
      </div>
    );
  }

  const paymentStatus = String(booking.paymentStatus || "unpaid").toLowerCase();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PaymentVerifier bookingId={bookingId} />

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 mb-6">
        <a
          href="/renter/my-rentals"
          className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
        >
          My Rentals
        </a>
        <span> &gt; </span>
        <span>Booking {bookingId}</span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Booking {bookingId}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
          {booking.equipmentName || "Equipment"}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Payment:
          </span>
          <span
            className={`text-sm font-medium ${
              paymentStatus === "paid"
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-zinc-400"
            }`}
          >
            {paymentStatus}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full border text-gray-600 dark:text-zinc-400"
          >
            {String(booking.status || "pending").toLowerCase()}
          </span>
        </div>

        {paymentStatus === "unpaid" && booking.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            <PayButton booking={booking} />
          </div>
        )}
      </div>
    </div>
  );
}
