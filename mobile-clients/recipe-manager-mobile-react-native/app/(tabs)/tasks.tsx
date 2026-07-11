import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// components
import Header from "@/components/header";
import { TaskListView } from "@/features/home-tasks/components/task-list-view";

const TasksScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 h-full bg-backgroundGray-light dark:bg-backgroundGray-dark"
      style={{ paddingTop: insets.top }}
    >
      <Header title="Home Tasks" />

      <TaskListView />
    </View>
  );
};

export default TasksScreen;
