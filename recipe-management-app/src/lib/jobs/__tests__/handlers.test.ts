/**
 * @jest-environment node
 */

/// <reference types="jest" />

// Mock the prisma client and the embeddings util so the handler is pure.
jest.mock("@/lib/prisma-client", () => ({
  __esModule: true,
  default: {
    recipe: { findUnique: jest.fn() },
    $executeRawUnsafe: jest.fn(),
  },
}));

jest.mock("@/lib/embeddings", () => ({
  generateEmbedding: jest.fn(),
}));

import prisma from "@/lib/prisma-client";
import { generateEmbedding } from "@/lib/embeddings";
import { runJob, handlers } from "../handlers";

const mockedFindUnique = prisma.recipe.findUnique as jest.MockedFunction<
  typeof prisma.recipe.findUnique
>;
const mockedExec = prisma.$executeRawUnsafe as jest.MockedFunction<
  typeof prisma.$executeRawUnsafe
>;
const mockedEmbed = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>;

beforeEach(() => {
  mockedFindUnique.mockReset();
  mockedExec.mockReset();
  mockedEmbed.mockReset();
});

describe("jobs/handlers — embed_recipe", () => {
  it("embeds the concatenated title/description/ingredients and writes the vector", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "r1",
      title: "Fish Tacos",
      description: "weeknight dinner",
      ingredients: "mahi mahi, cabbage, lime",
    } as any);
    mockedEmbed.mockResolvedValue([0.1, 0.2, 0.3]);

    await handlers.embed_recipe({ recipeId: "r1" });

    expect(mockedEmbed).toHaveBeenCalledWith(
      "Fish Tacos\nweeknight dinner\nmahi mahi, cabbage, lime"
    );
    expect(mockedExec).toHaveBeenCalledTimes(1);
    const [sql, vectorLiteral, recipeId] = mockedExec.mock.calls[0];
    expect(sql).toContain("UPDATE \"Recipe\"");
    expect(sql).toContain("embedding = $1::vector");
    expect(vectorLiteral).toBe("[0.1,0.2,0.3]");
    expect(recipeId).toBe("r1");
  });

  it("no-ops when the recipe was deleted", async () => {
    mockedFindUnique.mockResolvedValue(null);
    await handlers.embed_recipe({ recipeId: "gone" });
    expect(mockedEmbed).not.toHaveBeenCalled();
    expect(mockedExec).not.toHaveBeenCalled();
  });

  it("handles recipes with null description/ingredients", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "r2",
      title: "Just a title",
      description: null,
      ingredients: null,
    } as any);
    mockedEmbed.mockResolvedValue([0.5]);

    await handlers.embed_recipe({ recipeId: "r2" });

    // Should not include "null" or extra newlines
    expect(mockedEmbed).toHaveBeenCalledWith("Just a title");
  });
});

describe("jobs/handlers — runJob", () => {
  it("throws on unknown job type", async () => {
    await expect(runJob("not_a_type" as any, {})).rejects.toThrow(/Unknown job type/);
  });
});
