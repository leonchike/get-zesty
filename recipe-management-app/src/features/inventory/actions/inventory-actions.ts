"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma-client";
import { getUser, redirectToLogin } from "@/lib/actions/auth-actions";
import { classifyInventoryWithAI } from "@/lib/functions/ai-inventory-classification";
import { withTimeout } from "@/lib/functions/with-timeout";
import { FALLBACK_LOCATION_NAME } from "@/features/inventory/constants/inventory-defaults";
import { resolveRecipeLink } from "@/lib/helpers/resolve-recipe-link";
import type {
  CreateInventoryItemInput,
  InventoryFilter,
  UpdateInventoryItemInput,
} from "@/features/inventory/types";

const INVENTORY_INCLUDE = {
  location: true,
  recipe: true,
  cookbookRecipe: true,
} as const;

export async function getUserInventoryBase(
  userId: string,
  filter: InventoryFilter = {}
) {
  try {
    const where: Record<string, unknown> = { userId };

    if (filter.status) {
      where.status = filter.status;
    } else {
      where.status = "ACTIVE";
    }

    if (filter.locationId) {
      where.locationId = filter.locationId;
    }

    if (
      typeof filter.expiringWithinDays === "number" &&
      filter.expiringWithinDays >= 0
    ) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + filter.expiringWithinDays);
      where.expiresAt = { lte: cutoff, not: null };
    }

    if (filter.nameContains && filter.nameContains.trim()) {
      where.name = { contains: filter.nameContains.trim(), mode: "insensitive" };
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: INVENTORY_INCLUDE,
      orderBy: [
        { expiresAt: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });

    return items;
  } catch (error) {
    console.error("Error getting user inventory:", error);
    throw new Error("Failed to get user inventory");
  }
}

export async function getUserInventoryAction(filter?: InventoryFilter) {
  const user = await getUser();
  if (!user?.id) return [];
  return getUserInventoryBase(user.id, filter ?? {});
}

export async function getUserInventoryLocations(userId: string) {
  try {
    const locations = await prisma.inventoryLocation.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return locations;
  } catch (error) {
    console.error("Error getting inventory locations:", error);
    throw new Error("Failed to get inventory locations");
  }
}

export async function getUserInventoryLocationsAction() {
  const user = await getUser();
  if (!user?.id) return [];
  return getUserInventoryLocations(user.id);
}

async function resolveLocationId(
  input: { name: string; locationId?: string | null },
  userId: string,
  availableLocations: { id: string; name: string }[]
): Promise<{ locationId: string; suggestedShelfLifeDays: number | null }> {
  if (input.locationId) {
    const match = availableLocations.find((l) => l.id === input.locationId);
    if (match) {
      return { locationId: match.id, suggestedShelfLifeDays: null };
    }
  }

  let suggestedShelfLifeDays: number | null = null;
  let matchedName: string | null = null;

  try {
    const classification = await withTimeout(
      classifyInventoryWithAI(input.name, availableLocations),
      10000
    );
    if (classification) {
      matchedName = classification.locationName;
      suggestedShelfLifeDays = classification.suggestedShelfLifeDays;
    }
  } catch (error) {
    console.warn(
      `Inventory classification for '${input.name}' timed out or failed. Falling back to ${FALLBACK_LOCATION_NAME}.`
    );
  }

  const fallback =
    availableLocations.find(
      (l) => l.name.toLowerCase() === FALLBACK_LOCATION_NAME.toLowerCase()
    ) ?? availableLocations[0];

  const matched = matchedName
    ? availableLocations.find(
        (l) => l.name.toLowerCase() === matchedName!.toLowerCase()
      )
    : null;

  return {
    locationId: (matched ?? fallback).id,
    suggestedShelfLifeDays,
  };
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
  userId: string
) {
  if (!userId) throw new Error("User ID is required");
  if (!input.name?.trim()) throw new Error("Item name is required");

  try {
    const availableLocations = await getUserInventoryLocations(userId);
    if (availableLocations.length === 0) {
      throw new Error(
        "No inventory locations available. Seed defaults via `npm run seed-inventory-locations`."
      );
    }

    const { locationId, suggestedShelfLifeDays } = await resolveLocationId(
      { name: input.name, locationId: input.locationId },
      userId,
      availableLocations
    );

    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      expiresAt = new Date(input.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) expiresAt = null;
    } else if (suggestedShelfLifeDays && suggestedShelfLifeDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + suggestedShelfLifeDays);
    }

    const recipeLink = await resolveRecipeLink(input.recipeId, userId);

    const item = await prisma.inventoryItem.create({
      data: {
        name: input.name.trim(),
        quantity: input.quantity ?? null,
        quantityUnit: input.quantityUnit ?? null,
        notes: input.notes ?? null,
        ...recipeLink,
        locationId,
        userId,
        expiresAt,
        status: "ACTIVE",
      },
      include: INVENTORY_INCLUDE,
    });

    revalidatePath("/inventory");
    return item;
  } catch (error) {
    console.error("Error creating inventory item:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create inventory item"
    );
  }
}

export async function createInventoryItemAction(input: CreateInventoryItemInput) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return createInventoryItem(input, user.id);
}

export async function updateInventoryItem(
  input: UpdateInventoryItemInput,
  userId: string
) {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: input.id, userId },
    });
    if (!existing) {
      throw new Error("Inventory item not found or does not belong to the user");
    }

    if (input.locationId) {
      const location = await prisma.inventoryLocation.findFirst({
        where: {
          id: input.locationId,
          OR: [{ userId: null }, { userId }],
        },
      });
      if (!location) {
        throw new Error("Location not found or does not belong to the user");
      }
    }

    let expiresAt: Date | null | undefined = undefined;
    if (input.expiresAt === null) {
      expiresAt = null;
    } else if (input.expiresAt !== undefined) {
      const parsed = new Date(input.expiresAt);
      expiresAt = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: input.id },
      data: {
        name: input.name,
        quantity: input.quantity,
        quantityUnit: input.quantityUnit,
        locationId: input.locationId,
        notes: input.notes,
        status: input.status,
        expiresAt,
      },
      include: INVENTORY_INCLUDE,
    });

    revalidatePath("/inventory");
    return updated;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update inventory item"
    );
  }
}

export async function updateInventoryItemAction(input: UpdateInventoryItemInput) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return updateInventoryItem(input, user.id);
}

export async function consumeInventoryItem(
  id: string,
  userId: string,
  decrement = 1
) {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Inventory item not found or does not belong to the user");
    }

    const step = Math.max(1, Math.round(decrement));

    if (
      typeof existing.quantity === "number" &&
      existing.quantity !== null &&
      existing.quantity > step
    ) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: { quantity: existing.quantity - step },
        include: INVENTORY_INCLUDE,
      });
      revalidatePath("/inventory");
      return updated;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { status: "CONSUMED", quantity: 0 },
      include: INVENTORY_INCLUDE,
    });
    revalidatePath("/inventory");
    return updated;
  } catch (error) {
    console.error("Error consuming inventory item:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to consume inventory item"
    );
  }
}

export async function consumeInventoryItemAction(id: string, decrement = 1) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return consumeInventoryItem(id, user.id, decrement);
}

export async function discardInventoryItem(id: string, userId: string) {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Inventory item not found or does not belong to the user");
    }
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { status: "DISCARDED" },
      include: INVENTORY_INCLUDE,
    });
    revalidatePath("/inventory");
    return updated;
  } catch (error) {
    console.error("Error discarding inventory item:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to discard inventory item"
    );
  }
}

export async function discardInventoryItemAction(id: string) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return discardInventoryItem(id, user.id);
}

export async function deleteInventoryItemBase(id: string, userId: string) {
  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("Inventory item not found or does not belong to the user");
    }
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/inventory");
    return { id };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete inventory item"
    );
  }
}

export async function deleteInventoryItemAction(id: string) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return deleteInventoryItemBase(id, user.id);
}

export async function createUserLocation(
  input: { name: string; emoji?: string | null },
  userId: string
) {
  const name = input.name?.trim();
  if (!name) throw new Error("Location name is required");
  try {
    const location = await prisma.inventoryLocation.create({
      data: {
        name,
        emoji: input.emoji ?? null,
        isUserCreated: true,
        userId,
        sortOrder: 100,
      },
    });
    revalidatePath("/inventory");
    return location;
  } catch (error) {
    console.error("Error creating user location:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create location"
    );
  }
}

export async function createUserLocationAction(input: {
  name: string;
  emoji?: string | null;
}) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return createUserLocation(input, user.id);
}

export async function renameUserLocation(
  id: string,
  name: string,
  userId: string
) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error("Location name is required");
  try {
    const existing = await prisma.inventoryLocation.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error(
        "Location not found, not owned by user, or is a global default"
      );
    }
    const updated = await prisma.inventoryLocation.update({
      where: { id },
      data: { name: trimmed },
    });
    revalidatePath("/inventory");
    return updated;
  } catch (error) {
    console.error("Error renaming user location:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to rename location"
    );
  }
}

export async function deleteUserLocation(id: string, userId: string) {
  try {
    const existing = await prisma.inventoryLocation.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error(
        "Location not found, not owned by user, or is a global default"
      );
    }
    const itemCount = await prisma.inventoryItem.count({
      where: { locationId: id },
    });
    if (itemCount > 0) {
      throw new Error(
        `Cannot delete location with ${itemCount} item(s). Move or remove items first.`
      );
    }
    await prisma.inventoryLocation.delete({ where: { id } });
    revalidatePath("/inventory");
    return { id };
  } catch (error) {
    console.error("Error deleting user location:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete location"
    );
  }
}
