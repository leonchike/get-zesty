import React from "react";
import { View } from "react-native";

// components
import { RecipeFormScreen } from "@/features/create-edit-recipe/components/form-screen";

export default function NewRecipeScreen() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <RecipeFormScreen recipeId={undefined} />
    </View>
  );
}
