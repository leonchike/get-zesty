import anthropic, { extractJson } from "@/lib/anthropic-client";
import { z } from "zod";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import { parseRecipeComponents } from "./ingredient-instruction-parser";

export async function parseRecipeComponentsAiOnlyIngredients(
  ingredients: string
): Promise<{ parsedIngredients?: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // NEW: Use the batch approach
      const aiParsed = await callAiParserForAllIngredientsInBatches(
        ingredients
      );
      // If success:
      return aiParsed; // { parsedIngredients: "...json..." }
    } catch (err) {
      lastError = err;
      console.warn(`AI ingredient parse attempt #${attempt} failed.`, err);
    }
  }

  // If we get here, all 3 attempts failed => fallback
  console.error(
    "AI parser for ingredients failed after 3 attempts.",
    lastError
  );
  console.warn("Falling back to old parser for ingredients.");

  // fallback to old parser if AI fails
  const oldResult = await parseRecipeComponents(ingredients, undefined);
  return {
    parsedIngredients: oldResult.parsedIngredients,
  };
}

// Reuse your existing ingredient schema
const AiParsedIngredient = z.object({
  original_text: z.string(),
  quantity: z.number().min(0).nullable().optional(),
  unit: z.string().nullable().optional(),
  ingredient: z.string().nullable().optional(),
  extra: z.string().nullable().optional(),
});
const AiIngredientSchema = z.object({
  parsedIngredients: z.array(AiParsedIngredient),
});

/**
 * callAiParserForAllIngredientsInBatches
 *
 * 1. Splits the entire `ingredients` string by lines.
 * 2. Chunks them in groups of 4 lines each.
 * 3. Makes parallel requests to Claude for each chunk.
 * 4. Merges all chunk results into a single array of parsed ingredients.
 *
 * Throws on error (e.g. if any chunk fails).
 */
export async function callAiParserForAllIngredientsInBatches(
  ingredients: string
): Promise<{ parsedIngredients: string }> {
  // 1) Split into individual lines
  const lines = splitRecipeString(ingredients);
  if (lines.length === 0) {
    // no lines => just return empty
    return { parsedIngredients: JSON.stringify([]) };
  }

  // 2) Chunk lines by 4
  const chunkedLines: string[][] = chunkArray(lines, 4);

  // 3) Process each chunk in parallel
  //    Each chunk => single Claude call
  const chunkPromises = chunkedLines.map((chunk) => {
    // Join the chunk lines into a single string with newlines
    const chunkText = chunk.join("\n");
    return callAiParserForOneChunk(chunkText);
  });

  // If any chunk rejects, the entire Promise.all rejects
  const chunkResults = await Promise.all(chunkPromises);

  // 4) Merge all chunk arrays
  let allIngredients: any[] = [];
  for (const result of chunkResults) {
    // each result is { parsedIngredients: JSON-stringified array }
    const arr = JSON.parse(result.parsedIngredients);
    allIngredients = allIngredients.concat(arr);
  }

  // Return final merged JSON as string
  return {
    parsedIngredients: JSON.stringify(allIngredients),
  };
}

/**
 * callAiParserForOneChunk
 * Makes a single Claude call to parse up to 4 lines of ingredients in one request.
 * Throws on error or Zod validation issues.
 */
async function callAiParserForOneChunk(
  chunk: string
): Promise<{ parsedIngredients: string }> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    temperature: 0,
    system: `
You are an AI that parses ingredient lines into structured JSON.

Rules:
- Output valid JSON only, with no extra keys or commentary.
- Return an object with a "parsedIngredients" array.
- Each element in "parsedIngredients" has:
  {
    "original_text": string,
    "quantity": number or null,
    "unit": string or null,
    "ingredient": string or null,
    "extra": string or null
  }

- If a field is unknown, use null.

If a quantity is given as a range (e.g. "1-2 cups"), use the higher number
(2) for "quantity", and put "optional: 1-2 cups" in "extra" property.

Important rules:
1. Split combined ingredients like "salt and pepper" into separate entries,
   even if they share the same quantity. For example:
   "salt and pepper to taste" should become two entries:
   - { original_text: "salt and pepper to taste", ingredient: "salt", extra: "to taste" }
   - { original_text: "salt and pepper to taste", ingredient: "pepper", extra: "to taste" }

3. When splitting alternative ingredients (e.g. "X or Y"), each resulting entry
   MUST retain the original quantity and unit. For example:
   "3 oz gin or vodka" should become:
   - { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "gin", extra: "or vodka" }
   - { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "vodka", extra: "or gin" }

2. Capture ALL additional information that doesn't fit into quantity/unit/ingredient
   fields in the "extra" property. This includes:
   - Preparation instructions (e.g. "finely chopped", "at room temperature")
   - Quality descriptors (e.g. "fresh", "organic")
   - Size specifications (e.g. "large", "medium")
   - State descriptions (e.g. "frozen", "thawed")
   - Any other notes or details from the original text

Do not include any keys beyond the schema. Do not wrap the output in markdown.
Return valid JSON only.
`,
    messages: [
      {
        role: "user",
        content: `Ingredients:\n${chunk}`,
      },
    ],
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";
  // Try to parse with Zod
  const parsedJson = JSON.parse(extractJson(content));
  const parsed = AiIngredientSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error(`Zod validation error: ${parsed.error}`);
  }

  // Return the result, as { parsedIngredients: JSON-stringified array }
  return {
    parsedIngredients: JSON.stringify(parsedJson.parsedIngredients),
  };
}

/**
 * chunkArray
 * Helper to break an array into sub-arrays of a given size.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
