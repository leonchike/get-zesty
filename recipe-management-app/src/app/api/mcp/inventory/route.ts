import { NextRequest, NextResponse } from "next/server";
import { verifyMCPAuth } from "@/lib/helpers/verify-mcp-auth";
import {
  getUserInventoryBase,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItemBase,
} from "@/features/inventory/actions/inventory-actions";
import type { InventoryStatus } from "@/features/inventory/types";

const VALID_STATUSES: InventoryStatus[] = ["ACTIVE", "CONSUMED", "DISCARDED"];

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    const locationId = req.nextUrl.searchParams.get("location_id");
    const statusParam = req.nextUrl.searchParams.get("status");
    const expiringWithinDaysParam = req.nextUrl.searchParams.get(
      "expiring_within_days"
    );
    const nameContains = req.nextUrl.searchParams.get("name_contains");

    const auth = await verifyMCPAuth(req, { user_id: user_id || undefined });
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const status =
      statusParam && VALID_STATUSES.includes(statusParam as InventoryStatus)
        ? (statusParam as InventoryStatus)
        : undefined;

    const expiringWithinDays = expiringWithinDaysParam
      ? Math.max(0, parseInt(expiringWithinDaysParam, 10) || 0)
      : undefined;

    const inventory = await getUserInventoryBase(auth.userId!, {
      status,
      locationId: locationId || undefined,
      expiringWithinDays,
      nameContains: nameContains || undefined,
    });

    return NextResponse.json({ inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
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

    const { item } = body;
    if (!item || !item.name) {
      return NextResponse.json(
        { error: "Item with name is required" },
        { status: 400 }
      );
    }

    const created = await createInventoryItem(
      {
        name: item.name,
        quantity: item.quantity ?? null,
        quantityUnit: item.quantityUnit ?? null,
        locationId: item.locationId ?? null,
        expiresAt: item.expiresAt ?? null,
        recipeId: item.recipeId ?? null,
        notes: item.notes ?? null,
      },
      auth.userId!
    );

    return NextResponse.json({ inventory: created });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create inventory item",
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

    const { item } = body;
    if (!item || !item.id) {
      return NextResponse.json(
        { error: "Item with id is required" },
        { status: 400 }
      );
    }

    const updated = await updateInventoryItem(
      {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        locationId: item.locationId,
        expiresAt: item.expiresAt,
        notes: item.notes,
        status: item.status,
      },
      auth.userId!
    );

    return NextResponse.json({ inventory: updated });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update inventory item",
      },
      { status: 500 }
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
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteInventoryItemBase(id, auth.userId!);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete inventory item",
      },
      { status: 500 }
    );
  }
}
