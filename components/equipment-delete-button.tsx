"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteButton({
  equipmentId,
  equipmentName,
}: {
  equipmentId: string;
  equipmentName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/equipment?id=${encodeURIComponent(equipmentId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success("Equipment deleted successfully.");
        setIsOpen(false);
        window.location.href = "/equipment";
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete equipment.");
        setDeleting(false);
      }
    } catch {
      toast.error("Failed to delete equipment.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive dark:border-zinc-700 text-sm font-semibold text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsOpen(false)}
        title="Delete Equipment"
        equipmentName={equipmentName}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </>
  );
}
