import {
  parseIngredient,
  parseInstruction,
} from "@jlucaspains/sharp-recipe-parser";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import { ParsedIngredient } from "@/lib/types/types";

export interface ParsedInstruction {
  original_text: string;
  instruction: string;
  time?: {
    value: number;
    unit: string;
  };
  temperature?: {
    value: number;
    unit: string;
  };
}

export function parseRecipeIngredients(
  ingredients: string[]
): ParsedIngredient[] {
  return ingredients.map((ingredient) => {
    const parsed = parseIngredient(ingredient, "en", {
      includeExtra: true,
      includeAlternativeUnits: true,
    });
    return parsed
      ? {
          original_text: ingredient,
          quantity: parsed.quantity,
          unit: parsed.unit,
          ingredient: parsed.ingredient,
          extra: parsed.extra,
        }
      : {
          original_text: ingredient,
          quantity: 0,
          unit: "",
          ingredient: "",
          extra: "",
        };
  });
}

export function parseRecipeInstructions(
  instructions: string[]
): ParsedInstruction[] {
  return instructions.map((instruction) => {
    const parsed = parseInstruction(instruction, "en");
    const result: ParsedInstruction = {
      original_text: instruction,
      instruction,
    };

    if (parsed?.totalTimeInSeconds) {
      result.time = {
        value: parsed.totalTimeInSeconds / 60, // Convert to minutes
        unit: "minutes",
      };
    }

    if (parsed?.temperature) {
      result.temperature = {
        value: parsed.temperature,
        unit: parsed.temperatureUnit,
      };
    }

    return result;
  });
}

// Helper function to parse ingredients and instructions
export async function parseRecipeComponents(
  ingredients?: string,
  instructions?: string
) {
  let parsedIngredients = null;
  let parsedInstructions = null;

  try {
    if (ingredients) {
      const ingredientsArray = splitRecipeString(ingredients);
      parsedIngredients = parseRecipeIngredients(ingredientsArray);
    }
    if (instructions) {
      const instructionsArray = splitRecipeString(instructions);
      parsedInstructions = parseRecipeInstructions(instructionsArray);
    }
  } catch (error) {
    console.error("Error parsing recipe components:", error);
  }

  return {
    parsedIngredients: parsedIngredients
      ? JSON.stringify(parsedIngredients)
      : undefined,
    parsedInstructions: parsedInstructions
      ? JSON.stringify(parsedInstructions)
      : undefined,
  };
}
