# TASKS.md

Source: [`.ai/DELIVERY_PLAN.md`](DELIVERY_PLAN.md). User story IDs (US-N)
refer to that plan.

## Done

- [x] Project scaffold: Next.js App Router, TypeScript, Tailwind, all 5
      Mongoose models, stub API routes, git branch structure.
- [x] `.env.example`, README with setup + git workflow.
- [x] Login page UI + real NextAuth credentials wiring (US-1, partial —
      signup form not built yet, session/isolation not yet exercised
      end-to-end since no real DB connected during UI build).
- [x] Dashboard page UI (placeholder data) + shared NavBar.
- [x] Repo pushed to GitHub, all branches live.

## Week 1 — in progress / pending

| Dev | User Story                                                         | Status                                                                                                  |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| A   | US-1: signup, login, session, data isolation                       | Login UI done; signup UI + real end-to-end auth (session persistence, per-user isolation check) pending |
| B   | Canonical ingredients (seed + typeahead), US-2/3/4 CRUD groundwork | Seed data loaded (148 global ingredients in Atlas); search/typeahead API, recipe UI/API not started |
| C   | US-5 assign to day/slot, US-9 navigate weeks                       | Not started — model exists, no UI or working API yet                                                    |

**Week 1 integration checkpoint** (per spec Section 6): all three modules
demoable together, even shallowly, before Week 2 begins. Not yet reached.

## Week 2 — not started

| Dev | User Story                                           | Priority      |
| --- | ---------------------------------------------------- | ------------- |
| A   | US-7 generate shopping list (same-family conversion) | Must          |
| B   | US-4 recipe edit/delete, ingredient creation flow    | Must / Should |
| C   | US-8 checklist, empty states, polish                 | Must / Should |

## Also pending (not story-specific)

- [x] 148-item ingredient seed script (`scripts/seed-ingredients.mjs` +
      `data/ingredients-seed-data.js`) — run against the live Atlas cluster;
      verified 148 docs in the `ingredients` collection, all global
      (`userId: null`), unique `userId_1_name_1` index built.
- [x] Real MongoDB Atlas cluster provisioned + `MONGODB_URI` shared with team
      (in `.env.local`, `meal-planner-live` database).
- [ ] Vercel project connected (see DEPLOYMENT.md).
- [ ] Recipes page UI (`/recipes`), Calendar page UI (`/calendar`),
      Shopping List page UI (`/shopping-list`) — none built yet, only
      Login and Dashboard.

## Explicitly deferred (Future Features, not MVP)

Density-based cross-family unit conversion, fuzzy ingredient matching,
quantity rounding/display polish, repeat-recipe-across-days, recipe
duplication, drag-and-drop calendar, password reset, household accounts,
nutrition tracking, servings scaling, aisle categorization, recipe
import-from-URL, recipe versioning, batch-cook scaling. Don't build these
unless the spec is explicitly amended — see DECISIONS.md if that happens.
