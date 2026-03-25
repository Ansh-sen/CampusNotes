import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target",
          {
            "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))/90] shadow-soft": variant === "default",
            "border-2 border-[hsl(var(--primary))/20] text-[hsl(var(--primary))] bg-transparent hover:bg-[hsl(var(--primary))/5]": variant === "outline",
            "hover:bg-[hsl(var(--muted))]": variant === "ghost",
            "text-[hsl(var(--primary))] underline-offset-4 hover:underline": variant === "link",
            "bg-[hsl(var(--danger))] text-white hover:bg-[hsl(var(--danger))/90]": variant === "danger",
            "h-11 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-12 rounded-2xl px-8": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
