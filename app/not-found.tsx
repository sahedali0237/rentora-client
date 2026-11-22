"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const eyeRef = useRef<HTMLSpanElement>(null);
  const pupilRef = useRef<HTMLSpanElement>(null);

  // Pupil follows the pointer
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      const eye = eyeRef.current;
      const pupil = pupilRef.current;
      if (!eye || !pupil) return;

      const r = eye.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const max = r.width * 0.2;
      const k = Math.min(d, max * 4) / (max * 4);

      pupil.style.transform = `translate(${(dx / d) * max * k}px, ${
        (dy / d) * max * k
      }px)`;
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const btn =
    "rounded-[0.6rem] border-[1.5px] border-[#3a3fe0] px-[1.35rem] py-[0.7rem] font-medium transition-transform duration-100 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#ffd23f] dark:border-[#8b90ff]";

  return (
    <main className="grid min-h-screen place-items-center bg-[#edefff] px-5 py-8 leading-relaxed text-[#12143a] dark:bg-[#0d0f2b] dark:text-[#eef0ff]">
      <div className="w-full max-w-2xl text-center">
        {/* 4 [eyes] 4 */}
        <div
          role="img"
          aria-label="Error 404"
          className="mb-5 flex items-center justify-center gap-[0.02em] text-[clamp(7rem,30vw,13rem)] font-extrabold leading-none tracking-[-0.04em]"
        >
          <span aria-hidden="true">4</span>
          <span
            ref={eyeRef}
            aria-hidden="true"
            className="relative inline-block h-[0.74em] w-[0.62em] flex-none rounded-full bg-[#ffd23f] shadow-[inset_0_0_0_0.035em_#12143a] dark:shadow-[inset_0_0_0_0.035em_#eef0ff]"
          >
            <span
              ref={pupilRef}
              className="absolute left-1/2 top-1/2 ml-[-0.13em] mt-[-0.13em]` h-[0.26em] w-[0.26em] rounded-full bg-[#12143a] transition-transform duration-75 ease-linear motion-reduce:transition-none dark:bg-[#0d0f2b]"
            />
          </span>
          <span aria-hidden="true">4</span>
        </div>

        <h1 className="mb-3 text-[clamp(1.6rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight">
          We can’t find that page
        </h1>

        <p className="mx-auto mb-6 max-w-136 text-[#51548a] dark:text-[#a3a7dd]">
          <span className="inline-block max-w-full overflow-x-auto whitespace-nowrap rounded-md border border-[#c9cdf5] bg-[#f8f9ff] px-2 py-px align-bottom font-mono text-[0.9em] text-[#12143a] dark:border-[#2b2f6b] dark:bg-[#15183f] dark:text-[#eef0ff]">
            {pathname}
          </span>{" "}
          doesn&apos;t exist on Rentora. The listing may have been removed, or
          the link might have a typo.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className={`${btn} bg-[#3a3fe0] text-white dark:bg-[#8b90ff] dark:text-[#0d0f2b]`}
          >
            Go to homepage
          </Link>
          {/* Change this route to your equipment listing page */}
          <Link
            href="/equipment"
            className={`${btn} text-[#3a3fe0] dark:text-[#8b90ff]`}
          >
            Browse equipment
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className={`${btn} cursor-pointer text-[#3a3fe0] dark:text-[#8b90ff]`}
          >
            Go back
          </button>
        </div>
      </div>
    </main>
  );
}
