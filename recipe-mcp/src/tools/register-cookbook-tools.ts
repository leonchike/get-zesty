/**
 * Cookbook MCP Tools Registration
 *
 * 4 new cookbook/RAG tools for searching a digital cookbook collection
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Props } from "../types/index.js";
import { wrapWithSentry } from "./sentry-utils.js";
import * as cookbookApi from "./cookbook-api.js";

// Zod schemas
const SearchCookbookRecipesSchema = {
  query: z
    .string()
    .describe(
      "Natural language search query (e.g., 'creamy pasta with mushrooms', 'quick weeknight dinner')"
    ),
  cookbookId: z.string().optional().describe("Filter results to a specific cookbook by ID"),
  cuisineType: z.string().optional().describe("Filter by cuisine type"),
  mealType: z.string().optional().describe("Filter by meal type"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum number of results (default: 10, max: 20)"),
};

const GetCookbookRecipeSchema = {
  recipeId: z.string().describe("The unique identifier of the cookbook recipe"),
};

const ListCookbooksSchema = {};

const ListCookbookRecipesSchema = {
  cookbookId: z.string().describe("The unique identifier of the cookbook to browse"),
  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Page number for pagination (default: 1)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(64)
    .default(50)
    .describe("Number of recipes per page (default: 50, max: 64)"),
};

const SearchByIngredientSchema = {
  ingredients: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('List of ingredients to search for (e.g., ["chicken", "lemon", "garlic"])'),
  matchAll: z
    .boolean()
    .default(false)
    .describe(
      "If true, only return recipes containing ALL listed ingredients. If false, return recipes matching ANY ingredient."
    ),
};

/**
 * Register all cookbook tools with the MCP server
 */
export function registerCookbookTools(
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

  // 12. searchCookbookRecipes
  server.tool(
    "searchCookbookRecipes",
    "Semantic/RAG search across the user's digital cookbook library. Uses vector similarity and full-text search to find recipes matching natural language queries. Returns ranked results with relevance scores.",
    SearchCookbookRecipesSchema,
    wrapWithSentry(
      "searchCookbookRecipes",
      async ({ query, cookbookId, cuisineType, mealType, limit }) => {
        const data = await cookbookApi.searchCookbookRecipes(apiConfig, query, {
          cookbookId,
          cuisineType,
          mealType,
          limit,
        });

        let text = `**Cookbook Search Results** (${data.totalCount} matches)\n\n`;
        text += `*Query: "${query}"*\n\n`;

        if (data.results.length === 0) {
          text += "No cookbook recipes found matching your query.";
        } else {
          for (const { recipe, score, matchType } of data.results) {
            text += `### ${recipe.title}\n`;
            text += `- **ID**: \`${recipe.id}\`\n`;
            text += `- **Score**: ${(score * 100).toFixed(1)}% (${matchType})\n`;
            if (recipe.cookbook) {
              text += `- **Book**: ${recipe.cookbook.title}`;
              if (recipe.cookbook.author) text += ` by ${recipe.cookbook.author}`;
              text += "\n";
            }
            if (recipe.pageNumber) text += `- **Page**: ${recipe.pageNumber}\n`;
            if (recipe.description) text += `- **Description**: ${recipe.description}\n`;
            if (recipe.cuisineType) text += `- **Cuisine**: ${recipe.cuisineType}\n`;
            if (recipe.mealType) text += `- **Meal**: ${recipe.mealType}\n`;
            text += "\n";
          }
        }

        return { content: [{ type: "text", text }] };
      }
    )
  );

  // 13. getCookbookRecipe
  server.tool(
    "getCookbookRecipe",
    "Get full details of a cookbook recipe by ID, including the source cookbook, page reference, ingredients, and instructions.",
    GetCookbookRecipeSchema,
    wrapWithSentry("getCookbookRecipe", async ({ recipeId }) => {
      const r = await cookbookApi.getCookbookRecipe(apiConfig, recipeId);

      let text = `# ${r.title}\n\n`;

      if (r.cookbook) {
        text += `*From: ${r.cookbook.title}`;
        if (r.cookbook.author) text += ` by ${r.cookbook.author}`;
        if (r.pageNumber) text += ` (p. ${r.pageNumber})`;
        text += "*\n\n";
      }

      if (r.description) text += `${r.description}\n\n`;

      text += `## Details\n`;
      if (r.cuisineType) text += `- **Cuisine**: ${r.cuisineType}\n`;
      if (r.mealType) text += `- **Meal**: ${r.mealType}\n`;
      if (r.servings) text += `- **Servings**: ${r.servings}\n`;
      if (r.prepTime) text += `- **Prep Time**: ${r.prepTime}\n`;
      if (r.cookTime) text += `- **Cook Time**: ${r.cookTime}\n`;

      if (r.ingredients) {
        text += `\n## Ingredients\n${r.ingredients}\n`;
      }
      if (r.instructions) {
        text += `\n## Instructions\n${r.instructions}\n`;
      }

      text += `\n---\n*Cookbook Recipe ID: ${r.id}*`;

      return { content: [{ type: "text", text }] };
    })
  );

  // 14. listCookbooks
  server.tool(
    "listCookbooks",
    "List all cookbooks in the user's digital cookbook library with recipe counts.",
    ListCookbooksSchema,
    wrapWithSentry("listCookbooks", async () => {
      const cookbooks = await cookbookApi.listCookbooks(apiConfig);

      let text = `**Cookbook Library** (${cookbooks.length} books)\n\n`;

      if (cookbooks.length === 0) {
        text += "No cookbooks in your library yet.";
      } else {
        for (const book of cookbooks) {
          text += `### ${book.title}\n`;
          text += `- **ID**: \`${book.id}\`\n`;
          if (book.author) text += `- **Author**: ${book.author}\n`;
          if (book.publisher) text += `- **Publisher**: ${book.publisher}\n`;
          if (book.year) text += `- **Year**: ${book.year}\n`;
          text += `- **Recipes**: ${book.recipeCount}\n`;
          if (book.description) text += `- ${book.description}\n`;
          text += "\n";
        }
      }

      return { content: [{ type: "text", text }] };
    })
  );

  // 15. listCookbookRecipes
  server.tool(
    "listCookbookRecipes",
    "List all recipes in a specific cookbook with pagination. Returns recipe summaries (title, description, page number, cuisine/meal type). Use this to browse a cookbook's contents before fetching full recipe details.",
    ListCookbookRecipesSchema,
    wrapWithSentry("listCookbookRecipes", async ({ cookbookId, page, limit }) => {
      const data = await cookbookApi.listCookbookRecipes(apiConfig, cookbookId, {
        page,
        limit,
      });

      let text = `**Cookbook Recipes** (${data.totalCount} total)\n\n`;

      if (data.recipes.length > 0 && data.recipes[0].cookbook) {
        const cb = data.recipes[0].cookbook;
        text += `*${cb.title}`;
        if (cb.author) text += ` by ${cb.author}`;
        text += `*\n\n`;
      }

      if (data.recipes.length === 0) {
        text += "No recipes found in this cookbook.";
      } else {
        for (const recipe of data.recipes) {
          text += `### ${recipe.title}\n`;
          text += `- **ID**: \`${recipe.id}\`\n`;
          if (recipe.pageNumber) text += `- **Page**: ${recipe.pageNumber}\n`;
          if (recipe.description) text += `- **Description**: ${recipe.description}\n`;
          if (recipe.cuisineType) text += `- **Cuisine**: ${recipe.cuisineType}\n`;
          if (recipe.mealType) text += `- **Meal**: ${recipe.mealType}\n`;
          text += "\n";
        }

        if (data.nextPage) {
          text += `---\n*Page ${page} of ${Math.ceil(data.totalCount / limit)} — use page: ${data.nextPage} for more*\n`;
        }
      }

      return { content: [{ type: "text", text }] };
    })
  );

  // 16. searchByIngredient
  server.tool(
    "searchByIngredient",
    "Find cookbook recipes by ingredient list. Can match ANY of the listed ingredients (default) or require ALL of them. Useful for finding recipes based on what you have on hand.",
    SearchByIngredientSchema,
    wrapWithSentry("searchByIngredient", async ({ ingredients, matchAll }) => {
      const data = await cookbookApi.searchByIngredient(apiConfig, ingredients, matchAll);

      let text = `**Ingredient Search Results** (${data.totalCount} matches)\n\n`;
      text += `*Ingredients: ${ingredients.join(", ")} (match ${matchAll ? "ALL" : "ANY"})*\n\n`;

      if (data.results.length === 0) {
        text += "No cookbook recipes found with those ingredients.";
      } else {
        for (const { recipe, score } of data.results) {
          text += `### ${recipe.title}\n`;
          text += `- **ID**: \`${recipe.id}\`\n`;
          text += `- **Match**: ${(score * 100).toFixed(0)}%\n`;
          if (recipe.cookbook) {
            text += `- **Book**: ${recipe.cookbook.title}`;
            if (recipe.cookbook.author) text += ` by ${recipe.cookbook.author}`;
            text += "\n";
          }
          if (recipe.description) text += `- ${recipe.description}\n`;
          text += "\n";
        }
      }

      return { content: [{ type: "text", text }] };
    })
  );
}
