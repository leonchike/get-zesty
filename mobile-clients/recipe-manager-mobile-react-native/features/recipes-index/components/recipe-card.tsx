import React from "react";
import { View, Image, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import clsx from "clsx";

import { Recipe } from "@/lib/types";
import {
  humanReadableTime,
  calculateTotalTime,
} from "@/lib/helpers/recipe-display-helpers";
import { useRouter } from "expo-router";
import icons from "@/constants/icons";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useRecipeModalStore } from "@/stores/recipe-modal-store";
import { warmShadow } from "@/lib/helpers/warm-shadows";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const RecipeCard = ({
  recipe,
  index = 0,
}: {
  recipe: Recipe;
  index?: number;
}) => {
  const router = useRouter();
  const { isIPhone16Pro, dimensions } = useDeviceType();
  const { openRecipe } = useRecipeModalStore();
  const { width } = dimensions;
  const { prepTime, cookTime, restTime, imageUrl, title, difficulty } = recipe;
  const totalTime = calculateTotalTime(prepTime, cookTime, restTime);

  // Determine if we're in a grid layout
  const isGridLayout = width >= 768;

  const handlePress = () => {
    openRecipe(recipe.id);
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      className={clsx(
        !isGridLayout && horizontalPaddingValue
      )}
      style={{ width: "100%" }}
    >
      <Pressable
        onPress={handlePress}
        className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden"
        style={warmShadow("md")}
      >
        {/* Image */}
        <View className="relative w-full h-56">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-[#E7E0D8] dark:bg-[#44403C]">
              <View className="w-1/3 h-auto">
                <ImagePlaceholder />
              </View>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-4 pt-3 pb-4">
          <Text
            className={clsx(
              isGridLayout
                ? "text-base"
                : isIPhone16Pro()
                ? "text-lg"
                : "text-xl",
              "font-heading-semibold text-foreground-light dark:text-foreground-dark"
            )}
            numberOfLines={1}
          >
            {title}
          </Text>

          {/* Metadata row: time + difficulty */}
          <View className="flex-row items-center mt-1.5 gap-3">
            {totalTime && (
              <Text className="font-body text-sm text-muted-light dark:text-muted-dark">
                {humanReadableTime(totalTime)}
              </Text>
            )}
            {totalTime && difficulty && (
              <Text className="text-muted-light dark:text-muted-dark opacity-40">
                {"\u00B7"}
              </Text>
            )}
            {difficulty && (
              <Text className="font-body text-sm text-muted-light dark:text-muted-dark">
                {DIFFICULTY_LABELS[difficulty] ?? difficulty}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

function ImagePlaceholder() {
  return (
    <Image
      source={icons.recipePlaceholder}
      style={{ width: "100%", height: "100%", resizeMode: "contain" }}
    />
  );
}
