"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Truck, Headphones, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BG = "#F5F6F2";
const INK = "#12201B";
const GREEN = "#15803D";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, color: INK }}>
      <Suspense fallback={<PaymentLoading />}>
        <SuccessFlow />
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
        <div className="h-10 w-10 rounded-full bg-[#15803D] animate-pulse" />
        <p className="text-sm font-medium">Finalizing your payment…</p>
      </div>
    </div>
  );
}

async function fetchSession(sessionId) {
  const res = await fetch(
    `/api/payment/session/${encodeURIComponent(sessionId)}`,
    {
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Session lookup failed");
  return res.json();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SuccessFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [state, setState] = useState({
    status: "loading", // loading | idle | confirmed | failed | timeout | error
    booking: null,
    paymentMethod: null,
    attempt: 0,
  });
  const [retryKey, setRetryKey] = useState(0);

  const MAX_ATTEMPTS = 10;
  const POLL_INTERVAL_MS = 2000;

  useEffect(() => {
    // No session_id in the URL: nothing to poll.
    if (!sessionId) {
      setState({
        status: "idle",
        booking: null,
        paymentMethod: null,
        attempt: 0,
      });
      return undefined;
    }

    let attempt = 0;
    let polling = false;
    let intervalId = null;

    const poll = async () => {
      if (polling) return;
      polling = true;
      attempt += 1;
      setState((s) => ({ ...s, status: "loading", attempt }));

      try {
        const data = await fetchSession(sessionId);

        if (data.status === "confirmed" || data.payment_status === "paid") {
          setState({
            status: "confirmed",
            booking: data.booking ?? null,
            paymentMethod: data.paymentMethod ?? null,
            attempt,
          });
          if (intervalId) clearInterval(intervalId);
          return;
        }

        if (data.status === "unpaid" || data.status === "failed") {
          setState((s) => ({ ...s, status: "failed", attempt }));
          if (intervalId) clearInterval(intervalId);
          return;
        }

        // Still processing (or any other status): keep polling until the limit.
        if (attempt >= MAX_ATTEMPTS) {
          setState((s) => ({ ...s, status: "timeout", attempt }));
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        if (attempt >= MAX_ATTEMPTS) {
          setState((s) => ({ ...s, status: "error", attempt }));
          if (intervalId) clearInterval(intervalId);
        }
      } finally {
        polling = false;
      }
    };

    void poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, retryKey]);

  const handleRetry = () => {
    setRetryKey((k) => k + 1);
    setState({
      status: "loading",
      booking: null,
      paymentMethod: null,
      attempt: 0,
    });
  };

  const { status: payStatus, booking, paymentMethod, attempt } = state;

  if (payStatus === "idle") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: BG, color: INK }}
      >
        <div className="rounded-2xl border border-[#d9ddd4] bg-white p-8 text-center max-w-md">
          <div className="mx-auto mb-4 p-3 rounded-full bg-[#fdecea] text-[#b91c1c]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">No payment session</h2>
          <p className="text-gray-600 mb-6">
            No Stripe session was found in the URL. Please complete the
            checkout flow again.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => router.push("/renter/my-rentals")}
              className="w-full bg-[#12201B] text-white hover:bg-[#12201B]/90"
            >
              View my bookings
            </Button>
            <Button
              onClick={() => router.push("/equipment")}
              className="w-full border border-[#d9ddd4] bg-white text-[#12201B] hover:bg-[#f5f6f2]"
            >
              Browse more equipment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (payStatus === "loading") {
    return <PaymentLoading />;
  }

  if (payStatus === "failed" || payStatus === "timeout" || payStatus === "error") {
    const title =
      payStatus === "timeout"
        ? "Payment confirmation timed out"
        : payStatus === "error"
          ? "Could not confirm payment"
          : "Payment not confirmed";
    const body =
      payStatus === "timeout"
        ? "We didn't receive a confirmation from Stripe in time. Your payment may still be processing."
        : payStatus === "error"
          ? "We couldn't reach the payment server. Please try again."
          : "We couldn't confirm your payment. Please try again or contact support.";

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: BG, color: INK }}
      >
        <div className="rounded-2xl border border-[#d9ddd4] bg-white p-8 text-center max-w-md">
          <div className="mx-auto mb-4 p-3 rounded-full bg-[#fdecea] text-[#b91c1c]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{body}</p>
          <p className="text-xs text-gray-500 mb-6">
            Polling attempts: {attempt}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-[#12201B] text-white hover:bg-[#12201B]/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
            <Button
              onClick={() => router.push("/renter/my-rentals")}
              className="w-full border border-[#d9ddd4] bg-white text-[#12201B] hover:bg-[#f5f6f2]"
            >
              View my bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (payStatus === "confirmed" && booking) {
    const equipmentName = booking.equipmentName || "Equipment";
    const ownerName = booking.ownerName || "Equipment owner";
    const startDate = formatDate(booking.startDate);
    const endDate = formatDate(booking.endDate);
    const bookingId = String(booking._id || booking.id || "");
    const amount = Number(booking.amount || 0);
    const displayAmount = amount ? `$${amount.toLocaleString()}` : "$0.00";

    return (
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:grid lg:grid-cols-12 gap-8"
        >
          {/* Left column: booking confirmation card */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-[#d9ddd4] bg-white p-8"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ea] text-[#15803D]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Payment successful</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Your booking is confirmed. We've sent a receipt to your email and
                notified the equipment owner.
              </p>

              <div className="grid gap-4 mb-6">
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Equipment
                  </p>
                  <p className="font-medium">{equipmentName}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Owner
                  </p>
                  <p className="font-medium">{ownerName}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Rental period
                  </p>
                  <p className="font-medium">
                    {startDate} – {endDate}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Booking ID
                  </p>
                  <p className="font-medium">{bookingId}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Payment method
                  </p>
                  <p className="font-medium">{paymentMethod || "Card"}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#d9ddd4]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    Amount paid
                  </p>
                  <p className="font-semibold">{displayAmount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-8">
                <Badge className="bg-[#15803D] text-[#12201B]">Confirmed</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => router.push("/renter/my-rentals")}
                  className="w-full bg-[#12201B] text-white hover:bg-[#12201B]/90"
                >
                  View my bookings
                </Button>
                <Button
                  onClick={() => router.push("/equipment")}
                  className="w-full border border-[#d9ddd4] bg-white text-[#12201B] hover:bg-[#f5f6f2]"
                >
                  Browse more equipment
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right column: timeline + support card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-[#d9ddd4] bg-white p-6"
            >
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#15803D]" /> What happens next
              </h3>
              <ol className="space-y-5">
                {[
                  {
                    step: 1,
                    title: "Owner prepares your gear",
                    body: "You'll be notified when your booking is confirmed and the gear is ready.",
                  },
                  {
                    step: 2,
                    title: "Pick up on rental start",
                    body: "Pickup details appear in your booking.",
                  },
                  {
                    step: 3,
                    title: "Return it on rental end",
                    body: "Return it in the same condition.",
                  },
                ].map((s) => (
                  <li key={s.step} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#15803D] bg-[#15803D] text-white text-xs font-bold mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-gray-600">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl bg-[#12201B] text-white p-6"
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#15803D]" /> Need to change
                something?
              </h3>
              <p className="text-[#c9d4cb] text-sm mb-4">
                Contact the owner from your bookings page or reach our support
                team.
              </p>
              <Button className="w-full text-[#12201B] bg-white hover:bg-[#e7f3ea]">
                Contact support
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
