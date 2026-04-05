/**
 * Grocery MCP Tools Registration
 *
 * Ports 6 grocery tools from the Python MCP server
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Props } from "../types/index.js";
import { wrapWithSentry } from "./sentry-utils.js";
import * as groceryApi from "./grocery-api.js";

// Zod schemas for input validation
const GetGroceryListSchema = {
  includeCompleted: z
    .boolean()
    .default(false)
    .describe(
      "If true, includes completed items from last 7 days. Default is false (active items only)."
    ),
};

const AddGroceryItemSchema = {
  name: z.string().describe("Name of the grocery item (required)"),
  quantity: z.number().optional().describe("Quantity of the item"),
  quantityUnit: z
    .string()
    .optional()
    .describe('Unit of measurement (e.g., "lbs", "cups", "pieces")'),
  recipeId: z.string().optional().describe("Associated recipe ID if item is from a recipe"),
};

const AddMultipleGroceryItemsSchema = {
  items: z
    .array(
      z.object({
        name: z.string().describe("Item name (required)"),
        quantity: z.number().optional().describe("Quantity as number"),
        quantityUnit: z.string().optional().describe("Unit of measurement"),
        recipeId: z.string().optional().describe("Associated recipe ID"),
      })
    )
    .min(1)
    .max(50)
    .describe("List of items to add (1-50 items)"),
};

const UpdateGroceryItemSchema = {
  itemId: z.string().describe("The unique identifier of the grocery item (required)"),
  name: z.string().optional().describe("New name for the item"),
  quantity: z.number().optional().describe("New quantity"),
  quantityUnit: z.string().optional().describe("New unit of measurement"),
  status: z
    .enum(["ACTIVE", "COMPLETED"])
    .optional()
    .describe('New status - "ACTIVE" or "COMPLETED"'),
};

const CompleteGroceryItemsSchema = {
  itemIds: z
    .array(z.string())
    .min(1)
    .describe("List of grocery item IDs to mark as completed (required)"),
};

const DeleteGroceryItemSchema = {
  itemId: z.string().describe("The unique identifier of the grocery item to delete (required)"),
};

/**
 * Register all grocery tools with the MCP server
 */
export function registerGroceryTools(
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

  // 6. getGroceryList
  server.tool(
    "getGroceryList",
    "Get the user's grocery list organized by section. Shows active items by default; optionally includes completed items from the last 7 days.",
    GetGroceryListSchema,
    wrapWithSentry("getGroceryList", async ({ includeCompleted }) => {
      const data = await groceryApi.getGroceryList(apiConfig, includeCompleted);

      const groceries = data.groceries || [];

      // Separate by status
      const active = groceries.filter((g) => g.status === "ACTIVE");
      const completed = groceries.filter((g) => g.status === "COMPLETED");

      // Group active by section
      const sections: Record<string, typeof active> = {};
      for (const item of active) {
        const sectionName = item.section?.name ?? "Uncategorized";
        if (!sections[sectionName]) sections[sectionName] = [];
        sections[sectionName].push(item);
      }

      let text = `**Grocery List** (${active.length} active`;
      if (includeCompleted) text += `, ${completed.length} completed`;
      text += ")\n\n";

      if (active.length === 0) {
        text += "Your grocery list is empty.\n";
      } else {
        for (const [section, items] of Object.entries(sections)) {
          text += `### ${section}\n`;
          for (const item of items) {
            text += `- ${item.name}`;
            if (item.quantity) {
              text += ` (${item.quantity}`;
              if (item.quantityUnit) text += ` ${item.quantityUnit}`;
              text += ")";
            }
            if (item.recipe?.title) text += ` — *from ${item.recipe.title}*`;
            text += ` \`${item.id}\`\n`;
          }
          text += "\n";
        }
      }

      if (includeCompleted && completed.length > 0) {
        text += `### Completed\n`;
        for (const item of completed) {
          text += `- ~~${item.name}~~`;
          if (item.quantity) {
            text += ` (${item.quantity}`;
            if (item.quantityUnit) text += ` ${item.quantityUnit}`;
            text += ")";
          }
          text += ` \`${item.id}\`\n`;
        }
      }

      return { content: [{ type: "text", text }] };
    })
  );

  // 7. addGroceryItem
  server.tool(
    "addGroceryItem",
    "Add a single item to the grocery list. Items are automatically classified into grocery sections (Produce, Dairy, Meat, etc.) using AI.",
    AddGroceryItemSchema,
    wrapWithSentry("addGroceryItem", async ({ name, quantity, quantityUnit, recipeId }) => {
      const data = await groceryApi.addGroceryItem(apiConfig, {
        name,
        quantity,
        quantityUnit,
        recipeId,
      });

      const item = data.grocery;
      const section = item.section?.name ?? "Uncategorized";

      return {
        content: [
          {
            type: "text",
            text: `**Added to Grocery List**\n\n- **${item.name}**${item.quantity ? ` (${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""})` : ""}\n- **Section**: ${section}\n- **ID**: \`${item.id}\``,
          },
        ],
      };
    })
  );

  // 8. addMultipleGroceryItems
  server.tool(
    "addMultipleGroceryItems",
    "Bulk add 1-50 items to the grocery list. Each item is added individually with AI section classification. Returns a summary of successful and failed additions.",
    AddMultipleGroceryItemsSchema,
    wrapWithSentry("addMultipleGroceryItems", async ({ items }) => {
      const results = await Promise.allSettled(
        items.map((item) =>
          groceryApi.addGroceryItem(apiConfig, {
            name: item.name,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
            recipeId: item.recipeId,
          })
        )
      );

      const successful: string[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const g = result.value.grocery;
          successful.push(
            `- ${g.name}${g.quantity ? ` (${g.quantity}${g.quantityUnit ? ` ${g.quantityUnit}` : ""})` : ""} — ${g.section?.name ?? "Uncategorized"}`
          );
        } else {
          failed.push(`- ${items[index].name}: ${result.reason}`);
        }
      });

      let text = `**Bulk Add Results** (${successful.length}/${items.length} added)\n\n`;

      if (successful.length > 0) {
        text += `### Added\n${successful.join("\n")}\n\n`;
      }
      if (failed.length > 0) {
        text += `### Failed\n${failed.join("\n")}\n`;
      }

      return { content: [{ type: "text", text }] };
    })
  );

  // 9. updateGroceryItem
  server.tool(
    "updateGroceryItem",
    "Update an existing grocery item. Only provided fields will be updated. Can change name, quantity, unit, or status.",
    UpdateGroceryItemSchema,
    wrapWithSentry(
      "updateGroceryItem",
      async ({ itemId, name, quantity, quantityUnit, status }) => {
        const itemUpdate: {
          id: string;
          name?: string;
          quantity?: number;
          quantityUnit?: string;
          status?: string;
        } = { id: itemId };
        if (name !== undefined) itemUpdate.name = name;
        if (quantity !== undefined) itemUpdate.quantity = quantity;
        if (quantityUnit !== undefined) itemUpdate.quantityUnit = quantityUnit;
        if (status !== undefined) itemUpdate.status = status;

        const data = await groceryApi.updateGroceryItem(apiConfig, itemUpdate);

        const item = data.grocery;

        return {
          content: [
            {
              type: "text",
              text: `**Grocery Item Updated**\n\n- **${item.name}**${item.quantity ? ` (${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""})` : ""}\n- **Status**: ${item.status}\n- **ID**: \`${item.id}\``,
            },
          ],
        };
      }
    )
  );

  // 10. completeGroceryItems
  server.tool(
    "completeGroceryItems",
    "Batch mark one or more grocery items as completed. Pass an array of item IDs.",
    CompleteGroceryItemsSchema,
    wrapWithSentry("completeGroceryItems", async ({ itemIds }) => {
      const data = await groceryApi.completeGroceryItems(apiConfig, itemIds);

      return {
        content: [
          {
            type: "text",
            text: `**Items Completed**\n\nMarked ${data.count} item(s) as completed.`,
          },
        ],
      };
    })
  );

  // 11. deleteGroceryItem
  server.tool(
    "deleteGroceryItem",
    "Permanently delete a grocery item from the list. This action cannot be undone.",
    DeleteGroceryItemSchema,
    wrapWithSentry("deleteGroceryItem", async ({ itemId }) => {
      const data = await groceryApi.deleteGroceryItem(apiConfig, itemId);

      return {
        content: [
          {
            type: "text",
            text: `**Grocery Item Deleted**\n\n- **ID**: \`${data.id}\``,
          },
        ],
      };
    })
  );
}
