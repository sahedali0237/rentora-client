"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import type { ApiReview } from "@/lib/api-types";

/**
 * Auto-scrolling "What customers say" marquee shown on the home page,
 * directly under the "Browse by category" section.
 *
 * It reuses the same `.animate-marquee` keyframes as the equipment carousel
 * (see globals.css) and the same seamless double-copy + pause-on-hover +
 * reduced-motion behaviour. Reviews are fetched client-side.
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

export default function ReviewMarquee() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithRetry("/api/reviews");
        if (!res) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = await res.json();
        const list: ApiReview[] = Array.isArray(data)
          ? data
          : (data.reviews ?? []);
        if (!cancelled) setReviews(list);
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

  const hasItems = reviews.length > 0;
  const showEmpty = loaded && !failed && !hasItems;

  if (failed) {
    return (
      <section className="bg-[#f5f1ea] py-12 lg:py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              What customers say
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Couldn't load reviews. Please refresh the page to try again.
            </p>
          </div>
          <Link
            href="/equipment"
            className="inline-flex shrink-0 items-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-gray-800"
          >
            Browse equipment
          </Link>
        </div>
      </section>
    );
  }

  if (showEmpty) {
    return (
      <section className="bg-[#f5f1ea] py-12 lg:py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              What customers say
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No reviews yet — be the first to share your experience after your next rental.
            </p>
          </div>
          <Link
            href="/equipment"
            className="inline-flex shrink-0 items-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-gray-800"
          >
            Browse equipment
          </Link>
        </div>
      </section>
    );
  }

  if (!hasItems) {
    return (
      <section aria-hidden className="bg-[#f5f1ea] py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            What customers say
          </h2>
          <div className="mt-6 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 w-72 shrink-0 rounded-xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Two copies of the list so the marquee loops seamlessly.
  const cards = [...reviews, ...reviews];

  return (
    <section
      aria-label="Customer reviews"
      className="bg-[#f5f1ea] py-12 lg:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          What customers say
        </h2>

        <div className="group/marquee relative mt-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-linear-to-r from-[#f5f1ea] to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-linear-to-l from-[#f5f1ea] to-transparent sm:w-24" />

          <div className="animate-marquee flex w-max gap-5 group-hover/marquee:pause">
            {cards.map((review, idx) => (
              <ReviewCard key={`${review.id}-${idx}`} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  const rating = Number(review.rating || 0);
  const name = review.renterName || "Customer";
  const comment = review.comment || "";
  const image = review.renterImage || "";

  return (
    <div className="relative w-72 shrink-0 rounded-xl bg-white p-5 shadow-sm">
      {/* Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
            aria-hidden
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-gray-500">
          {rating.toFixed(1)} / 5
        </span>
      </div>

      {/* Comment */}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
        {comment || "No comment."}
      </p>

      {/* Author */}
      <div className="mt-4 flex items-center gap-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">{name}</span>
      </div>

      {/* Decorative quote */}
      <Quote className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-gray-200" />
    </div>
  );
}
