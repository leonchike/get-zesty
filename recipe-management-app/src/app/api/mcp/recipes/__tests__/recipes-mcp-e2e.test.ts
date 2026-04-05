/**
 * @jest-environment node
 */

/// <reference types="jest" />

/**
 * E2E tests for MCP Recipe API routes
 *
 * These tests make real HTTP calls to the running Next.js server.
 * Requires:
 *   - Next.js dev server running on localhost:3000
 *   - MCP_API_KEY set in .env
 *   - A valid user in the database
 *
 * Run: npm test -- src/app/api/mcp/recipes/__tests__/recipes-mcp-e2e.test.ts
 */

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.MCP_API_KEY;
const USER_ID = process.env.DEFAULT_USER_ID || "clzej3dqz0000inntk5x0bqre";

const canRunE2E = !!API_KEY;
const describeE2E = canRunE2E ? describe : describe.skip;

function headers(): Record<string, string> {
  return {
    "X-API-Key": API_KEY!,
    "Content-Type": "application/json",
  };
}

describeE2E("MCP Recipe API — E2E", () => {
  jest.setTimeout(30000);

  // Track created recipe IDs for cleanup
  let createdRecipeId: string | null = null;

  afterAll(async () => {
    // Cleanup: soft-delete any recipe we created
    if (createdRecipeId) {
      try {
        await fetch(`${API_BASE}/api/mcp/recipes`, {
          method: "DELETE",
          headers: headers(),
          body: JSON.stringify({ user_id: USER_ID, id: createdRecipeId }),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe("POST /api/mcp/recipes/search", () => {
    it("returns recipes with valid authentication", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          filters: { isPersonal: true, page: 1, limit: 5 },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty("recipes");
      expect(data).toHaveProperty("totalCount");
      expect(Array.isArray(data.recipes)).toBe(true);
    });

    it("returns 401 without API key", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          filters: {},
        }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 401 with invalid API key", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: {
          "X-API-Key": "invalid-key-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          filters: {},
        }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 400 without user_id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ filters: {} }),
      });

      expect(response.status).toBe(400);
    });

    it("supports text search filter", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          filters: { search: "chicken", page: 1, limit: 5 },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("recipes");
    });

    it("supports pagination", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          filters: { page: 1, limit: 2 },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.recipes.length).toBeLessThanOrEqual(2);
    });
  });

  describe("POST /api/mcp/recipes (create)", () => {
    it("creates a recipe and returns an id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          recipe: {
            title: "E2E Test Recipe — Spaghetti Aglio e Olio",
            description: "Created by automated E2E test",
            ingredients: "400g spaghetti\n6 cloves garlic\n1/2 cup olive oil\nRed pepper flakes\nParsley\nSalt",
            instructions:
              "1. Boil pasta until al dente\n2. Slice garlic thinly\n3. Heat olive oil and saute garlic\n4. Add pepper flakes\n5. Toss pasta in oil\n6. Garnish with parsley",
            cuisineType: "Italian",
            mealType: "Dinner",
            difficulty: "EASY",
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            isPublic: false,
            source: "USER",
          },
          parseWithAI: false,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(typeof data.id).toBe("string");

      // Store for subsequent tests and cleanup
      createdRecipeId = data.id;
    });

    it("returns 400 without recipe data", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ user_id: USER_ID }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/mcp/recipes (get by ID)", () => {
    it("returns full recipe details for a valid ID", async () => {
      // Use the recipe we created above, or search for any existing one
      let recipeId = createdRecipeId;

      if (!recipeId) {
        const searchRes = await fetch(`${API_BASE}/api/mcp/recipes/search`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            user_id: USER_ID,
            filters: { page: 1, limit: 1 },
          }),
        });
        const searchData = await searchRes.json();
        if (searchData.recipes?.length > 0) {
          recipeId = searchData.recipes[0].id;
        }
      }

      if (!recipeId) {
        console.warn("No recipe available for GET test — skipping");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/mcp/recipes?id=${recipeId}&user_id=${USER_ID}`,
        { method: "GET", headers: headers() }
      );

      expect(response.ok).toBe(true);
      const recipe = await response.json();
      expect(recipe).toHaveProperty("id");
      expect(recipe).toHaveProperty("title");
      expect(recipe).toHaveProperty("ingredients");
    });

    it("returns 400 without recipe ID", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/recipes?user_id=${USER_ID}`,
        { method: "GET", headers: headers() }
      );

      expect(response.status).toBe(400);
    });

    it("returns 404 for nonexistent recipe", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/recipes?id=nonexistent-id-12345&user_id=${USER_ID}`,
        { method: "GET", headers: headers() }
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/mcp/recipes (update)", () => {
    it("updates recipe fields", async () => {
      if (!createdRecipeId) {
        console.warn("No created recipe for update test — skipping");
        return;
      }

      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          id: createdRecipeId,
          recipe: { description: "Updated by E2E test" },
          parseWithAI: false,
        }),
      });

      expect(response.ok).toBe(true);

      // Verify the update
      const getRes = await fetch(
        `${API_BASE}/api/mcp/recipes?id=${createdRecipeId}&user_id=${USER_ID}`,
        { method: "GET", headers: headers() }
      );
      const updated = await getRes.json();
      expect(updated.description).toBe("Updated by E2E test");
    });

    it("returns 400 without recipe ID", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          recipe: { title: "Missing ID" },
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/mcp/recipes (soft delete)", () => {
    it("soft-deletes the test recipe", async () => {
      if (!createdRecipeId) {
        console.warn("No created recipe for delete test — skipping");
        return;
      }

      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          id: createdRecipeId,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("id");

      // Clear so afterAll doesn't try to delete again
      createdRecipeId = null;
    });

    it("returns 400 without recipe ID", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/recipes`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ user_id: USER_ID }),
      });

      expect(response.status).toBe(400);
    });
  });
});
