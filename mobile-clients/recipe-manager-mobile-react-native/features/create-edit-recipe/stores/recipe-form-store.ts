// src/lib/stores/recipe-form-store.ts
import { create } from "zustand";
import { Recipe, RecipeSource } from "@/lib/types";
import {
  createRecipe,
  updateRecipe,
  scrapeRecipe,
} from "../actions/recipe-actions";

interface RecipeState {
  recipe: Partial<Recipe> | null;
  scrapedRecipe: Partial<Recipe> | null;
  isSubmitting: boolean;
  imageUrl: string | null;
  recipeID: string | null;
  setRecipeID: (id: string | null) => void;
  setRecipe: (recipe: Partial<Recipe> | null) => void;
  setImageUrl: (url: string | null) => void;
  submitRecipe: (data: Partial<Recipe>) => Promise<string | undefined>;
  reset: () => void;

  // Scraping
  scrapeUrl: string | null;
  setScrapeUrl: (url: string | null) => void;
  isScraping: boolean;
  scrapeError: string | null;
  scrapeSuccess: boolean;
  doScrapeRecipe: (url: string) => Promise<void>;
  resetScrapeForm: () => void;
}

export const initialRecipeState: Partial<Recipe> = {
  title: "",
  ingredients: "",
  instructions: "",
  description: "",
  difficulty: "EASY",
  isPublic: false,
  servings: 4,
  imageUrl: undefined,
  sourceUrl: undefined,
  prepTime: 0,
  cookTime: 0,
  restTime: 0,
  totalTime: 0,
  equipment: "",
  utensils: "",
  notes: "",
  mealType: "",
  cuisineType: "",
  dietaryRestrictions: [],
  tags: [],
  isDeleted: false,
  reviewCount: 0,
  favoriteCount: 0,
  seasonality: "",
  source: undefined,
  parsedIngredients: undefined,
  parsedInstructions: undefined,
  user: undefined,
  rating: undefined,
};

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipe: null,
  scrapedRecipe: null,
  isSubmitting: false,
  imageUrl: null,
  recipeID: null,
  scrapeUrl: null,
  isScraping: false,
  scrapeError: null,
  scrapeSuccess: false,

  setRecipeID: (id) => set({ recipeID: id }),
  setRecipe: (recipe) =>
    set({
      recipe,
      scrapedRecipe: null,
      imageUrl: null,
      scrapeSuccess: false,
    }),
  setImageUrl: (url) => set({ imageUrl: url }),

  submitRecipe: async (data: Partial<Recipe>) => {
    set({ isSubmitting: true });
    const { recipeID } = get();
    try {
      if (!data) throw new Error("No recipe data available");
      if (recipeID) {
        await updateRecipe({ id: recipeID, recipe: data });
        return recipeID;
      } else {
        if (!data?.title) throw new Error("Recipe title is required");
        const response = await createRecipe({
          recipe: data as Omit<
            Recipe,
            "id" | "userId" | "createdAt" | "updatedAt"
          >,
        });

        if (!response?.id) {
          throw new Error("No recipe ID returned from create");
        }
        get().reset();
        return response.id;
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
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
      scrapeSuccess: false,
      recipeID: null,
    }),

  setScrapeUrl: (url) => set({ scrapeUrl: url }),
  doScrapeRecipe: async (url: string) => {
    try {
      set({ isScraping: true, scrapeError: null });
      const result = await scrapeRecipe({ url });
      if (result) {
        // clear all fields
        get().reset();

        const scrapedData = {
          ...result,
          source: "SCRAPE" as RecipeSource,
          imageUrl: result.imageUrl,
          ingredients: Array.isArray(result.ingredients)
            ? result.ingredients.join("\n")
            : result.ingredients,
          instructions: Array.isArray(result.instructions)
            ? result.instructions.join("\n\n")
            : result.instructions,
          equipment: Array.isArray(result.equipment)
            ? result.equipment.join(", ")
            : result.equipment,
        };
        set({
          scrapedRecipe: scrapedData,
          recipe: scrapedData,
          scrapeSuccess: true,
        });
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
}));
