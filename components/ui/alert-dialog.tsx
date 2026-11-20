"use client";

import * as React from "react";
import {
  AlertDialog as AlertDialogPrimitive,
  Dialog as DialogPrimitive,
} from "@base-ui/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * AlertDialog — a lightweight accessible confirmation dialog built on
 * @base-ui/react. Follows the codebase's custom dialog style
 * (rounded panel, backdrop blur, dark mode classes) while using the
 * Base UI primitives for focus management and keyboard semantics.
 *
 * Usage:
 *   <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
 *     <AlertDialogBody>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>…</AlertDialogTitle>
 *       </AlertDialogHeader>
 *       <AlertDialogDescription>…</AlertDialogDescription>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Cancel</AlertDialogCancel>
 *         <AlertDialogAction>Confirm</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogBody>
 *   </AlertDialog>
 *
 * The <AlertDialog> renders a Root that wraps the Trigger and the
 * Portal+Popup pair. The body is rendered inside the Popup when open.
 */

type AlertDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerId?: string | null;
  defaultTriggerId?: string | null;
  children?: React.ReactNode;
};

function AlertDialog({
  open,
  onOpenChange,
  triggerId,
  defaultTriggerId,
  children,
}: AlertDialogProps) {
  const [state, setState] = React.useState(false);
  const isOpen = open ?? state;

  const handleOpenChange = (next: boolean) => {
    setState(next);
    onOpenChange?.(next);
  };

  return (
    <AlertDialogPrimitive.Root
      open={open === undefined ? isOpen : open}
      onOpenChange={handleOpenChange}
      triggerId={triggerId}
      defaultTriggerId={defaultTriggerId}
    >
      {children}
    </AlertDialogPrimitive.Root>
  );
}

function AlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

function AlertDialogBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <DialogPrimitive.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props} />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle(
  props: React.ComponentProps<typeof DialogPrimitive.Title>,
) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-white",
        props.className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-gray-500 dark:text-zinc-400", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & {
  variant?: "default" | "destructive";
}) {
  return (
    <DialogPrimitive.Close
      className={cn(
        buttonVariants({ variant: variant as "default" }),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        buttonVariants({ variant: "outline" }),
        "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogBody,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
