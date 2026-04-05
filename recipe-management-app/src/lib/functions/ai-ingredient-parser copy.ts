// parse-recipe-components-ai-only-ingredients.ts

import OpenAI from "openai";
import { z } from "zod";
import { parseRecipeComponents } from "./ingredient-instruction-parser";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";

// If you have a special “ingredient only” schema, define it here:
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * parseRecipeComponentsAiOnlyIngredients
 *  - Attempt 3 times to parse the ingredients text with AI.
 *  - If all fail, fallback to old parser for ingredients.
 */
export async function parseRecipeComponentsAiOnlyIngredients(
  ingredients: string
): Promise<{ parsedIngredients?: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const aiParsed = await callOpenAiParserForIngredients(ingredients);
      if (aiParsed) {
        return aiParsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`AI ingredient parse attempt #${attempt} failed.`, err);
    }
  }

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

/**
 * callOpenAiParserForIngredients
 * Single attempt to parse only the ingredients with AI.
 * Throw on error to trigger a retry in the parent function.
 */
async function callOpenAiParserForIngredients(
  ingredients: string
): Promise<{ parsedIngredients?: string }> {
  // We'll pass only the "ingredients" text to the system instruction
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or whichever model
    messages: [
      {
        role: "system",
        content: `You are an AI that parses raw ingredient lines into structured JSON. 
Here is the shape (Zod schema) you must return:

${AiIngredientSchema.toString()}

Rules:
- Output valid JSON only, with no extra keys or commentary.
- "parsedIngredients" is an array of objects. Each object has:
  {
    "original_text": string,
    "quantity": number or null,
    "unit": string or null,
    "ingredient": string or null,
    "extra": string or null
  }
- If a field is unknown, use null.
`,
      },
      {
        role: "user",
        content: `Ingredients:\n${ingredients}`,
      },
    ],
    temperature: 0,
  });

  const content = response.choices[0].message?.content ?? "";
  // Try to parse with Zod
  const parsedJson = JSON.parse(content);
  const parsed = AiIngredientSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error(`Zod validation error: ${parsed.error}`);
  }

  const { parsedIngredients } = parsed.data;
  return {
    parsedIngredients: JSON.stringify(parsedIngredients),
  };
}
