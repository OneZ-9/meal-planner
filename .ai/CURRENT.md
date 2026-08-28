# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

Shopping List (US-7/US-8) is implemented — all five MVP modules (Auth,
Ingredients, Recipes, Calendar, Shopping List) now exist. Full
density-based unit conversion and nearest-5g/5ml/kg-L rounding were built
(the user reversed the earlier same-family-only/plain-decimal scope cut
when asked directly before starting). Remaining work is Week 2 polish
(ingredient delete, live browser verification, deployment) rather than
new modules.

## Recent work

Investigating a reported "recipe saves with a duplicate ingredient" issue
(from another dev) on top of the completed US-1 auth, Ingredients, Recipes,
and Calendar work. Applied a defensive double-submit-guard fix; **root
cause not confirmed** — see below.

## Recent work

- **Bug investigation — recipe reportedly ends up with a duplicate-looking
  ingredient** (reported by another dev; not reproduced firsthand in a
  browser — no browser automation tool available). Initial static-analysis
  theory: a fast double-click (or Enter-then-click) on the
  ingredient-create dialog's submit button fires the handler twice before
  React re-renders with `isSubmitting: true` and disables the button (the
  `disabled` prop only reflects the in-flight mutation a tick *after* the
  click), sending two `POST /api/ingredients` requests for the same name;
  if both succeeded, `recipe-form.tsx`'s `ingredientId`-based dedup
  couldn't catch two different ingredient records with the same name.
  **Live-tested against the real Atlas cluster once `.env.local` was
  provided mid-session** (register test user → sign in via NextAuth
  credentials → fire two genuinely concurrent `POST /api/ingredients` for
  the same new name): the app-level `findOne`-then-`create` check plus the
  DB's unique index correctly produced one `201` + one `409`, only one
  document ever persisted. A full create-ingredient → create-recipe →
  fetch-recipe round trip also came back clean (no duplication). **So this
  specific failure mode did not reproduce server-side** — the DB-level
  protection held under a direct race test in this environment. Test data
  (`claude-bugtrace@example.com`, the test recipe, the test ingredient) was
  cleaned up afterward (recipe via `DELETE /api/recipes/[id]`; the
  user/ingredient via a one-off `mongoose` script, since ingredient/user
  delete aren't exposed via API).
  **Fix applied anyway, as defensive hardening** (prevents the double
  request from firing at all, rather than depending on 409-timing luck):
  added a synchronous double-submit guard via `useRef` (not `useState` —
  state updates aren't visible until the next render, so they can't close
  this specific race window) to
  `features/ingredients/components/ingredient-form-dialog.tsx` and
  `features/recipes/components/recipe-form.tsx`, reset once the mutation
  actually settles (success or error) via `useEffect` — refs must only be
  written in effects/handlers, never during render (trips the
  `react-hooks/refs` lint rule otherwise; the existing "adjust state during
  render" pattern in this codebase is specifically for state, not refs).
  `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
  **Still unresolved / next step**: the original report's exact mechanism
  is still unknown — worth getting the reporting dev's browser Network tab
  or exact repro steps next time it happens, since a live server-side race
  test couldn't trigger it. See FIXES.md for the full writeup.

- Changed the Calendar and Shopping List week-nav control on request: the
  middle pill now shows the current week's date range (e.g. "Oct 23 – Oct
  29, 2023") instead of a static "Today" label, and the separate
  date-range subtitle under each page title was dropped as redundant once
  the pill became dynamic. Click behavior unchanged — the pill still jumps
  to the current week. See DECISIONS.md "Week navigation pill shows the
  date range, not a static 'Today' label"; DESIGN.md sections 28/30
  updated to match.
- Implemented the Shopping List module (US-7/US-8), the last unbuilt
  module. `lib/unitConversion.ts` implements the full four-step algorithm
  from `.ai/Unit_Conversion_Algorithm_Spec.md` (same-family normalization,
  family-match check, density-based cross-family conversion, caller
  groups/sums/rounds) with hand-rolled ratios matching the spec's
  "Verified test cases" exactly (sugar → 265g, olive oil → 130ml) rather
  than the `convert-units` npm package the spec's aside suggested.
  `lib/shoppingListGenerator.ts` groups by `ingredientId:resultUnit`,
  sums, and rounds (nearest 5g/5ml, switching to kg/L above 1000) —
  simplified from the spec's reference pseudocode by not also splitting
  "unmerged" (missing-density) entries by their original entered unit,
  since that split changes nothing for any case the spec actually verifies.
  `lib/models/shoppingListItemState.ts` persists only checked/unchecked
  state per `(userId, weekStart, itemKey)` — the list itself is always
  regenerated live from Calendar + Recipe + Ingredient data, never stored,
  same "no snapshot" philosophy used everywhere else in this app.
  `GET/PATCH /api/shopping-list`: GET takes a `weekStart` query param
  (same convention as Calendar) and merges in persisted checked state;
  PATCH always takes `itemKeys: string[]` so one endpoint covers both a
  single checkbox toggle and DESIGN.md's "Clear Checked"/"Check All" bulk
  actions. `features/shopping-list/`: `ShoppingListScreen` (`/shopping-list`)
  with Prev/Today/Next week navigation (added beyond DESIGN.md's static
  mockup, since the list is genuinely week-scoped per US-9), optimistic
  checkbox toggling via `useUpdateShoppingListChecks` (the only optimistic
  mutation in this app — US-8 is specifically about responsiveness while
  physically shopping), hand-rolled checkbox/progress-bar UI rather than a
  new shadcn primitive (DESIGN.md itself calls for a "custom-styled"
  checkbox, not a default library look), and a flat item list rather than
  DESIGN.md's category-grouped layout (no aisle/category field exists on
  `Ingredient`; aisle categorization is an explicit MoSCoW "Won't"). See
  DECISIONS.md "Shopping List generation (US-7/US-8)" for the full
  reasoning on every deviation above.
- **Before starting, confirmed with the user whether to build the
  original full algorithm (density-based cross-family conversion +
  nearest-5/kg-L rounding) or the same-family-only/plain-decimal version
  DECISIONS.md's "Features cut or simplified" list had previously cut for
  time.** `ARCHITECTURE.md` §13-§17 and `Unit_Conversion_Algorithm_Spec.md`
  had never been updated to reflect that cut, so the two core docs
  actively disagreed; three other docs (DECISIONS.md, KNOWN_ISSUES.md,
  `Meal_Planner_Feature_List_MoSCoW.md`) agreed the cut was real. The user
  chose the full original algorithm, reversing that cut — both affected
  cut-list items in DECISIONS.md are now annotated "Superseded" rather
  than deleted, so the history isn't lost.

- Implemented the recipe-delete cascade deferred since the Calendar module
  landed (ARCHITECTURE.md §22, KNOWN_ISSUES.md, DECISIONS.md "Calendar
  module (US-5/US-9)"): `DELETE /api/recipes/[id]` now calls
  `CalendarEntryModel.deleteMany({ userId, recipeId })` after deleting the
  recipe (no transaction — matches the already-accepted "blunt cascade"
  risk in DECISIONS.md). Added `GET /api/recipes/[id]/calendar-usage`
  (`{ count }`, same 404-not-403 ownership rule as the other recipe
  routes) and a matching `useRecipeCalendarUsage` hook so the delete
  confirmation dialog in `recipes-manager.tsx` shows a real "assigned to N
  calendar days" warning instead of always showing the generic "cannot be
  undone" copy. `useDeleteRecipe` now also invalidates `["calendar"]`
  queries so an open Weekly Plan view drops the removed chips. See
  DECISIONS.md "Recipe delete cascade (ARCHITECTURE.md §22)" for the full
  reasoning, including why "Update Affected Lists" (the diagram's last
  step) is a no-op until Shopping List exists.
- **The Vitest/rolldown native-binding issue that blocked `npx vitest run`
  on this machine across every prior session no longer reproduces** — cause
  unknown, no reinstall performed this session. Running the suite for real
  for the first time (97 tests, 13 files, all passing after fixes below)
  caught two unrelated pre-existing bugs that had only ever been "verified
  by reading": `app/api/recipes/route.test.ts` and
  `app/api/recipes/[id]/route.test.ts` mocked `@/lib/models/recipe` without
  the real `RECIPE_UNITS` export that `lib/recipeValidation.ts` needs at
  runtime (fixed via `importOriginal`), and `lib/recipeValidation.ts`'s tag
  dedup used a case-sensitive `Set` so `"Dinner"`/`"dinner"` produced two
  tags instead of one (fixed with a lowercase-keyed dedup that keeps
  first-seen casing). See FIXES.md.
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

All five MVP modules (Auth, Ingredients, Recipes, Calendar, Shopping List)
are now implemented. What's left is Week 2 polish and verification, not new
modules:

1. Set a strong `AUTH_SECRET` locally and in the deployment environment, then
   manually exercise registration/login against the intended Atlas database.
2. Manual click-through in a live browser (no browser automation tool
   available in this environment, same limitation noted throughout this
   file) — this has never been done for: the recipe delete cascade (both
   with and without calendar assignments), and the entire Shopping List
   screen (week nav, checkbox toggling incl. optimistic-update rollback on
   a failed request, "Clear Checked"/"Check All", the empty-state message
   for a week with no assignments, and a real cross-family/no-density
   ingredient producing an "(not merged with other units)" line).
3. Ingredient delete is still not implemented (KNOWN_ISSUES.md) — now
   buildable against a reference check on both `RecipeModel` and (new)
   whether the ingredient appears in any current shopping-list generation,
   though the latter is derived data and doesn't need its own check beyond
   the existing recipe-reference one.
4. Vercel project connection / deployment (see DEPLOYMENT.md) — not done
   yet.

5. Upgrade recipe delete to warn about affected calendar days and cascade
   the removal of those assignments (ARCHITECTURE.md §22) — buildable now
   that `CalendarEntryModel` exists, but deliberately left undone this
   session (see KNOWN_ISSUES.md and DECISIONS.md "Calendar module
   (US-5/US-9)"). Do this before or alongside Shopping List, since a
   dangling calendar entry pointing at a deleted recipe would otherwise
   surface as a confusing gap in a generated shopping list.
6. Resolve the Vitest/rolldown native-binding environment issue (see
   FIXES.md) so `npm test` is runnable again on this machine — needed to
   actually execute the Recipe and Calendar test files written across
   sessions (and the existing ingredient/auth tests).
7. Get exact repro steps (or a browser Network-tab capture) from the dev
   who reported the "recipe saves with a duplicate ingredient" bug — a
   direct server-side concurrency test couldn't trigger the failure this
   session (see FIXES.md), so the double-submit guard already applied is a
   reasonable hardening pass but not a confirmed fix for whatever they
   actually saw.

## Validation state

- Shopping List module: `npx tsc --noEmit`, `npm run lint`, `npm run
  build`, and `npx vitest run` (17 files, 130 tests) all pass. New
  coverage: `lib/unitConversion.test.ts` (reproduces the spec's verified
  sugar/olive-oil test cases plus count passthrough and the missing-
  density "unmerged" case), `lib/shoppingListGenerator.test.ts` (merging
  across recipes/occurrences, unmerged lines, dropped-ingredient
  tolerance, name sort), `lib/shoppingListValidation.test.ts`, and
  `app/api/shopping-list/route.test.ts` (GET generation + checked-state
  merge, empty-week short-circuit, PATCH bulk upsert). A signed-out HTTP
  request to `/shopping-list` was smoke-tested (307 → `/login`, same
  pattern as prior sessions' `/dashboard` check) via a locally-started
  `npm run dev`. Not otherwise manually exercised in a live browser this
  session (no browser automation tool available, same limitation noted
  throughout this file) — see "Next action" above for what that
  click-through still needs to cover.
- Recipe delete cascade: `npx tsc --noEmit`, `npm run lint`, `npm run
  build`, and `npx vitest run` (13 files, 97 tests) all pass — the first
  time this repo's full suite has actually executed rather than being
  verified by reading (see FIXES.md). New coverage:
  `app/api/recipes/[id]/route.test.ts` (DELETE now asserts the
  `CalendarEntryModel.deleteMany` cascade call, and that it's skipped when
  the recipe isn't owned by the caller) and a new
  `app/api/recipes/[id]/calendar-usage/route.test.ts`. Not manually
  exercised in a live browser this session (no browser automation tool
  available, same limitation noted throughout this file) — see "Next
  action" above.
- Calendar module: `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
  now `npx vitest run` all pass — `lib/dateWeek.test.ts`,
  `lib/calendarValidation.test.ts`, `app/api/calendar/route.test.ts`, and
  `app/api/calendar/[id]/route.test.ts` are confirmed passing, not just
  read. Not manually exercised in a live browser this session (no browser
  automation tool available, same limitation noted throughout this file).
- Recipe module: `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
  now `npx vitest run` all pass (after the mock/dedup fixes in FIXES.md).
  Not manually exercised against live Atlas in a browser this session (no
  browser automation tool available, same limitation noted below for
  ingredients).
- `npx tsc --noEmit` and `npm run lint` — clean after the ingredient
  pagination/scope-filter change.
- `npm test -- --run` passes (13 files, 97 tests as of the recipe-delete-
  cascade session); coverage includes registration validation, root auth
  redirects, ingredient validation, and the ingredient API routes (search
  scoping incl. `scope=custom`/`scope=global`, pagination `nextCursor`,
  create/update ownership, duplicate-check 409s, 403/404 cases).
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
