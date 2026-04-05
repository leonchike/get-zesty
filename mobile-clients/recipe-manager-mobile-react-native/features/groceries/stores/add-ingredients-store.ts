/*
Store for grocery selection and adding to grocery list

*/

import { create } from "zustand";
import { ParsedIngredient } from "@/lib/types";
import { addGroceriesFromRecipe } from "@/features/groceries/lib/add-ingredients-from-recipe";

interface Ingredient extends ParsedIngredient {
  selected: boolean;
}

interface AddIngredientsState {
  recipeId: string;
  recipeName: string;
  recipeScale: number;
  loading: boolean;
  error: string | null;
  ingredients: Ingredient[];
  setRecipeId: (recipeId: string) => void;
  setRecipeName: (recipeName: string) => void;
  setRecipeScale: (recipeScale: number) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  toggleIngredient: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  handleAddToGroceryList: () => Promise<boolean>;
}

export const useAddIngredientsStore = create<AddIngredientsState>(
  (set, get) => ({
    loading: false,
    error: null,
    recipeId: "",
    recipeName: "",
    recipeScale: 1,
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),
    setRecipeName: (recipeName) => set({ recipeName }),
    setRecipeScale: (recipeScale) => set({ recipeScale }),
    setRecipeId: (recipeId) => set({ recipeId }),
    toggleIngredient: (index) =>
      set((state) => ({
        ingredients: state.ingredients.map((ing, i) =>
          i === index ? { ...ing, selected: !ing.selected } : ing
        ),
      })),
    selectAll: () =>
      set((state) => ({
        ingredients: state.ingredients.map((ing) => ({
          ...ing,
          selected: true,
        })),
      })),
    deselectAll: () =>
      set((state) => ({
        ingredients: state.ingredients.map((ing) => ({
          ...ing,
          selected: false,
        })),
      })),
    handleAddToGroceryList: async () => {
      set({ loading: true, error: null });
      try {
        const selectedIngredients = get()
          .ingredients.filter((ing) => ing.selected)
          .map((ing) => ({
            name: ing.ingredient,
            quantity: ing.quantity * get().recipeScale,
            quantityUnit: ing.unit,
            recipeId: get().recipeId,
          }));

        console.log("selectedIngredients", selectedIngredients);

        const result = await addGroceriesFromRecipe(selectedIngredients);

        if (result.success) {
          set({ loading: false });
          return true;
        } else {
          throw new Error(result.error || "Failed to add ingredients");
        }
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        return false;
      }
    },
  })
);
