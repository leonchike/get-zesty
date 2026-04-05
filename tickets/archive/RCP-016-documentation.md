# RCP-016: Documentation & Polish

**Status:** `[ ]` Not started
**Phase:** 8 — Documentation
**Priority:** P1
**Depends on:** RCP-014

## Summary

Create comprehensive documentation for the new MCP server and finalize for production deployment.

## Files to Create

- `recipe-mcp/CLAUDE.md` — Development guide for Claude Code
- `recipe-mcp/README.md` — Setup, deployment, and usage guide

## CLAUDE.md Contents

- Architecture overview
- Development commands (`npm run dev`, `npm run deploy`, `npm run type-check`)
- MCP tools reference (all 15 tools)
- Environment configuration
- Auth flow explanation
- Adding new tools guide

## README.md Contents

- Project overview
- Prerequisites (Cloudflare account, Google OAuth credentials, Sentry)
- Local development setup
- Secret configuration (`wrangler secret put`)
- Deployment steps
- Claude Desktop / Claude Code integration config
- Troubleshooting guide

## Additional Polish

- [ ] Comprehensive error messages for all failure modes
- [ ] Production Sentry DSN configured
- [ ] Production deployment to Cloudflare Workers
- [ ] KV namespace created in production
- [ ] Google OAuth redirect URI updated for production domain
- [ ] End-to-end testing via Claude.ai

## Acceptance Criteria

- [ ] CLAUDE.md provides complete developer reference
- [ ] README.md enables setup from scratch
- [ ] Production deployment works
- [ ] All 15 tools functional in Claude.ai
