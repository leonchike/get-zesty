/**
 * @jest-environment node
 */

/// <reference types="jest" />

jest.mock("@/lib/helpers/get-user-id-from-jwt", () => ({
  getUserIdFromJwt: jest.fn(),
}));

jest.mock("@/features/home-tasks/actions/home-task-actions", () => ({
  getHomeTasksBase: jest.fn(),
  createHomeTaskBase: jest.fn(),
  updateHomeTaskBase: jest.fn(),
  deleteHomeTaskBase: jest.fn(),
  completeHomeTaskBase: jest.fn(),
  uncompleteHomeTaskBase: jest.fn(),
}));

import { NextRequest } from "next/server";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import {
  completeHomeTaskBase,
  createHomeTaskBase,
  getHomeTasksBase,
} from "@/features/home-tasks/actions/home-task-actions";
import { GET, POST } from "../route";
import { POST as COMPLETE } from "../[id]/complete/route";

const mockedGetUserId = getUserIdFromJwt as jest.Mock;
const mockedGetTasks = getHomeTasksBase as jest.Mock;
const mockedCreateTask = createHomeTaskBase as jest.Mock;
const mockedCompleteTask = completeHomeTaskBase as jest.Mock;

const USER_ID = "user-1";

function makeRequest(
  url: string,
  options: { token?: string; method?: string; body?: unknown } = {}
) {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  return new NextRequest(url, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined && {
      body: JSON.stringify(options.body),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetUserId.mockImplementation((token: string) => {
    if (token !== "valid-token") throw new Error("invalid token");
    return USER_ID;
  });
});

describe("GET /api/mobile/tasks", () => {
  it("returns 401 without a Bearer token", async () => {
    const res = await GET(makeRequest("http://test/api/mobile/tasks"));
    expect(res.status).toBe(401);
    expect(mockedGetTasks).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    const res = await GET(
      makeRequest("http://test/api/mobile/tasks", { token: "bad" })
    );
    expect(res.status).toBe(401);
  });

  it("returns tasks for a valid token, passing view + assignee filters", async () => {
    mockedGetTasks.mockResolvedValue([{ id: "task-1" }]);
    const res = await GET(
      makeRequest(
        "http://test/api/mobile/tasks?view=overdue&assignee_id=m-1",
        { token: "valid-token" }
      )
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "task-1" }]);
    expect(mockedGetTasks).toHaveBeenCalledWith(USER_ID, {
      view: "overdue",
      assigneeId: "m-1",
    });
  });

  it("ignores unknown view values", async () => {
    mockedGetTasks.mockResolvedValue([]);
    await GET(
      makeRequest("http://test/api/mobile/tasks?view=bogus", {
        token: "valid-token",
      })
    );
    expect(mockedGetTasks).toHaveBeenCalledWith(USER_ID, {
      view: undefined,
      assigneeId: undefined,
    });
  });
});

describe("POST /api/mobile/tasks", () => {
  it("returns 401 without a token", async () => {
    const res = await POST(
      makeRequest("http://test/api/mobile/tasks", {
        method: "POST",
        body: { title: "Paint fence" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("creates a task and returns 201", async () => {
    mockedCreateTask.mockResolvedValue({ id: "task-1", title: "Paint fence" });
    const res = await POST(
      makeRequest("http://test/api/mobile/tasks", {
        method: "POST",
        token: "valid-token",
        body: { title: "Paint fence" },
      })
    );
    expect(res.status).toBe(201);
    expect(mockedCreateTask).toHaveBeenCalledWith(
      { title: "Paint fence" },
      USER_ID
    );
  });

  it("maps validation errors to 400", async () => {
    mockedCreateTask.mockRejectedValue(new Error("Task title is required"));
    const res = await POST(
      makeRequest("http://test/api/mobile/tasks", {
        method: "POST",
        token: "valid-token",
        body: {},
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Task title is required" });
  });
});

describe("POST /api/mobile/tasks/[id]/complete", () => {
  const params = Promise.resolve({ id: "task-1" });

  it("returns 401 without a token", async () => {
    const res = await COMPLETE(
      makeRequest("http://test/api/mobile/tasks/task-1/complete", {
        method: "POST",
      }),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("delegates to completeHomeTaskBase with the completer", async () => {
    mockedCompleteTask.mockResolvedValue({ id: "task-1" });
    const res = await COMPLETE(
      makeRequest("http://test/api/mobile/tasks/task-1/complete", {
        method: "POST",
        token: "valid-token",
        body: { completedById: "m-1" },
      }),
      { params }
    );
    expect(res.status).toBe(200);
    expect(mockedCompleteTask).toHaveBeenCalledWith("task-1", USER_ID, "m-1");
  });

  it("maps missing tasks to 404", async () => {
    mockedCompleteTask.mockRejectedValue(new Error("Task not found"));
    const res = await COMPLETE(
      makeRequest("http://test/api/mobile/tasks/task-1/complete", {
        method: "POST",
        token: "valid-token",
        body: {},
      }),
      { params }
    );
    expect(res.status).toBe(404);
  });
});
