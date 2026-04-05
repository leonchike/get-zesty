# Recipe MCP — Implementation Tickets

Tracking tickets for building the new TypeScript MCP server on Cloudflare Workers, replacing the deprecated Python MCP. Includes porting all existing tools + new cookbook library/RAG features.

## Status Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Complete

## Ticket Index

### Phase 1: MCP Foundation
- [RCP-001](./RCP-001-project-scaffolding.md) — Project scaffolding
- [RCP-002](./RCP-002-google-oauth-auth.md) — Google OAuth authentication
- [RCP-003](./RCP-003-allowed-users-config.md) — Allowed users + user resolution
- [RCP-004](./RCP-004-sentry-integration.md) — Sentry error tracking
- [RCP-005](./RCP-005-mcp-server-shell.md) — MCP server shell (index.ts + register-all-tools)

### Phase 2: Recipe Tools (port from Python)
- [RCP-006](./RCP-006-recipe-api-client.md) — Recipe API HTTP client
- [RCP-007](./RCP-007-recipe-tools.md) — 5 recipe MCP tools

### Phase 3: Grocery Tools (port from Python)
- [RCP-008](./RCP-008-grocery-api-client.md) — Grocery API HTTP client
- [RCP-009](./RCP-009-grocery-tools.md) — 6 grocery MCP tools

### Phase 4: Cookbook Database Schema
- [RCP-010](./RCP-010-cookbook-prisma-schema.md) — Prisma models + pgvector migration

### Phase 5: Cookbook Next.js API Routes
- [RCP-011](./RCP-011-cookbook-api-routes.md) — Cookbook API routes in Next.js app
- [RCP-012](./RCP-012-embedding-utility.md) — OpenAI embedding generation utility

### Phase 6: Cookbook MCP Tools
- [RCP-013](./RCP-013-cookbook-api-client.md) — Cookbook API HTTP client
- [RCP-014](./RCP-014-cookbook-tools.md) — 4 cookbook/RAG MCP tools

### Phase 7: Ingestion Pipeline
- [RCP-015](./RCP-015-ingestion-pipeline.md) — PDF/ebook ingestion script

### Phase 8: Documentation & Polish
- [RCP-016](./RCP-016-documentation.md) — CLAUDE.md, README, deployment guide
