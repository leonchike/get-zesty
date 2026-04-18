/**
 * @jest-environment node
 */

/// <reference types="jest" />

import { backoffMs, MAX_ATTEMPTS } from "../enqueue";

describe("jobs/enqueue — backoffMs", () => {
  it("returns a positive delay for attempt 1", () => {
    const d = backoffMs(1);
    expect(d).toBeGreaterThan(0);
  });

  it("grows exponentially up to the cap", () => {
    // Without jitter, attempt N would yield 2^(N-1) seconds.
    // Jitter adds up to 25% on top, so our lower bound is 2^(N-1) * 1000.
    for (let a = 1; a <= 5; a++) {
      const d = backoffMs(a);
      expect(d).toBeGreaterThanOrEqual(1000 * 2 ** (a - 1));
    }
  });

  it("caps at 5 minutes", () => {
    const d = backoffMs(20); // would be absurd without the cap
    // 5 min + max 25% jitter = 375_000 ms
    expect(d).toBeLessThanOrEqual(5 * 60 * 1000 + 5 * 60 * 250);
  });

  it("exposes a sensible MAX_ATTEMPTS", () => {
    expect(MAX_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_ATTEMPTS).toBeLessThan(20);
  });
});
