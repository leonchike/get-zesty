/// <reference types="jest" />

import { parseGroceryItemInput } from "./parse-grocery-item-input";

describe("parseGroceryItemInput", () => {
  const testCases = [
    {
      input: "Cast Iron 14 in",
      expected: {
        name: "Cast Iron 14 in",
        quantity: undefined,
        quantityUnit: undefined,
      },
    },
    {
      input: "4-6 tomatoes",
      expected: {
        name: "tomatoes",
        quantity: 6,
        quantityUnit: undefined,
      },
    },
    {
      input: "6 fl oz milk",
      expected: {
        name: "milk",
        quantity: 6,
        quantityUnit: "fl oz",
      },
    },
    {
      input: "4 -6 tomatoes",
      expected: {
        name: "tomatoes",
        quantity: 6,
        quantityUnit: undefined,
      },
    },
    {
      input: "4 - 6 tomatoes",
      expected: {
        name: "tomatoes",
        quantity: 6,
        quantityUnit: undefined,
      },
    },
    {
      input: ".75 Cups Milk",
      expected: {
        name: "Milk",
        quantity: 0.75,
        quantityUnit: "cup",
      },
    },
    {
      input: "2% Plain Yogurt 28oz",
      expected: {
        name: "2% Plain Yogurt",
        quantity: 28,
        quantityUnit: "oz",
      },
    },
    {
      input: "2% Plain Yogurt",
      expected: {
        name: "2% Plain Yogurt",
        quantity: undefined,
        quantityUnit: undefined,
      },
    },
    {
      input: "2 lbs apples",
      expected: { name: "apples", quantity: 2, quantityUnit: "lb" },
    },
    {
      input: "apples 2 lbs",
      expected: { name: "apples", quantity: 2, quantityUnit: "lb" },
    },
    {
      input: "3 grapes",
      expected: { name: "grapes", quantity: 3, quantityUnit: undefined },
    },
    {
      input: "bananas 3",
      expected: { name: "bananas", quantity: 3, quantityUnit: undefined },
    },
    {
      input: "1 loaf bread",
      expected: { name: "loaf bread", quantity: 1, quantityUnit: undefined },
    },
    {
      input: "bread 1 loaf",
      expected: { name: "loaf bread", quantity: 1, quantityUnit: undefined },
    },
    {
      input: "500g flour",
      expected: { name: "flour", quantity: 500, quantityUnit: "g" },
    },
    {
      input: "flour 500g",
      expected: { name: "flour", quantity: 500, quantityUnit: "g" },
    },
    {
      input: "2.5 kg rice",
      expected: { name: "rice", quantity: 2.5, quantityUnit: "kg" },
    },
    {
      input: "rice 2.5 kg",
      expected: { name: "rice", quantity: 2.5, quantityUnit: "kg" },
    },
    {
      input: "1 dozen eggs",
      expected: { name: "eggs", quantity: 1, quantityUnit: "doz" },
    },
    {
      input: "eggs 1 dozen",
      expected: { name: "eggs", quantity: 1, quantityUnit: "doz" },
    },
    {
      input: "3 lbs 2 oz chicken",
      expected: { name: "chicken", quantity: 3, quantityUnit: "lb" },
    },
    {
      input: "chicken 3 lbs 2 oz",
      expected: { name: "chicken", quantity: 3, quantityUnit: "lb" },
    },
    {
      input: "1 head lettuce",
      expected: { name: "lettuce", quantity: 1, quantityUnit: "head" },
    },
    {
      input: "lettuce 1 head",
      expected: { name: "lettuce", quantity: 1, quantityUnit: "head" },
    },
    {
      input: "2 cans tomatoes",
      expected: { name: "tomatoes", quantity: 2, quantityUnit: "can" },
    },
    {
      input: "tomatoes 2 cans",
      expected: { name: "tomatoes", quantity: 2, quantityUnit: "can" },
    },
    {
      input: "1 bottle olive oil",
      expected: { name: "olive oil", quantity: 1, quantityUnit: "bottle" },
    },
    {
      input: "olive oil 1 bottle",
      expected: { name: "olive oil", quantity: 1, quantityUnit: "bottle" },
    },
    {
      input: "500ml milk",
      expected: { name: "milk", quantity: 500, quantityUnit: "ml" },
    },
    {
      input: "milk 500ml",
      expected: { name: "milk", quantity: 500, quantityUnit: "ml" },
    },
    {
      input: "1 pack cheese",
      expected: { name: "cheese", quantity: 1, quantityUnit: "pack" },
    },
    {
      input: "cheese 1 pack",
      expected: { name: "cheese", quantity: 1, quantityUnit: "pack" },
    },
    {
      input: "2 tbsp sugar",
      expected: { name: "sugar", quantity: 2, quantityUnit: "tbsp" },
    },
    {
      input: "sugar 2 tbsp",
      expected: { name: "sugar", quantity: 2, quantityUnit: "tbsp" },
    },
    {
      input: "1 tsp salt",
      expected: { name: "salt", quantity: 1, quantityUnit: "tsp" },
    },
    {
      input: "salt 1 tsp",
      expected: { name: "salt", quantity: 1, quantityUnit: "tsp" },
    },
    {
      input: "butter",
      expected: {
        name: "butter",
        quantity: undefined,
        quantityUnit: undefined,
      },
    },
    {
      input: "2",
      expected: { name: "item", quantity: 2, quantityUnit: undefined },
    },
    {
      input: "3.5",
      expected: { name: "item", quantity: 3.5, quantityUnit: undefined },
    },
    {
      input: "s Plum 12",
      expected: { name: "s Plum", quantity: 12, quantityUnit: undefined },
    },
    {
      input: "12 s Plum",
      expected: { name: "s Plum", quantity: 12, quantityUnit: undefined },
    },
    {
      input: "s Egg 2",
      expected: { name: "s Egg", quantity: 2, quantityUnit: undefined },
    },
    {
      input: "Toast 30",
      expected: { name: "Toast", quantity: 30, quantityUnit: undefined },
    },
    {
      input: "30 s Toast",
      expected: { name: "s Toast", quantity: 30, quantityUnit: undefined },
    },
    {
      input: "toamtoes 2 lb",
      expected: { name: "toamtoes", quantity: 2, quantityUnit: "lb" },
    },
    {
      input: "2 lb toamtoes",
      expected: { name: "toamtoes", quantity: 2, quantityUnit: "lb" },
    },
    {
      input: "Eggs",
      expected: { name: "Eggs", quantity: undefined, quantityUnit: undefined },
    },
    {
      input: "s apple 3",
      expected: { name: "s apple", quantity: 3, quantityUnit: undefined },
    },
    {
      input: "3 s Apple",
      expected: { name: "s Apple", quantity: 3, quantityUnit: undefined },
    },
    {
      input: "flow 3 cup",
      expected: { name: "flow", quantity: 3, quantityUnit: "cup" },
    },
    {
      input: "3 cup flow",
      expected: { name: "flow", quantity: 3, quantityUnit: "cup" },
    },
    // Additional test cases for varied user input
    {
      input: "1.5 liters water",
      expected: { name: "water", quantity: 1.5, quantityUnit: "liter" },
    },
    {
      input: "250 grams chocolate chips",
      expected: { name: "chocolate chips", quantity: 250, quantityUnit: "g" },
    },
    {
      input: "6-pack beer",
      expected: { name: "beer", quantity: 6, quantityUnit: "pack" },
    },
    {
      input: "half dozen bagels",
      expected: { name: "bagels", quantity: 0.5, quantityUnit: "doz" },
    },
    {
      input: "1 and 1/2 cups sugar",
      expected: { name: "sugar", quantity: 1.5, quantityUnit: "cup" },
    },
    {
      input: "2x4 oz salmon fillets",
      expected: { name: "salmon fillets", quantity: 8, quantityUnit: "oz" },
    },
    {
      input: "1kg potatoes",
      expected: { name: "potatoes", quantity: 1, quantityUnit: "kg" },
    },
    {
      input: "5 lbs. ground beef",
      expected: { name: "ground beef", quantity: 5, quantityUnit: "lb" },
    },
    {
      input: "1 pint blueberries",
      expected: { name: "blueberries", quantity: 1, quantityUnit: "pt" },
    },
    {
      input: "2 tablespoons olive oil",
      expected: { name: "olive oil", quantity: 2, quantityUnit: "tbsp" },
    },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should correctly parse "${input}"`, () => {
      const result = parseGroceryItemInput(input);
      expect(result).toEqual(expected);
    });
  });

  // Additional tests for edge cases and error handling
  it("should handle empty input", () => {
    expect(parseGroceryItemInput("")).toEqual({
      name: "item",
      quantity: undefined,
      quantityUnit: undefined,
    });
  });

  it("should handle input with only spaces", () => {
    expect(parseGroceryItemInput("   ")).toEqual({
      name: "item",
      quantity: undefined,
      quantityUnit: undefined,
    });
  });

  it("should handle input with special characters", () => {
    expect(parseGroceryItemInput("2 lbs apples!")).toEqual({
      name: "apples!",
      quantity: 2,
      quantityUnit: "lb",
    });
  });

  it("should handle very long input", () => {
    const longInput = "a".repeat(1000) + " 2 lbs";
    expect(parseGroceryItemInput(longInput)).toEqual({
      name: "a".repeat(1000),
      quantity: 2,
      quantityUnit: "lb",
    });
  });

  // Additional edge case tests
  it("should handle input with multiple spaces", () => {
    expect(parseGroceryItemInput("2   lbs   apples")).toEqual({
      name: "apples",
      quantity: 2,
      quantityUnit: "lb",
    });
  });

  it("should handle input with mixed case", () => {
    expect(parseGroceryItemInput("2 LBs ApPLes")).toEqual({
      name: "ApPLes",
      quantity: 2,
      quantityUnit: "lb",
    });
  });

  it("should handle input with decimal quantities", () => {
    expect(parseGroceryItemInput("1.5 kg sugar")).toEqual({
      name: "sugar",
      quantity: 1.5,
      quantityUnit: "kg",
    });
  });

  it("should handle input with fractions", () => {
    expect(parseGroceryItemInput("1/2 cup flour")).toEqual({
      name: "flour",
      quantity: 0.5,
      quantityUnit: "cup",
    });
  });

  it("should handle input with unusual units", () => {
    expect(parseGroceryItemInput("1 bunch bananas")).toEqual({
      name: "bananas",
      quantity: 1,
      quantityUnit: "bunch",
    });
  });
});
