import type {
  InventoryItem,
  InventoryLocation,
  Recipe,
  CookbookRecipe,
} from "@prisma/client";

export type InventoryItemWithRelations = InventoryItem & {
  location: InventoryLocation;
  recipe: Recipe | null;
  cookbookRecipe: CookbookRecipe | null;
};

export type InventoryStatus = "ACTIVE" | "CONSUMED" | "DISCARDED";

export interface CreateInventoryItemInput {
  name: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  locationId?: string | null;
  expiresAt?: Date | string | null;
  recipeId?: string | null;
  notes?: string | null;
}

export interface UpdateInventoryItemInput {
  id: string;
  name?: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  locationId?: string;
  expiresAt?: Date | string | null;
  notes?: string | null;
  status?: InventoryStatus;
}

export interface InventoryFilter {
  locationId?: string;
  status?: InventoryStatus;
  expiringWithinDays?: number;
  nameContains?: string;
}
