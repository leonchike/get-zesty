import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "./recipe-api.js";

const mockConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "test-api-key",
  userId: "user-123",
};

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("searchRecipes", () => {
  it("sends POST to /api/mcp/recipes/search with correct payload", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ recipes: [], nextPage: null, totalCount: 0 })
    );

    await searchRecipes(mockConfig, { search: "pasta" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/mcp/recipes/search");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.user_id).toBe("user-123");
    expect(body.filters.search).toBe("pasta");
    expect(body.filters.isPersonal).toBe(true);
  });

  it("caps limit at 64", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ recipes: [], nextPage: null, totalCount: 0 })
    );

    await searchRecipes(mockConfig, { limit: 100 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.filters.limit).toBe(64);
  });

  it("only includes cuisineTypes when provided", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ recipes: [], nextPage: null, totalCount: 0 })
    );

    await searchRecipes(mockConfig, {});

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.filters.cuisineTypes).toBeUndefined();
  });

  it("includes cuisineTypes when they have values", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ recipes: [], nextPage: null, totalCount: 0 })
    );

    await searchRecipes(mockConfig, { cuisineTypes: ["Italian", "Mexican"] });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.filters.cuisineTypes).toEqual(["Italian", "Mexican"]);
  });

  it("sets correct headers", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ recipes: [], nextPage: null, totalCount: 0 })
    );

    await searchRecipes(mockConfig, {});

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["X-API-Key"]).toBe("test-api-key");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

    await expect(searchRecipes(mockConfig, {})).rejects.toThrow("HTTP 401");
  });
});

describe("getRecipe", () => {
  it("sends GET to /api/mcp/recipes with query params", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ id: "recipe-1", title: "Pasta" })
    );

    await getRecipe(mockConfig, "recipe-1");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/mcp/recipes?id=recipe-1");
    expect(url).toContain("user_id=user-123");
    expect(options.method).toBe("GET");
  });

  it("encodes special characters in recipe ID", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "a&b", title: "Test" }));

    await getRecipe(mockConfig, "a&b");

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("id=a%26b");
  });

  it("throws on 404", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Recipe not found" }, 404)
    );

    await expect(getRecipe(mockConfig, "nonexistent")).rejects.toThrow("HTTP 404");
  });
});

describe("createRecipe", () => {
  it("sends POST with recipe data and source USER", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "new-recipe" }));

    const result = await createRecipe(mockConfig, {
      title: "Carbonara",
      ingredients: "Pasta, eggs, pecorino",
      instructions: "1. Boil pasta\n2. Mix eggs",
      cuisineType: "Italian",
    });

    expect(result.id).toBe("new-recipe");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.recipe.title).toBe("Carbonara");
    expect(body.recipe.source).toBe("USER");
    expect(body.recipe.difficulty).toBe("EASY");
    expect(body.parseWithAI).toBe(true);
  });

  it("respects parseWithAI=false", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "new-recipe" }));

    await createRecipe(
      mockConfig,
      { title: "Test", ingredients: "x", instructions: "y" },
      false
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.parseWithAI).toBe(false);
  });

  it("uses 60s timeout", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "x" }));

    await createRecipe(mockConfig, {
      title: "T",
      ingredients: "I",
      instructions: "I",
    });

    const signal = mockFetch.mock.calls[0][1].signal;
    expect(signal).toBeDefined();
  });
});

describe("updateRecipe", () => {
  it("sends PUT with partial updates", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "recipe-1" }));

    await updateRecipe(mockConfig, "recipe-1", { title: "Updated Title" });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/mcp/recipes");
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body);
    expect(body.id).toBe("recipe-1");
    expect(body.recipe.title).toBe("Updated Title");
    expect(body.parseWithAI).toBe(true);
  });
});

describe("deleteRecipe", () => {
  it("sends DELETE with recipe ID", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "recipe-1" }));

    const result = await deleteRecipe(mockConfig, "recipe-1");

    expect(result.id).toBe("recipe-1");

    const options = mockFetch.mock.calls[0][1];
    expect(options.method).toBe("DELETE");

    const body = JSON.parse(options.body);
    expect(body.id).toBe("recipe-1");
    expect(body.user_id).toBe("user-123");
  });
});
