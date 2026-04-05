/**
 * @jest-environment node
 */

import { RateLimiter, pMap } from "../rate-limiter";

describe("RateLimiter", () => {
  it("allows immediate acquisition when tokens available", async () => {
    const limiter = new RateLimiter(10);
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("throttles when tokens are exhausted", async () => {
    const limiter = new RateLimiter(2); // 2 tokens/sec

    // Drain both tokens
    await limiter.acquire();
    await limiter.acquire();

    // Third acquire should wait ~500ms for a token to refill
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // Should have waited at least 200ms (allowing margin)
    expect(elapsed).toBeGreaterThanOrEqual(200);
  });
});

describe("pMap", () => {
  it("processes all items", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await pMap(items, async (x) => x * 2, 3);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("preserves order regardless of completion time", async () => {
    const items = [100, 10, 50]; // different "durations"
    const results = await pMap(
      items,
      async (ms, index) => {
        await new Promise((r) => setTimeout(r, ms));
        return index;
      },
      3
    );
    expect(results).toEqual([0, 1, 2]);
  });

  it("limits concurrency", async () => {
    let running = 0;
    let maxRunning = 0;

    const items = Array.from({ length: 10 }, (_, i) => i);
    await pMap(
      items,
      async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, 50));
        running--;
      },
      3
    );

    expect(maxRunning).toBeLessThanOrEqual(3);
  });

  it("handles empty input", async () => {
    const results = await pMap([], async (x: number) => x, 3);
    expect(results).toEqual([]);
  });

  it("propagates errors", async () => {
    await expect(
      pMap([1, 2, 3], async (x) => {
        if (x === 2) throw new Error("fail");
        return x;
      }, 1)
    ).rejects.toThrow("fail");
  });
});
