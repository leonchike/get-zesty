import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import clsx from "clsx";

import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import {
  daysUntil,
  formatCadence,
  formatDueLabel,
} from "@/features/home-tasks/lib/task-dates";
import {
  useCompleteHomeTask,
  useUncompleteHomeTask,
} from "@/features/home-tasks/hooks/home-task-query-hooks";
import { useHomeTaskStore } from "@/features/home-tasks/stores/home-task-store";
import type { HomeTask } from "@/features/home-tasks/types";

interface TaskItemProps {
  task: HomeTask;
  isCompletedView?: boolean;
}

// Translucent warm card — deliberately NOT a BlurView (never blur list rows)
const cardClasses =
  "flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/[0.06] border-[0.5px] border-white/40 dark:border-white/10";

export const TaskItem = ({ task, isCompletedView = false }: TaskItemProps) => {
  const completeMutation = useCompleteHomeTask();
  const uncompleteMutation = useUncompleteHomeTask();
  const setEditingTask = useHomeTaskStore((s) => s.setEditingTask);

  const cadence = task.isRecurring
    ? formatCadence(task.intervalValue, task.intervalUnit)
    : null;
  const dueLabel = formatDueLabel(task.dueDate);
  const days = daysUntil(task.dueDate);
  const dueColor =
    days === null
      ? ""
      : days < 0
      ? "text-red-500"
      : days <= 7
      ? "text-[#F0960A]"
      : "text-muted-light dark:text-muted-dark";

  const handleToggle = () => {
    if (isCompletedView) {
      uncompleteMutation.mutate(task.id);
    } else {
      completeMutation.mutate(task.id);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Pressable onPress={() => setEditingTask(task)} className={cardClasses}>
        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.7}
          hitSlop={8}
          className={clsx(
            "w-6 h-6 rounded-full items-center justify-center border-2",
            isCompletedView
              ? "bg-[#38A862] border-[#38A862]"
              : "border-border-light dark:border-border-dark"
          )}
        >
          {isCompletedView && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              className={clsx(
                "flex-shrink font-body-semibold text-base",
                isCompletedView
                  ? "text-muted-light dark:text-muted-dark line-through"
                  : "text-foreground-light dark:text-foreground-dark"
              )}
            >
              {task.title}
            </Text>
            {cadence && (
              <View className="rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10">
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  ↻ {cadence}
                </Text>
              </View>
            )}
          </View>
          {(task.category || dueLabel) && (
            <View className="flex-row items-center gap-2 mt-0.5">
              {!isCompletedView && dueLabel && (
                <Text className={clsx("text-xs font-body-medium", dueColor)}>
                  {dueLabel}
                </Text>
              )}
              {task.category && (
                <Text className="text-xs text-muted-light dark:text-muted-dark">
                  {task.category}
                </Text>
              )}
            </View>
          )}
        </View>

        {task.assignee && (
          <MemberAvatar name={task.assignee.name} color={task.assignee.color} />
        )}
      </Pressable>
    </Animated.View>
  );
};
