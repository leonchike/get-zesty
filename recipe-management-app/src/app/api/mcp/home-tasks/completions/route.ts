import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { getTaskCompletionsBase } from "@/features/home-tasks/actions/home-task-actions";

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    const task_id = req.nextUrl.searchParams.get("task_id");

    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    if (!task_id) {
      return NextResponse.json(
        { error: "task_id is required" },
        { status: 400 }
      );
    }

    const completions = await getTaskCompletionsBase(task_id, auth.userId!);

    return NextResponse.json({ completions });
  } catch (error) {
    console.error("Error fetching task completions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch task history",
      },
      { status: error instanceof Error && error.message === "Task not found" ? 404 : 500 }
    );
  }
}
