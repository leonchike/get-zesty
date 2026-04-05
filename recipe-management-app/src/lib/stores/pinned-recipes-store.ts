import { create } from "zustand";
import { Recipe } from "@prisma/client";

interface PinnedRecipesState {
  pinnedRecipes: Recipe[];
  setPinnedRecipes: (recipes: Recipe[]) => void;
  addPinnedRecipe: (recipe: Recipe) => void;
  removePinnedRecipe: (recipeId: string) => void;
  togglePinnedRecipe: (recipe: Recipe) => void;
}

export const usePinnedRecipesStore = create<PinnedRecipesState>((set) => ({
  pinnedRecipes: [],
  setPinnedRecipes: (recipes) => set({ pinnedRecipes: recipes }),
  addPinnedRecipe: (recipe) =>
    set((state) => ({ pinnedRecipes: [...state.pinnedRecipes, recipe] })),
  removePinnedRecipe: (recipeId) =>
    set((state) => ({
      pinnedRecipes: state.pinnedRecipes.filter(
        (recipe) => recipe.id !== recipeId
      ),
    })),
  togglePinnedRecipe: (recipe) =>
    set((state) => {
      const isPinned = state.pinnedRecipes.some((r) => r.id === recipe.id);
      if (isPinned) {
        return {
          pinnedRecipes: state.pinnedRecipes.filter((r) => r.id !== recipe.id),
        };
      } else {
        return { pinnedRecipes: [...state.pinnedRecipes, recipe] };
      }
    }),
}));
