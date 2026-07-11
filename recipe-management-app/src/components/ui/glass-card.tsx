"use client";

import * as React from "react";

import { GlassPanel, type GlassPanelProps } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends GlassPanelProps {
  interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = true, ...props }, ref) => (
    <GlassPanel
      ref={ref}
      className={cn(
        "overflow-hidden transition-shadow duration-200",
        interactive && "hover:shadow-glass",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
