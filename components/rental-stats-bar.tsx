"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import type { RentalRow } from "@/components/my-rentals-table";

/**
 * The Pending/Confirmed/Cancelled counter cards for My Rentals.
 *
 * Starts from the server-rendered rows and re-syncs live: when the table
 * refetches rows after an action (e.g. cancelling a booking), it dispatches
 * a `rentals:rows` event with the fresh data and this component updates the
 * counters immediately — no page reload.
 */
export function RentalStatsBar({ initialRows }: { initialRows: RentalRow[] }) {
  const [rows, setRows] = useState<RentalRow[]>(initialRows);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<RentalRow[]>).detail;
      if (Array.isArray(detail)) setRows(detail);
    };
    window.addEventListener("rentals:rows", handler);
    return () => window.removeEventListener("rentals:rows", handler);
  }, []);

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    active: 0,
    other: 0,
  };
  for (const r of rows) {
    const s = r.status.toLowerCase();
    if (
      s === "pending" ||
      s === "confirmed" ||
      s === "completed" ||
      s === "cancelled" ||
      s === "active"
    ) {
      statusCounts[s] += 1;
    } else {
      statusCounts.other += 1;
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Pending"
        value={statusCounts.pending}
        subtitle="Awaiting payment"
        icon={Clock}
        color="amber"
      />
      <StatCard
        title="Confirmed"
        value={statusCounts.confirmed}
        subtitle="Active bookings"
        icon={CheckCircle2}
        color="emerald"
      />
      <StatCard
        title="Cancelled"
        value={statusCounts.cancelled}
        subtitle="No longer active"
        icon={XCircle}
        color="rose"
      />
    </div>
  );
}
