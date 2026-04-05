import type { Recipe } from "@prisma/client";
import type { RecipeDetailData, BreadcrumbData } from "./types";
import type { ParsedIngredient } from "@/lib/types/types";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import { parseRecipeIngredients } from "@/lib/functions/ingredient-instruction-parser";

export function adaptRecipeToDetailData(recipe: Recipe): RecipeDetailData {
  let parsedIngredients: ParsedIngredient[] | null = null;
  if (recipe.parsedIngredients) {
    try {
      parsedIngredients =
        typeof recipe.parsedIngredients === "string"
          ? JSON.parse(recipe.parsedIngredients)
          : (recipe.parsedIngredients as unknown as ParsedIngredient[]);
    } catch {
      parsedIngredients = null;
    }
  }

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    equipment: recipe.equipment,
    notes: recipe.notes,
    nutrition: recipe.nutrition,
    parsedIngredients,
    parsedInstructions: recipe.parsedInstructions,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    restTime: recipe.restTime,
    totalTime: recipe.totalTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    cuisineType: recipe.cuisineType,
    mealType: recipe.mealType,
    dietaryRestrictions: recipe.dietaryRestrictions ?? [],
    tags: recipe.tags ?? [],
    breadcrumb: null,
    attribution: null,
    pageNumber: null,
  };
}

interface CookbookRecipeInput {
  id: string;
  title: string;
  description: string | null;
  ingredients: string | null;
  instructions: string | null;
  pageNumber: number | null;
  cuisineType: string | null;
  mealType: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  imageUrl?: string | null;
  cookbook: {
    id: string;
    title: string;
    author: string | null;
  };
}

function parseTimeString(timeStr: string | null): number | null {
  if (!timeStr) return null;
  // Try to extract minutes from strings like "30 minutes", "1 hour", "1h 30m", "45 min"
  const str = timeStr.toLowerCase().trim();

  // Pure number
  const num = parseInt(str);
  if (!isNaN(num) && str === String(num)) return num;

  let totalMinutes = 0;
  const hourMatch = str.match(/(\d+)\s*h(?:ours?)?/);
  const minMatch = str.match(/(\d+)\s*m(?:in(?:utes?)?)?/);

  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);

  if (totalMinutes > 0) return totalMinutes;

  // Fallback: just try to parse any number
  const anyNum = str.match(/(\d+)/);
  if (anyNum) return parseInt(anyNum[1]);

  return null;
}

function parseServingsString(servingsStr: string | null): number | null {
  if (!servingsStr) return null;
  const num = parseInt(servingsStr);
  return isNaN(num) ? null : num;
}

export function adaptCookbookRecipeToDetailData(
  recipe: CookbookRecipeInput
): RecipeDetailData {
  const breadcrumb: BreadcrumbData = {
    cookbookId: recipe.cookbook.id,
    cookbookTitle: recipe.cookbook.title,
    recipeTitle: recipe.title,
  };

  const attribution = recipe.cookbook.author
    ? `From ${recipe.cookbook.title} by ${recipe.cookbook.author}`
    : null;

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl ?? null,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    equipment: null,
    notes: null,
    nutrition: null,
    parsedIngredients: recipe.ingredients
      ? parseRecipeIngredients(splitRecipeString(recipe.ingredients))
      : null,
    parsedInstructions: null,
    prepTime: parseTimeString(recipe.prepTime),
    cookTime: parseTimeString(recipe.cookTime),
    restTime: null,
    totalTime: null,
    servings: parseServingsString(recipe.servings),
    difficulty: null,
    cuisineType: recipe.cuisineType,
    mealType: recipe.mealType,
    dietaryRestrictions: [],
    tags: [],
    breadcrumb,
    attribution,
    pageNumber: recipe.pageNumber,
  };
}
