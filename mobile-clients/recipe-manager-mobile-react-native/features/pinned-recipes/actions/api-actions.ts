import backendApi, { ROUTES } from "@/lib/backend-api";
import { Recipe } from "@/lib/types";

export const getPinnedRecipes = async () => {
  const response = await backendApi.get(ROUTES.PINNED_RECIPES);
  return response.data as Recipe[];
};

export const togglePinnedRecipe = async (recipeId: string) => {
  const response = await backendApi.post(ROUTES.PINNED_RECIPES, { recipeId });
  return response.data as { pinned: boolean };
};
