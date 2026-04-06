import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-[#dfe9e1] bg-white px-3 py-2 text-sm text-[#2a3a31] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3f7d62]/40",
        className,
      )}
      {...props}
    />
  );
}

