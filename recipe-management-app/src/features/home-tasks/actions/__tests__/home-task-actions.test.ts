/**
 * @jest-environment node
 */

/// <reference types="jest" />

jest.mock("@/lib/prisma-client", () => ({
  __esModule: true,
  default: {
    homeTask: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    householdMember: {
      findFirst: jest.fn(),
    },
    taskCompletion: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/actions/auth-actions", () => ({
  getUser: jest.fn(),
  redirectToLogin: jest.fn(),
}));

import prisma from "@/lib/prisma-client";
import {
  completeHomeTaskBase,
  createHomeTaskBase,
  deleteHomeTaskBase,
  getHomeTasksBase,
  uncompleteHomeTaskBase,
} from "../home-task-actions";

const mockedFindMany = prisma.homeTask.findMany as jest.Mock;
const mockedFindFirst = prisma.homeTask.findFirst as jest.Mock;
const mockedCreate = prisma.homeTask.create as jest.Mock;
const mockedUpdate = prisma.homeTask.update as jest.Mock;
const mockedDelete = prisma.homeTask.delete as jest.Mock;
const mockedMemberFindFirst = prisma.householdMember.findFirst as jest.Mock;
const mockedCompletionCreate = prisma.taskCompletion.create as jest.Mock;
const mockedCompletionDelete = prisma.taskCompletion.delete as jest.Mock;
const mockedTransaction = prisma.$transaction as jest.Mock;

const USER_ID = "user-1";

beforeEach(() => {
  jest.clearAllMocks();
  // Array-style $transaction: capture each op's args by letting the
  // individual mocks resolve, then return their results in order.
  mockedTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
    Promise.all(ops)
  );
});

describe("createHomeTaskBase", () => {
  it("rejects an empty title", async () => {
    await expect(createHomeTaskBase({ title: "  " }, USER_ID)).rejects.toThrow(
      "Task title is required"
    );
  });

  it("rejects recurring tasks without a cadence", async () => {
    await expect(
      createHomeTaskBase({ title: "Clean filters", isRecurring: true }, USER_ID)
    ).rejects.toThrow("repeat interval");
  });

  it("rejects recurring tasks without a unit", async () => {
    await expect(
      createHomeTaskBase(
        { title: "Clean filters", isRecurring: true, intervalValue: 3 },
        USER_ID
      )
    ).rejects.toThrow("repeat unit");
  });

  it("rejects an assignee that belongs to another user", async () => {
    mockedMemberFindFirst.mockResolvedValue(null);
    await expect(
      createHomeTaskBase(
        { title: "Paint fence", assigneeId: "member-x" },
        USER_ID
      )
    ).rejects.toThrow("Assignee not found");
    expect(mockedMemberFindFirst).toHaveBeenCalledWith({
      where: { id: "member-x", userId: USER_ID },
    });
  });

  it("creates a one-off task with trimmed fields", async () => {
    mockedCreate.mockImplementation(async ({ data }: any) => ({
      id: "task-1",
      ...data,
      assignee: null,
    }));

    const task = await createHomeTaskBase(
      { title: "  Paint fence  ", notes: "" },
      USER_ID
    );

    expect(task.title).toBe("Paint fence");
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Paint fence",
          notes: null,
          isRecurring: false,
          intervalValue: null,
          intervalUnit: null,
          userId: USER_ID,
        }),
      })
    );
  });
});

describe("getHomeTasksBase", () => {
  beforeEach(() => mockedFindMany.mockResolvedValue([]));

  it("defaults to active tasks", async () => {
    await getHomeTasksBase(USER_ID);
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, status: "ACTIVE" },
      })
    );
  });

  it("builds an overdue cutoff", async () => {
    await getHomeTasksBase(USER_ID, { view: "overdue" });
    const where = mockedFindMany.mock.calls[0][0].where;
    expect(where.status).toBe("ACTIVE");
    expect(where.dueDate.lt).toBeInstanceOf(Date);
  });

  it("builds a dueSoon window of 7 days", async () => {
    await getHomeTasksBase(USER_ID, { view: "dueSoon" });
    const where = mockedFindMany.mock.calls[0][0].where;
    const spanDays =
      (where.dueDate.lte.getTime() - where.dueDate.gte.getTime()) /
      (1000 * 60 * 60 * 24);
    expect(Math.round(spanDays)).toBe(7);
  });

  it("filters completed and by assignee", async () => {
    await getHomeTasksBase(USER_ID, {
      view: "completed",
      assigneeId: "member-1",
    });
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: USER_ID,
          status: "COMPLETED",
          assigneeId: "member-1",
        },
      })
    );
  });
});

describe("completeHomeTaskBase", () => {
  it("rejects tasks owned by another user", async () => {
    mockedFindFirst.mockResolvedValue(null);
    await expect(completeHomeTaskBase("task-1", USER_ID)).rejects.toThrow(
      "Task not found"
    );
  });

  it("marks a one-off task COMPLETED and logs the completion", async () => {
    mockedFindFirst.mockResolvedValue({
      id: "task-1",
      isRecurring: false,
      dueDate: new Date("2026-07-01T00:00:00Z"),
      status: "ACTIVE",
      assigneeId: null,
    });
    mockedCompletionCreate.mockResolvedValue({ id: "comp-1" });
    mockedUpdate.mockResolvedValue({ id: "task-1", status: "COMPLETED" });

    await completeHomeTaskBase("task-1", USER_ID);

    expect(mockedCompletionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: "task-1",
          previousDueDate: new Date("2026-07-01T00:00:00Z"),
          userId: USER_ID,
        }),
      })
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });

  it("rolls a recurring task forward from the completion date, not the old due date", async () => {
    // Task was due 2026-01-01 (badly overdue), cadence 3 months.
    mockedFindFirst.mockResolvedValue({
      id: "task-2",
      isRecurring: true,
      intervalValue: 3,
      intervalUnit: "MONTH",
      dueDate: new Date("2026-01-01T00:00:00Z"),
      status: "ACTIVE",
      assigneeId: null,
    });
    mockedCompletionCreate.mockResolvedValue({ id: "comp-2" });
    mockedUpdate.mockResolvedValue({ id: "task-2" });

    const before = Date.now();
    await completeHomeTaskBase("task-2", USER_ID);

    const updateData = mockedUpdate.mock.calls[0][0].data;
    expect(updateData.status).toBeUndefined(); // stays ACTIVE
    const newDue: Date = updateData.dueDate;

    // Expected ≈ now + 3 months, NOT 2026-04-01 (old due + 3 months)
    const expected = new Date(before);
    expected.setMonth(expected.getMonth() + 3);
    expect(Math.abs(newDue.getTime() - expected.getTime())).toBeLessThan(
      1000 * 60
    );
  });

  it("rejects completing a non-active task", async () => {
    mockedFindFirst.mockResolvedValue({
      id: "task-3",
      status: "COMPLETED",
    });
    await expect(completeHomeTaskBase("task-3", USER_ID)).rejects.toThrow(
      "not active"
    );
  });
});

describe("uncompleteHomeTaskBase", () => {
  it("restores the previous due date and deletes the latest completion", async () => {
    mockedFindFirst.mockResolvedValue({
      id: "task-1",
      completions: [
        {
          id: "comp-2",
          completedAt: new Date("2026-07-10T00:00:00Z"),
          previousDueDate: new Date("2026-07-01T00:00:00Z"),
        },
        {
          id: "comp-1",
          completedAt: new Date("2026-04-01T00:00:00Z"),
        },
      ],
    });
    mockedCompletionDelete.mockResolvedValue({});
    mockedUpdate.mockResolvedValue({ id: "task-1" });

    await uncompleteHomeTaskBase("task-1", USER_ID);

    expect(mockedCompletionDelete).toHaveBeenCalledWith({
      where: { id: "comp-2" },
    });
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "ACTIVE",
          dueDate: new Date("2026-07-01T00:00:00Z"),
          lastCompletedAt: new Date("2026-04-01T00:00:00Z"),
        }),
      })
    );
  });

  it("rejects when there is nothing to undo", async () => {
    mockedFindFirst.mockResolvedValue({ id: "task-1", completions: [] });
    await expect(uncompleteHomeTaskBase("task-1", USER_ID)).rejects.toThrow(
      "no completions"
    );
  });
});

describe("deleteHomeTaskBase", () => {
  it("verifies ownership before deleting", async () => {
    mockedFindFirst.mockResolvedValue(null);
    await expect(deleteHomeTaskBase("task-1", USER_ID)).rejects.toThrow(
      "Task not found"
    );
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("deletes an owned task", async () => {
    mockedFindFirst.mockResolvedValue({ id: "task-1" });
    mockedDelete.mockResolvedValue({});
    await expect(deleteHomeTaskBase("task-1", USER_ID)).resolves.toEqual({
      success: true,
    });
  });
});
