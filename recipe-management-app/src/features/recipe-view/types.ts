import type { ParsedIngredient } from "@/lib/types/types";

export interface RecipeDetailData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  ingredients: string | null;
  instructions: string | null;
  equipment: string | null;
  notes: string | null;
  nutrition: unknown | null;
  parsedIngredients: ParsedIngredient[] | null;
  parsedInstructions: unknown | null;
  prepTime: number | null;
  cookTime: number | null;
  restTime: number | null;
  totalTime: number | null;
  servings: number | null;
  difficulty: string | null;
  cuisineType: string | null;
  mealType: string | null;
  dietaryRestrictions: string[];
  tags: string[];
  // Cookbook-specific
  breadcrumb: BreadcrumbData | null;
  attribution: string | null;
  pageNumber: number | null;
}

export interface BreadcrumbData {
  cookbookId: string;
  cookbookTitle: string;
  recipeTitle: string;
}

export interface RecipeDetailConfig {
  showScaling: boolean;
  showCookingMode: boolean;
  showGroceryIntegration: boolean;
  showEditActions: boolean;
  showFavoritePin: boolean;
  showBreadcrumb: boolean;
  showEquipment: boolean;
  showNutrition: boolean;
  showNotes: boolean;
  showTags: boolean;
}

export const fullRecipeConfig: RecipeDetailConfig = {
  showScaling: true,
  showCookingMode: true,
  showGroceryIntegration: true,
  showEditActions: true,
  showFavoritePin: true,
  showBreadcrumb: false,
  showEquipment: true,
  showNutrition: true,
  showNotes: true,
  showTags: true,
};

export const cookbookRecipeConfig: RecipeDetailConfig = {
  showScaling: false,
  showCookingMode: true,
  showGroceryIntegration: true,
  showEditActions: false,
  showFavoritePin: false,
  showBreadcrumb: true,
  showEquipment: false,
  showNutrition: false,
  showNotes: false,
  showTags: false,
};
