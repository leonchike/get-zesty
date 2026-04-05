# RCP-014: Cookbook MCP Tools

**Status:** `[ ]` Not started
**Phase:** 6 — Cookbook MCP Tools
**Priority:** P0
**Depends on:** RCP-005, RCP-013

## Summary

Register 4 cookbook library/RAG search tools with the MCP server. These are new tools (not ported from Python).

## Files to Create

- `recipe-mcp/src/tools/register-cookbook-tools.ts`

## Tools to Implement

### 12. `searchCookbookRecipes`
- **Schema**: `query` (required), `cookbookId?`, `cuisineType?`, `maxResults?` (1-20, default 5)
- **Description**: Search cookbook library using semantic/RAG search. Finds recipes from your digital cookbook collection based on natural language queries. Returns recipe title, cookbook source, page reference, and relevance score.
- **Response**: Ranked list of matching recipes with cookbook source, page number, relevance

### 13. `getCookbookRecipe`
- **Schema**: `recipeId` (required)
- **Description**: Get full details of a specific recipe from the cookbook library, including complete ingredients, instructions, and source cookbook/page.
- **Response**: Complete recipe formatted as markdown with source attribution

### 14. `listCookbooks`
- **Schema**: `search?`
- **Description**: List all cookbooks in the digital library with recipe counts. Optionally filter by title or author.
- **Response**: Formatted list of cookbooks with author, year, recipe count

### 15. `searchByIngredient`
- **Schema**: `ingredients[]` (required, 1-10), `matchAll?` (default false), `maxResults?` (default 10)
- **Description**: Find cookbook recipes by ingredient. Useful for "what can I make with X, Y, Z?" queries. Searches across all cookbooks.
- **Response**: Ranked list of matching recipes with ingredient match info

## Patterns

- Same registration pattern as recipe/grocery tools
- All wrapped with `wrapWithSentry`
- Markdown-formatted responses with cookbook source attribution
- Error responses follow standard format

## Acceptance Criteria

- [ ] All 4 tools registered and callable via MCP client
- [ ] RAG search returns semantically relevant results
- [ ] Cookbook source and page references included in results
- [ ] Ingredient search supports both matchAll and matchAny
- [ ] All tools wrapped with Sentry
