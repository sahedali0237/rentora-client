import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const bookingsCollection = () => db.collection("bookings");

/**
 * POST /api/bookings/:id/checkout
 * Creates a Stripe Checkout Session (mode: payment) for an unpaid booking and
 * returns { url } for the client to redirect to. Next.js 15: `params` is a Promise.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payment provider is not configured." },
      { status: 500 },
    );
  }

  const booking = await bookingsCollection().findOne(
    { _id: userIdFilter(id) } as Record<string, unknown>,
  );

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only allow payment when the booking is still unpaid.
  if (String(booking.paymentStatus || "").toLowerCase() !== "unpaid") {
    return NextResponse.json(
      { error: "This booking has already been paid for." },
      { status: 400 },
    );
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  // The amount is taken from the booking itself (server-side) so the client
  // can never alter the price.
  const amount = Number(booking.amount || 0);
  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "This booking has no payable amount." },
      { status: 400 },
    );
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Equipment Rental",
              description: `Booking #${id}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel?booking=${encodeURIComponent(id)}`,
      metadata: {
        bookingId: id,
        renterEmail: session.user.email,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
