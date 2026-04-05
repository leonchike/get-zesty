# Recipe Manager MCP Server

TypeScript MCP server on Cloudflare Workers with Google OAuth, replacing the Python MCP at `recipe-management-app/mcp/`.

## Architecture

```
User -> MCP (Google OAuth) -> resolve email -> userId via allowed-users.ts
MCP -> Next.js API (X-API-Key + user_id) -> Database
```

- **Auth**: Google OAuth -> email -> database userId lookup in `src/config/allowed-users.ts`
- **Transport**: SSE (`/sse`) and HTTP (`/mcp`) via Cloudflare Durable Objects
- **API calls**: MCP tools call `RECIPE_API_BASE_URL` with `RECIPE_API_KEY` header
- **Sentry**: All tool handlers wrapped with `wrapWithSentry()` for tracing

## Commands

```bash
npm run dev          # Start local dev server on port 8793
npm run deploy       # Deploy to Cloudflare Workers
npm run type-check   # TypeScript type checking
npm run cf-typegen   # Regenerate Cloudflare types
```

## Tools (16 total)

### Recipe (5): searchRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe
### Grocery (6): getGroceryList, addGroceryItem, addMultipleGroceryItems, updateGroceryItem, completeGroceryItems, deleteGroceryItem
### Cookbook (5): searchCookbookRecipes, getCookbookRecipe, listCookbooks, listCookbookRecipes, searchByIngredient

## Key Files

- `src/index.ts` — RecipeMCP class, OAuthProvider, Sentry wrapper
- `src/auth/` — Google OAuth flow (adapted from SimBrief MCP)
- `src/config/allowed-users.ts` — email -> database userId mapping
- `src/tools/register-*.ts` — tool registration with Zod schemas
- `src/tools/*-api.ts` — HTTP clients for Next.js API routes
- `src/tools/sentry-utils.ts` — wrapWithSentry helper

## Environment

Required secrets (via `wrangler secret put`):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `COOKIE_ENCRYPTION_KEY`
- `RECIPE_API_BASE_URL`, `RECIPE_API_KEY`

Optional: `SENTRY_DSN`, `ENVIRONMENT`

## Claude Desktop Integration

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

## Patterns

- Tool registration: `server.tool(name, description, ZodSchema, wrapWithSentry(name, handler))`
- Success response: `{ content: [{ type: "text", text: markdownResult }] }`
- Error response: `{ content: [{ type: "text", text: "**Error**\n\n...", isError: true }] }`
- API client separation: HTTP calls in `*-api.ts`, tool logic in `register-*-tools.ts`

## Database (cookbook models)

Cookbook, CookbookRecipe, RecipeChunk models defined in `recipe-management-app/prisma/schema.prisma`. After `npx prisma migrate dev`, run the manual SQL at `prisma/migrations/manual/add_pgvector_cookbook_indexes.sql` for vector embeddings.

## Reference

- SimBrief MCP pattern: `example-mcp/simbrief-mcp/`
- Python MCP (deprecated): `recipe-management-app/mcp/`
- Next.js API routes: `recipe-management-app/src/app/api/mcp/`
