// hooks/useFilterOptions.ts

import { useEffect, useRef, useCallback } from "react";
import { useFilterStore } from "@/features/search-filters/store/search-filter-store";
import { fetchFilterOptionsAction } from "@/features/search-filters/actions/search-actions";
import isEqual from "lodash/isEqual";

export function useFilterOptions() {
  const filters = useFilterStore();

  const prevFiltersRef = useRef({
    isFavorite: filters.isFavorite,
    isPinned: filters.isPinned,
    isPersonal: filters.isPersonal,
    isPublic: filters.isPublic,
    selectedCuisineTypes: filters.selectedCuisineTypes,
    selectedMealTypes: filters.selectedMealTypes,
  });

  const fetchOptions = useCallback(async () => {
    try {
      const { mealTypes, cuisineTypes } = await fetchFilterOptionsAction({
        isFavorite: filters.isFavorite,
        isPinned: filters.isPinned,
        isPersonal: filters.isPersonal,
        isPublic: filters.isPublic,
        cuisineType: filters.selectedCuisineTypes,
        mealType: filters.selectedMealTypes,
      });
      filters.setAvailableMealTypes(mealTypes);
      filters.setAvailableCuisineTypes(cuisineTypes);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, [filters]);

  useEffect(() => {
    const currentFilters = {
      isFavorite: filters.isFavorite,
      isPinned: filters.isPinned,
      isPersonal: filters.isPersonal,
      isPublic: filters.isPublic,
      selectedCuisineTypes: filters.selectedCuisineTypes,
      selectedMealTypes: filters.selectedMealTypes,
    };

    if (!isEqual(currentFilters, prevFiltersRef.current)) {
      fetchOptions();
      prevFiltersRef.current = currentFilters;
    }
  }, [
    filters.isFavorite,
    filters.isPinned,
    filters.isPersonal,
    filters.isPublic,
    filters.selectedCuisineTypes,
    filters.selectedMealTypes,
    fetchOptions,
  ]);
}
