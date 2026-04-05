import anthropic, { extractJson } from "@/lib/anthropic-client";
import { z } from "zod";

// Reuse the same schema as in your gen recipe code
const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
  restTime: z.number(),
  servings: z.number(),
  notes: z.string(),
  equipment: z.array(z.string()),
  imageUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
});

/**
 * This function uses Claude to clean up scraped recipe data.
 * It takes a raw scraped recipe object, prompts the model to transform it
 * into a clean, well-structured recipe following the `recipeSchema`.
 */
export async function cleanRecipeWithAI(rawRecipe: {
  title: string;
  description?: string | null;
  ingredients?: string | null;
  instructions?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  restTime?: number | null;
  servings?: number | null;
  notes?: string | null;
  utensils?: string | null;
}) {
  const SYSTEM_PROMPT = `
You are a helpful assistant that cleans and standardizes scraped recipe data.
You will receive a raw scraped recipe object with potentially messy text, incomplete fields, or junk.
Your job is to return a clean, high-quality recipe in JSON format that matches the given schema.

The JSON schema is:
{
  "title": string,
  "description": string,
  "ingredients": string[] (list of ingredient strings),
  "instructions": string[] (list of step strings),
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "restTime": number (minutes),
  "servings": number,
  "notes": string,
  "equipment": string[] (list of equipment strings),
  "imageUrl": string (optional),
  "sourceUrl": string (optional)
}

Important:
- Remove any extraneous disclaimers, advertisements, or non-recipe text.
- Do not assume all information is in the right field in the user input.
- Make sure to output only clean and relevant content.
- Ingredients should be in a standardized list, removing any non-ingredient text or special formatting. Ideal ingredient format is "1 cup of flour" or "1/2 cup of sugar".
- Instructions should be broken into clear steps.
- If the scraped data is incomplete, infer or leave blank fields where appropriate.
- Always return a well-structured JSON object that conforms strictly to the schema.
- Return valid JSON only. Do not wrap the output in markdown code fences.
`;

  const userMessageContent = `
Raw scraped recipe data:
Title: ${rawRecipe.title ?? ""}
Description: ${rawRecipe.description ?? ""}
Ingredients: ${rawRecipe.ingredients ?? ""}
Instructions: ${rawRecipe.instructions ?? ""}
Prep Time (min): ${rawRecipe.prepTime ?? ""}
Cook Time (min): ${rawRecipe.cookTime ?? ""}
Rest Time (min): ${rawRecipe.restTime ?? ""}
Servings: ${rawRecipe.servings ?? ""}
Notes: ${rawRecipe.notes ?? ""}
Utensils/Equipment: ${rawRecipe.utensils ?? ""}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessageContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = recipeSchema.safeParse(JSON.parse(extractJson(text)));

  if (!parsed.success) {
    throw new Error(`Recipe validation error: ${parsed.error}`);
  }

  return parsed.data;
}
