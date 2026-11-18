"use client";

import { useState } from "react";
import { toast } from "react-toastify";

type ProfileFormProps = {
  title?: string;
  initialName: string;
  initialEmail: string;
  initialPhone?: string;
  initialAddress?: string;
};

export function ProfileForm({
  title = "My Profile",
  initialName,
  initialEmail,
  initialPhone = "",
  initialAddress = "",
}: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    address: initialAddress,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully.");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update your personal information.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
            <input
              type="tel"
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <textarea
              rows={3}
              className="h-24 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-amber-500 transition-colors"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-6 rounded-md bg-amber-500 text-gray-900 font-semibold hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95 shadow-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
