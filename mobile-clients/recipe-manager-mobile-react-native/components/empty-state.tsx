import { View, Text } from "react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import clsx from "clsx";

const EMPTY_STATE_CONFIG = {
  groceries: {
    header: "Grocery List",
    description: "Add items to your grocery list to get started",
    emoji: "🛒",
  },
  recipes: {
    header: "No recipes found",
    description:
      "Add recipes to your collection to get started. Or explore community recipes.",
    emoji: "🍳",
  },
  shoppingLists: {
    header: "Shopping Lists",
    description: "Create a shopping list to get started",
    emoji: "🛒",
  },
  // Easy to add new types by adding new entries here
} as const;

type EmptyStateType = keyof typeof EMPTY_STATE_CONFIG;

export const EmptyState = ({ type }: { type: EmptyStateType }) => {
  const { isIpad } = useDeviceType();
  const config = EMPTY_STATE_CONFIG[type];

  return (
    <View className="flex-1 items-center justify-center">
      <Text className={clsx(isIpad() ? "text-8xl" : "text-6xl", "font-bold mb-2")}>{config.emoji}</Text>
      <Text className={clsx(isIpad() ? "text-4xl" : "text-3xl", "pt-4 font-heading mb-2 text-foreground-light dark:text-foreground-dark")}>
        {config.header}
      </Text>
      <Text className={clsx(isIpad() ? "text-xl" : "text-lg", "font-body text-muted-light dark:text-muted-dark text-center px-4")}>
        {config.description}
      </Text>
    </View>
  );
};
