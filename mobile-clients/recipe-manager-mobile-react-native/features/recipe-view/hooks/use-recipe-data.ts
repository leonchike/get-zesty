import { useQuery } from "@tanstack/react-query";
import backendApi, { ROUTES } from "@/lib/backend-api";

import { Recipe } from "@/lib/types";

export const useRecipeData = (id: string) => {
  return useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: async () => {
      try {
        const response = await backendApi.get<Recipe>(
          `${ROUTES.RECIPE}?id=${id}`
        );
        return response.data;
      } catch (error) {
        // Re-throw the error so React Query can handle it properly
        throw error;
      }
    },
  });
};

export const getRecipeQueryKey = (id: string) => ["recipe", id];
