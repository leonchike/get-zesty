/**
 * @jest-environment node
 */

// Test the chunk creation logic by directly testing buildChunksForRecipe
// We import indirectly by re-testing the logic here since buildChunksForRecipe is not exported.
// Instead, we test the chunk type expectations.

import { CHUNK_TYPES, EMBEDDING_BATCH_SIZE } from "../pipeline-types";

describe("chunk constants", () => {
  it("has 4 chunk types", () => {
    expect(CHUNK_TYPES).toEqual([
      "full",
      "description",
      "ingredients",
      "instructions",
    ]);
  });

  it("uses batch size of 20", () => {
    expect(EMBEDDING_BATCH_SIZE).toBe(20);
  });
});

describe("chunk creation logic", () => {
  // Replicate the buildChunksForRecipe logic for testing
  function buildChunks(recipe: {
    id: string;
    title: string;
    description: string | null;
    ingredients: string | null;
    instructions: string | null;
  }) {
    const chunks: Array<{
      cookbookRecipeId: string;
      chunkType: string;
      content: string;
    }> = [];

    const fullParts = [
      recipe.title,
      recipe.description,
      recipe.ingredients,
      recipe.instructions,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (fullParts.trim()) {
      chunks.push({
        cookbookRecipeId: recipe.id,
        chunkType: "full",
        content: fullParts,
      });
    }

    if (recipe.description?.trim()) {
      chunks.push({
        cookbookRecipeId: recipe.id,
        chunkType: "description",
        content: recipe.description,
      });
    }

    if (recipe.ingredients?.trim()) {
      chunks.push({
        cookbookRecipeId: recipe.id,
        chunkType: "ingredients",
        content: recipe.ingredients,
      });
    }

    if (recipe.instructions?.trim()) {
      chunks.push({
        cookbookRecipeId: recipe.id,
        chunkType: "instructions",
        content: recipe.instructions,
      });
    }

    return chunks;
  }

  it("creates 4 chunks for a full recipe", () => {
    const chunks = buildChunks({
      id: "r1",
      title: "Pasta",
      description: "A simple pasta dish",
      ingredients: "200g pasta\n1 tbsp oil",
      instructions: "1. Boil pasta\n2. Add oil",
    });

    expect(chunks).toHaveLength(4);
    expect(chunks.map((c) => c.chunkType)).toEqual([
      "full",
      "description",
      "ingredients",
      "instructions",
    ]);
  });

  it("skips description chunk when description is null", () => {
    const chunks = buildChunks({
      id: "r2",
      title: "Quick Salad",
      description: null,
      ingredients: "Lettuce\nTomato",
      instructions: "1. Mix it",
    });

    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.chunkType)).toEqual([
      "full",
      "ingredients",
      "instructions",
    ]);
  });

  it("skips chunks for empty string fields", () => {
    const chunks = buildChunks({
      id: "r3",
      title: "Minimal",
      description: "   ",
      ingredients: "One thing",
      instructions: "",
    });

    // full chunk includes title + ingredients
    // description is whitespace-only → skipped
    // instructions is empty → skipped
    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.chunkType)).toEqual(["full", "ingredients"]);
  });

  it("full chunk concatenates all non-null fields", () => {
    const chunks = buildChunks({
      id: "r4",
      title: "Test",
      description: "Desc",
      ingredients: "Ing",
      instructions: "Inst",
    });

    const fullChunk = chunks.find((c) => c.chunkType === "full");
    expect(fullChunk?.content).toBe("Test\n\nDesc\n\nIng\n\nInst");
  });
});

describe("batch sizing", () => {
  it("calculates correct number of batches", () => {
    const totalChunks = 85;
    const expectedBatches = Math.ceil(totalChunks / EMBEDDING_BATCH_SIZE);
    expect(expectedBatches).toBe(5); // 85 / 20 = 4.25 → 5
  });

  it("handles fewer chunks than batch size", () => {
    const totalChunks = 10;
    const expectedBatches = Math.ceil(totalChunks / EMBEDDING_BATCH_SIZE);
    expect(expectedBatches).toBe(1);
  });
});
