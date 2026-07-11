import { add } from "date-fns";
import type { CadenceUnit } from "@prisma/client";

const CADENCE_UNIT_TO_DURATION_KEY: Record<
  CadenceUnit,
  "days" | "weeks" | "months" | "years"
> = {
  DAY: "days",
  WEEK: "weeks",
  MONTH: "months",
  YEAR: "years",
};

export const DUE_SOON_DAYS = 7;

/**
 * Recurrence rolls forward from the completion date, not the previous due
 * date: "every 3 months" means 3 months from whenever the task was last done.
 */
export function computeNextDueDate(
  completedAt: Date,
  intervalValue: number,
  intervalUnit: CadenceUnit
): Date {
  return add(completedAt, {
    [CADENCE_UNIT_TO_DURATION_KEY[intervalUnit]]: intervalValue,
  });
}

export function isOverdue(
  task: { dueDate: Date | string | null; status: string },
  now: Date = new Date()
): boolean {
  if (!task.dueDate || task.status !== "ACTIVE") return false;
  return new Date(task.dueDate) < now;
}

export function isDueSoon(
  task: { dueDate: Date | string | null; status: string },
  now: Date = new Date(),
  days: number = DUE_SOON_DAYS
): boolean {
  if (!task.dueDate || task.status !== "ACTIVE") return false;
  const due = new Date(task.dueDate);
  const cutoff = add(now, { days });
  return due >= now && due <= cutoff;
}

export function formatCadence(
  intervalValue: number | null,
  intervalUnit: CadenceUnit | null
): string | null {
  if (!intervalValue || !intervalUnit) return null;
  const unit = intervalUnit.toLowerCase();
  return intervalValue === 1
    ? `every ${unit}`
    : `every ${intervalValue} ${unit}s`;
}
