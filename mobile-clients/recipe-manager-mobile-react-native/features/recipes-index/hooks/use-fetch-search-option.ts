import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecipeStore } from "../stores/recipe-store";
import backendApi, { ROUTES } from "@/lib/backend-api";

interface SearchOptionsResponse {
  cuisineTypes: string[];
  mealTypes: string[];
}

export const useFetchSearchOptions = () => {
  const queryClient = useQueryClient();
  const {
    selectedCuisineTypes,
    selectedMealTypes,
    isFavorite,
    isPinned,
    isPersonal,
    isPublic,
    setAvailableCuisineTypes,
    setAvailableMealTypes,
  } = useRecipeStore();

  return useQuery({
    queryKey: [
      "searchOptions",
      {
        cuisineTypes: selectedCuisineTypes,
        mealTypes: selectedMealTypes,
        isFavorite,
        isPinned,
        isPersonal,
        isPublic,
      },
    ],
    queryFn: async () => {
      const { data } = await backendApi.post<SearchOptionsResponse>(
        ROUTES.SEARCH_FILTER_OPTIONS,
        {
          data: {
            selectedCuisineTypes,
            selectedMealTypes,
            isFavorite,
            isPinned,
            isPersonal,
            isPublic,
          },
        }
      );

      // Update the store with new available options
      setAvailableCuisineTypes(data.cuisineTypes);
      setAvailableMealTypes(data.mealTypes);

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};

// Hook to prefetch options for better UX
export const usePrefetchSearchOptions = () => {
  const queryClient = useQueryClient();
  const filters = useRecipeStore();

  const prefetchNextOptions = async (newFilters: Partial<typeof filters>) => {
    const queryKey = ["searchOptions", { ...filters, ...newFilters }];

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const { data } = await backendApi.get<SearchOptionsResponse>(
          ROUTES.SEARCH_FILTER_OPTIONS,
          {
            params: {
              ...filters,
              ...newFilters,
            },
          }
        );
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  return prefetchNextOptions;
};

// Hook to invalidate search options cache when needed
export const useInvalidateSearchOptions = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["searchOptions"] });
  };
};
