import { Suspense } from "react";
import RentBookingClient from "./RentBookingClient";

function RentBookingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

export default function RentPage() {
  return (
    <Suspense fallback={<RentBookingFallback />}>
      <RentBookingClient />
    </Suspense>
  );
}
