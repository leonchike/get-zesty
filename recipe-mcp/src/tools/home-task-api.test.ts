import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getHomeTasks,
  createHomeTask,
  updateHomeTask,
  completeHomeTask,
  uncompleteHomeTask,
  deleteHomeTask,
  getHouseholdMembers,
  getTaskCompletions,
} from "./home-task-api.js";

const mockConfig = {
  baseUrl: "https://api.example.com",
  apiKey: "test-key",
  userId: "user-123",
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getHomeTasks", () => {
  it("sends GET with only user_id by default", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ tasks: [] }));

    await getHomeTasks(mockConfig);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/home-tasks?");
    expect(url).toContain("user_id=user-123");
    expect(url).not.toContain("view=");
    expect(url).not.toContain("assignee_id=");
    expect(url).not.toContain("due_within_days=");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    expect(mockFetch.mock.calls[0][1].headers["X-API-Key"]).toBe("test-key");
  });

  it("includes filters when provided", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ tasks: [] }));

    await getHomeTasks(mockConfig, {
      view: "overdue",
      assigneeId: "member-1",
      dueWithinDays: 3,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("view=overdue");
    expect(url).toContain("assignee_id=member-1");
    expect(url).toContain("due_within_days=3");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

    await expect(getHomeTasks(mockConfig)).rejects.toThrow("HTTP 401");
  });
});

describe("createHomeTask", () => {
  it("sends POST with user_id and task in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ task: { id: "t1" } }));

    await createHomeTask(mockConfig, {
      title: "Clean filters",
      isRecurring: true,
      intervalValue: 3,
      intervalUnit: "MONTH",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("https://api.example.com/api/mcp/home-tasks");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.user_id).toBe("user-123");
    expect(body.task.title).toBe("Clean filters");
    expect(body.task.intervalUnit).toBe("MONTH");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "bad" }, 400));

    await expect(
      createHomeTask(mockConfig, { title: "x" })
    ).rejects.toThrow("HTTP 400");
  });
});

describe("updateHomeTask", () => {
  it("sends PATCH with task.id in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ task: { id: "t1" } }));

    await updateHomeTask(mockConfig, { id: "t1", title: "Renamed" });

    expect(mockFetch.mock.calls[0][1].method).toBe("PATCH");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.task.id).toBe("t1");
    expect(body.task.title).toBe("Renamed");
  });
});

describe("completeHomeTask", () => {
  it("posts to /complete with id and completed_by_id", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ task: { id: "t1" } }));

    await completeHomeTask(mockConfig, "t1", "member-2");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("https://api.example.com/api/mcp/home-tasks/complete");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.id).toBe("t1");
    expect(body.completed_by_id).toBe("member-2");
  });

  it("omits completed_by_id when not provided", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ task: { id: "t1" } }));

    await completeHomeTask(mockConfig, "t1");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("completed_by_id");
  });
});

describe("uncompleteHomeTask", () => {
  it("posts to /uncomplete", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ task: { id: "t1" } }));

    await uncompleteHomeTask(mockConfig, "t1");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("https://api.example.com/api/mcp/home-tasks/uncomplete");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.id).toBe("t1");
    expect(body.user_id).toBe("user-123");
  });
});

describe("deleteHomeTask", () => {
  it("sends DELETE with id in body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true, id: "t1" }));

    await deleteHomeTask(mockConfig, "t1");

    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.id).toBe("t1");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "nope" }, 404));

    await expect(deleteHomeTask(mockConfig, "t1")).rejects.toThrow("HTTP 404");
  });
});

describe("getHouseholdMembers", () => {
  it("sends GET to /members with user_id", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ members: [] }));

    await getHouseholdMembers(mockConfig);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/home-tasks/members?");
    expect(url).toContain("user_id=user-123");
  });
});

describe("getTaskCompletions", () => {
  it("sends GET to /completions with task_id", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ completions: [] }));

    await getTaskCompletions(mockConfig, "t1");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/mcp/home-tasks/completions?");
    expect(url).toContain("task_id=t1");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: "denied" }, 401));

    await expect(getTaskCompletions(mockConfig, "t1")).rejects.toThrow(
      "HTTP 401"
    );
  });
});
