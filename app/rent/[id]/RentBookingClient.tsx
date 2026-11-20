"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, Calendar, CreditCard, MapPin, Truck, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface BookingForm {
  startDate: string;
  endDate: string;
  quantity: string;
  notes: string;
}

export default function RentBookingClient() {
  const router = useRouter();
  const { id } = useParams();
  const equipmentId = Array.isArray(id) ? id[0] : id || "";
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id ?? null;

  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<BookingForm>({
    startDate: "",
    endDate: "",
    quantity: "1",
    notes: "",
  });

  useEffect(() => {
    fetchEquipment();
  }, [equipmentId]);

  // Earliest allowed start date is today
  const todayStr = new Date().toISOString().split("T")[0];

  const fetchEquipment = async () => {
    try {
      const res = await fetch(
        `/api/equipment/${encodeURIComponent(equipmentId)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || data);
      } else {
        toast.error("Failed to load equipment.");
      }
    } catch {
      toast.error("Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast.error("Please log in to rent equipment.");
      router.push("/sign-in");
      return;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Please select start and end dates.");
      return;
    }

    if (form.startDate < todayStr) {
      toast.error("Start date cannot be before today.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (!qty || qty < 1) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    const availableQty = equipment?.availableQuantity || 0;
    if (qty > availableQty) {
      toast.error(`Only ${availableQty} unit(s) available.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          equipmentName: equipment?.name || "Equipment",
          startDate: form.startDate,
          endDate: form.endDate,
          quantity: qty,
          notes: form.notes,
          amount: equipment?.rentalPrice
            ? Number(equipment.rentalPrice) * qty
            : 0,
        }),
      });

      if (res.ok) {
        toast.success("Rental request submitted successfully!");
        router.push("/renter/my-rentals");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to submit rental request.");
      }
    } catch {
      toast.error("Failed to submit rental request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-zinc-500">Equipment not found.</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUserId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
          <CalendarClock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Login Required
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 mb-6">
          Please log in to submit a rental request.
        </p>
        <Button onClick={() => router.push("/sign-in")}>
          Log In
        </Button>
      </div>
    );
  }

  const price = Number(equipment.rentalPrice || 0);
  const qty = parseInt(form.quantity, 10) || 1;
  const total = price * qty;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 mb-6">
        <ArrowLeft className="h-4 w-4" onClick={() => router.back()} />
        <a
          href={`/equipment/${equipmentId}`}
          className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
        >
          Back to Listing
        </a>
      </div>

      <div className="lg:grid lg:grid-cols-12 gap-8">
        {/* Left: Equipment Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            {equipment.img || equipment.image ? (
              <img
                src={equipment.img || equipment.image}
                alt={equipment.name}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="h-48 w-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                No Image
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {equipment.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {equipment.category || "General"}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Available
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Rental Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-zinc-400">
                  Price per {equipment.rentalType || "day"}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Quantity</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {qty}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Submit Rental Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={todayStr}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || todayStr}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Your Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {session?.user?.name || "Logged-in user"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any special instructions or questions for the owner..."
                  className="w-full p-3.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-sm shadow-green-600/20 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Rental Request"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
