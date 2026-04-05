import { z } from "zod";

// --- Constants ---

export const WINDOW_SIZE = 5;
export const WINDOW_OVERLAP = 2;
export const MAX_CONCURRENT_WINDOWS = 10;
export const MAX_CONCURRENT_RECIPES = 10;
export const EMBEDDING_BATCH_SIZE = 20;
export const CHUNK_TYPES = [
  "full",
  "description",
  "ingredients",
  "instructions",
] as const;

export const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";
export const CLAUDE_SONNET = "claude-sonnet-4-6";

// --- Zod Schemas ---

export const CookbookMetadataSchema = z.object({
  title: z.string(),
  author: z.string().nullable(),
  publisher: z.string().nullable(),
  year: z.number().int().nullable(),
  isbn: z.string().nullable(),
  description: z.string().nullable(),
});

export const RecipeBoundarySchema = z.object({
  title: z.string(),
  startPage: z.number().int().min(1),
  endPage: z.number().int().min(1),
});

export const RecipeBoundaryListSchema = z.object({
  recipes: z.array(RecipeBoundarySchema),
});

export const ExtractedRecipeSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  ingredients: z.string(),
  instructions: z.string(),
  cuisineType: z.string().nullable().optional(),
  mealType: z.string().nullable().optional(),
  servings: z.string().nullable().optional(),
  prepTime: z.string().nullable().optional(),
  cookTime: z.string().nullable().optional(),
  pageNumber: z.number().int().nullable().optional(),
});

// --- Types ---

export type CookbookMetadata = z.infer<typeof CookbookMetadataSchema>;
export type RecipeBoundary = z.infer<typeof RecipeBoundarySchema>;
export type ExtractedRecipe = z.infer<typeof ExtractedRecipeSchema>;
export type PageTextMap = Map<number, string>;
export type ChunkType = (typeof CHUNK_TYPES)[number];

// --- Utilities ---

/**
 * Strip markdown code fences that Claude sometimes wraps around JSON responses.
 */
export function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}
