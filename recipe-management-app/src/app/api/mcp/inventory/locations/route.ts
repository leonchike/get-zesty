import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import {
  getUserInventoryLocations,
  createUserLocation,
} from "@/features/inventory/actions/inventory-actions";

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const locations = await getUserInventoryLocations(auth.userId!);
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching inventory locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory locations" },
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

    const { name, emoji } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 }
      );
    }

    const location = await createUserLocation(
      { name, emoji: emoji ?? null },
      auth.userId!
    );
    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error creating inventory location:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create inventory location",
      },
      { status: 500 }
    );
  }
}
