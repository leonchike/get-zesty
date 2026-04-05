# RCP-007: Recipe MCP Tools

**Status:** `[ ]` Not started
**Phase:** 2 — Recipe Tools
**Priority:** P0
**Depends on:** RCP-005, RCP-006

## Summary

Register 5 recipe management tools with the MCP server, porting functionality from the Python MCP (`recipe-management-app/mcp/main.py`).

## Files to Create

- `recipe-mcp/src/tools/register-recipe-tools.ts`

## Tools to Implement

### 1. `searchRecipes`
- **Schema**: `search?`, `isFavorite?`, `isPinned?`, `isPersonal?`, `isPublic?`, `cuisineTypes?[]`, `mealTypes?[]`, `page?`, `limit?`
- **Description**: Search and filter recipes with text query, cuisine, meal type, favorites, pinned, pagination
- **Response**: Formatted markdown list of matching recipes with key metadata

### 2. `getRecipe`
- **Schema**: `recipeId` (required)
- **Description**: Get full recipe details by ID including ingredients, instructions, nutrition
- **Response**: Complete recipe formatted as markdown

### 3. `createRecipe`
- **Schema**: `title`, `ingredients`, `instructions` (required), `description?`, `prepTime?`, `cookTime?`, `servings?`, `cuisineType?`, `mealType?`, `difficulty?`, `isPublic?`, `parseWithAI?`
- **Description**: Create a new recipe with optional AI parsing
- **Response**: Confirmation with new recipe ID and title

### 4. `updateRecipe`
- **Schema**: `recipeId` (required), all other fields optional
- **Description**: Partial update of recipe fields
- **Response**: Confirmation with updated recipe summary

### 5. `deleteRecipe`
- **Schema**: `recipeId` (required)
- **Description**: Soft-delete a recipe
- **Response**: Confirmation of deletion

## Patterns

- Each tool: `server.tool(name, description, ZodSchema, wrapWithSentry(name, handler))`
- API config constructed from `env.RECIPE_API_BASE_URL`, `env.RECIPE_API_KEY`, `props.userId`
- Format responses as readable markdown (not raw JSON)
- Error responses follow standard format

## Reference Files

- `recipe-management-app/mcp/main.py` — Python implementations to port
- `example-mcp/simbrief-mcp/src/tools/register-simbrief-tools.ts` — registration pattern

## Acceptance Criteria

- [ ] All 5 tools registered and callable via MCP client
- [ ] Search returns formatted recipe list
- [ ] Get returns complete recipe details
- [ ] Create/update/delete operations work end-to-end
- [ ] All tools wrapped with Sentry
- [ ] Input validation via Zod schemas
