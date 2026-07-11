import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassVariants = cva("", {
  variants: {
    variant: {
      default: "glass",
      strong: "glass-strong",
      overlay: "glass-overlay",
    },
    rounded: {
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
      none: "",
    },
  },
  defaultVariants: {
    variant: "default",
    rounded: "xl",
  },
});

export interface GlassPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassVariants> {
  asChild?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(glassVariants({ variant, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel, glassVariants };
