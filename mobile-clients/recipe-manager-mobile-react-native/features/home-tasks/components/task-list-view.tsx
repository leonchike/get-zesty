import React, { useMemo } from "react";
import { SectionList, Text, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { TaskItem } from "@/features/home-tasks/components/task-item";
import { TaskFilterPills } from "@/features/home-tasks/components/task-filter-pills";
import { AddTaskInput } from "@/features/home-tasks/components/add-task-input";
import { EditTaskModal } from "@/features/home-tasks/components/edit-task-modal";
import {
  useCompletedTasksQuery,
  useHomeTasksQuery,
} from "@/features/home-tasks/hooks/home-task-query-hooks";
import { useHomeTaskStore } from "@/features/home-tasks/stores/home-task-store";
import { isDueSoon, isOverdue } from "@/features/home-tasks/lib/task-dates";
import type { HomeTask } from "@/features/home-tasks/types";

interface TaskSection {
  title: string | null;
  data: HomeTask[];
}

export const TaskListView = () => {
  const insets = useSafeAreaInsets();
  const { viewFilter, memberFilter } = useHomeTaskStore();
  const isCompletedView = viewFilter === "completed";

  const { data: activeTasks, isLoading } = useHomeTasksQuery();
  const { data: completedTasks, isLoading: isLoadingCompleted } =
    useCompletedTasksQuery(isCompletedView);

  const sections = useMemo<TaskSection[]>(() => {
    const source = (isCompletedView ? completedTasks : activeTasks) ?? [];
    const filtered = source.filter((task) => {
      if (memberFilter && task.assigneeId !== memberFilter) return false;
      if (viewFilter === "overdue") return isOverdue(task);
      if (viewFilter === "dueSoon") return isDueSoon(task);
      return true;
    });

    if (filtered.length === 0) return [];
    if (viewFilter !== "all") return [{ title: null, data: filtered }];

    const groups: TaskSection[] = [
      { title: "Overdue", data: filtered.filter((t) => isOverdue(t)) },
      { title: "Due soon", data: filtered.filter((t) => isDueSoon(t)) },
      {
        title: "Later",
        data: filtered.filter(
          (t) => t.dueDate && !isOverdue(t) && !isDueSoon(t)
        ),
      },
      { title: "Anytime", data: filtered.filter((t) => !t.dueDate) },
    ];
    return groups.filter((g) => g.data.length > 0);
  }, [activeTasks, completedTasks, isCompletedView, memberFilter, viewFilter]);

  const loading = isCompletedView ? isLoadingCompleted : isLoading;

  return (
    <View className="flex-1">
      <AddTaskInput />
      <TaskFilterPills />

      {loading && sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState type="homeTasks" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 pb-2">
              <TaskItem task={item} isCompletedView={isCompletedView} />
            </View>
          )}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <Text className="px-4 pt-4 pb-2 font-heading text-xl text-foreground-light dark:text-foreground-dark">
                {section.title}
              </Text>
            ) : (
              <View className="pt-2" />
            )
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <EditTaskModal />
    </View>
  );
};
