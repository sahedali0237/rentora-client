import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-5 bg-gray-200 dark:bg-zinc-800"
          >
            <Skeleton className="h-5 w-5 mb-4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full mt-1" />
            <Skeleton className="h-3 w-1/2 mt-0.5" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6 bg-gray-200 dark:bg-zinc-800">
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((_, i) => (
          <a key={i} className="rounded-xl border p-6 bg-gray-200 dark:bg-zinc-800">
            <Skeleton className="h-6 w-6 mb-3" />
            <Skeleton className="h-4 w-1/3 mb-1" />
            <Skeleton className="h-3 w-full" />
          </a>
        ))}
      </div>
    </div>
  );
}
