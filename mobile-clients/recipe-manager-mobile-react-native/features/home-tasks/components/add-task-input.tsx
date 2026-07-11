import React, { useState } from "react";
import { TextInput, TouchableOpacity, View, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCreateHomeTask } from "@/features/home-tasks/hooks/home-task-query-hooks";

export const AddTaskInput = () => {
  const [value, setValue] = useState("");
  const colorScheme = useColorScheme();
  const createMutation = useCreateHomeTask();

  const handleSubmit = () => {
    if (!value.trim()) return;
    createMutation.mutate({ title: value.trim() });
    setValue("");
  };

  return (
    <View className="mx-4 mb-1 flex-row items-center rounded-2xl bg-white/60 dark:bg-white/[0.06] border-[0.5px] border-white/40 dark:border-white/10 pl-4 pr-1.5 py-1.5">
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        placeholder="Add a task…"
        placeholderTextColor={colorScheme === "dark" ? "#78716C" : "#A8A29E"}
        className="flex-1 py-2 text-base font-body text-foreground-light dark:text-foreground-dark"
      />
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!value.trim() || createMutation.isPending}
        activeOpacity={0.7}
        className={
          value.trim()
            ? "rounded-xl bg-[#FF385C] px-4 py-2"
            : "rounded-xl bg-black/10 dark:bg-white/10 px-4 py-2"
        }
      >
        <Text
          className={
            value.trim()
              ? "text-white text-sm font-body-semibold"
              : "text-muted-light dark:text-muted-dark text-sm font-body-semibold"
          }
        >
          Add
        </Text>
      </TouchableOpacity>
    </View>
  );
};
