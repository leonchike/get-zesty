import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";

// components
import { RecipeFormScreen } from "@/features/create-edit-recipe/components/form-screen";

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  if (typeof id !== "string") {
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <RecipeFormScreen recipeId={id} />
    </View>
  );
}
