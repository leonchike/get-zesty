# Recipe Manager MCP Server

A Model Context Protocol (MCP) server that provides AI agents with full access to a user's personal recipe collection and digital cookbook library. Built with TypeScript on Cloudflare Workers, it exposes 15 tools across three domains: **Recipes**, **Groceries**, and **Cookbooks**.

## Purpose

This MCP server enables an AI agent to act as a knowledgeable cooking assistant that can:

- Browse, search, and manage the user's personal recipe collection
- Explore recipes from the user's digitized cookbook library using semantic (RAG) search
- Find cookbook recipes by ingredients the user has on hand
- Manage the user's grocery list, including adding items from recipes

The server connects to a Next.js Recipe Manager web application via authenticated API calls. All data is scoped to the authenticated user — the agent only sees recipes and cookbooks belonging to that user.

---

## Two Recipe Domains

The user has two distinct sources of recipes, each with its own set of tools:

### Personal Recipes (Recipe Tools)
Recipes the user has created, imported, or saved in their Recipe Manager app. These are fully editable — the agent can search, view, create, update, and delete them. Each recipe has structured metadata (cuisine type, meal type, difficulty, timings, servings) and content (ingredients, instructions, nutrition, notes).

### Cookbook Recipes (Cookbook Tools)
Recipes extracted from the user's physical cookbooks that have been digitized and indexed. These are **read-only** — the agent can search and view them but cannot modify them. Cookbook recipes support semantic/natural language search powered by vector embeddings, making them ideal for exploratory queries like "something hearty with root vegetables" or "quick Asian-inspired appetizers."

---

## Tools Reference

### Recipe Tools (5)

#### `searchRecipes`
Search and filter the user's personal recipe collection. Returns summaries, not full details — use `getRecipe` for complete information.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | — | Text search across recipe title and description |
| `isFavorite` | boolean | No | `false` | Only show recipes the user has favorited |
| `isPinned` | boolean | No | `false` | Only show recipes the user has pinned |
| `isPersonal` | boolean | No | `true` | Only show the user's own recipes |
| `isPublic` | boolean | No | `false` | Only show publicly shared recipes |
| `cuisineTypes` | string[] | No | — | Filter by cuisine (e.g., `["Italian", "Mexican"]`) |
| `mealTypes` | string[] | No | — | Filter by meal (e.g., `["Dinner", "Lunch"]`) |
| `page` | number | No | `1` | Pagination page number |
| `limit` | number | No | `20` | Results per page (max: 64) |

**Returns:** List of recipe summaries with `id`, `title`, `description`, `cuisineType`, `mealType`, `difficulty`, `prepTime`, `cookTime`, `servings`. Also returns `totalCount` and `nextPage` for pagination.

**Usage notes:**
- Default behavior (no filters) returns the user's personal recipes
- Combine filters to narrow results: `{ search: "chicken", cuisineTypes: ["Thai"], mealTypes: ["Dinner"] }`
- Always check `totalCount` and `nextPage` — there may be more results than the current page shows
- Recipe IDs from search results can be passed to `getRecipe` for full details

---

#### `getRecipe`
Get complete details for a single recipe by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string | Yes | The unique recipe identifier |

**Returns:** Full recipe including:
- **Metadata:** title, description, cuisineType, mealType, difficulty, prepTime, cookTime, restTime, servings, isPublic, source, sourceUrl, imageUrl
- **Content:** ingredients (raw text), instructions (raw text), parsedIngredients (structured JSON), parsedInstructions (structured JSON), notes, utensils, nutrition (JSON)
- **Timestamps:** createdAt, updatedAt

**Usage notes:**
- Always use this after `searchRecipes` to get the full recipe content
- The `parsedIngredients` and `parsedInstructions` fields contain AI-structured versions of the raw text (quantities, units, steps)
- `nutrition` is a JSON object with nutritional breakdown when available

---

#### `createRecipe`
Create a new recipe in the user's collection.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | Yes | — | Recipe title |
| `ingredients` | string | Yes | — | Ingredients as text (one per line recommended) |
| `instructions` | string | Yes | — | Instructions as text (numbered steps recommended) |
| `description` | string | No | — | Brief description |
| `prepTime` | number | No | — | Preparation time in minutes |
| `cookTime` | number | No | — | Cooking time in minutes |
| `servings` | number | No | — | Number of servings |
| `cuisineType` | string | No | — | Cuisine type (e.g., "Italian") |
| `mealType` | string | No | — | Meal type (e.g., "Dinner") |
| `difficulty` | enum | No | `"EASY"` | `"EASY"`, `"MEDIUM"`, or `"HARD"` |
| `isPublic` | boolean | No | `false` | Whether the recipe is publicly visible |
| `parseWithAI` | boolean | No | `true` | Use AI to parse ingredients/instructions into structured format |

**Returns:** The new recipe's `id`.

**Usage notes:**
- `parseWithAI: true` (default) creates structured `parsedIngredients` and `parsedInstructions` in addition to the raw text — this takes longer but improves the recipe's usability in the app
- Created recipes are automatically assigned `source: "USER"`
- Format ingredients as one item per line for best AI parsing results

---

#### `updateRecipe`
Partially update an existing recipe. Only provided fields are modified.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string | Yes | Recipe ID to update |
| `title` | string | No | New title |
| `description` | string | No | New description |
| `ingredients` | string | No | New ingredients text |
| `instructions` | string | No | New instructions text |
| `prepTime` | number | No | New prep time in minutes |
| `cookTime` | number | No | New cook time in minutes |
| `servings` | number | No | New serving count |
| `cuisineType` | string | No | New cuisine type |
| `mealType` | string | No | New meal type |
| `difficulty` | enum | No | `"EASY"`, `"MEDIUM"`, or `"HARD"` |
| `isPublic` | boolean | No | New visibility setting |
| `parseWithAI` | boolean | No | Re-parse ingredients/instructions with AI (default: true) |

**Returns:** The recipe `id` and list of updated field names.

**Usage notes:**
- Use `getRecipe` first to see current values before updating
- Only include fields you want to change — omitted fields are left untouched

---

#### `deleteRecipe`
Soft-delete a recipe. The recipe is marked as deleted but not permanently removed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string | Yes | Recipe ID to delete |

**Returns:** The deleted recipe's `id`.

---

### Grocery Tools (6)

#### `getGroceryList`
Retrieve the user's grocery list organized by section (Produce, Dairy, Meat, etc.).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeCompleted` | boolean | No | `false` | Include items completed in the last 7 days |

**Returns:** Grocery items grouped by section. Each item includes: `id`, `name`, `quantity`, `quantityUnit`, `status` ("ACTIVE" or "COMPLETED"), `section.name`, and optionally `recipe.title` (if the item was added from a recipe).

**Usage notes:**
- By default, only shows ACTIVE items
- Items are auto-categorized into grocery store sections (Produce, Dairy, Meat & Seafood, etc.) using AI when they are added
- Item IDs are needed for update, complete, and delete operations

---

#### `addGroceryItem`
Add a single item to the grocery list. The item is automatically classified into a grocery section using AI.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Item name (e.g., "chicken breast") |
| `quantity` | number | No | Quantity |
| `quantityUnit` | string | No | Unit (e.g., "lbs", "cups", "pieces") |
| `recipeId` | string | No | Associate with a recipe |

**Returns:** The created item with its assigned `section` and `id`.

---

#### `addMultipleGroceryItems`
Bulk add 1-50 items to the grocery list. Each item is individually classified into a section.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | array | Yes | Array of 1-50 items, each with `name` (required), `quantity`, `quantityUnit`, `recipeId` |

**Returns:** Summary of successful and failed additions with section assignments.

**Usage notes:**
- Use this instead of `addGroceryItem` when adding ingredients from a recipe
- Pass the recipe's `recipeId` to associate grocery items with their source recipe

---

#### `updateGroceryItem`
Update an existing grocery item's name, quantity, unit, or status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | The grocery item ID |
| `name` | string | No | New item name |
| `quantity` | number | No | New quantity |
| `quantityUnit` | string | No | New unit |
| `status` | enum | No | `"ACTIVE"` or `"COMPLETED"` |

---

#### `completeGroceryItems`
Batch-mark one or more grocery items as completed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemIds` | string[] | Yes | Array of item IDs to mark completed |

**Returns:** Count of completed items.

---

#### `deleteGroceryItem`
Permanently delete a grocery item. This cannot be undone.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | The grocery item ID to delete |

---

### Cookbook Tools (4)

#### `searchCookbookRecipes`
Semantic/RAG search across the user's digitized cookbook library. Uses vector similarity and full-text search to find recipes matching natural language queries. This is the primary discovery tool for cookbook recipes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | — | Natural language search query |
| `cookbookId` | string | No | — | Restrict search to a specific cookbook |
| `cuisineType` | string | No | — | Filter by cuisine type |
| `mealType` | string | No | — | Filter by meal type |
| `limit` | number | No | `10` | Max results (max: 20) |

**Returns:** Ranked results, each with:
- `recipe`: title, id, description, cuisineType, mealType, pageNumber, cookbook info (title, author)
- `score`: Relevance score (0-1, higher is better)
- `matchType`: How the match was found — `"semantic"` (vector similarity), `"fulltext"` (keyword match), or `"hybrid"` (both)

**Usage notes:**
- Supports natural language queries: "creamy pasta with mushrooms", "quick weeknight dinner", "something with leftover chicken"
- Semantic search understands meaning, not just keywords — "comfort food" will find stews, mac and cheese, etc.
- Use `cookbookId` (from `listCookbooks`) to search within a specific book
- Use `getCookbookRecipe` with the result's `recipe.id` to get full recipe details
- Results include the source cookbook title, author, and page number for physical reference

---

#### `getCookbookRecipe`
Get the full details of a cookbook recipe by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipeId` | string | Yes | The cookbook recipe ID |

**Returns:** Full recipe with:
- **Source:** cookbook title, author, page number
- **Metadata:** cuisineType, mealType, servings, prepTime, cookTime
- **Content:** ingredients, instructions, description

**Usage notes:**
- Use this after finding recipes via `searchCookbookRecipes` or `searchByIngredient`
- The page number lets the user look up the original recipe in their physical book

---

#### `listCookbooks`
List all cookbooks in the user's digital library with metadata and recipe counts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | — | — | No parameters required |

**Returns:** Array of cookbooks, each with: `id`, `title`, `author`, `publisher`, `year`, `description`, `recipeCount`.

**Usage notes:**
- Call this first when the user wants to browse their cookbook collection
- Use a cookbook's `id` to filter `searchCookbookRecipes` results to that specific book
- `recipeCount` shows how many recipes have been digitized from each book

---

#### `searchByIngredient`
Find cookbook recipes that use specific ingredients. Ideal for "what can I make with what I have?" queries.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ingredients` | string[] | Yes | — | List of 1-10 ingredients to search for |
| `matchAll` | boolean | No | `false` | `true` = recipes must contain ALL ingredients; `false` = recipes matching ANY ingredient |

**Returns:** Recipes ranked by ingredient match percentage, each with:
- `recipe`: title, id, description, cookbook info
- `score`: Match percentage (0-1)

**Usage notes:**
- Default (`matchAll: false`) returns recipes matching any of the listed ingredients, ranked by how many match
- `matchAll: true` is stricter — only returns recipes that use every listed ingredient
- Keep ingredient names simple: `["chicken", "lemon", "garlic"]` not `["2 lbs boneless skinless chicken breast"]`

---

## Common Workflows

### Exploring personal recipes
1. `searchRecipes` with no filters to see what the user has
2. `searchRecipes` with filters to narrow by cuisine, meal type, favorites, etc.
3. `getRecipe` to read the full recipe details

### Discovering cookbook recipes
1. `listCookbooks` to see the user's cookbook collection
2. `searchCookbookRecipes` with a natural language query to find relevant recipes
3. `getCookbookRecipe` to read the full recipe

### "What can I make?" workflow
1. Ask the user what ingredients they have on hand
2. `searchByIngredient` with those ingredients
3. `getCookbookRecipe` to view the best matches
4. Optionally `searchRecipes` to also check personal recipes for matches

### Recipe to grocery list
1. `getRecipe` or `getCookbookRecipe` to get ingredients
2. `addMultipleGroceryItems` to add all ingredients at once, passing the `recipeId` if it's a personal recipe
3. `getGroceryList` to confirm the items were added

### Meal planning assistance
1. `searchRecipes` and/or `searchCookbookRecipes` across different meal types
2. `getRecipe` / `getCookbookRecipe` for full details on selected recipes
3. `addMultipleGroceryItems` for each planned recipe's ingredients

---

## Data Model Quick Reference

### Recipe (personal)
```
id, title, description, cuisineType, mealType, difficulty (EASY|MEDIUM|HARD),
prepTime, cookTime, restTime, servings, isPublic, source (USER|SCRAPE|GEN_AI),
ingredients, instructions, parsedIngredients, parsedInstructions,
notes, utensils, nutrition, sourceUrl, imageUrl, createdAt, updatedAt
```

### Cookbook Recipe (from digitized books)
```
id, cookbookId, title, description, cuisineType, mealType,
ingredients, instructions, pageNumber, servings, prepTime, cookTime,
cookbook: { title, author }
```

### Grocery Item
```
id, name, quantity, quantityUnit, status (ACTIVE|COMPLETED),
section: { name }, recipe: { title }, recipeId
```

### Cookbook
```
id, title, author, publisher, year, description, recipeCount
```

---

## Architecture

```
AI Agent (Claude)
  │
  ▼
Recipe MCP Server (Cloudflare Workers, port 8793)
  │  - Google OAuth authentication
  │  - 15 MCP tools (recipe/grocery/cookbook)
  │  - Sentry error tracking
  │
  ▼  (HTTP + X-API-Key + user_id)
Next.js Recipe Manager App (port 3000)
  │  - API route handlers at /api/mcp/*
  │  - verifyMCPAuth middleware
  │  - Business logic + Prisma ORM
  │
  ▼
PostgreSQL Database
  │  - User-scoped data (all queries filtered by userId)
  │  - pgvector for cookbook semantic search embeddings
```

### Authentication Flow
1. User connects via Claude Desktop / MCP client
2. MCP server initiates Google OAuth
3. User's email is verified against an allowlist
4. Email maps to a database `userId`
5. All subsequent tool calls use this `userId` — the user only sees their own data

### Key Technical Details
- All tool responses are formatted as Markdown text
- Tool errors include a Sentry event ID for debugging
- API calls have a 30-second timeout (60 seconds for create/update operations that use AI parsing)
- Recipe deletion is soft-delete (marked `isDeleted`, not removed from database)
- Grocery items are auto-classified into store sections (Produce, Dairy, Meat & Seafood, etc.) via AI
- Cookbook search uses hybrid ranking: 70% vector similarity + 30% full-text match

---

## Environment & Deployment

### Local Development
```bash
cd recipe-mcp
npm run dev    # Starts MCP server on http://localhost:8793
```

Requires the Next.js app running on `http://localhost:3000`.

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "recipe-manager": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8793/mcp"]
    }
  }
}
```

### Production Deployment
```bash
npm run deploy    # Deploys to Cloudflare Workers
```

Update `RECIPE_API_BASE_URL` to point to the production Next.js app URL.
