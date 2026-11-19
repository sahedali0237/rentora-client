import { Suspense } from "react";
import AllEquipmentPageClient from "./AllEquipmentPageClient";

export default function AllEquipmentPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              All Equipment
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Find the perfect tools and equipment for your next project.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative h-11">
            <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    }>
      <AllEquipmentPageClient />
    </Suspense>
  );
}
