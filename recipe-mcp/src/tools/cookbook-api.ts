/**
 * HTTP client for Next.js /api/mcp/cookbooks/* endpoints
 *
 * Phase 6 implementation — these functions call the cookbook API routes
 * built in Phase 5.
 */

import type { Cookbook, CookbookRecipe, CookbookRecipeListResponse, CookbookSearchResponse } from "../types/index.js";

interface CookbookApiConfig {
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
 * List all cookbooks for the user
 */
export async function listCookbooks(config: CookbookApiConfig): Promise<Cookbook[]> {
  const url = `${config.baseUrl}/api/mcp/cookbooks?user_id=${encodeURIComponent(config.userId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as Cookbook[];
}

/**
 * Semantic/hybrid search across cookbook recipes
 */
export async function searchCookbookRecipes(
  config: CookbookApiConfig,
  query: string,
  options?: {
    cookbookId?: string;
    cuisineType?: string;
    mealType?: string;
    limit?: number;
  }
): Promise<CookbookSearchResponse> {
  const url = `${config.baseUrl}/api/mcp/cookbooks/search`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      query,
      cookbookId: options?.cookbookId,
      cuisineType: options?.cuisineType,
      mealType: options?.mealType,
      limit: options?.limit ?? 10,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as CookbookSearchResponse;
}

/**
 * Get a specific cookbook recipe by ID
 */
export async function getCookbookRecipe(
  config: CookbookApiConfig,
  recipeId: string
): Promise<CookbookRecipe> {
  const url = `${config.baseUrl}/api/mcp/cookbooks/recipes?id=${encodeURIComponent(recipeId)}&user_id=${encodeURIComponent(config.userId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as CookbookRecipe;
}

/**
 * List all recipes in a cookbook with pagination
 */
export async function listCookbookRecipes(
  config: CookbookApiConfig,
  cookbookId: string,
  options?: { page?: number; limit?: number }
): Promise<CookbookRecipeListResponse> {
  const params = new URLSearchParams({
    cookbook_id: cookbookId,
    user_id: config.userId,
  });
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));

  const url = `${config.baseUrl}/api/mcp/cookbooks/recipes/list?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as CookbookRecipeListResponse;
}

/**
 * Search cookbook recipes by ingredient list
 */
export async function searchByIngredient(
  config: CookbookApiConfig,
  ingredients: string[],
  matchAll: boolean = false
): Promise<CookbookSearchResponse> {
  const url = `${config.baseUrl}/api/mcp/cookbooks/ingredients`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      ingredients,
      matchAll,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as CookbookSearchResponse;
}
