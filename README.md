# Meal Planner + Auto Shopping List

A full-stack meal planning app that connects a recipe library to a weekly
calendar and auto-generates a de-duplicated, unit-normalized shopping list
from whatever's scheduled — so the list is always a direct, accurate
reflection of the plan instead of something built by hand every week.

Meal planning and grocery shopping are normally two disconnected tasks: the
shopping list gets derived from recipes manually, which reliably produces
missed items, duplicate purchases, and wasted food. This app closes that
gap by having every recipe reference a shared, de-duplicated ingredient
list (instead of free text) and by converting between cooking units (tbsp,
cup) and shopping units (g, ml) automatically, so the same ingredient from
different recipes merges into one correct line.

**Target users**: structured diet planners tracking macros, fitness-focused
meal-preppers batch-planning around workouts, and home cooks who want
recipes and their shopping list in one connected tool.

## Features

- **Authentication** — email/password signup and login (NextAuth, bcrypt),
  persisted session, and per-user data isolation across every module.
- **Canonical ingredients** — a de-duplicated, searchable ingredient list
  (148-item seeded baseline + user-created custom entries) that recipes
  reference by ID rather than free text, with infinite-scroll browsing and
  an All / My Ingredients / Global scope filter.
- **Recipe library** — create, edit, and delete recipes (name, servings,
  tags, instructions, ingredient rows with quantity + unit), with search
  and tag filters and optional recipe photo upload. Deleting a recipe warns
  about and cascades to any calendar days it's assigned to.
- **Weekly calendar** — assign a recipe to a (day, meal) slot, replace an
  occupied slot by reassigning, navigate between weeks, and view full
  recipe details from the calendar without leaving the page.
- **Auto-generated shopping list** — merges every ingredient across the
  week's assigned recipes, normalizing units within a family (tsp/tbsp/cup
  → ml, oz/lb → g) and converting across families using ingredient density
  data where available, then rounds to clean display quantities. Includes
  a persistent checklist (checked state survives across sessions) with
  optimistic toggling, "Check All"/"Clear Checked" bulk actions, and
  week-to-week navigation matching the calendar.
- **Live dashboard** — this week's meals-planned/recipes-to-try/items-to-buy/
  prep-ready summary and today's meal-slot highlights, computed from real
  Calendar/Recipe/Shopping List data (not placeholder values), plus a
  "Suggested for You" panel of your most-frequently-planned recipes.
- **Responsive app shell** — a shared nav bar (with a slide-out menu on
  mobile) across every authenticated screen.

## Project scope

This is a single-tenant MVP built to a fixed two-week delivery window —
scope was deliberately kept tight around one complete pipeline: **sign up →
build recipes → assign to a week → get a correct shopping list → check
items off while shopping.** Notable boundaries of the current scope:

- One recipe per calendar slot; no multi-recipe slots or offline mode.
- Ingredient de-duplication is exact-match only — no fuzzy matching (e.g.
  "Tomato" vs. "Tomatoe" are treated as different ingredients).
- No self-service password recovery; no household/shared accounts — every
  account and its data (recipes, calendar, shopping list) is single-user.
- Shopping list items are a flat list, not grouped by store aisle/category.
- No nutrition tracking — explored during planning and deliberately
  dropped, since reliable macro data isn't available at the ingredient
  level in this iteration.

See `.ai/Meal_Planner_Feature_List_MoSCoW.md` for the full prioritized
feature breakdown and `.ai/KNOWN_ISSUES.md` for the complete list of
by-design MVP limitations and accepted risks.

## Future enhancements

Explicitly deferred, not currently planned unless the project scope is
revisited:

- Fuzzy/near-duplicate ingredient matching
- Repeat-recipe-across-multiple-days and drag-and-drop calendar editing
- Recipe duplication, servings scaling, and import-from-URL
- Recipe versioning/snapshots (the calendar currently always reflects the
  live, latest recipe by design)
- Aisle/category grouping on the shopping list
- Self-service password reset
- Household / shared accounts
- Nutrition tracking with personal targets

## Tech stack

- **Framework**: Next.js 16 (App Router) + React 19, TypeScript (strict)
- **Styling/UI**: Tailwind CSS v4 + shadcn/ui (base-ui primitives)
- **Data**: MongoDB Atlas via Mongoose
- **Auth**: NextAuth.js (credentials provider) + bcrypt
- **State**: TanStack React Query (server state), Zustand (client state)
- **File storage**: Vercel Blob (recipe images)
- **Testing**: Vitest + React Testing Library
- **Hosting target**: Vercel

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No local MongoDB
install is needed — the app connects to MongoDB Atlas. Copy
`.env.example` to `.env.local`, set `MONGODB_URI`, and generate
`AUTH_SECRET` with `openssl rand -base64 32`; `AUTH_URL` is
`http://localhost:3000` locally. Ask a teammate for the shared dev
database value. For recipe image upload you'll also need
`BLOB_READ_WRITE_TOKEN` (see `.ai/DEVELOPMENT.md`) — everything else works
without it. If startup fails with `querySrv ENOTFOUND ...`, your
network/DNS is blocking the SRV lookup `mongodb+srv://` URIs need — see
`.ai/FIXES.md`.

## Scripts

- `npm run dev` — start the dev server (Next.js 16, Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode)
- `npm run format` / `npm run format:check` — Prettier write / check
- `node --env-file=.env.local scripts/seed-ingredients.mjs` — seed the canonical ingredients collection (idempotent, safe to re-run)

## Conventions

Project conventions — feature-folder structure, state management rules, code style, testing patterns — are documented in [AGENTS.md](./AGENTS.md). Read it before contributing. The full `.ai/` folder (linked from AGENTS.md) has the current architecture, delivery plan, task tracker, decisions log, and known issues — read `.ai/CURRENT.md` first for the latest project state.

## Project state

All five MVP modules — Authentication, Ingredients, Recipes, Calendar, and
Shopping List — are implemented and covered by an automated test suite,
plus recipe image upload as a post-MVP addition. Remaining work is
deployment (not yet live on Vercel — see `.ai/DEPLOYMENT.md`) and final
manual QA polish; see `.ai/CURRENT.md` for exactly what's outstanding.

## Contributors

- [Chamod Tharuka](https://github.com/OneZ-9)
- [Adeepa Isuru](https://github.com/AdeepaGit)
- [Mohamed Akeel](https://github.com/Akeel-Senzmate)
- [Abhisheka Karandanagama](https://github.com/Askarandanagama)
