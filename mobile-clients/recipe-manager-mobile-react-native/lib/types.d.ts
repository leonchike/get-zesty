export type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  password?: string;
  accounts: Account[];
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
  items: GroceryItem[];
  recipes: Recipe[];
  favoriteRecipes: FavoriteRecipe[];
  pinnedRecipes: PinnedRecipe[];
  isAccountDisabled: boolean;
};

// Type for Account (referenced in User but not defined)
export type Account = {
  id: string;
  userId: string;
  // Add other properties as needed
};

// Type for Session (referenced in User but not defined)
export type Session = {
  id: string;
  userId: string;
  // Add other properties as needed
};

export type FavoriteRecipe = {
  id: string;
  userId: string;
  recipeId: string;
  addedAt: Date;
  user: User;
  recipe: Recipe;
};

export type PinnedRecipe = {
  id: string;
  userId: string;
  recipeId: string;
  pinnedAt: Date;
  user: User;
  recipe: Recipe;
};

export enum RecipeSource {
  USER = "USER",
  SCRAPE = "SCRAPE",
  GEN_AI = "GEN_AI",
}

export type GroceryItemStatus = "ACTIVE" | "COMPLETED" | "DELETED";

export type CommonGroceryItem = {
  id: string;
  name: string;
  sectionId: string;
  section: GrocerySection;
  items: GroceryItem[];
  isUserCreated: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity?: number;
  quantityUnit?: string;
  userId: string;
  sectionId?: string;
  commonItemId?: string;
  recipeId?: string;
  status: GroceryItemStatus;
  user: User;
  section?: GrocerySection;
  commonItem?: CommonGroceryItem;
  recipe?: Recipe;
  createdAt: Date;
  updatedAt: Date;
};

export interface GroceryItemWithSection extends GroceryItem {
  section: GrocerySection | undefined;
  recipe?: Recipe;
}

export interface GrocerySection {
  id: string;
  name: string;
  items: GroceryItem[];
  commonItems: CommonGroceryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type RecipeDifficulty = "EASY" | "MEDIUM" | "HARD";

export type Recipe = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  difficulty: RecipeDifficulty;
  prepTime?: number;
  cookTime?: number;
  restTime?: number;
  totalTime?: number;
  servings?: number | null;
  ingredients?: string;
  instructions?: string;
  equipment?: string;
  utensils?: string;
  nutrition?: any;
  notes?: string;
  isPublic: boolean;
  cuisineType?: string;
  mealType?: string;
  dietaryRestrictions: string[];
  tags: string[];
  sourceUrl?: string;
  imageUrl?: string;
  rating?: number;
  isDeleted: boolean;
  reviewCount: number;
  favoriteCount: number;
  seasonality?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  FavoriteRecipe: FavoriteRecipe[];
  PinnedRecipe: PinnedRecipe[];
  source?: RecipeSource;
  parsedIngredients?: ParsedIngredient[];
  parsedInstructions?: any;
  GroceryItem: GroceryItem[];
};

export type CreateRecipeParams = {
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">;
};

export type UpdateRecipeParams = {
  id: string;
  recipe: Partial<Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">>;
};

export type DeleteRecipeParams = {
  recipeId: string;
};

export type ScrapeRecipeParams = {
  url: string;
};

export type GenerateAiRecipeParams = {
  prompt: string;
};

export type GetRecipeParams = {
  recipeId: string;
};

export interface FetchRecipesResponse {
  recipes: Recipe[];
  nextPage: number | null;
  totalCount: number;
}

export interface FetchSearchOptionsResponse {
  mealTypes: string[];
  cuisineTypes: string[];
}

export interface ParsedIngredient {
  original_text: string;
  quantity: number;
  unit: string;
  ingredient: string;
  extra: string;
}