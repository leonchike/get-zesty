# RCP-003: Allowed Users Configuration

**Status:** `[ ]` Not started
**Phase:** 1 — MCP Foundation
**Priority:** P0
**Depends on:** RCP-001

## Summary

Create the user access control configuration that maps Google email addresses to database user IDs. This replaces the SimBrief pattern of mapping email → SimBrief UserID with email → Prisma User.id (cuid).

## Files to Create

- `recipe-mcp/src/config/allowed-users.ts`

## Implementation Details

```typescript
export const USER_CONFIG: Record<string, string> = {
  'leonchike@gmail.com': '<database-user-id-cuid>',
  'leonnwankwo@gmail.com': '<database-user-id-cuid>',
};
```

Functions:
- `resolveUserId(email: string): string | null` — maps email to database userId
- `checkUserIsAllowed(username: string): boolean` — checks against allowed usernames
- `getAuthDeniedResponse(username: string): Response` — styled HTML denial page

## Reference Files

- `example-mcp/simbrief-mcp/src/config/allowed-users.ts`

## Acceptance Criteria

- [ ] Allowed emails resolve to correct database user IDs
- [ ] Unknown emails return null / denied
- [ ] Auth denied page renders correctly
