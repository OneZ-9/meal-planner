<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Meal Planner + Auto Shopping List — agent instructions

This file is the entry point for the whole `.ai/` folder. Read the **core
loop** below every session, in order, before touching code. Read the
**situational** docs only when the listed trigger applies — they're not
part of the standard pickup sequence.

## Core loop — read every session, in order

1. **`.ai/CURRENT.md`** — what's happening right now; read this first every session.
2. **`.ai/PROJECT.md`** — what this app is, stack, terminology, directory map.
3. **`.ai/ARCHITECTURE.md`** — module boundaries, data flow, project structure, domain invariants.
4. **`.ai/DELIVERY_PLAN.md`** — the Week 1/Week 2 delivery breakdown and success measures.
5. **`.ai/TASKS.md`** — what's done, in progress, and pending, mapped to `.ai/DELIVERY_PLAN.md`'s user stories.
6. **`.ai/DECISIONS.md`** — check before "fixing" something that might be intentional scope.
7. **`.ai/KNOWN_ISSUES.md`** — MVP limitations and deferred features that are deliberate, not bugs.
8. **`.ai/FIXES.md`** — check here before re-debugging something that's happened before.
9. **`.ai/DEVELOPMENT.md`** — local setup, env vars, conventions, commands.

## Situational — read when the trigger applies

- **`.ai/DESIGN.md`** — the UI visual and interaction contract (layout, spacing,
  colors, typography, component patterns); read before implementing or
  modifying any screen.
- **`.ai/Unit_Conversion_Algorithm_Spec.md`** — read before touching shopping-list
  generation or unit normalization; has the exact algorithm and verified
  test cases (US-3, US-7).
- **`.ai/MEAL_PLANNER_REQUIREMENTS.md`** — the full user stories (US-1–US-9) and
  resolved open questions behind `.ai/DELIVERY_PLAN.md`/`.ai/TASKS.md`'s US-N IDs;
  read when a task references a story ID you need the full acceptance criteria for.
- **`.ai/Meal_Planner_Feature_List_MoSCoW.md`** — MoSCoW prioritization derived from
  the requirements doc; read when scope/priority of a feature is unclear.
- **`.ai/QA_Review_Edge_Cases.md`** — pre-implementation edge-case review of the
  requirements; cross-check `.ai/DECISIONS.md` to see which items were resolved vs.
  accepted as risk.
- **`.ai/DEPLOYMENT.md`** — read before deploying or changing deploy config.
- **`.ai/OPERATIONS.md`** — read when debugging a production incident or setting up monitoring.

## Mandatory: keep `.ai/` in sync with every change

Updating the relevant `.ai/` file(s) is part of the change, not a
follow-up step — a change isn't done until its docs are. This applies to
any repo change an agent makes or observes: code, config, infra/deploy
state, or one-off operations (e.g. running a seed script, provisioning a
cluster), not just "finishing a task."

Before ending a turn that changed something, update whichever of these
apply:

- **`.ai/CURRENT.md`** — always. Add/adjust the "Recent work" and "Next
  action" bullets so the next session's first read reflects reality.
- **`.ai/TASKS.md`** — move the item to Done, or update its status line,
  whenever it maps to a tracked task/user story.
- **`.ai/DECISIONS.md`** — add an entry for any non-obvious call (a
  choice between two reasonable approaches, a deviation from what a doc
  implied).
- **`.ai/FIXES.md`** — add an entry for anything debugged that could
  recur (a gotcha, a misleading error, an env quirk).
- **`.ai/KNOWN_ISSUES.md`** — update if the change resolves or introduces
  an MVP limitation.
- **`.ai/DEPLOYMENT.md`** / **`.ai/OPERATIONS.md`** — update for
  deploy/infra config changes or new operational gotchas.
- **`.ai/ARCHITECTURE.md`** / **`.ai/PROJECT.md`** — update only for
  actual structural/architectural changes (new module, changed data
  flow, new directory) — don't restate a normal code change here.

Stale docs here are actively misleading to the next person (or agent).
When in doubt about whether something is "worth" documenting, prefer
writing the one-line update — it's cheaper than the next session
re-discovering or re-doing the work.

## After any git pull/fetch+merge — reconcile `.ai/` automatically

Incoming commits from `dev`, `main`, or a teammate's branch may not have
followed the sync rule above. This step is self-triggered by the git
operation itself, not by the user asking — run it right after any pull/
merge/rebase, and also on discovering one already happened (e.g. local
HEAD is ahead of what `.ai/CURRENT.md` describes at session start).

1. Compare pre- and post-merge state: `git log <old-HEAD>..HEAD --oneline`
   and `git diff <old-HEAD>..HEAD --stat` for what was fetched in, plus
   `git status`/`git diff` for any of your own uncommitted local changes
   still pending.
2. Cross-check both against `.ai/CURRENT.md` and `.ai/TASKS.md`: anything
   marked "pending"/"not started" that's now actually done (locally or
   incoming), or "done" that got reverted/changed.
3. Update `.ai/CURRENT.md` and `.ai/TASKS.md` (and `DECISIONS.md`/
   `FIXES.md`/`KNOWN_ISSUES.md` where relevant) to reflect the combined
   local + fetched state before starting new work on top of it.
