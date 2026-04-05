/**
 * @jest-environment node
 */

import {
  createWindows,
  deduplicateBoundaries,
} from "../recipe-detector";
import { PageTextMap, RecipeBoundary } from "../pipeline-types";

describe("createWindows", () => {
  it("creates correct windows for a small book", () => {
    const pageTexts: PageTextMap = new Map([
      [1, "Page 1"],
      [2, "Page 2"],
      [3, "Page 3"],
      [4, "Page 4"],
      [5, "Page 5"],
      [6, "Page 6"],
      [7, "Page 7"],
    ]);

    const windows = createWindows(pageTexts);

    // Window size=5, overlap=2, step=3
    // Window 1: pages 1-5
    // Window 2: pages 4-7 (starts at 4, ends at 7 which is totalPages → stops)
    expect(windows.length).toBe(2);
    expect(windows[0].startPage).toBe(1);
    expect(windows[0].endPage).toBe(5);
    expect(windows[1].startPage).toBe(4);
    expect(windows[1].endPage).toBe(7);
  });

  it("creates a single window for 5 or fewer pages", () => {
    const pageTexts: PageTextMap = new Map([
      [1, "A"],
      [2, "B"],
      [3, "C"],
    ]);

    const windows = createWindows(pageTexts);
    expect(windows.length).toBe(1);
    expect(windows[0].startPage).toBe(1);
    expect(windows[0].endPage).toBe(3);
  });

  it("returns empty for empty input", () => {
    const windows = createWindows(new Map());
    expect(windows.length).toBe(0);
  });

  it("includes page text in window content", () => {
    const pageTexts: PageTextMap = new Map([
      [1, "First page content"],
      [2, "Second page content"],
    ]);

    const windows = createWindows(pageTexts);
    expect(windows[0].text).toContain("First page content");
    expect(windows[0].text).toContain("Second page content");
    expect(windows[0].text).toContain("--- Page 1 ---");
  });
});

describe("deduplicateBoundaries", () => {
  it("merges duplicate titles, keeping widest range", () => {
    const boundaries: RecipeBoundary[] = [
      { title: "Pasta Carbonara", startPage: 42, endPage: 43 },
      { title: "Pasta Carbonara", startPage: 43, endPage: 44 },
    ];

    const result = deduplicateBoundaries(boundaries);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Pasta Carbonara");
    expect(result[0].startPage).toBe(42);
    expect(result[0].endPage).toBe(44);
  });

  it("normalizes titles for comparison (case + punctuation)", () => {
    const boundaries: RecipeBoundary[] = [
      { title: "Pasta Carbonara", startPage: 42, endPage: 43 },
      { title: "pasta-carbonara", startPage: 43, endPage: 45 },
    ];

    const result = deduplicateBoundaries(boundaries);
    expect(result.length).toBe(1);
    expect(result[0].startPage).toBe(42);
    expect(result[0].endPage).toBe(45);
  });

  it("keeps distinct recipes separate", () => {
    const boundaries: RecipeBoundary[] = [
      { title: "Pasta Carbonara", startPage: 42, endPage: 43 },
      { title: "Caesar Salad", startPage: 50, endPage: 51 },
    ];

    const result = deduplicateBoundaries(boundaries);
    expect(result.length).toBe(2);
  });

  it("sorts results by startPage", () => {
    const boundaries: RecipeBoundary[] = [
      { title: "Recipe C", startPage: 30, endPage: 31 },
      { title: "Recipe A", startPage: 10, endPage: 11 },
      { title: "Recipe B", startPage: 20, endPage: 21 },
    ];

    const result = deduplicateBoundaries(boundaries);
    expect(result.map((r) => r.title)).toEqual([
      "Recipe A",
      "Recipe B",
      "Recipe C",
    ]);
  });

  it("handles empty input", () => {
    expect(deduplicateBoundaries([])).toEqual([]);
  });
});
