"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import type { ApiBooking } from "@/lib/api-types";

interface PayBookingButtonProps {
  booking: ApiBooking;
}

/**
 * A row-level "Pay $<total>" action for unpaid, non-cancelled bookings.
 *
 * Calls POST /api/bookings/:id/pay, which responds with `{ url }` pointing
 * to a Stripe Checkout page, and redirects the browser to it. Shows a
 * loading spinner while the request is in flight and a toast on error.
 */
export function PayBookingButton({ booking }: PayBookingButtonProps) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    const id = booking._id || booking.id;
    if (!id) {
      toast.error("Missing booking ID — cannot start payment.");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(id)}/pay`,
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(
          err?.error ||
            (res.status === 401 || res.status === 403
              ? "You are not authorized to pay for this booking."
              : "Failed to start payment."),
        );
        return;
      }

      const data = await res.json();
      const url = data.url;
      if (!url || typeof url !== "string") {
        toast.error("Payment link was not returned. Please try again.");
        return;
      }

      // Leave the page for Stripe Checkout.
      window.location.href = url;
    } catch {
      toast.error("Network error: could not reach the server.");
    } finally {
      // The button stays disabled until the redirect completes or the
      // user returns (a failed redirect keeps them on the page).
      setPaying(false);
    }
  };

  const total = booking.amount ?? 0;

  return (
    <Button
      type="button"
      variant="default"
      size="xs"
      onClick={handlePay}
      disabled={paying}
      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {paying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : null}
      Pay ${total}
    </Button>
  );
}
