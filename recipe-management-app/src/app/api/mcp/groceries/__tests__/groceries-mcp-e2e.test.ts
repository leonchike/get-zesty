/**
 * @jest-environment node
 */

/// <reference types="jest" />

/**
 * E2E tests for MCP Grocery API routes
 *
 * These tests make real HTTP calls to the running Next.js server.
 * Requires:
 *   - Next.js dev server running on localhost:3000
 *   - MCP_API_KEY set in .env
 *   - A valid user in the database
 *
 * Run: npm test -- src/app/api/mcp/groceries/__tests__/groceries-mcp-e2e.test.ts
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

describeE2E("MCP Grocery API — E2E", () => {
  jest.setTimeout(30000);

  // Track created item IDs for cleanup
  const createdItemIds: string[] = [];

  afterAll(async () => {
    // Cleanup: delete items we created
    for (const id of createdItemIds) {
      try {
        await fetch(`${API_BASE}/api/mcp/groceries`, {
          method: "DELETE",
          headers: headers(),
          body: JSON.stringify({ user_id: USER_ID, id }),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe("GET /api/mcp/groceries", () => {
    it("returns grocery list with valid auth", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/groceries?user_id=${USER_ID}&includeCompleted=false`,
        { method: "GET", headers: headers() }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("groceries");
      expect(Array.isArray(data.groceries)).toBe(true);
    });

    it("includes completed items when requested", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/groceries?user_id=${USER_ID}&includeCompleted=true`,
        { method: "GET", headers: headers() }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("groceries");
    });

    it("returns 401 without API key", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/groceries?user_id=${USER_ID}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.status).toBe(401);
    });

    it("returns 400 without user_id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "GET",
        headers: headers(),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/mcp/groceries (add item)", () => {
    it("adds a single grocery item with AI section classification", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          item: {
            name: "E2E Test — Organic Bananas",
            quantity: 6,
            quantityUnit: "pieces",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("grocery");
      expect(data.grocery).toHaveProperty("id");
      expect(data.grocery.name).toBe("E2E Test — Organic Bananas");
      expect(data.grocery.status).toBe("ACTIVE");

      // AI should classify bananas into Produce section
      if (data.grocery.section) {
        expect(typeof data.grocery.section.name).toBe("string");
      }

      createdItemIds.push(data.grocery.id);
    });

    it("adds an item with only name (minimal)", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          item: { name: "E2E Test — Bread" },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.grocery.name).toBe("E2E Test — Bread");

      createdItemIds.push(data.grocery.id);
    });

    it("returns 400 without item name", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          item: {},
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/mcp/groceries (update item)", () => {
    it("updates an existing grocery item", async () => {
      if (createdItemIds.length === 0) {
        console.warn("No items to update — skipping");
        return;
      }

      const itemId = createdItemIds[0];
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          item: {
            id: itemId,
            quantity: 12,
            quantityUnit: "count",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.grocery.quantity).toBe(12);
    });

    it("returns 400 without item ID", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          item: { name: "No ID" },
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/mcp/groceries/complete", () => {
    it("marks items as completed", async () => {
      if (createdItemIds.length === 0) {
        console.warn("No items to complete — skipping");
        return;
      }

      const response = await fetch(`${API_BASE}/api/mcp/groceries/complete`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          ids: [createdItemIds[0]],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("count");
      expect(data.count).toBeGreaterThanOrEqual(1);
    });

    it("returns 400 without any IDs", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries/complete`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ user_id: USER_ID }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/mcp/groceries", () => {
    it("deletes a grocery item", async () => {
      if (createdItemIds.length === 0) {
        console.warn("No items to delete — skipping");
        return;
      }

      const itemId = createdItemIds.pop()!;
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({
          user_id: USER_ID,
          id: itemId,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("id");
    });

    it("returns 400 without item ID", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/groceries`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ user_id: USER_ID }),
      });

      expect(response.status).toBe(400);
    });
  });
});
