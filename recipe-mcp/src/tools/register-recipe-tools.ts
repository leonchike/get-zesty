/**
 * Recipe MCP Tools Registration
 *
 * Ports 5 recipe tools from the Python MCP server
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Props } from "../types/index.js";
import { wrapWithSentry } from "./sentry-utils.js";
import * as recipeApi from "./recipe-api.js";

// Zod schemas for input validation
const SearchRecipesSchema = {
  search: z.string().optional().describe("Text search query for recipe title or description"),
  isFavorite: z.boolean().default(false).describe("Filter for favorite recipes only"),
  isPinned: z.boolean().default(false).describe("Filter for pinned recipes only"),
  isPersonal: z.boolean().default(true).describe("Filter for user's personal recipes only"),
  isPublic: z.boolean().default(false).describe("Filter for public recipes only"),
  cuisineTypes: z
    .array(z.string())
    .optional()
    .describe('List of cuisine types to filter by (e.g., ["Italian", "Mexican"])'),
  mealTypes: z
    .array(z.string())
    .optional()
    .describe('List of meal types to filter by (e.g., ["Dinner", "Lunch"])'),
  page: z.number().int().min(1).default(1).describe("Page number for pagination (default: 1)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(64)
    .default(20)
    .describe("Number of results per page (default: 20, max: 64)"),
};

const GetRecipeSchema = {
  recipeId: z.string().describe("The unique identifier of the recipe"),
};

const CreateRecipeSchema = {
  title: z.string().describe("Recipe title (required)"),
  ingredients: z.string().describe("Recipe ingredients as text (required)"),
  instructions: z.string().describe("Recipe instructions as text (required)"),
  description: z.string().optional().describe("Brief description of the recipe"),
  prepTime: z.number().optional().describe("Preparation time in minutes"),
  cookTime: z.number().optional().describe("Cooking time in minutes"),
  servings: z.number().optional().describe("Number of servings"),
  cuisineType: z.string().optional().describe('Type of cuisine (e.g., "Italian", "Mexican")'),
  mealType: z
    .string()
    .optional()
    .describe('Type of meal (e.g., "Dinner", "Lunch", "Breakfast")'),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .default("EASY")
    .describe("Recipe difficulty (default: EASY)"),
  isPublic: z
    .boolean()
    .default(false)
    .describe("Whether recipe is publicly visible (default: false)"),
  parseWithAI: z
    .boolean()
    .default(true)
    .describe("Use AI to parse ingredients and instructions (default: true)"),
};

const UpdateRecipeSchema = {
  recipeId: z.string().describe("The unique identifier of the recipe to update (required)"),
  title: z.string().optional().describe("New recipe title"),
  description: z.string().optional().describe("New description"),
  ingredients: z.string().optional().describe("New ingredients text"),
  instructions: z.string().optional().describe("New instructions text"),
  prepTime: z.number().optional().describe("New preparation time in minutes"),
  cookTime: z.number().optional().describe("New cooking time in minutes"),
  servings: z.number().optional().describe("New number of servings"),
  cuisineType: z.string().optional().describe("New cuisine type"),
  mealType: z.string().optional().describe("New meal type"),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .optional()
    .describe("New difficulty level"),
  isPublic: z.boolean().optional().describe("New public visibility setting"),
  parseWithAI: z
    .boolean()
    .default(true)
    .describe("Use AI to parse ingredients and instructions (default: true)"),
};

const DeleteRecipeSchema = {
  recipeId: z
    .string()
    .describe("The unique identifier of the recipe to delete (required)"),
};

/**
 * Register all recipe tools with the MCP server
 */
export function registerRecipeTools(
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

  // 1. searchRecipes
  server.tool(
    "searchRecipes",
    "Search and filter recipes in the recipe database. Supports text search, cuisine/meal type filters, favorites, pinned recipes, and pagination. Returns recipe summaries (not full details — use getRecipe for that).",
    SearchRecipesSchema,
    wrapWithSentry(
      "searchRecipes",
      async ({
        search,
        isFavorite,
        isPinned,
        isPersonal,
        isPublic,
        cuisineTypes,
        mealTypes,
        page,
        limit,
      }) => {
        const data = await recipeApi.searchRecipes(apiConfig, {
          search,
          isFavorite,
          isPinned,
          isPersonal,
          isPublic,
          cuisineTypes,
          mealTypes,
          page,
          limit,
        });

        const recipes = data.recipes || [];

        let text = `**Recipe Search Results** (${data.totalCount} total)\n\n`;

        if (recipes.length === 0) {
          text += "No recipes found matching your criteria.";
        } else {
          for (const r of recipes) {
            text += `### ${r.title}\n`;
            text += `- **ID**: \`${r.id}\`\n`;
            if (r.description) text += `- **Description**: ${r.description}\n`;
            if (r.cuisineType) text += `- **Cuisine**: ${r.cuisineType}\n`;
            if (r.mealType) text += `- **Meal**: ${r.mealType}\n`;
            text += `- **Difficulty**: ${r.difficulty}`;
            if (r.prepTime) text += ` | Prep: ${r.prepTime}min`;
            if (r.cookTime) text += ` | Cook: ${r.cookTime}min`;
            if (r.servings) text += ` | Servings: ${r.servings}`;
            text += "\n\n";
          }

          if (data.nextPage) {
            text += `\n---\n*Page ${page} of results. Use page=${data.nextPage} for more.*`;
          }
        }

        return { content: [{ type: "text", text }] };
      }
    )
  );

  // 2. getRecipe
  server.tool(
    "getRecipe",
    "Get full recipe details by ID, including ingredients, instructions, nutrition, and metadata.",
    GetRecipeSchema,
    wrapWithSentry("getRecipe", async ({ recipeId }) => {
      const r = await recipeApi.getRecipe(apiConfig, recipeId);

      let text = `# ${r.title}\n\n`;
      if (r.description) text += `${r.description}\n\n`;

      text += `## Details\n`;
      if (r.cuisineType) text += `- **Cuisine**: ${r.cuisineType}\n`;
      if (r.mealType) text += `- **Meal**: ${r.mealType}\n`;
      text += `- **Difficulty**: ${r.difficulty}\n`;
      if (r.prepTime) text += `- **Prep Time**: ${r.prepTime} min\n`;
      if (r.cookTime) text += `- **Cook Time**: ${r.cookTime} min\n`;
      if (r.restTime) text += `- **Rest Time**: ${r.restTime} min\n`;
      if (r.servings) text += `- **Servings**: ${r.servings}\n`;
      text += `- **Public**: ${r.isPublic ? "Yes" : "No"}\n`;
      if (r.source) text += `- **Source**: ${r.source}\n`;
      if (r.sourceUrl) text += `- **Source URL**: ${r.sourceUrl}\n`;

      if (r.ingredients) {
        text += `\n## Ingredients\n${r.ingredients}\n`;
      }
      if (r.instructions) {
        text += `\n## Instructions\n${r.instructions}\n`;
      }
      if (r.notes) {
        text += `\n## Notes\n${r.notes}\n`;
      }
      if (r.nutrition) {
        text += `\n## Nutrition\n\`\`\`json\n${JSON.stringify(r.nutrition, null, 2)}\n\`\`\`\n`;
      }

      text += `\n---\n*ID: ${r.id} | Created: ${r.createdAt} | Updated: ${r.updatedAt}*`;

      return { content: [{ type: "text", text }] };
    })
  );

  // 3. createRecipe
  server.tool(
    "createRecipe",
    "Create a new recipe with title, ingredients, and instructions. Optionally uses AI to parse ingredients and instructions into structured format.",
    CreateRecipeSchema,
    wrapWithSentry(
      "createRecipe",
      async ({
        title,
        ingredients,
        instructions,
        description,
        prepTime,
        cookTime,
        servings,
        cuisineType,
        mealType,
        difficulty,
        isPublic,
        parseWithAI,
      }) => {
        const data = await recipeApi.createRecipe(
          apiConfig,
          {
            title,
            ingredients,
            instructions,
            description,
            prepTime,
            cookTime,
            servings,
            cuisineType,
            mealType,
            difficulty,
            isPublic,
          },
          parseWithAI
        );

        return {
          content: [
            {
              type: "text",
              text: `**Recipe Created**\n\n- **Title**: ${title}\n- **ID**: \`${data.id}\``,
            },
          ],
        };
      }
    )
  );

  // 4. updateRecipe
  server.tool(
    "updateRecipe",
    "Update an existing recipe. Only provided fields will be updated. Use getRecipe first to see current values.",
    UpdateRecipeSchema,
    wrapWithSentry(
      "updateRecipe",
      async ({
        recipeId,
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        cuisineType,
        mealType,
        difficulty,
        isPublic,
        parseWithAI,
      }) => {
        // Build update object with only provided fields
        const updates: Record<string, any> = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (ingredients !== undefined) updates.ingredients = ingredients;
        if (instructions !== undefined) updates.instructions = instructions;
        if (prepTime !== undefined) updates.prepTime = prepTime;
        if (cookTime !== undefined) updates.cookTime = cookTime;
        if (servings !== undefined) updates.servings = servings;
        if (cuisineType !== undefined) updates.cuisineType = cuisineType;
        if (mealType !== undefined) updates.mealType = mealType;
        if (difficulty !== undefined) updates.difficulty = difficulty;
        if (isPublic !== undefined) updates.isPublic = isPublic;

        const data = await recipeApi.updateRecipe(apiConfig, recipeId, updates, parseWithAI);

        return {
          content: [
            {
              type: "text",
              text: `**Recipe Updated**\n\n- **ID**: \`${data.id}\`\n- **Fields updated**: ${Object.keys(updates).join(", ") || "none"}`,
            },
          ],
        };
      }
    )
  );

  // 5. deleteRecipe
  server.tool(
    "deleteRecipe",
    "Soft-delete a recipe. The recipe is marked as deleted but not permanently removed from the database.",
    DeleteRecipeSchema,
    wrapWithSentry("deleteRecipe", async ({ recipeId }) => {
      const data = await recipeApi.deleteRecipe(apiConfig, recipeId);

      return {
        content: [
          {
            type: "text",
            text: `**Recipe Deleted**\n\n- **ID**: \`${data.id}\``,
          },
        ],
      };
    })
  );
}
