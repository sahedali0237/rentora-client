import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border input-background shadow",
  success: "border-transparent bg-emerald-500 text-emerald-900 hover:bg-emerald-600",
  warning: "border-transparent bg-amber-500 text-amber-900 hover:bg-amber-400",
};

const badgeClasses = (variant: BadgeVariant, className?: string) =>
  cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant ?? "default"],
    className,
  );

const Badge = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot> & {
    variant?: BadgeVariant;
    asChild?: boolean;
  }
>(({ className, variant = "default", asChild = false, ...props }, ref) => {
  const classes = badgeClasses(variant ?? "default", className);

  // `Slot` requires a single React element child, so only use it when the
  // caller explicitly opts into `asChild`. Otherwise render a plain <span>,
  // which safely accepts text/fragment children.
  if (asChild) {
    return <Slot ref={ref} className={classes} {...props} />;
  }

  return <span ref={ref} className={classes} {...props} />;
});
Badge.displayName = "Badge";

export { Badge };
export type { BadgeVariant };
