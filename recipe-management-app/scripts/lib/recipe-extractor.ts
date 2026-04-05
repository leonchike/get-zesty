/**
 * Stage 5: Extract full recipe details for each detected boundary using Claude Sonnet.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  RecipeBoundary,
  ExtractedRecipe,
  ExtractedRecipeSchema,
  PageTextMap,
  CLAUDE_SONNET,
  MAX_CONCURRENT_RECIPES,
  extractJson,
} from "./pipeline-types";
import { pMap } from "./rate-limiter";

/**
 * Gather page text for a recipe boundary.
 */
export function getRecipeText(
  pageTexts: PageTextMap,
  boundary: RecipeBoundary
): string {
  const parts: string[] = [];
  for (let p = boundary.startPage; p <= boundary.endPage; p++) {
    const text = pageTexts.get(p);
    if (text) {
      parts.push(`--- Page ${p} ---\n${text}`);
    }
  }
  return parts.join("\n\n");
}

/**
 * Extract a single recipe from its page text using Claude Sonnet.
 */
export async function extractSingleRecipe(
  anthropic: Anthropic,
  boundary: RecipeBoundary,
  recipeText: string
): Promise<ExtractedRecipe> {
  const response = await anthropic.messages.create({
    model: CLAUDE_SONNET,
    max_tokens: 4096,
    temperature: 0,
    system: `You are an assistant that extracts structured recipe data from cookbook text.

Given the text of a specific recipe from a cookbook, extract the following as JSON:

{
  "title": "Recipe Name",
  "description": "Brief description of the dish, or null",
  "ingredients": "Full ingredient list, one per line",
  "instructions": "Step-by-step instructions, one step per line",
  "cuisineType": "e.g. Italian, Mexican, Thai, or null",
  "mealType": "e.g. breakfast, lunch, dinner, dessert, snack, or null",
  "servings": "e.g. 4 servings, or null",
  "prepTime": "e.g. 15 minutes, or null",
  "cookTime": "e.g. 30 minutes, or null",
  "pageNumber": ${boundary.startPage}
}

Rules:
- ingredients: List each ingredient on its own line including quantity and unit. Preserve original text.
- instructions: List each step on its own line. Number the steps.
- If a field cannot be determined, use null.
- Return valid JSON only. No markdown fences, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Extract the recipe "${boundary.title}" from this cookbook text:\n\n${recipeText}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(extractJson(text));

  // Ensure pageNumber is set
  parsed.pageNumber = parsed.pageNumber ?? boundary.startPage;

  const validated = ExtractedRecipeSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Recipe extraction validation failed for "${boundary.title}": ${validated.error.message}`
    );
  }

  return validated.data;
}

/**
 * Extract full details for all detected recipe boundaries.
 * Retries each recipe up to 2 times on failure.
 */
export async function extractRecipes(
  anthropic: Anthropic,
  pageTexts: PageTextMap,
  boundaries: RecipeBoundary[]
): Promise<ExtractedRecipe[]> {
  console.log(`[Extractor] Extracting ${boundaries.length} recipes...`);

  const recipes = await pMap(
    boundaries,
    async (boundary, index) => {
      const recipeText = getRecipeText(pageTexts, boundary);
      let lastError: unknown;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(
            `[Extractor] (${index + 1}/${boundaries.length}) "${boundary.title}" (pages ${boundary.startPage}-${boundary.endPage})${attempt > 1 ? ` attempt ${attempt}` : ""}...`
          );
          return await extractSingleRecipe(anthropic, boundary, recipeText);
        } catch (err) {
          lastError = err;
          console.warn(
            `[Extractor] Attempt ${attempt} failed for "${boundary.title}":`,
            err instanceof Error ? err.message : err
          );
        }
      }

      console.error(
        `[Extractor] Skipping "${boundary.title}" after 3 failed attempts: ${lastError instanceof Error ? lastError.message : lastError}`
      );
      return null;
    },
    MAX_CONCURRENT_RECIPES
  );

  const extracted = recipes.filter((r): r is ExtractedRecipe => r !== null);
  const skipped = recipes.length - extracted.length;
  if (skipped > 0) {
    console.warn(`[Extractor] Skipped ${skipped} recipe(s) due to extraction failures.`);
  }
  console.log(`[Extractor] Successfully extracted ${extracted.length} recipes.`);
  return extracted;
}
