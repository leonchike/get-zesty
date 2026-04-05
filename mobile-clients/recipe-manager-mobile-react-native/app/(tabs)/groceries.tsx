import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// components
import Header from "@/components/header";
import { ListView } from "@/features/groceries/components/list-view";

const GroceriesScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="flex-1 h-full bg-backgroundGray-light dark:bg-backgroundGray-dark" style={{ paddingTop: insets.top }}>
      <Header title="Groceries" />

      <ListView />
    </View>
  );
};

export default GroceriesScreen;
