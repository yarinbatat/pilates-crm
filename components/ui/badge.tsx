import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#3f7d62] text-white",
  secondary: "bg-[#edf5ef] text-[#3c6a52]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}

