# RCP-009: Grocery MCP Tools

**Status:** `[ ]` Not started
**Phase:** 3 — Grocery Tools
**Priority:** P0
**Depends on:** RCP-005, RCP-008

## Summary

Register 6 grocery management tools with the MCP server, porting functionality from the Python MCP.

## Files to Create

- `recipe-mcp/src/tools/register-grocery-tools.ts`

## Tools to Implement

### 6. `getGroceryList`
- **Schema**: `includeCompleted?` (default false)
- **Description**: Get grocery list organized by section and status
- **Response**: Formatted markdown grouped by grocery section

### 7. `addGroceryItem`
- **Schema**: `name` (required), `quantity?`, `quantityUnit?`, `recipeId?`
- **Description**: Add single item with AI section classification
- **Response**: Confirmation with item details and assigned section

### 8. `addMultipleGroceryItems`
- **Schema**: `items[]` (1-50, each with name required, quantity?, quantityUnit?, recipeId?)
- **Description**: Bulk add items
- **Response**: Summary of successes and failures

### 9. `updateGroceryItem`
- **Schema**: `itemId` (required), `name?`, `quantity?`, `quantityUnit?`, `status?`
- **Description**: Update item fields
- **Response**: Confirmation with updated item

### 10. `completeGroceryItems`
- **Schema**: `itemIds[]` (required, min 1)
- **Description**: Batch mark items as completed
- **Response**: Confirmation with count of completed items

### 11. `deleteGroceryItem`
- **Schema**: `itemId` (required)
- **Description**: Permanently remove a grocery item
- **Response**: Confirmation of deletion

## Reference Files

- `recipe-management-app/mcp/main.py` — Python implementations
- `example-mcp/simbrief-mcp/src/tools/register-simbrief-tools.ts` — registration pattern

## Acceptance Criteria

- [ ] All 6 tools registered and callable via MCP client
- [ ] Grocery list formatted by section in markdown
- [ ] Bulk add returns clear success/failure summary
- [ ] All tools wrapped with Sentry
- [ ] Input validation via Zod schemas
