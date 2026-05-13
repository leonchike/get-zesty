import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import { discardInventoryItem } from "@/features/inventory/actions/inventory-actions";

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

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const updated = await discardInventoryItem(id, auth.userId!);
    return NextResponse.json({ inventory: updated });
  } catch (error) {
    console.error("Error discarding inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to discard inventory item",
      },
      { status: 500 }
    );
  }
}
