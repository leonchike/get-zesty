import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFavoriteRecipesStore } from "@/lib/stores/favorites-recipes-store";
import {
  getFavoriteRecipes,
  toggleFavoriteRecipe,
} from "@/lib/actions/recipe-actions";

export function useFavoriteRecipes() {
  const queryClient = useQueryClient();
  const { favoriteRecipes, setFavoriteRecipes, toggleFavoriteRecipeInStore } =
    useFavoriteRecipesStore();

  const { isLoading, error } = useQuery({
    queryKey: ["favoriteRecipes"],
    queryFn: async () => {
      const favoriteRecipes = await getFavoriteRecipes();
      setFavoriteRecipes(favoriteRecipes);
      return favoriteRecipes;
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleFavoriteRecipe,
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries({ queryKey: ["favoriteRecipes"] });
      const recipe = favoriteRecipes.find(
        (r: { id: string }) => r.id === (recipeId as unknown)
      );
      if (recipe) {
        toggleFavoriteRecipeInStore(recipe);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteRecipes"] });
    },
  });

  const toggleFavorite = (recipeId: string) => {
    toggleFavoriteMutation.mutate(recipeId);
  };

  return {
    favoriteRecipes,
    isLoading,
    error,
    toggleFavorite,
  };
}
