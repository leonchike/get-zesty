# RCP-011: Cookbook API Routes in Next.js

**Status:** `[ ]` Not started
**Phase:** 5 — Cookbook API
**Priority:** P0
**Depends on:** RCP-010

## Summary

Create Next.js API routes for cookbook operations that the MCP server will call. All routes use the existing `verifyMCPAuth()` pattern.

## Files to Create

### API Routes
- `recipe-management-app/src/app/api/mcp/cookbooks/route.ts` — List cookbooks (GET)
- `recipe-management-app/src/app/api/mcp/cookbooks/search/route.ts` — RAG search (POST)
- `recipe-management-app/src/app/api/mcp/cookbooks/recipes/route.ts` — Get cookbook recipe (GET)
- `recipe-management-app/src/app/api/mcp/cookbooks/ingredients/route.ts` — Ingredient search (POST)

### Business Logic
- `recipe-management-app/src/lib/actions/cookbook-actions.ts`

## Route Specifications

### GET /api/mcp/cookbooks
- **Query params**: `user_id`, optional `search`
- **Returns**: `{ cookbooks: CookbookSummary[], totalCount: number }`
- **Logic**: Prisma query with optional title/author search

### POST /api/mcp/cookbooks/search
- **Body**: `{ user_id, query, cookbookId?, cuisineType?, maxResults? }`
- **Logic**:
  1. Generate embedding from `query` using OpenAI text-embedding-3-small
  2. Execute hybrid search: pgvector cosine similarity + full-text search ranking
  3. Combine and deduplicate results
  4. Return with relevance scores and cookbook source info
- **Returns**: `{ results: CookbookRecipeResult[] }`
- **Note**: Uses `prisma.$queryRaw` for vector operations

### GET /api/mcp/cookbooks/recipes
- **Query params**: `id`, `user_id`
- **Returns**: Complete `CookbookRecipe` with cookbook metadata
- **Logic**: Prisma query with cookbook relation include

### POST /api/mcp/cookbooks/ingredients
- **Body**: `{ user_id, ingredients: string[], matchAll: boolean, maxResults? }`
- **Logic**: Full-text search on ingredients column, ranked by match count
- **Returns**: `{ results: CookbookRecipeResult[] }`

## Reference Files

- `recipe-management-app/src/app/api/mcp/recipes/route.ts` — existing MCP route pattern
- `recipe-management-app/src/app/api/mcp/recipes/search/route.ts` — search route pattern
- `recipe-management-app/src/lib/helpers/verify-mcp-auth.ts` — auth helper

## Acceptance Criteria

- [ ] All 4 routes respond correctly to cURL/Postman
- [ ] Auth validation works with X-API-Key + user_id
- [ ] RAG search returns relevant results with scores
- [ ] Ingredient search handles matchAll/matchAny correctly
- [ ] Error responses follow existing MCP route patterns
