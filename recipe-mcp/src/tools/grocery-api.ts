/**
 * HTTP client for Next.js /api/mcp/groceries/* endpoints
 */

import type {
  GroceryListResponse,
  GroceryCreateResponse,
  GroceryCompleteResponse,
  GroceryItem,
} from "../types/index.js";

interface GroceryApiConfig {
  baseUrl: string;
  apiKey: string;
  userId: string;
}

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

/**
 * Get grocery list, optionally including completed items
 */
export async function getGroceryList(
  config: GroceryApiConfig,
  includeCompleted: boolean = false
): Promise<GroceryListResponse> {
  const includeParam = includeCompleted ? "true" : "false";
  const url = `${config.baseUrl}/api/mcp/groceries?user_id=${encodeURIComponent(config.userId)}&includeCompleted=${includeParam}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as GroceryListResponse;
}

/**
 * Add a single grocery item
 */
export async function addGroceryItem(
  config: GroceryApiConfig,
  item: {
    name: string;
    quantity?: number;
    quantityUnit?: string;
    recipeId?: string;
  }
): Promise<GroceryCreateResponse> {
  const url = `${config.baseUrl}/api/mcp/groceries`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      item: {
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        recipeId: item.recipeId,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as GroceryCreateResponse;
}

/**
 * Update a grocery item (partial update)
 */
export async function updateGroceryItem(
  config: GroceryApiConfig,
  itemUpdate: {
    id: string;
    name?: string;
    quantity?: number;
    quantityUnit?: string;
    status?: string;
  }
): Promise<{ grocery: GroceryItem }> {
  const url = `${config.baseUrl}/api/mcp/groceries`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      item: itemUpdate,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as { grocery: GroceryItem };
}

/**
 * Batch mark items as completed
 */
export async function completeGroceryItems(
  config: GroceryApiConfig,
  itemIds: string[]
): Promise<GroceryCompleteResponse> {
  const url = `${config.baseUrl}/api/mcp/groceries/complete`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      ids: itemIds,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as GroceryCompleteResponse;
}

/**
 * Permanently delete a grocery item
 */
export async function deleteGroceryItem(
  config: GroceryApiConfig,
  itemId: string
): Promise<{ id: string }> {
  const url = `${config.baseUrl}/api/mcp/groceries`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      id: itemId,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as { id: string };
}
