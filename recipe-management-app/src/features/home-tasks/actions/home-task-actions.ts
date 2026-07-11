"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma-client";
import { getUser } from "@/lib/actions/auth-actions";
import {
  computeNextDueDate,
  DUE_SOON_DAYS,
} from "@/features/home-tasks/lib/task-dates";
import type {
  CreateHomeTaskInput,
  HomeTaskFilter,
  UpdateHomeTaskInput,
} from "@/features/home-tasks/types";

const TASK_INCLUDE = {
  assignee: true,
} as const;

function validateRecurrence(input: {
  isRecurring?: boolean;
  intervalValue?: number | null;
  intervalUnit?: string | null;
}) {
  if (input.isRecurring) {
    if (!input.intervalValue || input.intervalValue < 1) {
      throw new Error("Recurring tasks need a repeat interval of at least 1");
    }
    if (!input.intervalUnit) {
      throw new Error("Recurring tasks need a repeat unit");
    }
  }
}

async function verifyAssignee(assigneeId: string, userId: string) {
  const member = await prisma.householdMember.findFirst({
    where: { id: assigneeId, userId },
  });
  if (!member) throw new Error("Assignee not found");
}

export async function getHomeTasksBase(
  userId: string,
  filter: HomeTaskFilter = {}
) {
  try {
    const where: Record<string, unknown> = { userId };
    const now = new Date();

    switch (filter.view) {
      case "completed":
        where.status = "COMPLETED";
        break;
      case "overdue":
        where.status = "ACTIVE";
        where.dueDate = { lt: now };
        break;
      case "dueSoon": {
        const cutoff = new Date(now);
        cutoff.setDate(
          cutoff.getDate() + (filter.dueWithinDays ?? DUE_SOON_DAYS)
        );
        where.status = "ACTIVE";
        where.dueDate = { gte: now, lte: cutoff };
        break;
      }
      default:
        where.status = "ACTIVE";
    }

    if (filter.assigneeId) {
      where.assigneeId = filter.assigneeId;
    }

    const tasks = await prisma.homeTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [
        { dueDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });

    return tasks;
  } catch (error) {
    console.error("Error getting home tasks:", error);
    throw new Error("Failed to get home tasks");
  }
}

export async function getHomeTasksAction(filter?: HomeTaskFilter) {
  const user = await getUser();
  if (!user?.id) return [];
  return getHomeTasksBase(user.id, filter ?? {});
}

export async function createHomeTaskBase(
  input: CreateHomeTaskInput,
  userId: string
) {
  if (!userId) throw new Error("User ID is required");
  if (!input.title?.trim()) throw new Error("Task title is required");
  validateRecurrence(input);

  try {
    if (input.assigneeId) {
      await verifyAssignee(input.assigneeId, userId);
    }

    const task = await prisma.homeTask.create({
      data: {
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        category: input.category?.trim() || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isRecurring: input.isRecurring ?? false,
        intervalValue: input.isRecurring ? input.intervalValue : null,
        intervalUnit: input.isRecurring ? input.intervalUnit : null,
        assigneeId: input.assigneeId || null,
        userId,
      },
      include: TASK_INCLUDE,
    });

    return task;
  } catch (error) {
    console.error("Error creating home task:", error);
    throw error instanceof Error ? error : new Error("Failed to create task");
  }
}

export async function createHomeTaskAction(input: CreateHomeTaskInput) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const task = await createHomeTaskBase(input, user.id);
  revalidatePath("/home-tasks");
  return task;
}

export async function updateHomeTaskBase(
  id: string,
  input: UpdateHomeTaskInput,
  userId: string
) {
  if (!userId) throw new Error("User ID is required");

  try {
    const existing = await prisma.homeTask.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Task not found");

    if (input.title !== undefined && !input.title.trim()) {
      throw new Error("Task title is required");
    }

    const isRecurring = input.isRecurring ?? existing.isRecurring;
    validateRecurrence({
      isRecurring,
      intervalValue:
        input.intervalValue !== undefined
          ? input.intervalValue
          : existing.intervalValue,
      intervalUnit:
        input.intervalUnit !== undefined
          ? input.intervalUnit
          : existing.intervalUnit,
    });

    if (input.assigneeId) {
      await verifyAssignee(input.assigneeId, userId);
    }

    const task = await prisma.homeTask.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.notes !== undefined && {
          notes: input.notes?.trim() || null,
        }),
        ...(input.category !== undefined && {
          category: input.category?.trim() || null,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.isRecurring !== undefined && {
          isRecurring: input.isRecurring,
        }),
        ...(!isRecurring
          ? { intervalValue: null, intervalUnit: null }
          : {
              ...(input.intervalValue !== undefined && {
                intervalValue: input.intervalValue,
              }),
              ...(input.intervalUnit !== undefined && {
                intervalUnit: input.intervalUnit,
              }),
            }),
        ...(input.assigneeId !== undefined && {
          assigneeId: input.assigneeId || null,
        }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: TASK_INCLUDE,
    });

    return task;
  } catch (error) {
    console.error("Error updating home task:", error);
    throw error instanceof Error ? error : new Error("Failed to update task");
  }
}

export async function updateHomeTaskAction(
  id: string,
  input: UpdateHomeTaskInput
) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const task = await updateHomeTaskBase(id, input, user.id);
  revalidatePath("/home-tasks");
  return task;
}

export async function deleteHomeTaskBase(id: string, userId: string) {
  if (!userId) throw new Error("User ID is required");

  try {
    const existing = await prisma.homeTask.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Task not found");

    await prisma.homeTask.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting home task:", error);
    throw error instanceof Error ? error : new Error("Failed to delete task");
  }
}

export async function deleteHomeTaskAction(id: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const result = await deleteHomeTaskBase(id, user.id);
  revalidatePath("/home-tasks");
  return result;
}

export async function completeHomeTaskBase(
  id: string,
  userId: string,
  completedById?: string | null
) {
  if (!userId) throw new Error("User ID is required");

  try {
    const task = await prisma.homeTask.findFirst({
      where: { id, userId },
    });
    if (!task) throw new Error("Task not found");
    if (task.status !== "ACTIVE") throw new Error("Task is not active");

    if (completedById) {
      await verifyAssignee(completedById, userId);
    }

    const now = new Date();

    const [, updated] = await prisma.$transaction([
      prisma.taskCompletion.create({
        data: {
          taskId: task.id,
          completedAt: now,
          previousDueDate: task.dueDate,
          completedById: completedById || task.assigneeId,
          userId,
        },
      }),
      prisma.homeTask.update({
        where: { id: task.id },
        data:
          task.isRecurring && task.intervalValue && task.intervalUnit
            ? {
                // Next due date anchors on the completion date, not the old
                // due date — filters last 3 months from when you changed them.
                dueDate: computeNextDueDate(
                  now,
                  task.intervalValue,
                  task.intervalUnit
                ),
                lastCompletedAt: now,
              }
            : {
                status: "COMPLETED",
                lastCompletedAt: now,
              },
        include: TASK_INCLUDE,
      }),
    ]);

    return updated;
  } catch (error) {
    console.error("Error completing home task:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to complete task");
  }
}

export async function completeHomeTaskAction(
  id: string,
  completedById?: string | null
) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const task = await completeHomeTaskBase(id, user.id, completedById);
  revalidatePath("/home-tasks");
  return task;
}

export async function uncompleteHomeTaskBase(id: string, userId: string) {
  if (!userId) throw new Error("User ID is required");

  try {
    const task = await prisma.homeTask.findFirst({
      where: { id, userId },
      include: {
        completions: { orderBy: { completedAt: "desc" }, take: 2 },
      },
    });
    if (!task) throw new Error("Task not found");

    const [latest, prior] = task.completions;
    if (!latest) throw new Error("Task has no completions to undo");

    const [, updated] = await prisma.$transaction([
      prisma.taskCompletion.delete({ where: { id: latest.id } }),
      prisma.homeTask.update({
        where: { id: task.id },
        data: {
          status: "ACTIVE",
          dueDate: latest.previousDueDate,
          lastCompletedAt: prior?.completedAt ?? null,
        },
        include: TASK_INCLUDE,
      }),
    ]);

    return updated;
  } catch (error) {
    console.error("Error uncompleting home task:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to undo completion");
  }
}

export async function uncompleteHomeTaskAction(id: string) {
  const user = await getUser();
  if (!user?.id) throw new Error("Not authenticated");
  const task = await uncompleteHomeTaskBase(id, user.id);
  revalidatePath("/home-tasks");
  return task;
}

export async function getTaskCompletionsBase(taskId: string, userId: string) {
  try {
    const task = await prisma.homeTask.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) throw new Error("Task not found");

    return prisma.taskCompletion.findMany({
      where: { taskId },
      include: { completedBy: true },
      orderBy: { completedAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting task completions:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get task history");
  }
}

export async function getTaskCompletionsAction(taskId: string) {
  const user = await getUser();
  if (!user?.id) return [];
  return getTaskCompletionsBase(taskId, user.id);
}
