"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSessionUser } from "@/lib/use-session-user";

/**
 * /how-it-works — marketing page explaining how the Rentora rental
 * marketplace works for renters and owners, plus booking statuses.
 *
 * Theme: light tokens by default, dark tokens via `dark:` variants that
 * sync with the app-wide theme system (`.dark` class on <html>, toggled
 * by ThemeToggle / theme-init.js).
 *
 * Motion: subtle fade-up on scroll (whileInView, once, y 24 -> 0, 0.5s)
 * with a 0.08s stagger between cards in a grid. The hero fades in on
 * load. Respects prefers-reduced-motion via useReducedMotion.
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F6F3] dark:focus-visible:ring-offset-[#10352c]";

type Transition = {
  duration?: number;
  delay?: number;
};

type Target = { opacity: number; y: number };

function fadeUp(reduced: boolean, delay = 0): Transition {
  return reduced ? { duration: 0 } : { duration: 0.5, delay };
}

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "16px",
} as const;

const threeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
} as const;

const pillButton = `inline-flex items-center justify-center min-h-11 px-[22px] rounded-full text-[15px] font-semibold transition-colors ${FOCUS_RING}`;

export function HowItWorks() {
  const reduced = useReducedMotion() ?? false;
  const { user, isPending } = useSessionUser();

  // "List your equipment" resolves to the owner add-equipment route when
  // signed in (that route is behind the owner guard) and to /sign-in
  // otherwise, so unauthenticated visitors can authenticate first.
  const listHref = user ? "/list-equipment" : "/sign-in";

  const heroTransition = {
    initial: reduced ? undefined : ({ opacity: 0, y: 24 } as Target),
    animate: reduced ? undefined : ({ opacity: 1, y: 0 } as Target),
    transition: fadeUp(reduced),
  };

  const inView = (delay: number) => ({
    initial: reduced ? undefined : { opacity: 0, y: 24 },
    whileInView: reduced ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: fadeUp(reduced, delay),
  });

  return (
    <div className="text-[#10161F] dark:text-white">
      <section className="mx-auto w-full max-w-280 px-6 pt-20 pb-16">
        <motion.div
          {...heroTransition}
          className="mx-auto max-w-215 text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4A5361] dark:text-gray-400">
            How Rentora works
          </p>
          <h1 className="font-(family-name:--font-space-grotesk) font-bold mt-4 text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[64px] text-[#10161F] dark:text-white">
            Rent the gear.
            <br />
            Skip the buying.
          </h1>
          <p className="mt-6 text-[19px] leading-relaxed text-[#4A5361] dark:text-gray-400">
            Rentora connects people who need equipment with owners who have it.
            Pick your dates, pay securely, and you&apos;re booked.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/equipment"
              className={`${pillButton} bg-[#FFC400] text-[#10161F] hover:bg-[#e6b100]`}
            >
              Browse equipment
            </Link>
            <Link
              href={listHref}
              className={`${pillButton} bg-transparent border-[1.5px] border-[#10161F] dark:border-white text-[#10161F] dark:text-white hover:bg-[#10161F]/5 dark:hover:bg-white/10`}
            >
              List your equipment
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-280 px-6 py-16">
        <motion.div {...inView(0)}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4A5361] dark:text-gray-400">
            For renters
          </p>
          <h2 className="font-(family-name:--font-space-grotesk) font-bold mt-3 text-[40px] tracking-tight text-[#10161F] dark:text-white">
            Book in four steps
          </h2>
        </motion.div>

        <div className="mt-10" style={cardGrid}>
          {[
            {
              step: 1,
              title: "Browse",
              body: "Explore equipment listed by owners and compare daily prices.",
            },
            {
              step: 2,
              title: "Pick your dates",
              body: "Choose a start and end date. Your total is the daily rate times the number of days.",
            },
            {
              step: 3,
              title: "Pay with Stripe",
              body: "New bookings start unpaid. Press Pay to check out securely with your account email already filled in.",
            },
            {
              step: 4,
              title: "Get confirmed",
              body: "When payment succeeds, your booking is confirmed automatically.",
            },
          ].map((card, i) => (
            <motion.article
              key={card.step}
              {...inView(i * 0.08)}
              className="rounded-2xl border border-[#DDE0DA] dark:border-[#1a4a40] bg-white dark:bg-[#10352c] p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#10161F] dark:bg-[#FFC400] font-(family-name:--font-space-grotesk) font-bold text-[18px] text-[#FFC400] dark:text-[#10161F]"
                >
                  {card.step}
                </span>
                <h3 className="font-(family-name:--font-space-grotesk) font-bold text-[18px] text-[#10161F] dark:text-white">
                  {card.title}
                </h3>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4A5361] dark:text-gray-400">
                {card.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-[#10161F] py-20">
        <div className="mx-auto w-full max-w-280 px-6">
          <motion.div {...inView(0)}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#FFC400]">
              For owners
            </p>
            <h2 className="font-(family-name:--font-space-grotesk) font-bold mt-3 text-[40px] tracking-tight text-white">
              Put idle equipment to work
            </h2>
          </motion.div>

          <div className="mt-10" style={threeColGrid}>
            {[
              {
                step: 1,
                title: "List your equipment",
                body: "Add a title, photos and a daily rental price. Your listing goes live for renters to find.",
              },
              {
                step: 2,
                title: "Receive bookings",
                body: "Each booking shows the renter, dates, total and payment status in your dashboard.",
              },
              {
                step: 3,
                title: "Stay in control",
                body: "Cancel a booking while it is unpaid. Once it is paid and confirmed, it is locked in.",
              },
            ].map((card, i) => (
              <motion.article
                key={card.step}
                {...inView(i * 0.08)}
                className="rounded-2xl border border-[#2B3548] bg-[#1A2230] p-6"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFC400] font-(family-name:--font-space-grotesk) font-bold text-[18px] text-[#10161F]"
                  >
                    {card.step}
                  </span>
                  <h3 className="font-(family-name:--font-space-grotesk) font-bold text-[18px] text-white">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-[#C3CAD6]">
                  {card.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-280 px-6 py-16">
        <motion.div {...inView(0)}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4A5361] dark:text-gray-400">
            Booking status
          </p>
          <h2 className="font-(family-name:--font-space-grotesk) font-bold mt-3 text-[40px] tracking-tight text-[#10161F] dark:text-white">
            What each status means
          </h2>
        </motion.div>

        <div className="mt-10" style={threeColGrid}>
          {[
            {
              label: "Unpaid",
              pillBg: "#FFF1C2",
              pillText: "#5C4300",
              title: "Waiting for payment",
              body: "The renter sees a Pay button. The owner can still cancel the booking.",
            },
            {
              label: "Paid",
              pillBg: "#DCE8FB",
              pillText: "#12356B",
              title: "Payment received",
              body: "Stripe reports a successful payment and the booking moves on by itself.",
            },
            {
              label: "Confirmed",
              pillBg: "#DDF3E4",
              pillText: "#14532D",
              title: "You're booked",
              body: "Set automatically after payment. The owner can no longer cancel.",
            },
          ].map((card, i) => (
            <motion.article
              key={card.label}
              {...inView(i * 0.08)}
              className="rounded-2xl border border-[#DDE0DA] dark:border-[#1a4a40] bg-white dark:bg-[#10352c] p-6"
            >
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold"
                style={{ backgroundColor: card.pillBg, color: card.pillText }}
              >
                {card.label}
              </span>
              <h3 className="font-(family-name:--font-space-grotesk) font-bold mt-3 text-[18px] text-[#10161F] dark:text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A5361] dark:text-gray-400">
                {card.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-280 px-6 pb-16">
        <div className="mx-auto max-w-215 space-y-4">
          {[
            {
              q: "How is the price worked out?",
              a: "Daily rental price multiplied by the number of days you book.",
            },
            {
              q: "Who can do what?",
              a: "Customers browse and book. Owners list equipment and manage bookings. Admins oversee the platform.",
            },
            {
              q: "Is payment secure?",
              a: "Yes. Payments are handled by Stripe Checkout, so card details never touch Rentora.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.q}
              {...inView(i * 0.08)}
              className="rounded-2xl border border-[#DDE0DA] dark:border-[#1a4a40] bg-white dark:bg-[#10352c] p-6"
            >
              <h3 className="font-(family-name:--font-space-grotesk) font-bold text-[19px] text-[#10161F] dark:text-white">
                {item.q}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#4A5361] dark:text-gray-400">
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-280 px-6 pb-20">
        <motion.div
          {...inView(0)}
          className="rounded-3xl bg-[#FFC400] py-14 text-center"
        >
          <h2 className="font-(family-name:--font-space-grotesk) font-bold text-11 tracking-tight text-[#10161F]">
            Ready to rent or list?
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/equipment"
              className={`${pillButton} bg-[#10161F] text-white hover:bg-[#1A2230]`}
            >
              Browse equipment
            </Link>
            <Link
              href={listHref}
              className={`${pillButton} bg-transparent border-[1.5px] border-[#10161F] text-[#10161F] hover:bg-[#10161F]/10`}
            >
              List your equipment
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
