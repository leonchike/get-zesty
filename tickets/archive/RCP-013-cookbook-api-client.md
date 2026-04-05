# RCP-013: Cookbook API HTTP Client

**Status:** `[ ]` Not started
**Phase:** 6 — Cookbook MCP Tools
**Priority:** P0
**Depends on:** RCP-005, RCP-011

## Summary

Create the HTTP client module for communicating with the Next.js cookbook API endpoints from the Cloudflare Worker MCP server.

## Files to Create

- `recipe-mcp/src/tools/cookbook-api.ts`

## Implementation Details

### API Client Functions

```typescript
// All functions return Promise<ApiResponse<T>>

listCookbooks(config, search?)                    → GET  /api/mcp/cookbooks?user_id=X&search=Y
searchCookbookRecipes(config, query, filters)      → POST /api/mcp/cookbooks/search
getCookbookRecipe(config, recipeId)                → GET  /api/mcp/cookbooks/recipes?id=X&user_id=Y
searchByIngredient(config, ingredients, matchAll)   → POST /api/mcp/cookbooks/ingredients
```

### Patterns
- Same `ApiConfig` interface as recipe-api.ts and grocery-api.ts
- 30s timeout with AbortController
- Standardized error wrapping

## Acceptance Criteria

- [ ] All 4 API functions work against local Next.js dev server
- [ ] Consistent error handling with recipe/grocery API clients
- [ ] TypeScript types match cookbook API response shapes
