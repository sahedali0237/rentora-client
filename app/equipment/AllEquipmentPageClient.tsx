"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EquipmentCard, EquipmentCardProps } from "@/components/equipment-card";
import { ApiEquipment } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import {
  Filter,
  Search,
  SlidersHorizontal,
  ListSortAscending as SortAscending,
  X,
  ChevronDown,
  Menu,
  X as XIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";

interface FilterState {
  search: string;
  category: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  rentalType: string;
  sort: string;
  order: string;
  page: string;
}

const CATEGORIES = [
  "Construction",
  "Electronics",
  "Photography",
  "Event Equipment",
  "Other",
];

const RENTAL_TYPES = ["Daily", "Weekly", "Monthly"];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest First" },
  { value: "rentalPrice", label: "Price: Low to High" },
  { value: "rentalPrice", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "All Categories",
  location: "All Locations",
  minPrice: "",
  maxPrice: "",
  rentalType: "All Rental Types",
  sort: "createdAt",
  order: "desc",
  page: "1",
};

export default function AllEquipmentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id ?? null;

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [equipment, setEquipment] = useState<ApiEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  // Initialize from URL search params
  useEffect(() => {
    const sp = Object.fromEntries(searchParams.entries());
    setFilters({
      search: sp.search || "",
      category: sp.category || "All Categories",
      location: sp.location || "All Locations",
      minPrice: sp.minPrice || "",
      maxPrice: sp.maxPrice || "",
      rentalType: sp.rentalType || "All Rental Types",
      sort: sp.sort || "createdAt",
      order: sp.order || "desc",
      page: sp.page || "1",
    });
  }, [searchParams]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category && filters.category !== "All Categories")
        params.set("category", filters.category);
      if (filters.location && filters.location !== "All Locations")
        params.set("location", filters.location);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.rentalType && filters.rentalType !== "All Rental Types")
        params.set("rentalType", filters.rentalType);
      params.set("sort", filters.sort);
      params.set("order", filters.order);
      params.set("page", filters.page);
      params.set("limit", "6");

      const res = await fetch(`/api/equipment?${params.toString()}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const list: ApiEquipment[] = Array.isArray(data)
          ? data
          : (data.equipment ?? []);
        setEquipment(list);
        setTotal(data.total ?? list.length);
        setTotalPages(data.totalPages ?? 1);
      } else {
        toast.error("Failed to load equipment.");
      }
    } catch {
      toast.error("Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value } as FilterState;
      // Reset to page 1 whenever a filter/sort changes, but keep the
      // requested page when the user is paginating.
      if (key !== "page") next.page = "1";
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.replace(pathname);
  };

  const isOwnerOf = (item: ApiEquipment) =>
    !!currentUserId &&
    (item.ownerId === currentUserId ||
      item.ownerId?.toString() === currentUserId.toString());

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Equipment
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            Find the perfect tools and equipment for your next project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <Button size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Grid View
          </Button>
          <button
            className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="List view"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchEquipment()}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
          />
        </div>
        <Button onClick={fetchEquipment} className="px-6">
          Search{" "}
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 3"
            />
          </svg>
        </Button>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {equipment.length} of {total} results
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-zinc-400">
            Sort by:
          </span>
          <select
            value={`${filters.sort}-${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-");
              updateFilter("sort", sort);
              updateFilter("order", order);
            }}
            className="text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="rentalPrice-asc">Price: Low to High</option>
            <option value="rentalPrice-desc">Price: High to Low</option>
            <option value="rating-desc">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
            <div className="h-8 w-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : equipment.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-zinc-500">
              No equipment matches your filters.
            </p>
            <Button variant="outline" onClick={resetFilters} size="sm">
              Clear Filters
            </Button>
          </div>
        ) : (
          equipment.map((item) => {
            const props: EquipmentCardProps = {
              equipment: item,
              isOwner: isOwnerOf(item),
              userId: currentUserId,
            };
            return <EquipmentCard key={item._id || item.id} {...props} />;
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-zinc-400">
            Page {filters.page} of {totalPages} — {total} results
          </div>
          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              onClick={() => {
                const p = Math.max(parseInt(filters.page, 10) - 1, 1);
                updateFilter("page", String(p));
              }}
              disabled={parseInt(filters.page, 10) <= 1}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              aria-label="Previous page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pageNum) => {
                const currentPage = parseInt(filters.page, 10);
                // Show first page, last page, current page, and ±2 around current
                return (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  pageNum === currentPage ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                );
              })
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {/* Add ellipsis if there's a gap */}
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && (
                    <span className="px-2 py-2 text-gray-400 dark:text-zinc-500">...</span>
                  )}
                  <button
                    onClick={() => updateFilter("page", String(pageNum))}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === parseInt(filters.page, 10)
                        ? "bg-amber-500 text-white"
                        : "border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === parseInt(filters.page, 10) ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            {/* Next button */}
            <button
              onClick={() => {
                const p = Math.min(parseInt(filters.page, 10) + 1, totalPages);
                updateFilter("page", String(p));
              }}
              disabled={parseInt(filters.page, 10) >= totalPages}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              aria-label="Next page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
