import type { CadenceUnit, HomeTask } from "@/features/home-tasks/types";

export const DUE_SOON_DAYS = 7;

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(task: HomeTask): boolean {
  if (!task.dueDate || task.status !== "ACTIVE") return false;
  return new Date(task.dueDate) < new Date();
}

export function isDueSoon(task: HomeTask, days: number = DUE_SOON_DAYS): boolean {
  if (!task.dueDate || task.status !== "ACTIVE") return false;
  const d = daysUntil(task.dueDate);
  return d !== null && d >= 0 && d <= days;
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

export function formatDueLabel(dueDate: string | null): string | null {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days <= DUE_SOON_DAYS) return `Due in ${days}d`;
  return `Due ${new Date(dueDate!).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}
