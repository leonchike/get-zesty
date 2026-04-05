import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RecipeDisplayState {
  recipeScales: Record<string, number>;
  setRecipeScale: (recipeId: string, scale: number) => void;
  getRecipeScale: (recipeId: string) => number;
  scaleOptions: number[];
}

const SCALE_OPTIONS = [0.5, ...Array.from({ length: 200 }, (_, i) => i + 1)];

export const useRecipeDisplayStore = create(
  persist<RecipeDisplayState>(
    (set, get) => ({
      recipeScales: {},
      setRecipeScale: (recipeId, scale) => {
        if (SCALE_OPTIONS.includes(scale)) {
          set((state) => ({
            recipeScales: { ...state.recipeScales, [recipeId]: scale },
          }));
        }
      },
      getRecipeScale: (recipeId) => {
        return get().recipeScales[recipeId] || 1;
      },
      scaleOptions: SCALE_OPTIONS,
    }),
    {
      name: "recipe-display-storage-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
