import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPinnedRecipes, togglePinnedRecipe } from "../actions/api-actions";
import { Recipe } from "@/lib/types";

export const usePinnedRecipes = () => {
  return useQuery({
    queryKey: ["pinnedRecipes"],
    queryFn: getPinnedRecipes,
  });
};

export const useTogglePinnedRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePinnedRecipe,
    // Optimistic update
    onMutate: async (recipeId: string) => {
      await queryClient.cancelQueries({ queryKey: ["pinnedRecipes"] });

      const previousPinnedRecipes = queryClient.getQueryData<Recipe[]>([
        "pinnedRecipes",
      ]);

      const recipe = previousPinnedRecipes?.find((r) => r.id === recipeId);
      if (!recipe) return { previousPinnedRecipes };

      queryClient.setQueryData<Recipe[]>(["pinnedRecipes"], (old = []) => {
        const isPinned = old.some((r) => r.id === recipeId);
        return isPinned
          ? old.filter((r) => r.id !== recipeId)
          : [...old, recipe];
      });

      return { previousPinnedRecipes };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["pinnedRecipes"],
        context?.previousPinnedRecipes
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedRecipes"] });
    },
  });
};
