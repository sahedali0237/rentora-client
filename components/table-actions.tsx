"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const buttonClass =
  "text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const dangerButtonClass =
  "text-xs px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

type EquipmentActionsProps = {
  id: string;
  status: string;
  name?: string;
  /** Admins can approve listings; owners cannot. */
  canApprove?: boolean;
  /** Owners can edit their own listings; admins cannot. */
  canEdit?: boolean;
  /** Admins can terminate any listing; owners cannot. */
  canTerminate?: boolean;
};

export function EquipmentActions({
  id,
  status,
  name,
  canApprove = false,
  canEdit = false,
  canTerminate = false,
}: EquipmentActionsProps) {
  const [pending, setPending] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const router = useRouter();

  const isApproved = String(status).toLowerCase() === "approved";

  const handleApprove = async () => {
    if (!canApprove || isApproved) return;
    setPending(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      if (res.ok) {
        toast.success("Equipment approved.");
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to approve equipment.");
      }
    } catch {
      toast.error("Failed to approve equipment.");
    } finally {
      setPending(false);
    }
  };

  const handleTerminate = async () => {
    setTerminating(true);
    try {
      const res = await fetch(`/api/equipment?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Equipment deleted successfully.");
        setTerminateOpen(false);
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete equipment.");
        setTerminating(false);
      }
    } catch {
      toast.error("Failed to delete equipment.");
      setTerminating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || isApproved}
          className={buttonClass}
        >
          {isApproved ? "Approved" : "Approve"}
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => router.push(`/owner/edit-equipment/${id}`)}
          className={buttonClass}
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
      )}
      {canTerminate && (
        <button
          type="button"
          onClick={() => setTerminateOpen(true)}
          disabled={terminating}
          className={dangerButtonClass}
        >
          <Trash2 className="h-4 w-4" /> Terminate
        </button>
      )}
      <ConfirmDialog
        isOpen={terminateOpen}
        onConfirm={handleTerminate}
        onCancel={() => setTerminateOpen(false)}
        title={canTerminate ? "Terminate Listing" : "Delete Equipment"}
        equipmentName={name}
        confirmLabel={canTerminate ? "Terminate" : "Delete"}
        cancelLabel="Cancel"
        destructive
      />
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
