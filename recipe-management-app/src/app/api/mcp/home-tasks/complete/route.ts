import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { completeHomeTaskBase } from "@/features/home-tasks/actions/home-task-actions";

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

    const { id, completed_by_id } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    const task = await completeHomeTaskBase(
      id,
      auth.userId!,
      completed_by_id ?? null
    );

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error completing home task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete task",
      },
      { status: error instanceof Error && error.message === "Task not found" ? 404 : 500 }
    );
  }
}
