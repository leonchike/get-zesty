"use client";

import clsx from "clsx";

interface TaskDueBadgeProps {
  dueDate: Date | string | null;
  className?: string;
}

function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function TaskDueBadge({ dueDate, className }: TaskDueBadgeProps) {
  const days = daysUntil(dueDate);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span
        className={clsx(
          "text-xs font-medium text-destructive whitespace-nowrap",
          className
        )}
      >
        Overdue {Math.abs(days)}d
      </span>
    );
  }
  if (days === 0) {
    return (
      <span
        className={clsx(
          "text-xs font-medium text-accent whitespace-nowrap",
          className
        )}
      >
        Due today
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span
        className={clsx(
          "text-xs font-medium text-accent whitespace-nowrap",
          className
        )}
      >
        Due in {days}d
      </span>
    );
  }
  return (
    <span
      className={clsx(
        "text-xs text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      Due{" "}
      {new Date(dueDate!).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}
    </span>
  );
}
