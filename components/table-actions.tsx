"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
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
  /** Owners can delete their own listings. */
  canDelete?: boolean;
};

export function EquipmentActions({
  id,
  status,
  name,
  canApprove = false,
  canEdit = false,
  canTerminate = false,
  canDelete = false,
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

  const handleDelete = async () => {
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

  const showDelete = canTerminate || canDelete;
  const isAdminAction = canTerminate;

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
      {showDelete && (
        <button
          type="button"
          onClick={() => setTerminateOpen(true)}
          disabled={terminating}
          className={dangerButtonClass}
        >
          <Trash2 className="h-4 w-4" /> {isAdminAction ? "Terminate" : "Delete"}
        </button>
      )}
      <ConfirmDialog
        isOpen={terminateOpen}
        onConfirm={handleDelete}
        onCancel={() => setTerminateOpen(false)}
        title={isAdminAction ? "Terminate Listing" : "Delete Equipment"}
        equipmentName={name}
        confirmLabel={isAdminAction ? "Terminate" : "Delete"}
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
  /** The user's current active role, to show in the trigger. */
  currentRole?: string;
};

type AdminRole = "admin" | "owner" | "renter";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  owner: "Owner",
  renter: "Renter",
};

export function ChangeRoleButton({ userId, currentRole }: ChangeRoleButtonProps) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRoleChange = async (role: AdminRole) => {
    setOpen(false);
    if (!userId || pending || role === currentRole) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        toast.success(`Role changed to ${ROLE_LABELS[role]}.`);
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to change role.");
        setPending(false);
      }
    } catch {
      toast.error("Failed to change role.");
      setPending(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending || !userId}
        className={buttonClass}
      >
        Change Role <ChevronDown className="ml-0.5 h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          {(["owner", "renter"] as AdminRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              disabled={pending || role === currentRole}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ROLE_LABELS[role]}
              {role === currentRole && (
                <span className="ml-auto text-[10px] text-gray-400">current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
