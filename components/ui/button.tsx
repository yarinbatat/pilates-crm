import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "outline" | "secondary";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d62]/40 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  default: "bg-[#3f7d62] text-white hover:bg-[#356b54]",
  outline: "border border-[#b8c9bd] bg-transparent text-[#365646] hover:bg-[#f1f7f2]",
  secondary: "bg-[#edf5ef] text-[#3c6a52] hover:bg-[#e4f0e6]",
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

