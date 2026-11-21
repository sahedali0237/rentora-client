"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApiBooking } from "@/lib/api-types";

const BG = "#F5F6F2";
const INK = "#12201B";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, color: INK }}>
      <Suspense fallback={<PaymentLoading />}>
        <CancelFlow />
      </Suspense>
    </div>
  );
}

function PaymentLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#F5C97B] animate-pulse" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CancelFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking");

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(!!bookingId);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/bookings/${encodeURIComponent(bookingId)}`,
          {
            credentials: "include",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.booking) {
          setBooking(data.booking as ApiBooking);
        }
      } catch {
        // Network failure: render the generic card without booking details.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handleRetryPayment = async () => {
    if (!bookingId || retrying) return;

    setRetrying(true);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}/checkout`,
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(
          err?.error ||
            (res.status === 401 || res.status === 403
              ? "You are not authorized to pay for this booking."
              : "Failed to start payment. Please try again."),
        );
        return;
      }

      const data = await res.json();
      const url = data.url;
      if (!url || typeof url !== "string") {
        alert("Payment link was not returned. Please try again.");
        return;
      }

      window.location.href = url;
    } catch {
      alert("Network error: could not reach the server.");
    } finally {
      // Keep the button disabled until the redirect completes or the user
      // returns (a failed redirect leaves them on the page).
      setRetrying(false);
    }
  };

  const amount = Number(booking?.amount || 0);
  const displayAmount = amount
    ? `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;
  const equipmentName = booking?.equipmentName || booking?.name || null;
  const equipmentImage = booking?.equipmentImage || null;
  const startDate = formatDate(booking?.startDate);
  const endDate = formatDate(booking?.endDate);
  const showDates =
    startDate && endDate && startDate !== "—" && endDate !== "—";

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:grid lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-[#d9ddd4] bg-white p-8 sm:p-10 text-center max-w-md mx-auto"
          >
            <div className="mx-auto mb-5 p-3 rounded-full bg-[#FBEFD8] text-[#C47F17]">
              <XCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment not completed</h2>
            <p className="text-gray-600 mb-8">
              You haven&apos;t been charged. Your booking is still unpaid, so
              you can try again whenever you&apos;re ready.
            </p>

            {/* Booking summary card */}
            <div className="rounded-xl border border-[#d9ddd4] p-4 text-left mb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-[#eceee9] overflow-hidden flex items-center justify-center">
                    {equipmentImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={equipmentImage}
                        alt={equipmentName || "Equipment"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="h-5 w-5 text-[#9aa29b]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {equipmentName || "Your booking"}
                    </p>
                    {showDates ? (
                      <p className="text-xs text-gray-500">
                        {startDate} – {endDate}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge variant="warning">Unpaid</Badge>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[#d9ddd4]">
                <p className="text-sm font-semibold">Amount due</p>
                <p className="text-sm font-semibold">{displayAmount || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleRetryPayment}
                disabled={!bookingId || loading || retrying}
                className="w-full bg-[#12201B] text-white hover:bg-[#12201B]/90"
              >
                {retrying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Try payment again
              </Button>
              <Button
                onClick={() => router.push("/renter/my-rentals")}
                className="w-full border border-[#d9ddd4] bg-white text-[#12201B] hover:bg-[#f5f6f2]"
              >
                Back to my bookings
              </Button>
            </div>
          </motion.div>

          <p className="mt-6 text-sm text-gray-600">
            Card declined or something went wrong? Check your card details or
            try another card.{" "}
            <a
              href="#"
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
