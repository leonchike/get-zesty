---
name: deploy-web
description: Deploy the Get Zesty Next.js web app (recipe-management-app) to production — preflight checks, apply pending Prisma migrations, merge the working branch into main, and push to GitHub, which triggers Vercel's CI/CD. Use when the user asks to deploy, ship, or release the web app / website / backend / Next.js app to production.
---

# Deploy Get Zesty Web (Next.js → Vercel via main)

Production deploys are driven by git: **anything pushed to `main` on GitHub (leonchike/get-zesty) is built and deployed by Vercel automatically.** This skill's job is to get the current work onto `main` safely.

## 1. Preflight (run in `recipe-management-app/`)

```bash
git status --porcelain                  # see what's uncommitted, repo-wide
npx tsc --noEmit                        # typecheck
npm test                                # jest
npm run build                           # local prod build — cheaper to fail here than on Vercel
```

Known pre-existing failures to ignore (typecheck/lint only, tests must be green): errors confined to `scripts/__tests__/`, `scripts/lib/__tests__/`, and `src/app/api/mcp/*/__tests__/` (stale test typings, redeclared e2e consts). Anything new outside those paths is a blocker — stop and report.

Uncommitted changes: production ships from `main`, so work must be committed first. If the working tree is dirty, show the user what's uncommitted and ask whether to commit it to the current branch before merging (never commit unrelated files silently).

## 2. Prisma migrations

Vercel's build only runs `prisma generate` — it does NOT apply migrations. Check and apply before pushing:

```bash
cd recipe-management-app
npx prisma migrate status        # reports pending migrations against DATABASE_URL (.env — the live Supabase DB)
npx prisma migrate deploy        # only if status shows pending migrations
```

`migrate deploy` is non-interactive-safe and only applies committed migration folders. NEVER use `prisma migrate dev` or `db push` here. If `migrate status` reports drift or a failed migration, stop and show the user the output.

## 3. Merge to main and push

From the repo root:

```bash
git fetch origin
git checkout main
git pull origin main                      # fast-forward main first
git merge --no-ff <working-branch> -m "Merge <working-branch>: <one-line summary>"
git push origin main
git checkout <working-branch>             # return to where the user was
```

- If the merge conflicts, abort (`git merge --abort`), return to the working branch, and report the conflicting files — don't resolve production merges without the user.
- Never force-push main. Never rebase main.
- If already on `main`, just pull, verify, and push.

## 4. Watch the Vercel deployment

The push triggers Vercel automatically. The `vercel` CLI is installed and the project is linked (`.vercel/`):

```bash
cd recipe-management-app
vercel ls --yes 2>/dev/null | head -5     # latest deployments + status (Building/Ready/Error)
```

Poll every ~60s in the background until the newest production deployment shows **Ready** or **Error**. On Error, fetch logs with `vercel inspect --logs <deployment-url>` and report the failure. Dashboard: https://vercel.com (project linked to getzesty.food).

## 5. Post-deploy smoke test

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.getzesty.food                      # expect 200
curl -s -o /dev/null -w "%{http_code}" https://www.getzesty.food/api/mobile/tasks     # expect 401 (auth required, route exists)
```

A 404 from an API route that should exist means the deploy didn't pick up the changes — check which commit Vercel built.

## 6. Report

Tell the user: what was merged (branch + commit range), migration status (applied/none pending), the Vercel deployment status + URL, and smoke-test results. Remind them if the mobile app is waiting on this deploy (e.g. a TestFlight build whose features need these API routes).
