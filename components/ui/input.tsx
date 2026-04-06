import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-[#dfe9e1] bg-white px-3 py-2 text-sm text-[#2a3a31] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d62]/40",
        className,
      )}
      {...props}
    />
  );
}

