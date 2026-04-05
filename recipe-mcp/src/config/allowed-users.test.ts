import { describe, it, expect } from "vitest";
import {
  resolveUserId,
  checkUserIsAllowed,
  getAuthDeniedResponse,
  USER_CONFIG,
} from "./allowed-users.js";

describe("resolveUserId", () => {
  it("resolves a known email to the correct database userId", () => {
    expect(resolveUserId("leonchike@gmail.com")).toBe("clzej3dqz0000inntk5x0bqre");
  });

  it("resolves a second known email", () => {
    expect(resolveUserId("leonnwankwo@gmail.com")).toBe("cm88mq7p50000le1wzkrpnqat");
  });

  it("returns null for an unknown email", () => {
    expect(resolveUserId("unknown@example.com")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveUserId("")).toBeNull();
  });

  it("is case-sensitive (email must match exactly)", () => {
    expect(resolveUserId("Leonchike@gmail.com")).toBeNull();
  });
});

describe("checkUserIsAllowed", () => {
  it("allows a known username", () => {
    expect(checkUserIsAllowed("leonchike")).toBe(true);
  });

  it("allows a second known username", () => {
    expect(checkUserIsAllowed("leonnwankwo")).toBe(true);
  });

  it("denies an unknown username", () => {
    expect(checkUserIsAllowed("hacker")).toBe(false);
  });

  it("denies empty string", () => {
    expect(checkUserIsAllowed("")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(checkUserIsAllowed("Leonchike")).toBe(false);
  });
});

describe("getAuthDeniedResponse", () => {
  it("returns a 403 response", () => {
    const response = getAuthDeniedResponse("baduser");
    expect(response.status).toBe(403);
  });

  it("returns HTML content type", () => {
    const response = getAuthDeniedResponse("baduser");
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  });

  it("includes the username in the response body", async () => {
    const response = getAuthDeniedResponse("baduser");
    const body = await response.text();
    expect(body).toContain("baduser");
    expect(body).toContain("Access Denied");
  });
});

describe("USER_CONFIG", () => {
  it("has at least one user configured", () => {
    expect(Object.keys(USER_CONFIG).length).toBeGreaterThan(0);
  });

  it("maps emails to non-empty user IDs", () => {
    for (const [email, userId] of Object.entries(USER_CONFIG)) {
      expect(email).toContain("@");
      expect(userId.length).toBeGreaterThan(0);
    }
  });
});
