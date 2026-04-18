/**
 * Small LRU cache for query embeddings.
 * Queries repeat constantly as the user types and backspaces;
 * re-calling OpenAI for the same string wastes money and adds ~150ms.
 */

import { generateEmbedding } from "@/lib/embeddings";

type Entry = { value: number[]; expiresAt: number };

const MAX_ENTRIES = 500;
const TTL_MS = 5 * 60 * 1000; // 5 min — long enough to cover a typing session

const cache = new Map<string, Entry>();

function normalizeKey(text: string): string {
  return text.trim().toLowerCase();
}

function evictIfNeeded() {
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function getCachedQueryEmbedding(
  text: string
): Promise<number[]> {
  const key = normalizeKey(text);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    // Move to end (Map iteration order = insertion order)
    cache.delete(key);
    cache.set(key, hit);
    return hit.value;
  }

  const value = await generateEmbedding(text);
  cache.set(key, { value, expiresAt: now + TTL_MS });
  evictIfNeeded();
  return value;
}

// Exposed for tests only
export const __internals = { cache, MAX_ENTRIES, TTL_MS };
