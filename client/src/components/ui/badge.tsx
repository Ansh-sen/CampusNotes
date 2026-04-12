import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]": variant === "default",
          "border-transparent bg-[hsl(var(--muted))] text-[hsl(var(--text))]": variant === "secondary",
          "border-[hsl(var(--muted))] text-[hsl(var(--text))]": variant === "outline",
          "border-transparent bg-[hsl(var(--success))] text-white": variant === "success",
          "border-transparent bg-[hsl(var(--accent))] text-white": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
