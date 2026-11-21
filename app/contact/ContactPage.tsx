"use client";

import { ContactForm } from "@/components/contact-form";
import { ContactInfoCard } from "@/components/contact-info-card";

export function ContactPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] text-[#10161F] dark:text-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12 sm:pt-20">
        {/* Subtle green glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,rgba(253,176,61,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,rgba(16,243,90,0.06),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            Get in touch
          </p>
          <h1 className="font-(family-name:--font-space-grotesk) font-bold mt-4 text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px] text-[#10161F] dark:text-white">
            Let&apos;s Talk
          </h1>
          <p className="mt-4 text-[19px] leading-relaxed text-gray-500 dark:text-gray-400">
            Have a question about renting equipment? We&apos;re here to help.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-400 dark:text-gray-500">
            Whether you&apos;re looking for equipment, managing a listing, or
            need help with a booking, send us a message.
          </p>
        </div>
      </section>

      {/* ── Two-column: info card + form ─────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          {/* Left: Contact info */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ContactInfoCard />

            {/* Quick response badge */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#1a4a40] dark:bg-[#0c2922]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.005 3.071-1.005 4.242 0 1.172 1.005 1.172 2.643 0 3.65l-3.654 2.436M21.414 12.586c.354-.354.617-1.104.617-1.586 0-.482-.263-1.232-.617-1.586a4.5 4.5 0 0 0-8.982.011c-.354.354-.617 1.104-.617 1.586s.263 1.232.617 1.586a4.5 4.5 0 0 0 8.982-.011z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Average response time
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Under 24 hours on business days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#1a4a40] dark:bg-[#0c2922] sm:p-8">
              <div className="mb-6">
                <h2 className="font-(family-name:--font-space-grotesk) text-lg font-semibold text-gray-900 dark:text-white">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Fill in the form below and we&apos;ll get back to you
                  shortly. Fields marked <span className="text-red-500">*</span>{" "}
                  are required.
                </p>
              </div>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
