"use client";

import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import TaskItem from "@/features/home-tasks/components/task-item";
import EditTaskModal from "@/features/home-tasks/components/edit-task-modal";
import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import {
  useCompletedTasksQuery,
  useHomeTasksQuery,
  useHouseholdMembersQuery,
} from "@/features/home-tasks/hooks/home-tasks-query-hooks";
import { useHomeTasksStore } from "@/features/home-tasks/stores/home-tasks-store";
import { isDueSoon, isOverdue } from "@/features/home-tasks/lib/task-dates";
import type {
  HomeTaskView,
  HomeTaskWithRelations,
} from "@/features/home-tasks/types";

const VIEW_OPTIONS: { value: HomeTaskView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "dueSoon", label: "Due soon" },
  { value: "completed", label: "Completed" },
];

export default function TaskListView() {
  const { viewFilter, setViewFilter, memberFilter, setMemberFilter } =
    useHomeTasksStore();
  const editingTaskId = useHomeTasksStore((s) => s.editingTaskId);
  const setEditingTaskId = useHomeTasksStore((s) => s.setEditingTaskId);

  const isCompletedView = viewFilter === "completed";
  const { data: activeTasks, isLoading, error } = useHomeTasksQuery();
  const { data: completedTasks, isLoading: isLoadingCompleted } =
    useCompletedTasksQuery(isCompletedView);
  const { data: members } = useHouseholdMembersQuery();

  const now = new Date();
  const sourceTasks = isCompletedView ? completedTasks : activeTasks;

  const byMember = (task: HomeTaskWithRelations) =>
    !memberFilter || task.assigneeId === memberFilter;

  const filtered = (sourceTasks ?? []).filter((task) => {
    if (!byMember(task)) return false;
    if (viewFilter === "overdue") return isOverdue(task, now);
    if (viewFilter === "dueSoon") return isDueSoon(task, now);
    return true;
  });

  const overdueCount = (activeTasks ?? []).filter(
    (t) => byMember(t) && isOverdue(t, now)
  ).length;

  const editingTask =
    (activeTasks ?? [])
      .concat(completedTasks ?? [])
      .find((t) => t.id === editingTaskId) ?? null;

  if (error) {
    return <div className="py-6 text-destructive">Error: {error.message}</div>;
  }

  const sections = buildSections(filtered, viewFilter, now);
  const loading = isCompletedView ? isLoadingCompleted : isLoading;

  return (
    <div className="py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewFilter(option.value)}
              aria-pressed={viewFilter === option.value}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                viewFilter === option.value
                  ? "bg-foreground text-background border-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
              {option.value === "overdue" && overdueCount > 0 && (
                <span
                  className={clsx(
                    "ml-1.5 text-xs",
                    viewFilter === "overdue" ? "opacity-90" : "text-destructive"
                  )}
                >
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {(members?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            {members!.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  setMemberFilter(
                    memberFilter === member.id ? null : member.id
                  )
                }
                aria-pressed={memberFilter === member.id}
                title={`Filter by ${member.name}`}
                className={clsx(
                  "rounded-full transition-all",
                  memberFilter === member.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <MemberAvatar name={member.name} color={member.color} size="md" />
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Loading your tasks…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center bg-grain">
          <div className="text-4xl mb-3">{isCompletedView ? "🎉" : "🏡"}</div>
          <div className="font-heading text-lg text-foreground mb-1">
            {isCompletedView
              ? "Nothing completed yet"
              : viewFilter === "overdue"
              ? "Nothing overdue"
              : viewFilter === "dueSoon"
              ? "Nothing due soon"
              : "No home tasks yet"}
          </div>
          <p className="text-sm text-muted-foreground">
            {isCompletedView || viewFilter !== "all"
              ? "Switch filters to see the rest of your tasks."
              : "Add a one-off job or a recurring chore above to get started."}
          </p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {sections.map((section) => (
          <m.div
            key={section.title}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {section.title && (
              <h2 className="pt-4 pb-2 font-heading text-lg font-medium text-foreground select-none flex items-center gap-3">
                <span className="relative">
                  {section.title}
                  <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-accent rounded-full" />
                </span>
                <span className="text-xs text-muted-foreground font-body font-normal">
                  {section.tasks.length}
                </span>
              </h2>
            )}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {section.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isCompletedView={isCompletedView}
                  />
                ))}
              </AnimatePresence>
            </div>
          </m.div>
        ))}
      </AnimatePresence>

      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTaskId(null)}
      />
    </div>
  );
}

interface TaskSection {
  title: string | null;
  tasks: HomeTaskWithRelations[];
}

function buildSections(
  tasks: HomeTaskWithRelations[],
  view: HomeTaskView,
  now: Date
): TaskSection[] {
  if (tasks.length === 0) return [];

  // Filtered views read better as a single flat list
  if (view !== "all") {
    return [{ title: null, tasks }];
  }

  const overdue = tasks.filter((t) => isOverdue(t, now));
  const dueSoon = tasks.filter((t) => isDueSoon(t, now));
  const later = tasks.filter(
    (t) => t.dueDate && !isOverdue(t, now) && !isDueSoon(t, now)
  );
  const noDate = tasks.filter((t) => !t.dueDate);

  return [
    { title: "Overdue", tasks: overdue },
    { title: "Due soon", tasks: dueSoon },
    { title: "Later", tasks: later },
    { title: "Anytime", tasks: noDate },
  ].filter((s) => s.tasks.length > 0);
}
