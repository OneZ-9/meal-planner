# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

Calendar module (US-5 assign recipe to day/slot, US-9 navigate weeks)
implemented on top of the completed US-1 auth, Ingredients, and Recipes
work: weekly grid, recipe assignment/replacement, and Prev/Today/Next week
navigation.

## Recent work

- Implemented the Calendar module (US-5/US-9): `lib/models/calendarEntry.ts`
  (`CalendarEntryModel`, unique `(userId, date, mealSlot)` per assignment —
  assigning again on an occupied slot replaces via upsert rather than
  erroring), `lib/mealSlot.ts` (the `MealSlot`/`MEAL_SLOTS` source of truth,
  deliberately kept free of the Mongoose import so client components can use
  it — see FIXES.md), `lib/dateWeek.ts` (Mon-Sun week math via the newly
  added `date-fns` dependency — no date library existed in this project
  before), `lib/calendarValidation.ts`, `lib/calendarDto.ts`, and
  `GET/POST /api/calendar` + `DELETE /api/calendar/[id]`. Added
  `features/calendar/`: `CalendarScreen` (`/calendar`, DESIGN.md Section
  28's Weekly Plan grid) with week navigation, an assign-recipe dialog that
  searches the user's own recipes (reusing the existing recipe search API),
  and a meal chip with a Change/Remove kebab menu. Empty grid cells render
  with no visible icon, matching DESIGN.md's explicit "no placeholder
  affordance" rule, while still being clickable.
- A first pass also upgraded recipe delete to warn about affected calendar
  days and cascade-remove assignments (ARCHITECTURE.md §22, previously
  deferred pending the Calendar module's existence) — **this was explicitly
  reverted at the user's request** to keep the session scoped to the
  Calendar module only. Recipe delete is therefore unchanged from before
  this session: no affected-day warning, no cascade. Deleting a recipe
  still assigned to the calendar now leaves orphaned calendar entries
  (silently dropped from `GET /api/calendar`'s response, not erroring) —
  see KNOWN_ISSUES.md and DECISIONS.md "Calendar module (US-5/US-9)" for the
  full reasoning and what upgrading this later would involve.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass. Hit and
  fixed the FIXES.md "tls"/mongoose client-bundle bug in a new form: a
  `"use client"` grid component imported the `MEAL_SLOTS` constant directly
  from `lib/models/calendarEntry.ts`, pulling Mongoose into the browser
  bundle — fixed by extracting `MealSlot`/`MEAL_SLOTS` into the new
  model-free `lib/mealSlot.ts`. `npm test -- --run` still cannot execute on
  this machine (pre-existing Vitest/rolldown native-binding issue, see
  FIXES.md) — new tests (`lib/dateWeek.test.ts`,
  `lib/calendarValidation.test.ts`, `app/api/calendar/route.test.ts`,
  `app/api/calendar/[id]/route.test.ts`) were verified by reading, not
  execution. Not manually exercised in a live browser (no browser
  automation tool available in this environment, same limitation noted for
  every prior feature).

- Implemented the Recipe module (US-2 create, US-4 edit/delete; recipes
  have no global scope, always private to their owner — unlike
  ingredients). Added `lib/models/recipe.ts` (`RecipeModel`, `RecipeUnit`
  matching `.ai/Unit_Conversion_Algorithm_Spec.md`'s
  `RecipeIngredientEntry` unit set exactly, so the not-yet-built
  shopping-list module can consume recipe ingredient rows without
  reshaping them), `lib/recipeValidation.ts` (structural validation:
  name/servings/ingredients required, zero-ingredient and
  missing-quantity/unit rejected per US-2), `lib/recipeDto.ts` +
  `lib/recipeIngredients.ts` (DTO shaping and ingredient-visibility
  resolution shared by the API routes), and
  `app/api/recipes/route.ts` + `app/api/recipes/[id]/route.ts`
  (GET list+search, POST, GET one, PATCH, DELETE — all scoped to
  `session.user.id`, 404 rather than 403 for another user's recipe since
  recipe existence itself is private). Every ingredient row is checked
  against the ingredient module for visibility (global or the user's own)
  before a recipe can reference it (ARCHITECTURE.md "Recipe -> Ingredient
  Boundary").
- Added `features/recipes/`: `RecipesScreen` (Recipe Library — search,
  tag-derived sidebar filters, recipe cards, delete confirmation) and
  `RecipeFormScreen` (shared Create/Edit form used by both `/recipes/new`
  and `/recipes/[id]/edit`, reusing `IngredientCombobox` for ingredient
  rows). Recipe cards always show the DESIGN.md empty-image placeholder
  (no image upload — not a modeled Recipe field, matches
  ARCHITECTURE.md/DESIGN.md's Create Recipe form, which has no image
  input) and derive their description preview from the recipe's own
  ingredient names rather than a separate free-text field.
- **Recipe delete does not yet warn about affected calendar days or
  cascade-remove calendar assignments** (ARCHITECTURE.md §22) — the
  Calendar module doesn't exist yet, so there is nothing to check against.
  Mirrors the same deferral already accepted for ingredient delete; upgrade
  both once Calendar is built. See DECISIONS.md and KNOWN_ISSUES.md.
- Added shadcn primitive `textarea` (for recipe instructions).
- Fixed a second instance of the `features/*` barrel Client-Component
  bundling issue from FIXES.md: `recipe-form.tsx` (a Client Component)
  was importing `IngredientCombobox` from the `features/ingredients`
  barrel, which also re-exports the server-safe `IngredientsScreen` (→
  `@/auth` → `mongoose` → `tls`), breaking `npm run build`. Fixed by
  importing `IngredientCombobox` directly from its component file — see
  FIXES.md for the general pattern to watch for.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
  `npm test` / `npx vitest run` could **not** be verified this session —
  Vitest 4's `rolldown` dependency fails to load its native binding on
  this machine (`Cannot find native binding... npm has a bug related to
  optional dependencies`, npm/cli#4828) regardless of a clean
  `node_modules`/`package-lock.json` reinstall under the current Node
  v20.15.1. Recipe tests were written (`lib/recipeValidation.test.ts`,
  `app/api/recipes/route.test.ts`, `app/api/recipes/[id]/route.test.ts`,
  mirroring the existing ingredient test patterns) and verified by
  reading, not by running. See FIXES.md.

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
   user-owned API as shopping-list routes are implemented (Ingredients,
   Recipes, and Calendar now all do this — shopping-list is the one
   remaining module).
3. Shopping List (US-7/US-8) is the natural next target: reads the Calendar
   module's assignments + Recipe ingredients, normalizes/merges quantities
   per `.ai/Unit_Conversion_Algorithm_Spec.md`, and needs its own
   checked-state persistence (US-8). No shopping-list model or API exists
   yet.
4. Upgrade recipe delete to warn about affected calendar days and cascade
   the removal of those assignments (ARCHITECTURE.md §22) — buildable now
   that `CalendarEntryModel` exists, but deliberately left undone this
   session (see KNOWN_ISSUES.md and DECISIONS.md "Calendar module
   (US-5/US-9)"). Do this before or alongside Shopping List, since a
   dangling calendar entry pointing at a deleted recipe would otherwise
   surface as a confusing gap in a generated shopping list.
5. Resolve the Vitest/rolldown native-binding environment issue (see
   FIXES.md) so `npm test` is runnable again on this machine — needed to
   actually execute the Recipe and Calendar test files written across
   sessions (and the existing ingredient/auth tests).

## Validation state

- Calendar module: `npx tsc --noEmit`, `npm run lint`, and `npm run build`
  all pass. `npx vitest run` still fails to start on this machine (same
  pre-existing environment issue, see FIXES.md), so
  `lib/dateWeek.test.ts`, `lib/calendarValidation.test.ts`,
  `app/api/calendar/route.test.ts`, and `app/api/calendar/[id]/route.test.ts`
  are unverified by execution, only by reading. Not manually exercised in a
  live browser this session (no browser automation tool available, same
  limitation noted throughout this file).
- Recipe module: `npx tsc --noEmit`, `npm run lint`, and `npm run build`
  all pass (build includes the barrel-import fix above). `npx vitest run`
  fails to start on this machine — pre-existing environment issue, not
  caused by this change (see FIXES.md) — so the new recipe tests are
  unverified by execution, only by reading. Not manually exercised against
  live Atlas in a browser this session (no browser automation tool
  available, same limitation noted below for ingredients).
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
- Shopping-List API routes still don't exist yet (not a stub — never
  scaffolded on this branch; see git history). Recipe and Calendar routes
  are both now implemented.
