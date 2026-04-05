import { Text, View, ScrollView } from "react-native";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

import React from "react";
import { useRecipeDisplayStore } from "@/features/recipe-view/stores/recipe-display-store";
import {
  calculateTotalTime,
  humanReadableTime,
} from "@/lib/helpers/recipe-display-helpers";
import { warmShadow } from "@/lib/helpers/warm-shadows";

export default function MetadataView({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  if (!recipe) return null;

  const { difficulty, prepTime, cookTime, restTime, servings, id } = recipe;
  const { getRecipeScale } = useRecipeDisplayStore();

  const totalTime = calculateTotalTime(prepTime, cookTime, restTime);
  const scale = getRecipeScale(id) || 1;

  // Calculate adjusted servings only if original servings are available
  const adjustedServings = servings ? Math.round(servings * scale) : null;

  // Build list of metadata items to render
  const items: { label: string; value: string | number }[] = [];

  items.push({ label: "Difficulty", value: getDifficultyEmoji(difficulty) });

  if (totalTime != null && totalTime > 0) {
    items.push({ label: "Total", value: humanReadableTime(totalTime) });
  }
  if (prepTime != null && prepTime > 0) {
    items.push({ label: "Prep", value: humanReadableTime(prepTime) });
  }
  if (cookTime != null && cookTime > 0) {
    items.push({ label: "Cook/Bake", value: humanReadableTime(cookTime) });
  }
  if (restTime != null && restTime > 0) {
    items.push({ label: "Rest", value: humanReadableTime(restTime) });
  }
  if (adjustedServings != null && adjustedServings > 0) {
    items.push({ label: "Servings", value: adjustedServings });
  }

  return (
    <View className={clsx(horizontalPaddingValue, "mt-6")}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {items.map((item) => (
          <MetadataPill
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function MetadataPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  if (!value || value === "0") return null;

  return (
    <View
      className="bg-surface-light dark:bg-surface-dark rounded-full px-4 py-2.5 items-center"
      style={warmShadow("sm")}
    >
      <Text className="font-body text-muted-light dark:text-muted-dark text-xs mb-0.5">
        {label}
      </Text>
      <Text className="font-body-medium text-foreground-light dark:text-foreground-dark text-base">
        {value}
      </Text>
    </View>
  );
}

export function getDifficultyEmoji(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "Easy 👌";
    case "medium":
      return "Medium 👍";
    case "hard":
      return "Hard 💪";
    default:
      return "🤷";
  }
}
