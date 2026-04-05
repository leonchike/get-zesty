# RCP-005: MCP Server Shell

**Status:** `[ ]` Not started
**Phase:** 1 — MCP Foundation
**Priority:** P0
**Depends on:** RCP-001, RCP-002, RCP-003, RCP-004

## Summary

Create the main MCP server entry point and tool registration orchestrator. This wires everything together: the McpAgent class, OAuthProvider, Sentry wrapper, and tool registration.

## Files to Create

- `recipe-mcp/src/index.ts`
- `recipe-mcp/src/tools/register-all-tools.ts`
- `recipe-mcp/src/types/index.ts`

## Implementation Details

### index.ts
```typescript
export class RecipeMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "Get Zesty Recipe Manager MCP Server",
    version: "1.0.0",
  });

  async init() {
    // Sentry user context
    // registerAllTools(this.server, this.env, this.props)
  }
}

const oauthProvider = new OAuthProvider({
  apiHandlers: {
    "/sse": RecipeMCP.serveSSE("/sse"),
    "/mcp": RecipeMCP.serve("/mcp"),
  },
  // ... auth endpoints
});

export default Sentry.withSentry(getSentryConfig, oauthProvider);
```

### register-all-tools.ts
Orchestrator that calls:
- `registerRecipeTools(server, env, props)` (Phase 2)
- `registerGroceryTools(server, env, props)` (Phase 3)
- `registerCookbookTools(server, env, props)` (Phase 6)

Initially calls no sub-registrations until Phase 2+.

### types/index.ts
- `Props` interface (login, name, email, accessToken, userId)
- `ExtendedEnv` interface
- `ApiResponse<T>` generic response wrapper
- Recipe, Grocery, Cookbook type interfaces

## Reference Files

- `example-mcp/simbrief-mcp/src/index.ts`
- `example-mcp/simbrief-mcp/src/types/index.ts`

## Acceptance Criteria

- [ ] `npm run dev` starts worker on port 8793
- [ ] OAuth flow completes and MCP session is created
- [ ] `RecipeMCP.init()` runs and logs success
- [ ] Type checking passes
- [ ] MCP client can connect via `mcp-remote http://localhost:8793/mcp`
