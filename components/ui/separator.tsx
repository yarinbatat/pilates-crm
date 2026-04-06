import * as React from "react";

import { cn } from "@/lib/utils";

export type SeparatorProps = React.HTMLAttributes<HTMLHRElement>;

export function Separator({ className, ...props }: SeparatorProps) {
  return <hr className={cn("border-[#e5ece7]", className)} {...props} />;
}

