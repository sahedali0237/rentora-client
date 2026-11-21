"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

interface PaymentVerifierProps {
  bookingId: string;
}

/**
 * Client component rendered on the booking page after Stripe Checkout
 * returns. Reads `session_id` from the URL, verifies the payment with the
 * backend (no webhooks), then replaces the URL so the booking status
 * refreshes without the query string. Runs only once, even under React
 * strict mode (guarded by a ref set synchronously at effect start).
 */
export function PaymentVerifier({ bookingId }: PaymentVerifierProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  // Ref-based guard so React strict-mode double-invocation cannot trigger
  // the verification request more than once.
  const started = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!sessionId || started.current || done) return;
    started.current = true;

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/bookings/${encodeURIComponent(bookingId)}/verify-payment`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(
            err?.error ||
              (res.status === 409 || res.status === 400
                ? "Payment verification failed."
                : `Verification failed (${res.status}).`),
          );
          setDone(true);
          return;
        }

        await res.json();

        // Remove the session_id query string so the booking page re-renders
        // with the refreshed payment status, then refresh the data.
        router.replace(`/bookings/${bookingId}`);
        router.refresh();
      } catch {
        toast.error("Network error: could not verify payment.");
      } finally {
        setDone(true);
      }
    };

    void verify();
  }, [sessionId, bookingId, router, done]);

  return null;
}
