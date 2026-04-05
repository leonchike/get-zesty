import React, { useMemo, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import {
  useRecipeStore,
  RecipeStore as FilterState,
} from "../stores/recipe-store";
import useUIStore from "@/stores/global-ui-store";
import { FilterBooleanButton, FilterCheckboxItem } from "./filter-buttons";
import CustomButton from "@/components/custom-button";
import { capitalizeWords } from "@/lib/helpers/text-helpers";
import pluralize from "pluralize";
import {
  getMealTypeEmoji,
  getCuisineTypeEmoji,
} from "@/lib/helpers/emoji-helpers";

// hooks
import {
  useFetchSearchOptions,
  usePrefetchSearchOptions,
} from "../hooks/use-fetch-search-option";

// helpers
import { getActiveFiltersCount } from "../helpers/count-active-filters";

export default function FiltersContent() {
  const { data: searchOptions, isLoading, isError } = useFetchSearchOptions();
  // const prefetchNextOptions = usePrefetchSearchOptions();

  const loading = isLoading && !searchOptions;

  const setFilterModalVisible = useUIStore(
    (state) => state.setFilterModalVisible
  );
  const filters = useRecipeStore();

  // // Prefetch on hover/focus for better UX
  // const handlePrefetch = useCallback(
  //   (newFilters: Partial<typeof filters>) => {
  //     prefetchNextOptions(newFilters);
  //   },
  //   [prefetchNextOptions]
  // );

  // Extract boolean filters
  const {
    isFavorite,
    setIsFavorite,
    isPinned,
    setIsPinned,
    isPersonal,
    setIsPersonal,
    isPublic,
    setIsPublic,
  } = filters;

  // Memoize sorted cuisine types to prevent unnecessary re-renders
  const sortedCuisineTypes = useMemo(
    () => searchOptions?.cuisineTypes.sort((a, b) => a.localeCompare(b)) || [],
    [searchOptions?.cuisineTypes]
  );

  const mealTypes = searchOptions?.mealTypes || [];

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters]
  );

  const handleClearAll = () => {
    filters.resetFilters();
  };

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">Error loading filter options</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-1">
        <ScrollView className="px-8 py-8">
          <View>
            <SectionHeader>Quick filters</SectionHeader>
            <View className="flex-row flex-wrap mt-3 gap-3">
              <FilterBooleanButton
                emoji="💖"
                label={capitalizeWords("Favorites")}
                value={isFavorite}
                onChange={setIsFavorite}
              />

              <FilterBooleanButton
                emoji="📌"
                label={capitalizeWords("Pinned")}
                value={isPinned}
                onChange={setIsPinned}
              />

              <FilterBooleanButton
                emoji="👨‍🍳"
                label={capitalizeWords("My recipes")}
                value={isPersonal}
                onChange={setIsPersonal}
              />

              <FilterBooleanButton
                emoji="🌍"
                label={capitalizeWords("Public")}
                value={isPublic}
                onChange={setIsPublic}
              />
            </View>
          </View>
          {/* Add more filters here */}

          {/* Dynamic Filters Sections */}
          {loading ? (
            <View className="mt-8">
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {/* Cuisine Types Section */}
              {sortedCuisineTypes.length > 0 && (
                <View className="mt-8">
                  <SectionHeader>Cuisine Types</SectionHeader>
                  <View className="flex-row flex-wrap gap-3 mt-2">
                    {sortedCuisineTypes.map((cuisineType) => (
                      <FilterCheckboxItem
                        key={cuisineType}
                        label={capitalizeWords(cuisineType)}
                        emoji={getCuisineTypeEmoji(cuisineType)}
                        checked={filters.selectedCuisineTypes.includes(
                          cuisineType
                        )}
                        onCheckedChange={() =>
                          filters.toggleSelectedCuisineType(cuisineType)
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Meal Types Section */}
          {mealTypes.length > 0 && (
            <View className="mt-8">
              <SectionHeader>Type of dish or drink</SectionHeader>
              <View className="flex-row flex-wrap gap-3 mt-2">
                {mealTypes.map((mealType) => (
                  <FilterCheckboxItem
                    key={mealType}
                    label={capitalizeWords(mealType)}
                    emoji={getMealTypeEmoji(mealType)}
                    checked={filters.selectedMealTypes.includes(mealType)}
                    onCheckedChange={() => {
                      filters.toggleSelectedMealType(mealType);
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      <View className="border-t mx-8 mb-10 border-gray-100 dark:border-gray-800 py-4 pb-20">
        <FilterFooter
          onClearAll={handleClearAll}
          onClose={() => setFilterModalVisible(false)}
          activeFiltersCount={activeFiltersCount}
        />
      </View>
    </View>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-primary-dark dark:text-primary-light">
        {children}
      </Text>
    </View>
  );
}

function FilterFooter({
  onClearAll,
  onClose,
  activeFiltersCount,
}: {
  onClearAll: () => void;
  onClose: () => void;
  activeFiltersCount: number;
}) {
  return (
    <View className="flex-row justify-between">
      <CustomButton
        handlePress={onClearAll}
        variant="ghost"
        textStyles="text-base"
      >
        Clear all
      </CustomButton>

      <CustomButton
        handlePress={onClose}
        variant="primary"
        textStyles="text-base"
      >
        {activeFiltersCount > 0
          ? `See results from ${activeFiltersCount} ${pluralize(
              "filter",
              activeFiltersCount
            )}`
          : "See all recipes"}
      </CustomButton>
    </View>
  );
}
