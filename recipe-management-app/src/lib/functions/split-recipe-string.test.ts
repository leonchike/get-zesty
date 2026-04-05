/// <reference types="jest" />

import { splitRecipeString } from "./split-recipe-string";

describe("splitRecipeString", () => {
  it("should split a string with single newlines", () => {
    const input = `4 pounds chicken wings
2 Tablespoons baking powder
3/4 teaspoon salt`;
    const result = splitRecipeString(input);
    expect(result).toEqual([
      "4 pounds chicken wings",
      "2 Tablespoons baking powder",
      "3/4 teaspoon salt",
    ]);
  });

  it("should handle multiple newlines between items", () => {
    const input = `4 pounds chicken wings


2 Tablespoons baking powder
3/4 teaspoon salt`;
    const result = splitRecipeString(input);
    expect(result).toEqual([
      "4 pounds chicken wings",
      "2 Tablespoons baking powder",
      "3/4 teaspoon salt",
    ]);
  });

  it("should trim whitespace from each item", () => {
    const input = `  4 pounds chicken wings  
  2 Tablespoons baking powder  
  3/4 teaspoon salt  `;
    const result = splitRecipeString(input);
    expect(result).toEqual([
      "4 pounds chicken wings",
      "2 Tablespoons baking powder",
      "3/4 teaspoon salt",
    ]);
  });

  it("should handle empty lines at the beginning and end", () => {
    const input = `

4 pounds chicken wings
2 Tablespoons baking powder
3/4 teaspoon salt

`;
    const result = splitRecipeString(input);
    expect(result).toEqual([
      "4 pounds chicken wings",
      "2 Tablespoons baking powder",
      "3/4 teaspoon salt",
    ]);
  });

  it("should handle a mix of different newline characters", () => {
    const input =
      "4 pounds chicken wings\r\n2 Tablespoons baking powder\n3/4 teaspoon salt";
    const result = splitRecipeString(input);
    expect(result).toEqual([
      "4 pounds chicken wings",
      "2 Tablespoons baking powder",
      "3/4 teaspoon salt",
    ]);
  });
});
