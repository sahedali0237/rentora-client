"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; title: string };

/* ----------------------------- Reading progress ---------------------------- */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(doc.scrollTop / total, 1) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent print:hidden"
    >
      <div
        className="h-full origin-left bg-emerald-500 transition-transform duration-100"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

/* ------------------------------ Table of contents -------------------------- */
export function PrivacyToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const links = (
    <ol className="space-y-1">
      {items.map((item, i) => {
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={`group flex items-baseline gap-3 rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-emerald-500 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-300"
                  : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
              }`}
            >
              <span className="tabular-nums text-xs opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Mobile: collapsible */}
      <details className="group mb-8 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 lg:hidden print:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          On this page
          <span className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <nav aria-label="Table of contents" className="mt-3">
          {links}
        </nav>
      </details>

      {/* Desktop: sticky sidebar */}
      <nav
        aria-label="Table of contents"
        className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 lg:block print:hidden"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-white/50">
          On this page
        </p>
        {links}
      </nav>
    </>
  );
}

/* --------------------------------- Actions --------------------------------- */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 print:hidden"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print
    </button>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 rounded-full bg-emerald-600 p-3 text-white shadow-lg transition-all hover:bg-emerald-700 print:hidden ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}
