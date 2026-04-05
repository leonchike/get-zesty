// parse-recipe-components-mixed.ts

import { parseRecipeComponents } from "./ingredient-instruction-parser";
import { parseRecipeComponentsAiOnlyIngredients } from "./ai-ingredient-parser";

/**
 * parseRecipeComponentsMixed
 *  - ALWAYS uses the old parser for instructions
 *  - Uses AI for ingredients if parseWithAI=true (retry up to 3 times, fallback to old parser on fail)
 *  - If parseWithAI=false, uses old parser for ingredients as well
 */
export async function parseRecipeComponentsMixed(
  ingredients?: string,
  instructions?: string,
  parseWithAI: boolean = true
): Promise<{
  parsedIngredients?: string;
  parsedInstructions?: string;
}> {
  // 1) Always parse instructions with old parser
  let parsedInstructions: string | undefined = undefined;
  if (instructions) {
    const instructionResult = await parseRecipeComponents(
      undefined,
      instructions
    );
    parsedInstructions = instructionResult.parsedInstructions;
  }

  // 2) Ingredients: AI or old parser
  if (!ingredients) {
    // No ingredients input
    return {
      parsedIngredients: undefined,
      parsedInstructions,
    };
  }

  if (!parseWithAI) {
    // if parseWithAI = false, parse with old parser
    const ingredientResult = await parseRecipeComponents(ingredients);
    return {
      parsedIngredients: ingredientResult.parsedIngredients,
      parsedInstructions,
    };
  }

  // else parseWithAI = true => attempt AI (with fallback)
  const aiResult = await parseRecipeComponentsAiOnlyIngredients(ingredients);
  // If it fails all 3 tries, that function will fallback automatically, so just return
  return {
    parsedIngredients: aiResult.parsedIngredients,
    parsedInstructions,
  };
}
