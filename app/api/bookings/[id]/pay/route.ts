import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/bookings/:id/pay
 * Creates a Stripe Checkout Session for the booking and returns { url },
 * which the client redirects the browser to.
 *
 * Authenticates via the BetterAuth session. The amount/currency are taken
 * from the request body (the client is the source of truth for what the
 * user is paying for); the server converts the amount to cents and hands
 * it to Stripe so the customer can never alter the price.
 *
 * Next.js 15: `params` is a Promise.
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

  let amount: number | undefined;
  let currency: string | undefined;
  try {
    const body = (await request.json()) as {
      amount?: unknown;
      currency?: unknown;
    } | null;
    amount =
      body && body.amount !== undefined && body.amount !== null
        ? Number(body.amount)
        : undefined;
    currency =
      typeof body?.currency === "string" ? body.currency : undefined;
  } catch {
    // No body or invalid JSON — amount will be validated below.
  }

  if (!amount || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "A valid payable amount is required." },
      { status: 400 },
    );
  }

  // Stripe expects the amount in the currency's smallest unit (cents).
  const unitAmount = Math.round(amount * 100);
  const cur = currency || "usd";

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: cur,
            product_data: {
              name: "Equipment Rental",
              description: `Booking #${id}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/bookings/${id}`,
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
