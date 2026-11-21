import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

/**
 * GET /api/payment/session/:sessionId (auth required)
 *
 * Returns:
 *   { status: "confirmed", payment_status: "paid", booking, paymentMethod }
 *     when Stripe reports the session as paid. The referenced booking is
 *     marked paid/confirmed here (idempotently) so this endpoint does not
 *     depend only on the webhook.
 *   { status: "unpaid", payment_status: <stripe payment_status> } otherwise.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  } catch {
    return NextResponse.json(
      { status: "unpaid", payment_status: null },
      { status: 200 },
    );
  }

  const paymentStatus = stripeSession.payment_status;

  // Stripe reports the payment as paid: mark the referenced booking locally
  // (idempotent) so the success page does not depend solely on the webhook.
  if (paymentStatus === "paid") {
    const bookingId = stripeSession.metadata?.bookingId;
    let booking = null;
    if (bookingId) {
      await bookingsCollection().updateOne(
        { _id: userIdFilter(bookingId) } as Record<string, unknown>,
        {
          $set: {
            paymentStatus: "Paid",
            status: "Confirmed",
            stripeSessionId: sessionId,
            updatedAt: new Date(),
          },
        },
      );
      booking = await bookingsCollection().findOne(
        { _id: userIdFilter(bookingId) } as Record<string, unknown>,
      );
    }

    let paymentMethod: string | null = null;
    try {
      const pi = stripeSession.payment_intent as
        | Stripe.PaymentIntent
        | null
        | undefined;
      if (pi && typeof pi.payment_method === "string") {
        const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
        if (pm.card) {
          paymentMethod = `${pm.card.brand} •••• ${pm.card.last4}`;
        }
      }
    } catch {
      // Payment method is optional; proceed without it.
    }

    return NextResponse.json({
      status: "confirmed",
      payment_status: "paid",
      booking,
      paymentMethod,
    });
  }

  return NextResponse.json(
    { status: "unpaid", payment_status: paymentStatus ?? null },
    { status: 200 },
  );
}
