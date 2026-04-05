import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePinnedRecipesStore } from "@/lib/stores/pinned-recipes-store";
import {
  getPinnedRecipesAction,
  togglePinRecipeAction,
} from "@/lib/actions/recipe-actions";

export function usePinnedRecipes() {
  const queryClient = useQueryClient();
  const { pinnedRecipes, setPinnedRecipes, togglePinnedRecipe } =
    usePinnedRecipesStore();

  const { isLoading, error } = useQuery({
    queryKey: ["pinnedRecipes"],
    queryFn: async () => {
      const data = await getPinnedRecipesAction();
      setPinnedRecipes(data);
      return data;
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: togglePinRecipeAction,
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries({ queryKey: ["pinnedRecipes"] });
      const recipe = pinnedRecipes.find(
        (r: { id: string }) => r.id === (recipeId as unknown)
      );
      if (recipe) {
        togglePinnedRecipe(recipe);
        // Ensure the function call is handled properly
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedRecipes"] });
    },
  });

  const togglePin = (recipeId: string) => {
    togglePinMutation.mutate(recipeId);
  };

  return {
    pinnedRecipes,
    isLoading,
    error,
    togglePin,
  };
}
