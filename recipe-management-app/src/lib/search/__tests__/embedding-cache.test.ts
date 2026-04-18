/**
 * @jest-environment node
 */

/// <reference types="jest" />

jest.mock("@/lib/embeddings", () => ({
  generateEmbedding: jest.fn(),
}));

import { generateEmbedding } from "@/lib/embeddings";
import { getCachedQueryEmbedding, __internals } from "../embedding-cache";

const mockedEmbed = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>;

beforeEach(() => {
  __internals.cache.clear();
  mockedEmbed.mockReset();
  mockedEmbed.mockResolvedValue([1, 2, 3]);
});

describe("embedding-cache", () => {
  it("calls OpenAI once per unique query", async () => {
    await getCachedQueryEmbedding("fish taco");
    await getCachedQueryEmbedding("fish taco");
    expect(mockedEmbed).toHaveBeenCalledTimes(1);
  });

  it("treats queries as case- and whitespace-insensitive", async () => {
    await getCachedQueryEmbedding("Fish Taco");
    await getCachedQueryEmbedding("  fish taco  ");
    expect(mockedEmbed).toHaveBeenCalledTimes(1);
  });

  it("issues a fresh call for different queries", async () => {
    await getCachedQueryEmbedding("fish taco");
    await getCachedQueryEmbedding("beef taco");
    expect(mockedEmbed).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest entry when MAX_ENTRIES is exceeded", async () => {
    const max = __internals.MAX_ENTRIES;
    // Fill the cache
    for (let i = 0; i < max; i++) {
      await getCachedQueryEmbedding(`query_${i}`);
    }
    expect(__internals.cache.size).toBe(max);
    // One more entry triggers eviction
    await getCachedQueryEmbedding("brand_new");
    expect(__internals.cache.size).toBe(max);
    // The first inserted should be gone
    expect(__internals.cache.has("query_0")).toBe(false);
    expect(__internals.cache.has("brand_new")).toBe(true);
  });

  it("expires entries after TTL", async () => {
    jest.useFakeTimers();
    try {
      await getCachedQueryEmbedding("fish taco");
      // Advance past TTL
      jest.setSystemTime(Date.now() + __internals.TTL_MS + 1000);
      await getCachedQueryEmbedding("fish taco");
      expect(mockedEmbed).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
