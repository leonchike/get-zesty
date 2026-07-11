/**
 * Types for Recipe Manager MCP Server
 */

// OAuth Props - User information from Google Auth
export interface Props extends Record<string, unknown> {
  login: string; // Email username (before @)
  name: string; // Display name
  email: string; // Full email address
  accessToken: string; // Google access token
}

// Import global Env type from worker-configuration
/// <reference types="../../worker-configuration.d.ts" />

// Cloudflare Worker Environment with OAuth provider
export interface ExtendedEnv extends Env {
  OAUTH_PROVIDER: {
    parseAuthRequest: (request: Request) => Promise<any>;
    lookupClient: (clientId: string) => Promise<any>;
    completeAuthorization: (args: any) => Promise<{ redirectTo: string }>;
  };
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  COOKIE_ENCRYPTION_KEY: string;
  RECIPE_API_BASE_URL: string;
  RECIPE_API_KEY: string;
  SENTRY_DSN?: string;
}

// Tool response types
export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
    isError?: boolean;
  }>;
}

// Recipe API response types
export interface RecipeSearchResult {
  id: string;
  title: string;
  description: string | null;
  cuisineType: string | null;
  mealType: string | null;
  difficulty: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  isPublic: boolean;
  source: string | null;
  imageUrl: string | null;
}

export interface RecipeDetail extends RecipeSearchResult {
  ingredients: string | null;
  instructions: string | null;
  parsedIngredients: any | null;
  parsedInstructions: any | null;
  restTime: number | null;
  notes: string | null;
  utensils: string | null;
  nutrition: any | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSearchResponse {
  recipes: RecipeSearchResult[];
  nextPage: number | null;
  totalCount: number;
}

// Grocery API response types
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number | null;
  quantityUnit: string | null;
  status: "ACTIVE" | "COMPLETED" | "DELETED";
  section: { name: string } | null;
  recipe: { title: string } | null;
  recipeId: string | null;
  cookbookRecipe: { title: string } | null;
  cookbookRecipeId: string | null;
}

export interface GroceryListResponse {
  groceries: GroceryItem[];
}

export interface GroceryCreateResponse {
  grocery: GroceryItem;
}

export interface GroceryCompleteResponse {
  count: number;
  groceries: GroceryItem[];
}

// Cookbook types (for Phase 6)
export interface Cookbook {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  description: string | null;
  recipeCount: number;
}

export interface CookbookRecipe {
  id: string;
  cookbookId: string;
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
  cookbook?: { title: string; author: string | null };
}

export interface CookbookRecipeListResponse {
  recipes: Array<{
    id: string;
    cookbookId: string;
    title: string;
    description: string | null;
    pageNumber: number | null;
    cuisineType: string | null;
    mealType: string | null;
    cookbook?: { title: string; author: string | null };
  }>;
  totalCount: number;
  nextPage: number | null;
}

export interface CookbookSearchResponse {
  results: Array<{
    recipe: CookbookRecipe;
    score: number;
    matchType: "semantic" | "fulltext" | "hybrid";
  }>;
  totalCount: number;
}

// Inventory types
export interface InventoryLocation {
  id: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
  isUserCreated: boolean;
  userId: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number | null;
  quantityUnit: string | null;
  notes: string | null;
  status: "ACTIVE" | "CONSUMED" | "DISCARDED";
  addedAt: string;
  expiresAt: string | null;
  locationId: string;
  recipeId: string | null;
  cookbookRecipeId: string | null;
  location: InventoryLocation;
  recipe: { title: string } | null;
  cookbookRecipe: { title: string } | null;
}

export interface InventoryListResponse {
  inventory: InventoryItem[];
}

export interface InventoryItemResponse {
  inventory: InventoryItem;
}

export interface InventoryLocationsResponse {
  locations: InventoryLocation[];
}

// Home Task types
export interface HouseholdMember {
  id: string;
  name: string;
  color: string;
}

export interface HomeTask {
  id: string;
  title: string;
  notes: string | null;
  category: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  dueDate: string | null;
  isRecurring: boolean;
  intervalValue: number | null;
  intervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  lastCompletedAt: string | null;
  assigneeId: string | null;
  assignee: HouseholdMember | null;
}

export interface TaskCompletionEntry {
  id: string;
  completedAt: string;
  previousDueDate: string | null;
  completedBy: HouseholdMember | null;
}

export interface HomeTaskListResponse {
  tasks: HomeTask[];
}

export interface HomeTaskResponse {
  task: HomeTask;
}

export interface HomeTaskDeleteResponse {
  success: boolean;
  id: string;
}

export interface HouseholdMembersResponse {
  members: HouseholdMember[];
}

export interface TaskCompletionsResponse {
  completions: TaskCompletionEntry[];
}
