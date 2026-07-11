import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import {
  createHomeTaskBase,
  deleteHomeTaskBase,
  getHomeTasksBase,
  updateHomeTaskBase,
} from "@/features/home-tasks/actions/home-task-actions";
import type { HomeTaskView } from "@/features/home-tasks/types";

const VALID_VIEWS: HomeTaskView[] = ["all", "overdue", "dueSoon", "completed"];

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    const viewParam = req.nextUrl.searchParams.get("view");
    const assigneeId = req.nextUrl.searchParams.get("assignee_id");
    const dueWithinDaysParam = req.nextUrl.searchParams.get("due_within_days");

    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const view =
      viewParam && VALID_VIEWS.includes(viewParam as HomeTaskView)
        ? (viewParam as HomeTaskView)
        : undefined;

    const dueWithinDays = dueWithinDaysParam
      ? Math.max(0, parseInt(dueWithinDaysParam, 10) || 0)
      : undefined;

    const tasks = await getHomeTasksBase(auth.userId!, {
      view,
      assigneeId: assigneeId || undefined,
      dueWithinDays,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching home tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch home tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { task } = body;
    if (!task || !task.title) {
      return NextResponse.json(
        { error: "Task with title is required" },
        { status: 400 }
      );
    }

    const created = await createHomeTaskBase(
      {
        title: task.title,
        notes: task.notes ?? null,
        category: task.category ?? null,
        dueDate: task.dueDate ?? null,
        isRecurring: task.isRecurring ?? false,
        intervalValue: task.intervalValue ?? null,
        intervalUnit: task.intervalUnit ?? null,
        assigneeId: task.assigneeId ?? null,
      },
      auth.userId!
    );

    return NextResponse.json({ task: created });
  } catch (error) {
    console.error("Error creating home task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create task",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { task } = body;
    if (!task || !task.id) {
      return NextResponse.json(
        { error: "Task with id is required" },
        { status: 400 }
      );
    }

    // Only forward fields that were provided — updateHomeTaskBase treats
    // undefined as "leave unchanged"
    const { id, ...fields } = task;
    const updated = await updateHomeTaskBase(id, fields, auth.userId!);

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Error updating home task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update task",
      },
      { status: error instanceof Error && error.message === "Task not found" ? 404 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await verifyMCPAuth(req, body);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    await deleteHomeTaskBase(id, auth.userId!);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting home task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete task",
      },
      { status: error instanceof Error && error.message === "Task not found" ? 404 : 500 }
    );
  }
}
