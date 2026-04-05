# RCP-006: Recipe API HTTP Client

**Status:** `[ ]` Not started
**Phase:** 2 — Recipe Tools
**Priority:** P0
**Depends on:** RCP-005

## Summary

Create the HTTP client module that communicates with the Next.js app's recipe API endpoints. Handles authentication (X-API-Key), request formatting, error handling, and timeout management.

## Files to Create

- `recipe-mcp/src/tools/recipe-api.ts`

## Implementation Details

### API Client Functions

```typescript
interface ApiConfig {
  baseUrl: string;   // RECIPE_API_BASE_URL from env
  apiKey: string;    // RECIPE_API_KEY from env
  userId: string;    // Resolved from Props
}

// All functions return Promise<ApiResponse<T>>

searchRecipes(config, filters) → POST /api/mcp/recipes/search
getRecipe(config, recipeId)    → GET  /api/mcp/recipes?id=X&user_id=Y
createRecipe(config, recipe, parseWithAI) → POST /api/mcp/recipes
updateRecipe(config, recipeId, recipe, parseWithAI) → PUT /api/mcp/recipes
deleteRecipe(config, recipeId) → DELETE /api/mcp/recipes
```

### Patterns
- 30s fetch timeout using `AbortController`
- Headers: `X-API-Key`, `Content-Type: application/json`
- `user_id` passed in request body (POST/PUT/DELETE) or query params (GET)
- Standardized error response wrapping

## Target Next.js API Routes

- `recipe-management-app/src/app/api/mcp/recipes/search/route.ts`
- `recipe-management-app/src/app/api/mcp/recipes/route.ts`

## Acceptance Criteria

- [ ] All 5 API functions work against local Next.js dev server
- [ ] Timeout handling works correctly
- [ ] Auth errors return clear error messages
- [ ] TypeScript types are correct for all request/response shapes
