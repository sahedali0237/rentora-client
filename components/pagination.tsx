import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

/**
 * Server-side pagination control. Renders Prev/Next links plus a
 * compact window of page numbers around the current page.
 */
export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageLink = (page: number) =>
    page === 1 ? `${basePath}` : `${basePath}?page=${page}`;

  const windowSize = 2;
  const start = Math.max(1, currentPage - windowSize);
  const end = Math.min(totalPages, currentPage + windowSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5"
    >
      <PageButton
        href={currentPage > 1 ? pageLink(currentPage - 1) : ""}
        disabled={currentPage <= 1}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageButton>

      {start > 1 && (
        <>
          <PageButton href={pageLink(1)} ariaLabel="Page 1">
            1
          </PageButton>
          {start > 2 && <Ellipsis />}
        </>
      )}

      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
        <PageButton
          key={p}
          href={pageLink(p)}
          ariaLabel={`Page ${p}`}
          active={p === currentPage}
        >
          {p}
        </PageButton>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <Ellipsis />}
          <PageButton href={pageLink(totalPages)} ariaLabel={`Page ${totalPages}`}>
            {totalPages}
          </PageButton>
        </>
      )}

      <PageButton
        href={currentPage < totalPages ? pageLink(currentPage + 1) : ""}
        disabled={currentPage >= totalPages}
        ariaLabel="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  href,
  disabled,
  active = false,
  ariaLabel,
  children,
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const cls = `inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    active
      ? "border-orange-400 bg-orange-500 text-white"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
  }`;

  if (disabled || !href) {
    return (
      <button type="button" className={cls} disabled aria-label={ariaLabel}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href} className={cls} aria-label={ariaLabel} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function Ellipsis() {
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-sm text-gray-400">
      …
    </span>
  );
}
