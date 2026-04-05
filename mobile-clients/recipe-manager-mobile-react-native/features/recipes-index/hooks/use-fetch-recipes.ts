import { useInfiniteQuery } from "@tanstack/react-query";

// types
import { Recipe, FetchRecipesResponse } from "@/lib/types";

// stores
import { useRecipeStore } from "../stores/recipe-store";

// API
import backendApi, { ROUTES } from "@/lib/backend-api";

const PAGE_SIZE = 20;

export const useFetchRecipes = () => {
  const {
    searchInput,
    isFavorite,
    isPinned,
    isPersonal,
    isPublic,
    selectedCuisineTypes,
    selectedMealTypes,
  } = useRecipeStore();

  const fetchRecipes = async ({ pageParam = 1 }) => {
    const response = await backendApi.post(ROUTES.SEARCH_RECIPES, {
      search: searchInput,
      isFavorite,
      isPinned,
      isPersonal,
      isPublic,
      cuisineTypes: selectedCuisineTypes,
      mealTypes: selectedMealTypes,
      page: pageParam,
      limit: PAGE_SIZE,
    });
    return response.data as FetchRecipesResponse;
  };

  return useInfiniteQuery({
    queryKey: [
      "recipes",
      searchInput,
      isFavorite,
      isPinned,
      isPersonal,
      isPublic,
      selectedCuisineTypes,
      selectedMealTypes,
    ],
    queryFn: fetchRecipes,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
