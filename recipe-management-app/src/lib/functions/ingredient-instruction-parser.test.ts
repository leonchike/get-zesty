/// <reference types="jest" />

import {
  parseRecipeInstructions,
  parseRecipeIngredients,
} from "./ingredient-instruction-parser";

describe("parseRecipeIngredients", () => {
  it("should correctly parse a simple ingredient", () => {
    const ingredients = ["2 cups flour"];
    const result = parseRecipeIngredients(ingredients);
    expect(result).toEqual([
      {
        original_text: "2 cups flour",
        quantity: 2,
        unit: "cup",
        ingredient: "flour",
        extra: "",
      },
    ]);
  });

  it("should handle fractions and extra information", () => {
    const ingredients = ["1 1/2 cups sugar, granulated"];
    const result = parseRecipeIngredients(ingredients);
    expect(result).toEqual([
      {
        original_text: "1 1/2 cups sugar, granulated",
        quantity: 1.5,
        unit: "cup",
        ingredient: "sugar",
        extra: "granulated",
      },
    ]);
  });

  it("should parse multiple ingredients", () => {
    const ingredients = ["2 eggs", "1 tsp vanilla extract"];
    const result = parseRecipeIngredients(ingredients);
    expect(result).toEqual([
      {
        original_text: "2 eggs",
        quantity: 2,
        unit: "",
        ingredient: "eggs",
        extra: "",
      },
      {
        original_text: "1 tsp vanilla extract",
        quantity: 1,
        unit: "teaspoon",
        ingredient: "vanilla extract",
        extra: "",
      },
    ]);
  });
});

describe("parseRecipeInstructions", () => {
  it("should parse an instruction with time", () => {
    const instructions = ["Bake for 30 minutes"];
    const result = parseRecipeInstructions(instructions);
    expect(result).toEqual([
      {
        original_text: "Bake for 30 minutes",
        instruction: "Bake for 30 minutes",
        time: {
          value: 30,
          unit: "minutes",
        },
      },
    ]);
  });

  it("should parse an instruction with temperature", () => {
    const instructions = ["Preheat oven to 350F"];
    const result = parseRecipeInstructions(instructions);
    expect(result).toEqual([
      {
        original_text: "Preheat oven to 350F",
        instruction: "Preheat oven to 350F",
        temperature: {
          value: 350,
          unit: "fahrenheit",
        },
      },
    ]);
  });

  it("should handle instructions without time or temperature", () => {
    const instructions = ["Mix all ingredients in a bowl"];
    const result = parseRecipeInstructions(instructions);
    expect(result).toEqual([
      {
        original_text: "Mix all ingredients in a bowl",
        instruction: "Mix all ingredients in a bowl",
      },
    ]);
  });

  it("should parse multiple instructions", () => {
    const instructions = [
      "Preheat oven to 375F",
      "Mix ingredients for 5 minutes",
      "Pour into pan",
    ];
    const result = parseRecipeInstructions(instructions);
    expect(result).toEqual([
      {
        original_text: "Preheat oven to 375F",
        instruction: "Preheat oven to 375F",
        temperature: {
          value: 375,
          unit: "fahrenheit",
        },
      },
      {
        original_text: "Mix ingredients for 5 minutes",
        instruction: "Mix ingredients for 5 minutes",
        time: {
          value: 5,
          unit: "minutes",
        },
      },
      {
        original_text: "Pour into pan",
        instruction: "Pour into pan",
      },
    ]);
  });
});
