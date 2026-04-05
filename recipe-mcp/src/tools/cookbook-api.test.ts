import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listCookbooks,
  searchCookbookRecipes,
  getCookbookRecipe,
  searchByIngredient,
} from "./cookbook-api.js";

const mockConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "test-key",
  userId: "user-123",
};

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

describe("listCookbooks", () => {
  it("sends GET with user_id query param", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await listCookbooks(mockConfig);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/cookbooks?user_id=user-123");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  it("returns array of cookbooks", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse([
        { id: "cb-1", title: "Italian Classics", author: "Marcella Hazan", recipeCount: 120 },
      ])
    );

    const result = await listCookbooks(mockConfig);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Italian Classics");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "Server Error" }, 500));
    await expect(listCookbooks(mockConfig)).rejects.toThrow("HTTP 500");
  });
});

describe("searchCookbookRecipes", () => {
  it("sends POST to /search with query and options", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [], totalCount: 0 }));

    await searchCookbookRecipes(mockConfig, "creamy pasta", {
      cuisineType: "Italian",
      limit: 5,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/mcp/cookbooks/search");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.query).toBe("creamy pasta");
    expect(body.cuisineType).toBe("Italian");
    expect(body.limit).toBe(5);
    expect(body.user_id).toBe("user-123");
  });

  it("defaults limit to 10 when not specified", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [], totalCount: 0 }));

    await searchCookbookRecipes(mockConfig, "chicken");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.limit).toBe(10);
  });
});

describe("getCookbookRecipe", () => {
  it("sends GET with recipe ID and user_id", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        id: "cr-1",
        title: "Bolognese",
        cookbookId: "cb-1",
        ingredients: "ground beef, tomatoes",
        instructions: "1. Brown meat",
      })
    );

    const result = await getCookbookRecipe(mockConfig, "cr-1");

    expect(result.title).toBe("Bolognese");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("id=cr-1");
    expect(url).toContain("user_id=user-123");
  });
});

describe("searchByIngredient", () => {
  it("sends POST with ingredients array", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [], totalCount: 0 }));

    await searchByIngredient(mockConfig, ["chicken", "lemon", "garlic"]);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.ingredients).toEqual(["chicken", "lemon", "garlic"]);
    expect(body.matchAll).toBe(false);
    expect(body.user_id).toBe("user-123");
  });

  it("passes matchAll=true when requested", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [], totalCount: 0 }));

    await searchByIngredient(mockConfig, ["flour", "butter"], true);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.matchAll).toBe(true);
  });

  it("sends to /ingredients endpoint", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [], totalCount: 0 }));

    await searchByIngredient(mockConfig, ["tomato"]);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/cookbooks/ingredients");
  });
});
