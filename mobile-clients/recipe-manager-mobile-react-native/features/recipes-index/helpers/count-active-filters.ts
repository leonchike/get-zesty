import { RecipeStore as FilterState } from "../stores/recipe-store";

export function getActiveFiltersCount(filters: FilterState): number {
  const booleanFilters = ["isFavorite", "isPinned", "isPersonal", "isPublic"];
  const arrayFilters = ["selectedCuisineTypes", "selectedMealTypes"];
  let count = 0;

  booleanFilters.forEach((key) => {
    if (filters[key as keyof FilterState] === true) count++;
  });

  arrayFilters.forEach((key) => {
    const array = filters[key as keyof FilterState] as string[];
    count += array.length;
  });

  if (filters.searchInput && filters.searchInput.trim() !== "") count++;

  return count;
}
