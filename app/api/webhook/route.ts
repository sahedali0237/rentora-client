import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

/**
 * POST /api/webhook
 * Stripe webhook endpoint. The raw request body is required for signature
 * verification, so it must NOT be parsed as JSON first.
 *
 * On checkout.session.completed, marks the referenced booking as Paid /
 * Confirmed and records the Stripe session id.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const stripeSession = event.data.object as Stripe.Checkout.Session;
    const bookingId = stripeSession.metadata?.bookingId;
    const stripeSessionId = stripeSession.id;

    if (bookingId) {
      await bookingsCollection().updateOne(
        { _id: userIdFilter(bookingId) } as Record<string, unknown>,
        {
          $set: {
            paymentStatus: "Paid",
            status: "Confirmed",
            stripeSessionId,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  return NextResponse.json({ received: true });
}
