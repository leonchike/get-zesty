import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// components
import Header from "@/components/header";
import RecipesIndexListView from "@/features/recipes-index/components/list-view";
import AddRecipeHeaderButton from "@/features/recipes-index/components/add-recipe-header-button";

const IndexScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 h-full bg-backgroundGray-light dark:bg-backgroundGray-dark" style={{ paddingTop: insets.top }}>
      <Header
        title="Recipes"
        subtitle="What are we cooking?"
        actions={<AddRecipeHeaderButton />}
      />
      <RecipesIndexListView />
    </View>
  );
};

export default IndexScreen;
