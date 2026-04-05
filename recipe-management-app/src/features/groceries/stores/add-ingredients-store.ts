/*
Store for grocery selection and adding to grocery list

*/

import { create } from "zustand";
import { ParsedIngredient } from "@/lib/types/types";
import { addGroceriesFromRecipeAction } from "@/features/groceries/actions/grocery-actions";

interface Ingredient extends ParsedIngredient {
  selected: boolean;
}

interface AddIngredientsState {
  loading: boolean;
  error: string | null;
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  toggleIngredient: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  handleAddToGroceryList: (recipeId: string | null) => Promise<boolean>;
}

export const useAddIngredientsStore = create<AddIngredientsState>(
  (set, get) => ({
    loading: false,
    error: null,
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),
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
    handleAddToGroceryList: async (recipeId: string | null) => {
      set({ loading: true, error: null });
      try {
        const selectedIngredients = get()
          .ingredients.filter((ing) => ing.selected)
          .map((ing) => ({
            name: ing.ingredient,
            quantity: ing.quantity,
            quantityUnit: ing.unit,
            recipeId,
          }));

        const result = await addGroceriesFromRecipeAction(selectedIngredients);

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
