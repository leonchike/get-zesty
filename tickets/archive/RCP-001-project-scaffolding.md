# RCP-001: Project Scaffolding

**Status:** `[ ]` Not started
**Phase:** 1 — MCP Foundation
**Priority:** P0

## Summary

Create the `recipe-mcp/` directory at the repo root with all project configuration files, mirroring the `example-mcp/simbrief-mcp/` structure.

## Files to Create

- `recipe-mcp/package.json` — dependencies matching simbrief-mcp pattern
- `recipe-mcp/tsconfig.json` — TypeScript strict config
- `recipe-mcp/wrangler.toml` — Cloudflare Workers config (Durable Objects, KV, port 8793)
- `recipe-mcp/worker-configuration.d.ts` — Env type definitions
- `recipe-mcp/.dev.vars.example` — local env template
- `recipe-mcp/.gitignore`
- `recipe-mcp/.prettierrc.json`

## Dependencies

```json
{
  "@cloudflare/workers-oauth-provider": "^0.0.5",
  "@modelcontextprotocol/sdk": "^1.15.1",
  "@sentry/cloudflare": "^10.17.0",
  "agents": "^0.0.100",
  "hono": "^4.8.3",
  "zod": "^3.25.67"
}
```

## Key Configuration

- `wrangler.toml`: class name `RecipeMCP`, port `8793`, KV binding `OAUTH_KV`
- `worker-configuration.d.ts`: Env with `RECIPE_API_BASE_URL`, `RECIPE_API_KEY`, Google OAuth secrets

## Reference Files

- `example-mcp/simbrief-mcp/package.json`
- `example-mcp/simbrief-mcp/wrangler.toml`
- `example-mcp/simbrief-mcp/tsconfig.json`

## Acceptance Criteria

- [ ] `npm install` succeeds in `recipe-mcp/`
- [ ] `npm run cf-typegen` generates types
- [ ] `npm run type-check` passes with no errors
- [ ] Directory structure matches plan
