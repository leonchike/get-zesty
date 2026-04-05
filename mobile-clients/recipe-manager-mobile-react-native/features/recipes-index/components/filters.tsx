import { View, Image, TouchableOpacity, Text } from "react-native";
import React from "react";
import { useColorScheme } from "nativewind";
import clsx from "clsx";

import icons from "@/constants/icons";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useRecipeStore } from "../stores/recipe-store";

// helpers
import { getActiveFiltersCount } from "../helpers/count-active-filters";

export default function Filters() {
  const { colorScheme } = useColorScheme();
  const setFilterModalVisible = useUIStore(
    (state) => state.setFilterModalVisible
  );
  const filters = useRecipeStore();
  const activeFiltersCount = getActiveFiltersCount(filters);

  return (
    <View className="flex-row h-full items-center gap-2">
      <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
        <View className="relative">
          <View
            className={clsx(
              "w-10 h-10 items-center justify-center border border-gray-400 dark:border-gray-600 rounded-full",
              activeFiltersCount > 0 &&
                "border-2 border-primary-dark dark:border-primary-light"
            )}
          >
            <Image
              source={
                colorScheme === "dark"
                  ? icons.filterIconDark
                  : icons.filterIconLight
              }
              className="w-6 h-6"
              tintColor={colorScheme === "dark" ? "#fff" : "#161622"}
            />
          </View>

          {activeFiltersCount > 0 && (
            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-dark dark:bg-primary-light rounded-full items-center justify-center px-1">
              <Text className="text-xs font-bold text-white dark:text-gray-900">
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
