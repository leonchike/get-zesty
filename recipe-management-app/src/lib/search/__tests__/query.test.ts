/**
 * @jest-environment node
 */

/// <reference types="jest" />

import {
  tokenize,
  buildWebsearchQuery,
  reciprocalRankFusion,
  isQueryActionable,
  MIN_QUERY_LENGTH,
} from "../query";

describe("search/query — tokenize", () => {
  it("lowercases and splits on whitespace", () => {
    expect(tokenize("Fish Taco")).toEqual(["fish", "taco"]);
  });

  it("strips punctuation (including apostrophes)", () => {
    expect(tokenize("The Fish Shop's Mahi Mahi Tacos")).toEqual([
      "the",
      "fish",
      "shops",
      "mahi",
      "mahi",
      "tacos",
    ]);
  });

  it("handles curly/smart apostrophes", () => {
    expect(tokenize("Shop\u2019s specials")).toEqual(["shops", "specials"]);
  });

  it("handles accented characters as letters", () => {
    expect(tokenize("jalapeño")).toEqual(["jalapeño"]);
  });

  it("returns [] for empty or whitespace-only input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("caps to 8 tokens to avoid runaway queries", () => {
    const tokens = tokenize("a b c d e f g h i j k");
    expect(tokens.length).toBe(8);
    expect(tokens).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("treats SQL-ish operators as separators, not tokens", () => {
    expect(tokenize("fish & taco")).toEqual(["fish", "taco"]);
    expect(tokenize("fish | taco")).toEqual(["fish", "taco"]);
    expect(tokenize("fish:taco")).toEqual(["fish", "taco"]);
  });
});

describe("search/query — buildWebsearchQuery", () => {
  it("joins tokens with spaces (websearch_to_tsquery handles AND implicitly)", () => {
    expect(buildWebsearchQuery("Fish Taco")).toBe("fish taco");
  });

  it("strips operators that could change websearch semantics", () => {
    expect(buildWebsearchQuery("fish & taco")).toBe("fish taco");
  });

  it("returns empty string for empty input", () => {
    expect(buildWebsearchQuery("")).toBe("");
  });
});

describe("search/query — reciprocalRankFusion", () => {
  it("ranks a doc higher when it appears in multiple lists", () => {
    const a = [{ id: "x" }, { id: "y" }];
    const b = [{ id: "y" }, { id: "z" }];
    const scores = reciprocalRankFusion([a, b]);
    // y appears in both at rank 2 and rank 1; others once
    expect(scores.get("y")!).toBeGreaterThan(scores.get("x")!);
    expect(scores.get("y")!).toBeGreaterThan(scores.get("z")!);
  });

  it("gives a doc at rank 1 a higher contribution than rank 2 (same list)", () => {
    const list = [{ id: "first" }, { id: "second" }];
    const scores = reciprocalRankFusion([list]);
    expect(scores.get("first")!).toBeGreaterThan(scores.get("second")!);
  });

  it("uses k=60 by default", () => {
    const scores = reciprocalRankFusion([[{ id: "a" }]]);
    // 1 / (60 + 1) = 1/61
    expect(scores.get("a")!).toBeCloseTo(1 / 61, 10);
  });

  it("respects a custom k", () => {
    const scores = reciprocalRankFusion([[{ id: "a" }]], 10);
    expect(scores.get("a")!).toBeCloseTo(1 / 11, 10);
  });

  it("returns an empty map for no lists", () => {
    expect(reciprocalRankFusion([]).size).toBe(0);
  });

  it("handles a doc missing from some lists without crashing", () => {
    const a = [{ id: "x" }, { id: "y" }];
    const b = [{ id: "z" }];
    const scores = reciprocalRankFusion([a, b]);
    expect(scores.has("x")).toBe(true);
    expect(scores.has("y")).toBe(true);
    expect(scores.has("z")).toBe(true);
  });
});

describe("search/query — isQueryActionable", () => {
  it(`accepts strings of length >= ${MIN_QUERY_LENGTH}`, () => {
    expect(isQueryActionable("fi")).toBe(true);
  });

  it("rejects single-char and whitespace-only strings", () => {
    expect(isQueryActionable("a")).toBe(false);
    expect(isQueryActionable("  ")).toBe(false);
    expect(isQueryActionable("")).toBe(false);
  });
});
