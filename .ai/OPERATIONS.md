# OPERATIONS.md

## Status
Pre-launch — no production traffic yet. This is the plan, not yet a
lived runbook. Update with real values/links once deployed.

## Health checks
No dedicated `/api/health` route exists yet. Until one is added, the
practical health check is: `/login` returns 200 and `/api/ingredients`
(or another authenticated route) returns something other than a 500.
Consider adding `app/api/health/route.ts` that pings `connectDB()` and
returns `{status: "ok"}` — cheap and catches Mongo connectivity issues
before a user does.

## Monitoring
- **Vercel dashboard** — deployment status, build logs, function
  invocation logs, and basic request analytics come for free once
  deployed (see DEPLOYMENT.md).
- **MongoDB Atlas dashboard** — connection count, slow queries, storage
  usage. Free/low tier per spec Assumptions — watch storage limits.
- No third-party error tracking (Sentry etc.) configured yet — flagged
  in KNOWN_ISSUES.md.

## Logs
Vercel function logs capture anything logged via `console.error` in API
routes. No structured logging yet — when adding error handling to a
route, prefer `console.error("[module] action failed:", err)` so logs
are greppable by module.

## Restarts
Serverless (Vercel) — no long-running process to restart. A bad deploy
is fixed by rollback (see DEPLOYMENT.md), not a restart.

## Backup / restore
MongoDB Atlas free tier does not include automated backups. This is an
accepted risk at MVP scale per spec Risks section ("seeded ingredient
data may contain errors with no in-app correction path — accepted risk,
manual database stopgap"). If this becomes a real concern, upgrading to
a tier with continuous backups is the fix — not built yet.

## Incident response
No on-call rotation (3-person team, side project cadence). If something
breaks in production:
1. Check Vercel deployment logs first — most likely a build or env-var issue.
2. Check Atlas dashboard for connection/quota issues second.
3. Roll back to last known-good deployment (see DEPLOYMENT.md) rather
   than debugging live if the issue isn't obvious within a few minutes.
4. Log the incident and its fix in FIXES.md once resolved, so it doesn't
   get re-debugged from scratch next time.
