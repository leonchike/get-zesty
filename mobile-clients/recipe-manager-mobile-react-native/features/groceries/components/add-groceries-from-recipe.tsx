import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { SectionHeader } from "@/features/recipe-view/components/reusable-components";
import Checkbox from "@/components/checkbox";
import { clsx } from "clsx";
import { cn } from "@/lib/helpers/cn";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// components
import { VerticalSpacer } from "@/components/view-wrapper";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useAddIngredientsStore } from "@/features/groceries/stores/add-ingredients-store";

export default function AddGroceriesFromRecipeContent() {
  const { isIPhone16Pro } = useDeviceType();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const { setAddIngredientsFromRecipeModalVisible } = useUIStore();
  const {
    ingredients,
    recipeName,
    loading,
    error,
    toggleIngredient,
    selectAll,
    deselectAll,
    handleAddToGroceryList,
    recipeScale,
  } = useAddIngredientsStore();

  // Determine if all ingredients are currently selected
  const isAllSelected = useMemo(
    () => ingredients.every((ing) => ing.selected),
    [ingredients]
  );

  // Handle toggling all ingredients
  const handleToggleAll = () => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  // Handle adding ingredients to the grocery list
  const handleAdd = async () => {
    const success = await handleAddToGroceryList();
    if (success) {
      // Close the modal on success
      setAddIngredientsFromRecipeModalVisible(false);
    }
  };

  return (
    <View className={clsx("flex-1")}>
      <ScrollView className={clsx("flex-1", horizontalPaddingValue)}>
        {/* Header Section */}
        <View className="mt-4 mb-8">
          <SectionHeader title={constructTitle(recipeName)} emoji="🛒" />
        </View>

        {/* Ingredients List */}
        {ingredients.length > 0 ? (
          <View className="flex-col gap-4 pb-32">
            {ingredients.map((ing, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center gap-4"
                onPress={() => toggleIngredient(index)}
                activeOpacity={0.7}
              >
                <Checkbox checked={ing.selected} checkedColor={colorScheme === "dark" ? "#F5F0EB" : "#292119"} checkmarkColor={colorScheme === "dark" ? "#1C1917" : "white"} />
                <Text
                  className={clsx(
                    "font-medium text-foreground-light dark:text-foreground-dark",
                    isIPhone16Pro() ? "text-lg" : "text-xl"
                  )}
                >
                  {ing.quantity !== 0 && `${ing.quantity * recipeScale} `}
                  {ing.unit && `${ing.unit} `}
                  {ing.ingredient}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="text-center text-base text-gray-500 mt-4">
            No ingredients found.
          </Text>
        )}

        {/* Error Message */}
        {error && (
          <View className="mt-4">
            <Text className="text-red-500">{error}</Text>
          </View>
        )}

        <VerticalSpacer height={100} />
      </ScrollView>

      {/* Footer fixed at the bottom */}
      <View
        className={cn(
          "absolute bottom-0 left-0 right-0 py-4 border-t border-gray-200 dark:border-gray-700",
          "bg-background-light dark:bg-background-dark"
        )}
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View
          className={clsx(
            "flex-row justify-between items-center",
            horizontalPaddingValue
          )}
        >
          <TouchableOpacity
            onPress={handleToggleAll}
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600"
            activeOpacity={0.7}
          >
            <Text
              className={clsx(
                "text-foreground-light dark:text-foreground-dark",
                isIPhone16Pro() ? "text-base" : "text-lg"
              )}
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading}
            className="px-4 py-3 rounded-md bg-brand-light dark:bg-brand-dark"
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                className={clsx(
                  "text-white font-semibold",
                  isIPhone16Pro() ? "text-base" : "text-lg"
                )}
              >
                Add to Grocery List
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function constructTitle(recipeName: string | undefined) {
  if (!recipeName) return "Add Groceries from Recipe";
  return `Add Groceries from Recipe`;
}
