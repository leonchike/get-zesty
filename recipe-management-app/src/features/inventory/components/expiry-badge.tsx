"use client";

import clsx from "clsx";

export interface ExpiryBadgeProps {
  expiresAt: Date | string | null;
  className?: string;
}

function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ExpiryBadge({ expiresAt, className }: ExpiryBadgeProps) {
  const days = daysUntil(expiresAt);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span
        className={clsx(
          "text-xs font-medium text-destructive whitespace-nowrap",
          className
        )}
      >
        Expired {Math.abs(days)}d ago
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span
        className={clsx(
          "text-xs font-medium text-accent whitespace-nowrap",
          className
        )}
      >
        Use soon ({days}d)
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span
        className={clsx(
          "text-xs text-muted-foreground whitespace-nowrap",
          className
        )}
      >
        Expires in {days}d
      </span>
    );
  }
  return null;
}
