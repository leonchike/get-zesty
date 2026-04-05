import backendApi, { ROUTES } from "@/lib/backend-api";

interface SelectedIngredients {
  name: string;
  quantity: number;
  quantityUnit: string;
  recipeId: string;
}

export const addGroceriesFromRecipe = async (
  selectedIngredients: SelectedIngredients[]
) => {
  const response = await backendApi.post(ROUTES.ADD_GROCERIES_FROM_RECIPE, {
    selectedIngredients,
  });
  if (response.status === 200) {
    return {
      success: true,
      data: response.data,
    };
  }
  return {
    success: false,
    error: response.data.error,
  };
};
