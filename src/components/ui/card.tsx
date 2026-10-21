import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-border bg-surface rounded-2xl border p-5 shadow-sm", className)}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "bg-accent-soft text-accent inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      {...props}
    />
  );
}
