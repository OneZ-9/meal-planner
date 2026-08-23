# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

Custom ingredients (US-3) implemented on top of the completed US-1 auth
work: ingredient search/typeahead, create, and update, plus a standalone
ingredient management page.

## Recent work

- Added `Ingredients` to `AppNav` as the 2nd item (after Dashboard, ahead
  of Recipes — ingredients are a prerequisite for building recipes),
  updated `DESIGN.md` §7 to match (on explicit request, superseding the
  earlier "direct URL only" call — see DECISIONS.md).
- Fixed the `/ingredients` list only ever showing 50 results (it reused
  the typeahead endpoint's flat cap) by splitting the two use cases:
  `GET /api/ingredients` now returns `{ items, nextCursor }` (offset
  pagination, `cursor`/`limit`/`scope` params) instead of a flat array;
  `IngredientsManager` uses a new `useInfiniteIngredients` hook
  (`useInfiniteQuery`) with an `IntersectionObserver` sentinel for real
  infinite scroll. Verified live against Atlas: all 148 seeded
  ingredients are now reachable by paging through with `scope=global`.
  `useIngredientSearch` (the recipe-picker combobox) is unchanged in
  behavior — still a flat top-20 typeahead slice, not paginated. See
  DECISIONS.md "Ingredient list pagination + scope filter".
- Added a 3-way scope filter (All / My Ingredients / Global) to
  `IngredientsManager`, and a clear ("×") button to both ingredient
  search inputs (list page + combobox) so clearing doesn't require
  backspacing manually.
- Ingredient names display capitalized in the UI (`capitalize` CSS,
  display-only — stored/API data untouched); unit family labels were
  tried capitalized too but reverted per feedback, still lowercase.
- Implemented custom ingredients (US-3): `GET /api/ingredients` (search,
  scoped to global + own), `POST /api/ingredients` (create, with a
  proactive case-insensitive duplicate check that returns 409 + the
  existing ingredient), `PATCH /api/ingredients/[id]` (update, owner-only —
  global and other users' ingredients 403). Delete is intentionally not
  implemented this pass (no Recipe model yet to check references against —
  see KNOWN_ISSUES.md).
- Added `features/ingredients/`: `useIngredientSearch`/`useCreateIngredient`/
  `useUpdateIngredient` hooks, `IngredientFormDialog` (create + edit, with a
  mandatory "this will affect recipes that use it" confirmation before any
  edit saves), `IngredientCombobox` (typeahead + inline create, for future
  Create Recipe use), and a standalone `/ingredients` page — not in
  DESIGN.md's reference screens, added ahead of Recipes on explicit
  request (see DECISIONS.md).
- Added shadcn primitives `input`, `dialog`, `alert-dialog`, `select` to
  `components/ui/` (existing `button.tsx` left untouched).
- Fixed a production-build break (`Can't resolve 'tls'`) caused by a
  `"use client"` screen rendering `AppNav` directly, which pulled
  `@/auth` → `mongoose` into the client bundle — split into a Server
  Component shell (`ingredients-screen.tsx`) + client content
  (`ingredients-manager.tsx`). See FIXES.md.
- Verified end-to-end against the real Atlas cluster: registered two test
  users, exercised search/create/update, confirmed case-insensitive
  duplicate detection (both on create and on rename), confirmed a user
  cannot edit another user's or a global ingredient (403) and doesn't see
  another user's custom ingredients in search, then deleted all test data.
- `npx tsc --noEmit`, `npm run lint`, `npm test -- --run` (5 files, 28
  tests now), and `npm run build` all pass.

- Implemented US-1 authentication in this checkout: `/register` creates a
  normalized-email user with a bcrypt hash in MongoDB, then signs the user in;
  `/login` uses NextAuth credentials and redirects successful logins to
  `/dashboard`; `/dashboard` is protected server-side; the app nav signs out.
- Added the `User` Mongoose model (`users` collection, unique email index),
  Auth.js route handler/config, server-side registration validation, JWT session
  user IDs, auth UI states, and unit coverage for registration validation and
  root redirects.
- Added `next-auth@5.0.0-beta.32` and `bcryptjs@3.0.3`; `.env.example` now
  documents `MONGODB_URI`, `AUTH_SECRET`, and `AUTH_URL`.

- Real MongoDB Atlas cluster is live (`meal-planner-live` DB, `MONGODB_URI`
  in `.env.local`). Ran `scripts/seed-ingredients.mjs` against it — verified
  148 global ingredients (`userId: null`) in the `ingredients` collection,
  unique `userId_1_name_1` index built. Ingredient module's data layer is
  ready; search/typeahead API and recipe CRUD still unbuilt.
- Scaffolded Next.js App Router project, all 5 Mongoose models, stub API
  routes for every module.
- Built `/login` page (real NextAuth wiring) matching the reference design.
- Built `/dashboard` page (placeholder data) + shared NavBar used by every
  `(dashboard)` route.
- Pushed to GitHub: `OneZ-9/meal-planner`, branches `main`, `develop`,
  `feature/auth-signup`, `feature/dashboard-overview`,
  `feature/ingredients-typeahead`, `feature/calendar-assign`.
- `.ai/DESIGN.md` now fully specifies all 6 reference screens (added Login,
  Calendar, Create Recipe, Shopping List — previously only Dashboard and
  Recipe Library were documented). `app/globals.css`'s shadcn CSS variables
  were retuned to match `DESIGN.md`'s exact palette (see DECISIONS.md); any
  page built from here on gets the correct colors automatically via the
  semantic Tailwind classes.
- Diagnosed a teammate's `querySrv ENOTFOUND _mongodb._tcp.<cluster>...`
  startup error: it's their machine's network/DNS blocking the SRV lookup
  `mongodb+srv://` needs, not a missing local MongoDB install (none is
  needed — everyone points at the shared Atlas cluster). Documented the
  fix in `FIXES.md` and clarified `README.md`'s "Getting started" section
  to say so explicitly instead of the misleading "requires a running
  MongoDB instance."
- `AGENTS.md`'s "After pulling/merging" section reworded: reconciling
  `.ai/` docs against incoming commits is now a standing, self-triggered
  step an agent runs automatically after any pull/fetch+merge/merge/
  rebase (or on noticing one already happened), not something that
  waits on a dev remembering to ask for it.

## Blocker

None currently.

## Next action

1. Set a strong `AUTH_SECRET` locally and in the deployment environment, then
   manually exercise registration/login against the intended Atlas database.
2. Apply `auth()` checks and `session.user.id` ownership filters to every
   user-owned API as recipe/calendar/shopping-list routes are implemented
   (Ingredients now does this — recipe/calendar/shopping-list routes are
   the ones still pending).
3. Recipes and Calendar pages remain unbuilt — Recipes is the natural next
   target, since it's what the ingredient module (`IngredientCombobox`) was
   built to plug into next, and it unblocks ingredient delete (needs a
   reference check against recipes — see KNOWN_ISSUES.md).

## Validation state

- `npx tsc --noEmit` and `npm run lint` — clean after the ingredient
  pagination/scope-filter change.
- `npm test -- --run` passes (5 files, 28 tests); coverage includes
  registration validation, root auth redirects, ingredient validation,
  and the ingredient API routes (search scoping incl. `scope=custom`/
  `scope=global`, pagination `nextCursor`, create/update ownership,
  duplicate-check 409s, 403/404 cases).
- `npm run build` passes; local HTTP smoke checks return 200 for `/login`
  and `/register`, and 307 `/login` for a signed-out `/dashboard` request.
- Ingredient endpoints (including the new pagination/scope params) were
  exercised live against the real Atlas cluster — paged through all 148
  seeded ingredients via `scope=global`, confirmed `scope=custom` isolates
  per-user results, confirmed `nextCursor` behavior at page boundaries.
  Test data was cleaned up afterward.
- Infinite-scroll UI (IntersectionObserver) and the scope-filter chips
  were verified via the API-level pagination checks above and code
  review, not a headless-browser interaction test — no browser automation
  tool (chromium-cli/Playwright/Puppeteer) is available in this
  environment. Worth a manual click-through in a real browser before
  considering this fully done.
- Recipe/Calendar/Shopping-List API routes still don't exist yet (not
  stubs — never scaffolded on this branch; see git history).
