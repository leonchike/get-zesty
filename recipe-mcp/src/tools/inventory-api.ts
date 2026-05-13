/**
 * HTTP client for Next.js /api/mcp/inventory/* endpoints
 */

import type {
  InventoryItemResponse,
  InventoryListResponse,
  InventoryLocationsResponse,
} from "../types/index.js";

interface InventoryApiConfig {
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

export interface InventoryListFilter {
  locationId?: string;
  status?: "ACTIVE" | "CONSUMED" | "DISCARDED";
  expiringWithinDays?: number;
  nameContains?: string;
}

export async function getInventoryList(
  config: InventoryApiConfig,
  filter: InventoryListFilter = {}
): Promise<InventoryListResponse> {
  const params = new URLSearchParams({ user_id: config.userId });
  if (filter.locationId) params.set("location_id", filter.locationId);
  if (filter.status) params.set("status", filter.status);
  if (typeof filter.expiringWithinDays === "number") {
    params.set("expiring_within_days", String(filter.expiringWithinDays));
  }
  if (filter.nameContains && filter.nameContains.trim()) {
    params.set("name_contains", filter.nameContains.trim());
  }

  const url = `${config.baseUrl}/api/mcp/inventory?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as InventoryListResponse;
}

export async function getInventoryLocations(
  config: InventoryApiConfig
): Promise<InventoryLocationsResponse> {
  const url = `${config.baseUrl}/api/mcp/inventory/locations?user_id=${encodeURIComponent(config.userId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(config.apiKey),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as InventoryLocationsResponse;
}

export interface AddInventoryItemInput {
  name: string;
  quantity?: number;
  quantityUnit?: string;
  locationId?: string;
  expiresAt?: string;
  recipeId?: string;
  notes?: string;
}

export async function addInventoryItem(
  config: InventoryApiConfig,
  item: AddInventoryItemInput
): Promise<InventoryItemResponse> {
  const url = `${config.baseUrl}/api/mcp/inventory`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      item,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as InventoryItemResponse;
}

export interface UpdateInventoryItemInput {
  id: string;
  name?: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  locationId?: string;
  expiresAt?: string | null;
  notes?: string | null;
  status?: "ACTIVE" | "CONSUMED" | "DISCARDED";
}

export async function updateInventoryItem(
  config: InventoryApiConfig,
  itemUpdate: UpdateInventoryItemInput
): Promise<InventoryItemResponse> {
  const url = `${config.baseUrl}/api/mcp/inventory`;

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

  return (await response.json()) as InventoryItemResponse;
}

export async function consumeInventoryItem(
  config: InventoryApiConfig,
  itemId: string,
  decrement?: number
): Promise<InventoryItemResponse> {
  const url = `${config.baseUrl}/api/mcp/inventory/consume`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({
      user_id: config.userId,
      id: itemId,
      decrement,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }

  return (await response.json()) as InventoryItemResponse;
}

export async function discardInventoryItem(
  config: InventoryApiConfig,
  itemId: string
): Promise<InventoryItemResponse> {
  const url = `${config.baseUrl}/api/mcp/inventory/discard`;

  const response = await fetch(url, {
    method: "POST",
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

  return (await response.json()) as InventoryItemResponse;
}

export async function deleteInventoryItem(
  config: InventoryApiConfig,
  itemId: string
): Promise<{ id: string }> {
  const url = `${config.baseUrl}/api/mcp/inventory`;

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
