import type { ElectronAPI } from '../../preload/index'

declare global {
  interface Window {
    api: ElectronAPI
  }
}

// --- User ---
export interface User {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  emailVerified: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  isAccountDisabled: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

// --- Recipe ---
export type RecipeDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type RecipeSource = 'USER' | 'SCRAPE' | 'GEN_AI'

export interface ParsedIngredient {
  original_text: string
  quantity: number | null
  unit: string | null
  ingredient: string
  extra: string | null
}

export interface RecipeInstruction {
  step: number
  text: string
}

export interface NutritionInfo {
  calories?: string
  fat?: string
  saturatedFat?: string
  cholesterol?: string
  sodium?: string
  carbohydrates?: string
  fiber?: string
  sugar?: string
  protein?: string
  [key: string]: string | undefined
}

export interface Recipe {
  id: string
  userId: string
  title: string
  description: string | null
  difficulty: RecipeDifficulty
  prepTime: number | null
  cookTime: number | null
  restTime: number | null
  totalTime: number | null
  servings: number | null
  ingredients: string | null
  instructions: string | null
  equipment: string | null
  utensils: string | null
  nutrition: NutritionInfo | null
  notes: string | null
  isPublic: boolean
  isDeleted: boolean
  cuisineType: string | null
  mealType: string | null
  dietaryRestrictions: string[]
  tags: string[]
  sourceUrl: string | null
  imageUrl: string | null
  rating: number | null
  reviewCount: number
  favoriteCount: number
  seasonality: string | null
  source: RecipeSource
  parsedIngredients: ParsedIngredient[] | null
  parsedInstructions: RecipeInstruction[] | null
  createdAt: string
  updatedAt: string
  FavoriteRecipe?: { id: string }[]
  PinnedRecipe?: { id: string }[]
  user?: { name: string | null; image: string | null }
}

export interface RecipeSearchFilters {
  search?: string
  isFavorite?: boolean
  isPinned?: boolean
  isPersonal?: boolean
  isPublic?: boolean
  cuisineTypes?: string[]
  mealTypes?: string[]
  page?: number
  pageSize?: number
}

export interface RecipeSearchResponse {
  recipes: Recipe[]
  nextPage: number | null
  totalCount: number
}

export interface RecipeFormData {
  title: string
  description: string
  difficulty: RecipeDifficulty
  prepTime: number | null
  cookTime: number | null
  restTime: number | null
  servings: number | null
  ingredients: string
  instructions: string
  equipment: string
  notes: string
  cuisineType: string
  mealType: string
  tags: string[]
  isPublic: boolean
  imageUrl: string | null
  sourceUrl: string | null
}

// --- Grocery ---
export type GroceryItemStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED'

export interface GrocerySection {
  id: string
  name: string
}

export interface GroceryItem {
  id: string
  userId: string
  name: string
  quantity: number | null
  quantityUnit: string | null
  status: GroceryItemStatus
  sectionId: string | null
  commonItemId: string | null
  recipeId: string | null
  createdAt: string
  updatedAt: string
  section: GrocerySection | null
}

// --- Cookbook ---
export interface Cookbook {
  id: string
  userId: string
  title: string
  author: string | null
  publisher: string | null
  year: number | null
  isbn: string | null
  coverUrl: string | null
  description: string | null
  totalPages: number | null
  fileType: string | null
  isProcessed: boolean
  recipeCount: number
  createdAt: string
  updatedAt: string
}

export interface CookbookRecipe {
  id: string
  cookbookId: string
  userId: string
  title: string
  description: string | null
  ingredients: string | null
  instructions: string | null
  pageNumber: number | null
  cuisineType: string | null
  mealType: string | null
  servings: string | null
  prepTime: string | null
  cookTime: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

// --- Filter Options ---
export interface FilterOptions {
  cuisineTypes: string[]
  mealTypes: string[]
}

// --- Chat ---
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// --- Pinned Recipe (GET /pinned-recipes returns Recipe[] directly) ---
export type PinnedRecipeItem = Recipe
