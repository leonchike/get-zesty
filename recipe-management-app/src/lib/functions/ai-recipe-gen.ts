import anthropic, { extractJson } from "@/lib/anthropic-client";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

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
});

export async function generateAiRecipeCaller(prompt: string) {
  return Sentry.startSpan(
    {
      op: "function",
      name: "generateAiRecipeCaller",
    },
    async () => {
      try {
        const SYSTEM_PROMPT = `You are a helpful assistant that can generate the best recipes for the user. Please use the notes section to add context to aid the users in executing the recipe, add technical details, and add tips that may be helpful. If the user does not ask for a recipe, respond with a refusal message.

You must respond with valid JSON only matching this schema:
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
  "equipment": string[] (list of equipment strings)
}

Do not wrap the output in markdown code fences.`;

        const completion = await Sentry.startSpan(
          { op: "http.client", name: "Anthropic API Call" },
          async () => {
            return anthropic.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              messages: [{ role: "user", content: prompt }],
            });
          }
        );

        const text =
          completion.content[0].type === "text"
            ? completion.content[0].text
            : "";
        const parsed = recipeSchema.safeParse(
          JSON.parse(extractJson(text))
        );

        if (!parsed.success) {
          throw new Error(`Recipe validation error: ${parsed.error}`);
        }

        return parsed.data;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}
