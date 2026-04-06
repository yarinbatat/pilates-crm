import * as React from "react";

import { cn } from "@/lib/utils";

export type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-[#e8efe9]", className)} {...props}>
      <div className="h-full rounded-full bg-[#3f7d62]" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

