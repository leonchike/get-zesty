# RCP-004: Sentry Error Tracking

**Status:** `[ ]` Not started
**Phase:** 1 — MCP Foundation
**Priority:** P1
**Depends on:** RCP-001

## Summary

Implement Sentry integration for error tracking and distributed tracing, following the SimBrief MCP pattern.

## Files to Create

- `recipe-mcp/src/tools/sentry-utils.ts`

## Implementation Details

### sentry-utils.ts
Extract the `wrapWithSentry` helper from the SimBrief pattern into a reusable module:
- Wraps tool handlers with `Sentry.startNewTrace()` + `Sentry.startSpan()`
- Records tool name and arguments as span attributes
- Captures exceptions with event ID
- Returns user-friendly error with error ID on failure
- Gracefully degrades when Sentry DSN is not configured

### Sentry wrapper in index.ts
- `export default Sentry.withSentry(getSentryConfig, oauthProvider)` — wraps the entire worker
- Sets user context (`email`, `username`) when Props are available

## Reference Files

- `example-mcp/simbrief-mcp/src/tools/register-simbrief-tools.ts` (lines 46-102)
- `example-mcp/simbrief-mcp/src/index.ts` (lines 12-18, 92-103)

## Acceptance Criteria

- [ ] `wrapWithSentry` wraps tool handlers with spans
- [ ] Errors are captured with event IDs
- [ ] Works gracefully when SENTRY_DSN is not set
- [ ] User context is set from OAuth Props
