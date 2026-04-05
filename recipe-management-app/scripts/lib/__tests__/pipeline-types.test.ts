/**
 * @jest-environment node
 */

import {
  CookbookMetadataSchema,
  RecipeBoundarySchema,
  RecipeBoundaryListSchema,
  ExtractedRecipeSchema,
  extractJson,
} from "../pipeline-types";

// --- extractJson ---

describe("extractJson", () => {
  it("returns plain JSON unchanged", () => {
    const raw = '{"title":"Test"}';
    expect(extractJson(raw)).toBe(raw);
  });

  it("strips ```json fences", () => {
    const raw = '```json\n{"title":"Test"}\n```';
    expect(extractJson(raw)).toBe('{"title":"Test"}');
  });

  it("strips ``` fences without language tag", () => {
    const raw = '```\n{"title":"Test"}\n```';
    expect(extractJson(raw)).toBe('{"title":"Test"}');
  });

  it("handles extra whitespace inside fences", () => {
    const raw = '```json\n  {"title": "Test"}  \n```';
    expect(extractJson(raw)).toBe('{"title": "Test"}');
  });

  it("handles text before and after fences", () => {
    const raw = 'Here is the JSON:\n```json\n{"title":"Test"}\n```\nDone.';
    expect(extractJson(raw)).toBe('{"title":"Test"}');
  });

  it("trims whitespace-only input", () => {
    expect(extractJson("  \n  ")).toBe("");
  });
});

// --- CookbookMetadataSchema ---

describe("CookbookMetadataSchema", () => {
  it("accepts valid metadata with all fields", () => {
    const data = {
      title: "The Joy of Cooking",
      author: "Irma Rombauer",
      publisher: "Scribner",
      year: 2019,
      isbn: "978-1501169717",
      description: "A classic American cookbook",
    };
    expect(CookbookMetadataSchema.safeParse(data).success).toBe(true);
  });

  it("accepts metadata with null optional fields", () => {
    const data = {
      title: "My Cookbook",
      author: null,
      publisher: null,
      year: null,
      isbn: null,
      description: null,
    };
    expect(CookbookMetadataSchema.safeParse(data).success).toBe(true);
  });

  it("rejects missing title", () => {
    const data = {
      author: "Test",
      publisher: null,
      year: null,
      isbn: null,
      description: null,
    };
    expect(CookbookMetadataSchema.safeParse(data).success).toBe(false);
  });

  it("rejects non-integer year", () => {
    const data = {
      title: "Test",
      author: null,
      publisher: null,
      year: 2019.5,
      isbn: null,
      description: null,
    };
    expect(CookbookMetadataSchema.safeParse(data).success).toBe(false);
  });
});

// --- RecipeBoundarySchema ---

describe("RecipeBoundarySchema", () => {
  it("accepts valid boundary", () => {
    const data = { title: "Pasta Carbonara", startPage: 42, endPage: 43 };
    expect(RecipeBoundarySchema.safeParse(data).success).toBe(true);
  });

  it("accepts single-page recipe", () => {
    const data = { title: "Quick Salad", startPage: 10, endPage: 10 };
    expect(RecipeBoundarySchema.safeParse(data).success).toBe(true);
  });

  it("rejects startPage of 0", () => {
    const data = { title: "Test", startPage: 0, endPage: 5 };
    expect(RecipeBoundarySchema.safeParse(data).success).toBe(false);
  });

  it("rejects negative endPage", () => {
    const data = { title: "Test", startPage: 1, endPage: -1 };
    expect(RecipeBoundarySchema.safeParse(data).success).toBe(false);
  });
});

// --- RecipeBoundaryListSchema ---

describe("RecipeBoundaryListSchema", () => {
  it("accepts a list of boundaries", () => {
    const data = {
      recipes: [
        { title: "Recipe A", startPage: 1, endPage: 2 },
        { title: "Recipe B", startPage: 5, endPage: 7 },
      ],
    };
    expect(RecipeBoundaryListSchema.safeParse(data).success).toBe(true);
  });

  it("accepts empty recipes list", () => {
    const data = { recipes: [] };
    expect(RecipeBoundaryListSchema.safeParse(data).success).toBe(true);
  });

  it("rejects missing recipes key", () => {
    const data = { items: [] };
    expect(RecipeBoundaryListSchema.safeParse(data).success).toBe(false);
  });
});

// --- ExtractedRecipeSchema ---

describe("ExtractedRecipeSchema", () => {
  it("accepts a full recipe", () => {
    const data = {
      title: "Spaghetti Bolognese",
      description: "A classic Italian pasta dish",
      ingredients: "500g spaghetti\n400g ground beef\n1 onion",
      instructions: "1. Cook pasta\n2. Brown meat\n3. Combine",
      cuisineType: "Italian",
      mealType: "dinner",
      servings: "4 servings",
      prepTime: "15 minutes",
      cookTime: "30 minutes",
      pageNumber: 42,
    };
    const result = ExtractedRecipeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts recipe with null optional fields", () => {
    const data = {
      title: "Simple Salad",
      ingredients: "Lettuce\nTomato",
      instructions: "1. Mix ingredients",
    };
    const result = ExtractedRecipeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing ingredients", () => {
    const data = {
      title: "Bad Recipe",
      instructions: "1. Do something",
    };
    expect(ExtractedRecipeSchema.safeParse(data).success).toBe(false);
  });

  it("rejects missing instructions", () => {
    const data = {
      title: "Bad Recipe",
      ingredients: "Some stuff",
    };
    expect(ExtractedRecipeSchema.safeParse(data).success).toBe(false);
  });
});
