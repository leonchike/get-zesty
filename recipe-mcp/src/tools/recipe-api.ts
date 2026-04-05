/**
 * HTTP client for Next.js /api/mcp/recipes/* endpoints
 */

import type { RecipeSearchResponse, RecipeDetail } from "../types/index.js";

interface RecipeApiConfig {
  baseUrl: string;
  apiKey: string;
  userId: string;
}

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

/**
 * Search/filter recipes
 */
export async function searchRecipes(
  config: RecipeApiConfig,
  filters: {
    search?: string;
    isFavorite?: boolean;
    isPinned?: boolean;
    isPersonal?: boolean;
    isPublic?: boolean;
    cuisineTypes?: string[];
    mealTypes?: string[];
    page?: number;
    limit?: number;
  }
): Promise<RecipeSearchResponse> {
  const url = `${config.baseUrl}/api/mcp/recipes/search`;

  const filterPayload: Record<string, any> = {
    search: filters.search,
    isFavorite: filters.isFavorite ?? false,
    isPinned: filters.isPinned ?? false,
    isPersonal: filters.isPersonal ?? true,
    isPublic: filters.isPublic ?? false,
    page: filters.page ?? 1,
    limit: Math.min(filters.limit ?? 20, 64),
  };

  // Only include array filters if they have values
  if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
    filterPayload.cuisineTypes = filters.cuisineTypes;
  }
  if (filters.mealTypes && filters.mealTypes.length > 0) {
    filterPayload.mealTypes = filters.mealTypes;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      filters: filterPayload,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as RecipeSearchResponse;
}

/**
 * Get full recipe details by ID
 */
export async function getRecipe(
  config: RecipeApiConfig,
  recipeId: string
): Promise<RecipeDetail> {
  const url = `${config.baseUrl}/api/mcp/recipes?id=${encodeURIComponent(recipeId)}&user_id=${encodeURIComponent(config.userId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as RecipeDetail;
}

/**
 * Create a new recipe
 */
export async function createRecipe(
  config: RecipeApiConfig,
  recipe: {
    title: string;
    ingredients: string;
    instructions: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    cuisineType?: string;
    mealType?: string;
    difficulty?: string;
    isPublic?: boolean;
  },
  parseWithAI: boolean = true
): Promise<{ id: string }> {
  const url = `${config.baseUrl}/api/mcp/recipes`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      recipe: {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        cuisineType: recipe.cuisineType,
        mealType: recipe.mealType,
        difficulty: recipe.difficulty ?? "EASY",
        isPublic: recipe.isPublic ?? false,
        source: "USER",
      },
      parseWithAI,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as { id: string };
}

/**
 * Update an existing recipe (partial update)
 */
export async function updateRecipe(
  config: RecipeApiConfig,
  recipeId: string,
  updates: Record<string, any>,
  parseWithAI: boolean = true
): Promise<{ id: string }> {
  const url = `${config.baseUrl}/api/mcp/recipes`;

  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      id: recipeId,
      recipe: updates,
      parseWithAI,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as { id: string };
}

/**
 * Soft-delete a recipe
 */
export async function deleteRecipe(
  config: RecipeApiConfig,
  recipeId: string
): Promise<{ id: string }> {
  const url = `${config.baseUrl}/api/mcp/recipes`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      id: recipeId,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as { id: string };
}
