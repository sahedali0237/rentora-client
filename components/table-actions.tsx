"use client";

import { useState } from "react";
import { toast } from "react-toastify";

const buttonClass =
  "text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const dangerButtonClass =
  "text-xs px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

type EquipmentActionsProps = {
  id: string;
  status: string;
  label?: string;
};

export function EquipmentActions({ id, status, label }: EquipmentActionsProps) {
  const [pending, setPending] = useState(false);

  const toggleStatus = async () => {
    setPending(true);
    try {
      const newStatus = status === "pending" ? "approved" : "pending";
      const res = await fetch("/api/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        toast.error("Failed to update equipment status.");
      }
    } catch {
      toast.error("Failed to update equipment status.");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this equipment?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/equipment?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        toast.error("Failed to delete equipment.");
      }
    } catch {
      toast.error("Failed to delete equipment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggleStatus} disabled={pending} className={buttonClass}>
        {label ?? (status === "pending" ? "Approve" : "Revert")}
      </button>
      <button type="button" onClick={remove} disabled={pending} className={dangerButtonClass}>
        Delete
      </button>
    </div>
  );
}

type FavoriteRemoveButtonProps = {
  equipmentId: string;
};

export function FavoriteRemoveButton({ equipmentId }: FavoriteRemoveButtonProps) {
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/favorites?equipmentId=${encodeURIComponent(equipmentId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Removed from favorites.");
        window.location.reload();
      } else {
        toast.error("Failed to remove favorite.");
      }
    } catch {
      toast.error("Failed to remove favorite.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button type="button" onClick={remove} disabled={pending} className={dangerButtonClass}>
      Remove Favorite
    </button>
  );
}

type ChangeRoleButtonProps = {
  userId: string;
};

export function ChangeRoleButton({ userId }: ChangeRoleButtonProps) {
  const [pending, setPending] = useState(false);

  const changeRole = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "renter" }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        toast.error("Failed to change role.");
      }
    } catch {
      toast.error("Failed to change role.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button type="button" onClick={changeRole} disabled={pending} className={buttonClass}>
      Change Role
    </button>
  );
}
