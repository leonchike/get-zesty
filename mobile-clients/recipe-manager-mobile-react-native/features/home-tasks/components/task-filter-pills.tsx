import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import clsx from "clsx";

import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import { useHouseholdMembersQuery } from "@/features/home-tasks/hooks/home-task-query-hooks";
import { useHomeTaskStore } from "@/features/home-tasks/stores/home-task-store";
import type { HomeTaskView } from "@/features/home-tasks/types";

const VIEW_OPTIONS: { value: HomeTaskView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "dueSoon", label: "Due soon" },
  { value: "completed", label: "Completed" },
];

export const TaskFilterPills = () => {
  const { viewFilter, setViewFilter, memberFilter, setMemberFilter } =
    useHomeTaskStore();
  const { data: members } = useHouseholdMembersQuery();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row items-center gap-2 px-4 py-2"
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = viewFilter === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => setViewFilter(option.value)}
            activeOpacity={0.7}
            className={clsx(
              "px-3.5 py-1.5 rounded-full border-[0.5px]",
              isActive
                ? "bg-foreground-light dark:bg-foreground-dark border-transparent"
                : "bg-white/60 dark:bg-white/[0.06] border-white/40 dark:border-white/10"
            )}
          >
            <Text
              className={clsx(
                "text-sm font-body-medium",
                isActive
                  ? "text-background-light dark:text-background-dark"
                  : "text-muted-light dark:text-muted-dark"
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {(members?.length ?? 0) > 0 && (
        <View className="flex-row items-center gap-1.5 ml-2">
          {members!.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() =>
                setMemberFilter(memberFilter === member.id ? null : member.id)
              }
              activeOpacity={0.7}
              className={clsx(
                "rounded-full",
                memberFilter === member.id
                  ? "border-2 border-[#FF385C]"
                  : "opacity-70"
              )}
            >
              <MemberAvatar name={member.name} color={member.color} size="md" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};
