"use client";

import { useEffect } from "react";
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  equipmentName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Confirmation dialog used for destructive actions (e.g. deleting equipment).
 * Replaces browser confirm() with a styled, accessible modal.
 */
export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  equipmentName,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmDialogProps) {
  // Trap focus and prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md mx-4 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex items-start gap-3">
              <div className={`flex shrink-0 items-center justify-center h-10 w-10 rounded-full ${
                destructive ? "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {destructive ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h3>
                {equipmentName && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                    <span className="font-medium">"{equipmentName}"</span> will be
                    deleted permanently. This action cannot be undone.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-sm"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={destructive ? "destructive" : "default"}
              onClick={onConfirm}
              className="text-sm"
            >
              {destructive ? (
                <>
                  <Trash2 className="h-4 w-4 mr-1" /> {confirmLabel}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> {confirmLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
