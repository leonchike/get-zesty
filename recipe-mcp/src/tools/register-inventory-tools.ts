/**
 * Inventory MCP Tools Registration
 *
 * 8 tools that mirror the grocery tools, scoped to kitchen inventory:
 * pantry, fridge, freezer, counter, and user-defined locations.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { InventoryItem, Props } from "../types/index.js";
import { wrapWithSentry } from "./sentry-utils.js";
import * as inventoryApi from "./inventory-api.js";

const StatusEnum = z.enum(["ACTIVE", "CONSUMED", "DISCARDED"]);

const GetInventorySchema = {
  locationName: z
    .string()
    .optional()
    .describe(
      'Filter to a single location by name (e.g. "Pantry", "Spices", "Fridge", "Freezer", "Counter", or a user-defined location).'
    ),
  status: StatusEnum.optional().describe(
    'Filter by status. Defaults to "ACTIVE" if omitted.'
  ),
  expiringWithinDays: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "If set, return only items expiring within this many days. Useful for 'what should I use soon?'."
    ),
  nameContains: z
    .string()
    .optional()
    .describe(
      "Case-insensitive substring match on the item name. Use this to search for specific items, e.g. 'parmesan', 'milk', 'tomato'."
    ),
};

const AddInventoryItemSchema = {
  name: z.string().describe("Name of the kitchen item (required)."),
  quantity: z.number().optional().describe("Quantity, e.g. 2."),
  quantityUnit: z
    .string()
    .optional()
    .describe('Unit, e.g. "jars", "lbs", "cups", "g".'),
  locationName: z
    .string()
    .optional()
    .describe(
      'Storage location name. If omitted, AI infers it (e.g. milk → Fridge).'
    ),
  expiresAt: z
    .string()
    .optional()
    .describe(
      "ISO date or YYYY-MM-DD for when this item expires. If omitted, AI may suggest one based on the item type."
    ),
  recipeId: z
    .string()
    .optional()
    .describe(
      "Optional Recipe ID — useful when logging leftovers from a recipe the user cooked."
    ),
  notes: z
    .string()
    .optional()
    .describe('Free-form notes, e.g. "opened on Tuesday".'),
};

const AddMultipleInventoryItemsSchema = {
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().optional(),
        quantityUnit: z.string().optional(),
        locationName: z.string().optional(),
        expiresAt: z.string().optional(),
        recipeId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1)
    .max(50)
    .describe("List of items to add (1-50)."),
};

const UpdateInventoryItemSchema = {
  itemId: z.string().describe("Inventory item ID (required)."),
  name: z.string().optional(),
  quantity: z.number().nullable().optional(),
  quantityUnit: z.string().nullable().optional(),
  locationName: z.string().optional().describe("New location name."),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .describe("New expiry date (ISO or YYYY-MM-DD). Pass null to clear."),
  notes: z.string().nullable().optional(),
  status: StatusEnum.optional(),
};

const ConsumeInventoryItemSchema = {
  itemId: z.string().describe("Inventory item ID (required)."),
  decrement: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      "How many units to subtract. Default 1. If equal to or greater than remaining quantity, the item is marked CONSUMED."
    ),
};

const DiscardInventoryItemSchema = {
  itemId: z
    .string()
    .describe("Inventory item ID to mark as discarded (thrown out)."),
};

const DeleteInventoryItemSchema = {
  itemId: z.string().describe("Inventory item ID to permanently delete."),
};

const ListExpiringSoonSchema = {
  withinDays: z
    .number()
    .int()
    .min(0)
    .default(3)
    .describe("Return items expiring within this many days. Default 3."),
};

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatExpiryBadge(date: string | null): string {
  const days = daysUntil(date);
  if (days === null) return "";
  if (days < 0) return ` — **Expired ${Math.abs(days)} day(s) ago**`;
  if (days <= 3) return ` — **Use soon (${days} day${days === 1 ? "" : "s"})**`;
  if (days <= 7) return ` — expires in ${days} days`;
  return "";
}

function formatItemLine(item: InventoryItem, opts: { showLocation?: boolean } = {}): string {
  const qty = item.quantity
    ? ` (${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""})`
    : "";
  const recipe = item.recipe?.title ? ` — *from ${item.recipe.title}*` : "";
  const expiry = formatExpiryBadge(item.expiresAt);
  const location = opts.showLocation
    ? ` _(in ${item.location?.name ?? "Unknown"})_`
    : "";
  return `- ${item.name}${qty}${location}${recipe}${expiry} \`${item.id}\``;
}

async function resolveLocationId(
  config: { baseUrl: string; apiKey: string; userId: string },
  locationName?: string
): Promise<string | undefined> {
  if (!locationName) return undefined;
  const { locations } = await inventoryApi.getInventoryLocations(config);
  const matched = locations.find(
    (l) => l.name.toLowerCase() === locationName.toLowerCase()
  );
  if (!matched) {
    throw new Error(
      `Location "${locationName}" not found. Available: ${locations.map((l) => l.name).join(", ")}.`
    );
  }
  return matched.id;
}

export function registerInventoryTools(
  server: McpServer,
  env: Env,
  _props: Props,
  userId: string
): void {
  const apiConfig = {
    baseUrl: (env as any).RECIPE_API_BASE_URL,
    apiKey: (env as any).RECIPE_API_KEY,
    userId,
  };

  server.tool(
    "getInventory",
    "Get the user's kitchen inventory grouped by location (Pantry, Fridge, Freezer, etc.). Shows active items by default with expiry indicators. Useful for 'what's in my fridge?' and similar questions. Pass `nameContains` to search items by name substring (e.g. 'parmesan').",
    GetInventorySchema,
    wrapWithSentry(
      "getInventory",
      async ({ locationName, status, expiringWithinDays, nameContains }) => {
        const locationId = await resolveLocationId(apiConfig, locationName);
        const data = await inventoryApi.getInventoryList(apiConfig, {
          locationId,
          status,
          expiringWithinDays,
          nameContains,
        });

        const items = data.inventory || [];
        const effectiveStatus = status ?? "ACTIVE";

        if (items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `**Inventory** (0 ${effectiveStatus.toLowerCase()})\n\nNo items found.`,
              },
            ],
          };
        }

        // Group by location
        const groups: Record<
          string,
          { emoji: string | null; items: InventoryItem[]; sortOrder: number }
        > = {};
        for (const item of items) {
          const key = item.location?.name ?? "Unknown";
          if (!groups[key]) {
            groups[key] = {
              emoji: item.location?.emoji ?? null,
              items: [],
              sortOrder: item.location?.sortOrder ?? 999,
            };
          }
          groups[key].items.push(item);
        }

        const expiringSoon = items.filter((i) => {
          const d = daysUntil(i.expiresAt);
          return d !== null && d <= 3;
        });

        let text = `**Inventory** (${items.length} ${effectiveStatus.toLowerCase()}`;
        if (effectiveStatus === "ACTIVE" && expiringSoon.length > 0) {
          text += ` · ${expiringSoon.length} expiring soon`;
        }
        text += ")\n\n";

        const sortedGroups = Object.entries(groups).sort(
          ([, a], [, b]) => a.sortOrder - b.sortOrder
        );

        for (const [name, group] of sortedGroups) {
          text += `### ${group.emoji ? `${group.emoji} ` : ""}${name}\n`;
          for (const item of group.items) {
            text += `${formatItemLine(item)}\n`;
          }
          text += "\n";
        }

        return { content: [{ type: "text", text }] };
      }
    )
  );

  server.tool(
    "addInventoryItem",
    "Add a single item to the kitchen inventory. If locationName is omitted, an AI classifier picks the best storage location (Pantry/Spices/Fridge/Freezer/Counter) and may suggest an expiry date based on typical shelf life.",
    AddInventoryItemSchema,
    wrapWithSentry(
      "addInventoryItem",
      async ({ name, quantity, quantityUnit, locationName, expiresAt, recipeId, notes }) => {
        const locationId = await resolveLocationId(apiConfig, locationName);
        const data = await inventoryApi.addInventoryItem(apiConfig, {
          name,
          quantity,
          quantityUnit,
          locationId,
          expiresAt,
          recipeId,
          notes,
        });

        const item = data.inventory;
        const lines = [
          `**Added to Inventory**`,
          ``,
          `- **${item.name}**${item.quantity ? ` (${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""})` : ""}`,
          `- **Location**: ${item.location?.emoji ? `${item.location.emoji} ` : ""}${item.location?.name ?? "Unknown"}`,
        ];
        if (item.expiresAt) {
          const days = daysUntil(item.expiresAt);
          lines.push(
            `- **Expires**: ${new Date(item.expiresAt).toISOString().slice(0, 10)}${days !== null ? ` (in ${days} day${days === 1 ? "" : "s"})` : ""}`
          );
        }
        if (item.recipe?.title) lines.push(`- **From recipe**: ${item.recipe.title}`);
        lines.push(`- **ID**: \`${item.id}\``);

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }
    )
  );

  server.tool(
    "addMultipleInventoryItems",
    "Bulk add 1-50 inventory items. Each is added individually with AI-assisted classification when location is omitted.",
    AddMultipleInventoryItemsSchema,
    wrapWithSentry("addMultipleInventoryItems", async ({ items }) => {
      const locationCache = new Map<string, string>();
      const resolveCached = async (name?: string): Promise<string | undefined> => {
        if (!name) return undefined;
        const key = name.toLowerCase();
        if (locationCache.has(key)) return locationCache.get(key);
        const id = await resolveLocationId(apiConfig, name);
        if (id) locationCache.set(key, id);
        return id;
      };

      const results = await Promise.allSettled(
        items.map(async (item) => {
          const locationId = await resolveCached(item.locationName);
          return inventoryApi.addInventoryItem(apiConfig, {
            name: item.name,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
            locationId,
            expiresAt: item.expiresAt,
            recipeId: item.recipeId,
            notes: item.notes,
          });
        })
      );

      const successful: string[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const it = result.value.inventory;
          successful.push(
            `- ${it.name}${it.quantity ? ` (${it.quantity}${it.quantityUnit ? ` ${it.quantityUnit}` : ""})` : ""} → ${it.location?.name ?? "Unknown"}`
          );
        } else {
          failed.push(`- ${items[index].name}: ${result.reason}`);
        }
      });

      let text = `**Bulk Inventory Add** (${successful.length}/${items.length} added)\n\n`;
      if (successful.length > 0) text += `### Added\n${successful.join("\n")}\n\n`;
      if (failed.length > 0) text += `### Failed\n${failed.join("\n")}\n`;

      return { content: [{ type: "text", text }] };
    })
  );

  server.tool(
    "updateInventoryItem",
    "Update fields on an existing inventory item: name, quantity, unit, location, expiry, notes, or status. Only provided fields change.",
    UpdateInventoryItemSchema,
    wrapWithSentry(
      "updateInventoryItem",
      async ({ itemId, name, quantity, quantityUnit, locationName, expiresAt, notes, status }) => {
        const locationId = await resolveLocationId(apiConfig, locationName);

        const update: inventoryApi.UpdateInventoryItemInput = { id: itemId };
        if (name !== undefined) update.name = name;
        if (quantity !== undefined) update.quantity = quantity;
        if (quantityUnit !== undefined) update.quantityUnit = quantityUnit;
        if (locationId !== undefined) update.locationId = locationId;
        if (expiresAt !== undefined) update.expiresAt = expiresAt;
        if (notes !== undefined) update.notes = notes;
        if (status !== undefined) update.status = status;

        const data = await inventoryApi.updateInventoryItem(apiConfig, update);
        const item = data.inventory;

        return {
          content: [
            {
              type: "text",
              text: [
                `**Inventory Item Updated**`,
                ``,
                `- **${item.name}**${item.quantity ? ` (${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""})` : ""}`,
                `- **Location**: ${item.location?.name ?? "Unknown"}`,
                `- **Status**: ${item.status}`,
                item.expiresAt
                  ? `- **Expires**: ${new Date(item.expiresAt).toISOString().slice(0, 10)}`
                  : `- **Expires**: —`,
                `- **ID**: \`${item.id}\``,
              ].join("\n"),
            },
          ],
        };
      }
    )
  );

  server.tool(
    "consumeInventoryItem",
    "Mark an inventory item as used. If the item has a quantity > decrement, the quantity is reduced. Otherwise, the item's status is set to CONSUMED. Use this when the user finishes off an item.",
    ConsumeInventoryItemSchema,
    wrapWithSentry("consumeInventoryItem", async ({ itemId, decrement }) => {
      const data = await inventoryApi.consumeInventoryItem(apiConfig, itemId, decrement);
      const item = data.inventory;
      const text =
        item.status === "CONSUMED"
          ? `**Marked Consumed**\n\n- **${item.name}** is now CONSUMED.\n- **ID**: \`${item.id}\``
          : `**Quantity Reduced**\n\n- **${item.name}** is now ${item.quantity ?? 0}${item.quantityUnit ? ` ${item.quantityUnit}` : ""} remaining.\n- **ID**: \`${item.id}\``;
      return { content: [{ type: "text", text }] };
    })
  );

  server.tool(
    "discardInventoryItem",
    "Mark an inventory item as thrown out (DISCARDED). Use this when something was wasted rather than eaten — useful for waste tracking later.",
    DiscardInventoryItemSchema,
    wrapWithSentry("discardInventoryItem", async ({ itemId }) => {
      const data = await inventoryApi.discardInventoryItem(apiConfig, itemId);
      const item = data.inventory;
      return {
        content: [
          {
            type: "text",
            text: `**Marked Discarded**\n\n- **${item.name}** is now DISCARDED.\n- **ID**: \`${item.id}\``,
          },
        ],
      };
    })
  );

  server.tool(
    "deleteInventoryItem",
    "Permanently delete an inventory item record. Prefer consumeInventoryItem or discardInventoryItem unless the entry was created in error.",
    DeleteInventoryItemSchema,
    wrapWithSentry("deleteInventoryItem", async ({ itemId }) => {
      const data = await inventoryApi.deleteInventoryItem(apiConfig, itemId);
      return {
        content: [
          {
            type: "text",
            text: `**Inventory Item Deleted**\n\n- **ID**: \`${data.id}\``,
          },
        ],
      };
    })
  );

  server.tool(
    "listExpiringSoon",
    "Return inventory items expiring within N days (default 3), sorted by soonest expiry. Useful for 'what should I cook before it goes bad?'.",
    ListExpiringSoonSchema,
    wrapWithSentry("listExpiringSoon", async ({ withinDays }) => {
      const data = await inventoryApi.getInventoryList(apiConfig, {
        status: "ACTIVE",
        expiringWithinDays: withinDays,
      });

      const items = data.inventory || [];

      if (items.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `**Expiring Soon** (0 items within ${withinDays} days)\n\nNothing on the watch list.`,
            },
          ],
        };
      }

      const sorted = [...items].sort((a, b) => {
        const da = daysUntil(a.expiresAt) ?? Infinity;
        const db = daysUntil(b.expiresAt) ?? Infinity;
        return da - db;
      });

      let text = `**Expiring Soon** (${items.length} within ${withinDays} days)\n\n`;
      for (const item of sorted) {
        text += `${formatItemLine(item, { showLocation: true })}\n`;
      }

      return { content: [{ type: "text", text }] };
    })
  );
}
