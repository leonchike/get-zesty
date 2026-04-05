import { create } from "zustand";
import { Recipe } from "@prisma/client";

interface FavoriteRecipesState {
  favoriteRecipes: Recipe[];
  setFavoriteRecipes: (recipes: Recipe[]) => void;
  addFavoriteRecipe: (recipe: Recipe) => void;
  removeFavoriteRecipe: (recipeId: string) => void;
  toggleFavoriteRecipeInStore: (recipe: Recipe) => void;
}

export const useFavoriteRecipesStore = create<FavoriteRecipesState>((set) => ({
  favoriteRecipes: [],
  setFavoriteRecipes: (recipes) => set({ favoriteRecipes: recipes }),
  addFavoriteRecipe: (recipe) =>
    set((state) => ({ favoriteRecipes: [...state.favoriteRecipes, recipe] })),
  removeFavoriteRecipe: (recipeId) =>
    set((state) => ({
      favoriteRecipes: state.favoriteRecipes.filter(
        (recipe) => recipe.id !== recipeId
      ),
    })),
  toggleFavoriteRecipeInStore: (recipe) =>
    set((state) => {
      const isFavorite = state.favoriteRecipes.some((r) => r.id === recipe.id);
      if (isFavorite) {
        return {
          favoriteRecipes: state.favoriteRecipes.filter(
            (r) => r.id !== recipe.id
          ),
        };
      } else {
        return { favoriteRecipes: [...state.favoriteRecipes, recipe] };
      }
    }),
}));
