"use client";

import { m } from "framer-motion";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import { TaskDueBadge } from "@/features/home-tasks/components/task-due-badge";
import { formatCadence } from "@/features/home-tasks/lib/task-dates";
import {
  useCompleteTask,
  useUncompleteTask,
} from "@/features/home-tasks/hooks/home-tasks-query-hooks";
import { useHomeTasksStore } from "@/features/home-tasks/stores/home-tasks-store";
import type { HomeTaskWithRelations } from "@/features/home-tasks/types";

interface TaskItemProps {
  task: HomeTaskWithRelations;
  isCompletedView?: boolean;
}

export default function TaskItem({
  task,
  isCompletedView = false,
}: TaskItemProps) {
  const completeMutation = useCompleteTask();
  const uncompleteMutation = useUncompleteTask();
  const setEditingTaskId = useHomeTasksStore((s) => s.setEditingTaskId);

  const cadence = task.isRecurring
    ? formatCadence(task.intervalValue, task.intervalUnit)
    : null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompletedView) {
      uncompleteMutation.mutate(task.id);
    } else {
      completeMutation.mutate({ id: task.id });
    }
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard
        rounded="xl"
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setEditingTaskId(task.id)}
        role="button"
        aria-label={`Edit ${task.title}`}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label={
            isCompletedView ? `Restore ${task.title}` : `Complete ${task.title}`
          }
          className={
            isCompletedView
              ? "flex-shrink-0 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              : "group flex-shrink-0 w-6 h-6 rounded-full border-2 border-border hover:border-success flex items-center justify-center transition-colors"
          }
        >
          {isCompletedView ? (
            <Undo2 size={13} />
          ) : (
            <Check
              size={13}
              className="text-success opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={
                isCompletedView
                  ? "text-sm font-medium text-muted-foreground line-through truncate"
                  : "text-sm font-medium text-foreground truncate"
              }
            >
              {task.title}
            </span>
            {cadence && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                <RotateCcw size={10} />
                {cadence}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {task.category && (
              <span className="text-xs text-muted-foreground truncate">
                {task.category}
              </span>
            )}
            {task.notes && (
              <span className="text-xs text-muted-foreground/70 truncate">
                {task.notes}
              </span>
            )}
          </div>
        </div>

        {!isCompletedView && <TaskDueBadge dueDate={task.dueDate} />}
        {isCompletedView && task.lastCompletedAt && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Done{" "}
            {new Date(task.lastCompletedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {task.assignee && (
          <MemberAvatar name={task.assignee.name} color={task.assignee.color} />
        )}
      </GlassCard>
    </m.div>
  );
}
