import { describe, it, expect, vi } from "vitest";

// Mock Sentry before importing sentry-utils
vi.mock("@sentry/cloudflare", () => ({
  getCurrentScope: undefined,
  startNewTrace: vi.fn(),
  startSpan: vi.fn(),
  captureException: vi.fn(),
  lastEventId: vi.fn(),
}));

import { wrapWithSentry } from "./sentry-utils.js";

describe("wrapWithSentry", () => {
  it("returns a function", () => {
    const handler = async () => ({ result: "ok" });
    const wrapped = wrapWithSentry("testTool", handler);
    expect(typeof wrapped).toBe("function");
  });

  it("calls the handler and returns its result when Sentry is not enabled", async () => {
    const handler = vi.fn().mockResolvedValue({ content: [{ type: "text", text: "hello" }] });
    const wrapped = wrapWithSentry("testTool", handler);

    const result = await wrapped({ foo: "bar" });

    expect(handler).toHaveBeenCalledWith({ foo: "bar" });
    expect(result).toEqual({ content: [{ type: "text", text: "hello" }] });
  });

  it("passes arguments through to the handler", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const wrapped = wrapWithSentry("myTool", handler);

    await wrapped({ query: "pasta", limit: 10 });

    expect(handler).toHaveBeenCalledWith({ query: "pasta", limit: 10 });
  });

  it("propagates handler errors when Sentry is not enabled", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("API down"));
    const wrapped = wrapWithSentry("failTool", handler);

    await expect(wrapped({})).rejects.toThrow("API down");
  });
});
