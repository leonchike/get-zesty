import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGroceryList,
  addGroceryItem,
  updateGroceryItem,
  completeGroceryItems,
  deleteGroceryItem,
} from "./grocery-api.js";

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

describe("getGroceryList", () => {
  it("sends GET with includeCompleted=false by default", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ groceries: [] }));

    await getGroceryList(mockConfig);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/groceries?");
    expect(url).toContain("user_id=user-123");
    expect(url).toContain("includeCompleted=false");
  });

  it("sends includeCompleted=true when requested", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ groceries: [] }));

    await getGroceryList(mockConfig, true);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("includeCompleted=true");
  });

  it("returns grocery items", async () => {
    const mockData = {
      groceries: [
        {
          id: "item-1",
          name: "Milk",
          quantity: 1,
          quantityUnit: "gallon",
          status: "ACTIVE",
          section: { name: "Dairy" },
          recipe: null,
          recipeId: null,
        },
      ],
    };
    mockFetch.mockResolvedValue(jsonResponse(mockData));

    const result = await getGroceryList(mockConfig);
    expect(result.groceries).toHaveLength(1);
    expect(result.groceries[0].name).toBe("Milk");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));
    await expect(getGroceryList(mockConfig)).rejects.toThrow("HTTP 401");
  });
});

describe("addGroceryItem", () => {
  it("sends POST with item data", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        grocery: {
          id: "new-item",
          name: "Tomatoes",
          quantity: 5,
          quantityUnit: "pieces",
          status: "ACTIVE",
          section: { name: "Produce" },
          recipe: null,
          recipeId: null,
        },
      })
    );

    const result = await addGroceryItem(mockConfig, {
      name: "Tomatoes",
      quantity: 5,
      quantityUnit: "pieces",
    });

    expect(result.grocery.name).toBe("Tomatoes");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.user_id).toBe("user-123");
    expect(body.item.name).toBe("Tomatoes");
    expect(body.item.quantity).toBe(5);
  });

  it("sends item with only name (optional fields omitted)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        grocery: {
          id: "item-2",
          name: "Bread",
          quantity: null,
          quantityUnit: null,
          status: "ACTIVE",
          section: { name: "Bakery" },
          recipe: null,
          recipeId: null,
        },
      })
    );

    await addGroceryItem(mockConfig, { name: "Bread" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.item.name).toBe("Bread");
    expect(body.item.quantity).toBeUndefined();
  });
});

describe("updateGroceryItem", () => {
  it("sends PATCH with partial update", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        grocery: {
          id: "item-1",
          name: "Updated Milk",
          quantity: 2,
          quantityUnit: "gallons",
          status: "ACTIVE",
          section: { name: "Dairy" },
          recipe: null,
          recipeId: null,
        },
      })
    );

    await updateGroceryItem(mockConfig, { id: "item-1", name: "Updated Milk", quantity: 2 });

    const options = mockFetch.mock.calls[0][1];
    expect(options.method).toBe("PATCH");

    const body = JSON.parse(options.body);
    expect(body.item.id).toBe("item-1");
    expect(body.item.name).toBe("Updated Milk");
  });
});

describe("completeGroceryItems", () => {
  it("sends POST to /complete with array of IDs", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ count: 2, groceries: [] })
    );

    const result = await completeGroceryItems(mockConfig, ["item-1", "item-2"]);

    expect(result.count).toBe(2);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/mcp/groceries/complete");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.ids).toEqual(["item-1", "item-2"]);
  });
});

describe("deleteGroceryItem", () => {
  it("sends DELETE with item ID", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "item-1" }));

    const result = await deleteGroceryItem(mockConfig, "item-1");

    expect(result.id).toBe("item-1");

    const options = mockFetch.mock.calls[0][1];
    expect(options.method).toBe("DELETE");

    const body = JSON.parse(options.body);
    expect(body.id).toBe("item-1");
    expect(body.user_id).toBe("user-123");
  });
});
