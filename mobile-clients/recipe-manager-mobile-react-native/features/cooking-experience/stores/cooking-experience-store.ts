"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RecipeProgress {
  currentStep: number;
  lastUpdated: number;
}

interface CookingExperienceState {
  recipeProgress: Record<string, RecipeProgress>;
  currentRecipeId: string | null;
  totalSteps: number;
  showIngredients: boolean;
  setCurrentStep: (recipeId: string, step: number) => void;
  getCurrentStep: (recipeId: string) => number;
  setTotalSteps: (steps: number) => void;
  setCurrentRecipeId: (recipeId: string) => void;
  toggleIngredients: () => void;
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const useCookingExperienceStore = create(
  persist<CookingExperienceState>(
    (set, get) => ({
      recipeProgress: {},
      currentRecipeId: null,
      totalSteps: 0,
      showIngredients: false,
      setCurrentStep: (recipeId, step) =>
        set((state) => ({
          recipeProgress: {
            ...state.recipeProgress,
            [recipeId]: { currentStep: step, lastUpdated: Date.now() },
          },
        })),
      getCurrentStep: (recipeId) => {
        const progress = get().recipeProgress[recipeId];
        if (!progress) return 0;

        const isExpired = Date.now() - progress.lastUpdated > ONE_DAY_IN_MS;
        return isExpired ? 0 : progress.currentStep;
      },
      setTotalSteps: (steps) => set({ totalSteps: steps }),
      setCurrentRecipeId: (recipeId) => set({ currentRecipeId: recipeId }),
      toggleIngredients: () =>
        set((state) => ({ showIngredients: !state.showIngredients })),
    }),
    {
      name: "cooking-experience-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
