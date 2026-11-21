"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { ApiEquipment } from "@/lib/api-types";

/**
 * Auto-scrolling equipment marquee shown directly below the hero.
 *
 * It's a dependency-free infinite "moving" carousel: the track holds two
 * copies of the same list and scrolls continuously via a CSS keyframe
 * animation (see `.animate-marquee` in globals.css), so it loops seamlessly.
 * It pauses on hover and respects `prefers-reduced-motion`.
 *
 * Data is fetched client-side (this is a static page, so we can't call the
 * auth-aware `apiFetch` at build time). The public endpoint returns only
 * approved listings, which is exactly what we showcase.
 */
async function fetchWithRetry(
  url: string,
  retries = 2,
  backoffMs = 1000,
): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res;
      // Non-ok response: treat as a retryable failure.
    } catch {
      // Network error: treat as a retryable failure.
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  return null;
}

export default function EquipmentCarousel() {
  const [items, setItems] = useState<ApiEquipment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithRetry("/api/equipment?limit=10");
        if (!res) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = await res.json();
        const list: ApiEquipment[] = Array.isArray(data)
          ? data
          : (data.equipment ?? []);
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasItems = items.length > 0;
  const showEmpty = loaded && !failed && !hasItems;

  if (failed) {
    return (
      <section className="bg-[#101820] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-10 bg-[#FFC21A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFC21A]">
                Browse the fleet
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Couldn't load equipment
            </h2>
            <p className="mt-2 text-sm text-[#C9D1D9]">
              Something went wrong. Please refresh the page to try again.
            </p>
          </div>
          <Link
            href="/list-equipment"
            className="inline-flex shrink-0 items-center rounded-xl bg-[#FFC21A] px-6 py-3 text-sm font-bold text-[#101820] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffd04d] hover:shadow-[0_12px_35px_rgba(255,194,26,0.25)]"
          >
            List Your Equipment
          </Link>
        </div>
      </section>
    );
  }

  if (showEmpty) {
    return (
      <section className="bg-[#101820] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-10 bg-[#FFC21A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFC21A]">
                Browse the fleet
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              No equipment listed yet
            </h2>
            <p className="mt-2 text-sm text-[#C9D1D9]">
              Be the first to put your gear to work and earn while it sits idle.
            </p>
          </div>
          <Link
            href="/list-equipment"
            className="inline-flex shrink-0 items-center rounded-xl bg-[#FFC21A] px-6 py-3 text-sm font-bold text-[#101820] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffd04d] hover:shadow-[0_12px_35px_rgba(255,194,26,0.25)]"
          >
            List Your Equipment
          </Link>
        </div>
      </section>
    );
  }

  if (!hasItems) {
    // Loading: keep the layout stable with a subtle skeleton strip.
    return (
      <section aria-hidden className="bg-[#101820] py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-8 flex gap-5 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-64 shrink-0 rounded-2xl border border-white/10 bg-white/5 sm:w-72"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <Marquee items={items} />
  );
}

function Marquee({ items }: { items: ApiEquipment[] }) {
  // Render the list twice so the track is always long enough to scroll
  // smoothly and loop seamlessly.
  const cards = [...items, ...items];
  const showImage = items.some((i) => !!(i.img || i.image));

  return (
    <section aria-label="Featured equipment" className="relative overflow-hidden bg-[#101820] py-14 lg:py-16">
      {/* Top / bottom fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-[#101820] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-[#101820] to-transparent" />

      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between gap-4 px-6 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-10 bg-[#FFC21A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFC21A]">
              Browse the fleet
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Featured equipment, ready to rent
          </h2>
        </div>
        <Link
          href="/equipment"
          className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#C9D1D9] transition-colors hover:text-[#FFC21A] sm:inline-flex"
        >
          View all
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* Marquee */}
      <div className="group/marquee relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-linear-to-r from-[#101820] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-linear-to-l from-[#101820] to-transparent sm:w-24" />

        <div className="animate-marquee flex w-max gap-5 group-hover/marquee:pause">
          {cards.map((item, idx) => (
            <CarouselCard
              key={`${item._id || item.id}-${idx}`}
              item={item}
              showImage={showImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarouselCard({
  item,
  showImage,
}: {
  item: ApiEquipment;
  showImage: boolean;
}) {
  const id = item._id || item.id || "";
  const name = item.name || "Untitled Equipment";
  const category = item.category || "General";
  const location = item.location || "";
  const price = Number(item.rentalPrice || 0);
  const rentalType = item.rentalType || "day";
  const rating = Number(item.rating || 0);
  const reviewCount = Number(item.reviewCount || 0);
  const image = item.img || item.image || "";

  return (
    <Link
      href={`/equipment/${encodeURIComponent(id)}`}
      className="group relative w-64 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FFC21A]/60 hover:bg-white/10 hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:w-72"
    >
      {showImage && (
        <div className="relative h-40 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 288px, 288px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[#1a2530]" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-[#FFC21A] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#101820]">
            {category}
          </div>
        </div>
      )}

      <div className="p-4">
        {!showImage && (
          <div className="mb-3 inline-flex rounded-full bg-[#FFC21A]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FFC21A]">
            {category}
          </div>
        )}
        <h3 className="line-clamp-1 text-base font-semibold text-white">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-sm text-[#C9D1D9]">
          {location && (
            <span className="flex min-w-0 items-center gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FFC21A]" />
              <span className="line-clamp-1">{location}</span>
            </span>
          )}
          {(rating > 0 || reviewCount > 0) && (
            <span className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-white">{rating.toFixed(1)}</span>
              <span className="text-[#8b95a3]">({reviewCount})</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold text-[#FFC21A]">
            ${price.toLocaleString()}
          </span>
          <span className="text-sm text-[#C9D1D9]">/ {rentalType}</span>
        </div>
      </div>
    </Link>
  );
}
