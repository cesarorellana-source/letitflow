import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-surface-muted text-foreground hover:bg-border",
        outline: "border border-border bg-surface text-foreground hover:bg-surface-muted",
        ghost: "text-foreground hover:bg-surface-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export { buttonVariants };
