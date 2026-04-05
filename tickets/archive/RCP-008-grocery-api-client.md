# RCP-008: Grocery API HTTP Client

**Status:** `[ ]` Not started
**Phase:** 3 — Grocery Tools
**Priority:** P0
**Depends on:** RCP-005

## Summary

Create the HTTP client module for communicating with the Next.js app's grocery API endpoints.

## Files to Create

- `recipe-mcp/src/tools/grocery-api.ts`

## Implementation Details

### API Client Functions

```typescript
// All functions return Promise<ApiResponse<T>>

getGroceryList(config, includeCompleted)  → GET  /api/mcp/groceries?user_id=X&includeCompleted=Y
addGroceryItem(config, item)              → POST /api/mcp/groceries
addMultipleGroceryItems(config, items)    → multiple POST /api/mcp/groceries (Promise.allSettled)
updateGroceryItem(config, item)           → PATCH /api/mcp/groceries
completeGroceryItems(config, itemIds)     → POST /api/mcp/groceries/complete
deleteGroceryItem(config, itemId)         → DELETE /api/mcp/groceries
```

### Key Consideration
`addMultipleGroceryItems` — The Python MCP uses `asyncio.gather` for parallel additions. In TypeScript, use `Promise.allSettled` to handle individual failures gracefully and return a summary of successes/failures.

## Target Next.js API Routes

- `recipe-management-app/src/app/api/mcp/groceries/route.ts`
- `recipe-management-app/src/app/api/mcp/groceries/complete/route.ts`

## Acceptance Criteria

- [ ] All API functions work against local Next.js dev server
- [ ] Bulk add handles partial failures gracefully
- [ ] Timeout and error handling consistent with recipe-api.ts
