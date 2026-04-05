# RCP-002: Google OAuth Authentication

**Status:** `[ ]` Not started
**Phase:** 1 — MCP Foundation
**Priority:** P0
**Depends on:** RCP-001

## Summary

Implement Google OAuth 2.0 authentication flow for the MCP server, adapted from the SimBrief MCP pattern. Users authenticate via Google, and the MCP resolves their email to a database user ID.

## Files to Create

- `recipe-mcp/src/auth/google-handler.ts` — Hono app with `/authorize`, `/callback` routes
- `recipe-mcp/src/auth/oauth-utils.ts` — HMAC cookie signing, approval dialog HTML

## Implementation Details

### google-handler.ts
- Adapt from `example-mcp/simbrief-mcp/src/auth/google-handler.ts`
- Replace "SimBrief" branding with "Get Zesty Recipe Manager"
- `/authorize` GET — parse OAuth request, check cookie approval, render dialog
- `/authorize` POST — handle form submission, redirect to Google
- `/callback` GET — exchange code for token, fetch user info, check allowed users, resolve userId, create MCP session
- Props include `userId` (database cuid) in addition to `login`, `email`, `name`, `accessToken`

### oauth-utils.ts
- Copy from `example-mcp/simbrief-mcp/src/auth/oauth-utils.ts` (no changes needed)
- HMAC cookie signing, approval dialog rendering, upstream URL construction

## Reference Files

- `example-mcp/simbrief-mcp/src/auth/google-handler.ts`
- `example-mcp/simbrief-mcp/src/auth/oauth-utils.ts`
- `example-mcp/simbrief-mcp/src/config/allowed-users.ts`

## Acceptance Criteria

- [ ] OAuth flow redirects to Google login
- [ ] Callback exchanges code and fetches user info
- [ ] Unauthorized users see access denied page
- [ ] Authorized users get MCP session with correct Props (including userId)
- [ ] Approval cookie persists to skip dialog on return visits
