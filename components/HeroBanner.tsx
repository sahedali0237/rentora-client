"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Headphones } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#101820] text-white">
      {/* Background equipment image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/rentora-hero-bg.png')",
        }}
      />

      {/* Dark overlay for readable text */}
      <div className="absolute inset-0 bg-linear-to-r from-[#101820] via-[#101820]/95 to-[#101820]/20" />

      {/* Extra bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#101820] to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-[#FFC21A]" />

            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#FFC21A]">
              Equipment Rental Marketplace
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Rent the gear.
            <br />
            <span className="text-[#FFC21A]">Skip the cost of</span>
            <br />
            owning it.
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-xl text-base leading-7 text-[#C9D1D9] sm:text-lg">
            Rentora connects verified equipment owners with customers who need
            construction, photography, farm and event gear for a day, a week or
            a month.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/equipment"
              className="group inline-flex items-center gap-3 rounded-xl bg-[#FFC21A] px-7 py-3.5 text-sm font-bold text-[#101820] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ffd04d] hover:shadow-[0_12px_35px_rgba(255,194,26,0.25)]"
            >
              Browse Equipment
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/list-equipment"
              className="inline-flex items-center rounded-xl border border-white/40 bg-white/5 px-7 py-3.5 text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:border-[#FFC21A] hover:bg-[#FFC21A] hover:text-[#101820]"
            >
              List Your Equipment
            </Link>
          </div>

          {/* Trust features */}
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-5">
            <Feature icon={<ShieldCheck size={20} />} text="Verified owners" />

            <Feature icon={<Zap size={20} />} text="Easy booking" />

            <Feature icon={<Headphones size={20} />} text="24/7 support" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-[#D7DDE2]">
      <span className="text-[#FFC21A]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
