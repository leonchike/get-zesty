/**
 * @jest-environment node
 */

/// <reference types="jest" />

import {
  computeNextDueDate,
  formatCadence,
  isDueSoon,
  isOverdue,
} from "../task-dates";

describe("computeNextDueDate", () => {
  it("adds days from the completion date", () => {
    const completed = new Date("2026-07-01T12:00:00Z");
    expect(computeNextDueDate(completed, 10, "DAY")).toEqual(
      new Date("2026-07-11T12:00:00Z")
    );
  });

  it("adds weeks from the completion date", () => {
    const completed = new Date("2026-07-01T12:00:00Z");
    expect(computeNextDueDate(completed, 2, "WEEK")).toEqual(
      new Date("2026-07-15T12:00:00Z")
    );
  });

  it("adds months from the completion date (not the old due date)", () => {
    const completed = new Date("2026-07-11T12:00:00Z");
    expect(computeNextDueDate(completed, 3, "MONTH")).toEqual(
      new Date("2026-10-11T12:00:00Z")
    );
  });

  it("clamps month-end overflow (Jan 31 + 1 month = Feb 28)", () => {
    const completed = new Date("2026-01-31T12:00:00Z");
    expect(computeNextDueDate(completed, 1, "MONTH")).toEqual(
      new Date("2026-02-28T12:00:00Z")
    );
  });

  it("handles leap years (Jan 31 + 1 month in 2028 = Feb 29)", () => {
    const completed = new Date("2028-01-31T12:00:00Z");
    expect(computeNextDueDate(completed, 1, "MONTH")).toEqual(
      new Date("2028-02-29T12:00:00Z")
    );
  });

  it("adds years", () => {
    const completed = new Date("2026-07-01T12:00:00Z");
    expect(computeNextDueDate(completed, 1, "YEAR")).toEqual(
      new Date("2027-07-01T12:00:00Z")
    );
  });
});

describe("isOverdue / isDueSoon", () => {
  const now = new Date("2026-07-11T12:00:00Z");

  it("flags past-due active tasks", () => {
    expect(
      isOverdue({ dueDate: "2026-07-10T00:00:00Z", status: "ACTIVE" }, now)
    ).toBe(true);
  });

  it("ignores tasks without a due date", () => {
    expect(isOverdue({ dueDate: null, status: "ACTIVE" }, now)).toBe(false);
    expect(isDueSoon({ dueDate: null, status: "ACTIVE" }, now)).toBe(false);
  });

  it("ignores completed tasks", () => {
    expect(
      isOverdue({ dueDate: "2026-07-10T00:00:00Z", status: "COMPLETED" }, now)
    ).toBe(false);
  });

  it("flags tasks due within the window", () => {
    expect(
      isDueSoon({ dueDate: "2026-07-15T00:00:00Z", status: "ACTIVE" }, now)
    ).toBe(true);
  });

  it("does not flag tasks beyond the window", () => {
    expect(
      isDueSoon({ dueDate: "2026-08-15T00:00:00Z", status: "ACTIVE" }, now)
    ).toBe(false);
  });
});

describe("formatCadence", () => {
  it("formats singular and plural cadences", () => {
    expect(formatCadence(1, "WEEK")).toBe("every week");
    expect(formatCadence(3, "MONTH")).toBe("every 3 months");
  });

  it("returns null when incomplete", () => {
    expect(formatCadence(null, "MONTH")).toBeNull();
    expect(formatCadence(2, null)).toBeNull();
  });
});
