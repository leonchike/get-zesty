// src/lib/stores/recipe-form-store.ts

import { create } from "zustand";
import { Recipe, RecipeDifficulty, RecipeSource } from "@prisma/client";
import {
  createRecipeAction,
  updateRecipeAction,
  scrapeRecipeAPI,
  generateAiRecipe,
} from "@/lib/actions/recipe-actions";

interface RecipeState {
  recipe: Partial<Recipe> | null;
  scrapedRecipe: Partial<Recipe> | null;
  aiGeneratedRecipe: Partial<Recipe> | null;
  isSubmitting: boolean;
  imageUrl: string | null;
  recipeID: string | null;
  setRecipeID: (id: string | null) => void;
  setRecipe: (recipe: Partial<Recipe> | null) => void;
  updateField: <K extends keyof Recipe>(field: K, value: Recipe[K]) => void;
  setImageUrl: (url: string | null) => void;
  submitRecipe: () => Promise<string | undefined>;
  reset: () => void;

  // Scraping state and actions
  scrapeRecipe: (url: string) => Promise<void>;
  scrapeUrl: string | null;
  setScrapeUrl: (url: string | null) => void;
  isScraping: boolean;
  scrapeError: string | null;
  scrapeSuccess: boolean;
  resetScrapeForm: () => void;

  // Generate AI recipe state and actions
  generateAiRecipe: (prompt: string) => Promise<void>;
  generateAiRecipePrompt: string | null;
  setGenerateAiRecipePrompt: (prompt: string | null) => void;
  isGeneratingAiRecipe: boolean;
  generateAiRecipeError: string | null;
  generateAiRecipeSuccess: boolean;
  resetAIGenerateForm: () => void;
}

const initialRecipeState: Partial<Recipe> = {
  title: "",
  description: undefined,
  difficulty: RecipeDifficulty.EASY,
  prepTime: undefined,
  cookTime: undefined,
  servings: undefined,
  ingredients: "",
  instructions: "",
  isPublic: false,
  imageUrl: undefined,
  nutrition: null,
  sourceUrl: null,
};

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipe: null,
  scrapedRecipe: null,
  aiGeneratedRecipe: null,
  isSubmitting: false,
  imageUrl: null,
  recipeID: null,
  setRecipeID: (id: string | null) => set({ recipeID: id }),
  // Scraping state and actions
  scrapeUrl: null,
  setScrapeUrl: (url: string | null) => set({ scrapeUrl: url }),
  isScraping: false,
  scrapeError: null,
  scrapeSuccess: false,
  scrapeRecipe: async (url: string) => {
    try {
      set({ isScraping: true, scrapeError: null });
      const result = await scrapeRecipeAPI(url);
      if (result.success && result.data) {
        const scrapedData = {
          ...result.data,
          ingredients: Array.isArray(result.data.ingredients)
            ? result.data.ingredients.join("\n")
            : result.data.ingredients,
          instructions: Array.isArray(result.data.instructions)
            ? result.data.instructions.join("\n\n")
            : result.data.instructions,
          equipment: Array.isArray(result.data.equipment)
            ? result.data.equipment.join(", ")
            : result.data.equipment,
          source: "GEN_AI" as RecipeSource,
        };
        set({ scrapedRecipe: scrapedData, recipe: scrapedData });
        set({ scrapeSuccess: true });
      } else {
        set({ scrapeError: "Error scraping recipe" });
      }
    } catch (error) {
      console.error("Error scraping recipe:", error);
      set({ scrapeError: "Error scraping recipe" });
    } finally {
      set({ isScraping: false });
    }
  },

  resetScrapeForm: () =>
    set({ scrapedRecipe: null, scrapeUrl: null, scrapeSuccess: false }),

  setRecipe: (recipe) =>
    set({
      recipe,
      scrapedRecipe: null,
      aiGeneratedRecipe: null,
      imageUrl: null,
      scrapeSuccess: false,
      generateAiRecipeSuccess: false,
    }),

  updateField: (field, value) =>
    set((state) => ({
      recipe: { ...state.recipe, [field]: value },
    })),

  setImageUrl: (url) => set({ imageUrl: url }),

  submitRecipe: async () => {
    set({ isSubmitting: true });
    const { recipe, recipeID } = get();
    try {
      if (recipeID) {
        await updateRecipeAction(recipeID, {
          ...recipe,
          // imageUrl: imageUrl || undefined,
        });
        return recipeID;
      } else {
        const newRecipe = await createRecipeAction({
          ...recipe,
        } as Recipe);
        return newRecipe.id;
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      set({ isSubmitting: false });
    } finally {
      set({ isSubmitting: false });
    }
  },

  reset: () =>
    set({
      recipe: initialRecipeState,
      imageUrl: null,
      isSubmitting: false,
      scrapedRecipe: null,
      aiGeneratedRecipe: null,
      scrapeSuccess: false,
      generateAiRecipeSuccess: false,
      recipeID: null,
    }),

  generateAiRecipe: async (prompt: string) => {
    set({ isGeneratingAiRecipe: true, generateAiRecipeError: null });
    const result = await generateAiRecipe(prompt);
    if (result.success && result.data) {
      set({ generateAiRecipeSuccess: true });
      const recipe = {
        ...result.data,
        ingredients: result.data.ingredients.join("\n"),
        instructions: result.data.instructions.join("\n\n"),
        equipment: result.data.equipment.join(", "),
        source: RecipeSource.GEN_AI,
      };
      set({ aiGeneratedRecipe: recipe as Partial<Recipe> });
    } else {
      set({ generateAiRecipeError: "Failed to generate AI recipe" });
    }
    set({ isGeneratingAiRecipe: false });
  },
  generateAiRecipePrompt: null,
  setGenerateAiRecipePrompt: (prompt: string | null) =>
    set({ generateAiRecipePrompt: prompt }),
  isGeneratingAiRecipe: false,
  generateAiRecipeError: null,
  generateAiRecipeSuccess: false,
  resetAIGenerateForm: () =>
    set({
      aiGeneratedRecipe: null,
      generateAiRecipePrompt: null,
      generateAiRecipeSuccess: false,
    }),
}));
