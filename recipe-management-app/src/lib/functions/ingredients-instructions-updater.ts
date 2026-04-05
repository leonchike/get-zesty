import { Recipe } from "@prisma/client";
import { parseRecipeComponentsMixed } from "@/lib/functions/ingredients-instructions-parser";

/**
 * detectRecipeFieldChanges
 *
 * Checks if ingredients or instructions have changed compared to existingRecipe.
 * If changed, parses them (via parseRecipeComponentsMixed), otherwise does nothing.
 *
 * Returns an object containing only the fields that should be updated (including
 * parsedIngredients / parsedInstructions if they were re-parsed).
 *
 * @param existingRecipe Full existing recipe from DB
 * @param incomingData   The partial updated fields from the user
 * @param parseWithAI    Whether to use AI for parsing
 * @returns A partial object with fields to update
 */
export async function detectRecipeFieldChanges(
  existingRecipe: Recipe,
  incomingData: Partial<Recipe>,
  parseWithAI: boolean
): Promise<Partial<Recipe>> {
  // Prepare the result that we'll merge into updateData
  const updatedFields: Partial<Recipe> = {};

  // 1) Check if ingredients have changed
  const ingredientsChanged =
    typeof incomingData.ingredients !== "undefined" &&
    incomingData.ingredients !== existingRecipe.ingredients;

  // 2) Check if instructions have changed
  const instructionsChanged =
    typeof incomingData.instructions !== "undefined" &&
    incomingData.instructions !== existingRecipe.instructions;

  // If neither ingredients nor instructions changed, nothing to parse
  if (!ingredientsChanged && !instructionsChanged) {
    return updatedFields; // returns an empty object
  }

  // Otherwise, figure out which final text to parse
  const finalIngredients = ingredientsChanged
    ? incomingData.ingredients!
    : existingRecipe.ingredients ?? "";

  const finalInstructions = instructionsChanged
    ? incomingData.instructions!
    : existingRecipe.instructions ?? "";

  // Run the parser (AI or old, depending on parseWithAI)
  const { parsedIngredients, parsedInstructions } =
    await parseRecipeComponentsMixed(
      finalIngredients,
      finalInstructions,
      parseWithAI
    );

  // If ingredients changed, update them
  if (ingredientsChanged) {
    updatedFields.ingredients = incomingData.ingredients;
    updatedFields.parsedIngredients = parsedIngredients;
  }

  // If instructions changed, update them
  if (instructionsChanged) {
    updatedFields.instructions = incomingData.instructions;
    updatedFields.parsedInstructions = parsedInstructions;
  }

  return updatedFields;
}
