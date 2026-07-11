import { NextRequest, NextResponse } from "next/server";
import { getMobileUserId } from "@/lib/helpers/mobile-auth";
import {
  createHomeTaskBase,
  getHomeTasksBase,
} from "@/features/home-tasks/actions/home-task-actions";
import type { HomeTaskView } from "@/features/home-tasks/types";

const VALID_VIEWS: HomeTaskView[] = ["all", "overdue", "dueSoon", "completed"];

export async function GET(req: NextRequest) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const viewParam = searchParams.get("view");
  const view = VALID_VIEWS.includes(viewParam as HomeTaskView)
    ? (viewParam as HomeTaskView)
    : undefined;
  const assigneeId = searchParams.get("assignee_id") ?? undefined;

  try {
    const tasks = await getHomeTasksBase(userId, { view, assigneeId });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const task = await createHomeTaskBase(body, userId);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
