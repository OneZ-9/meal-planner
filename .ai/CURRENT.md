# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

All five MVP modules (Auth, Ingredients, Recipes, Calendar, Shopping List)
are implemented, plus one non-spec addition on request: recipe image
upload via Vercel Blob. Remaining work is Week 2 polish (ingredient
delete, live browser verification against a real Blob store, deployment)
rather than new modules.

## Recent work

- Fixed a second occurrence of literal unresolved git-merge conflict
  markers committed directly into this file's "Recent work" section (a
  nested `<<<<<<< HEAD` / `=======` / `<<<<<<< HEAD` / `>>>>>>> adeepa/dev`
  this time, wrapping a sign-out-confirmation entry from another dev's
  branch) — combined the content in place, same as the first occurrence
  fixed earlier the same day. If this keeps recurring, it's worth raising
  with whoever's merging `adeepa/dev` in: something in that workflow is
  committing conflict markers instead of resolving them.
- Added recipe image upload (Create/Edit Recipe) — not an original spec
  feature, added on explicit request. The user's initial proposal was a
  gitignored repo-local `uploads/` folder; flagged before writing any
  code that this breaks in production, since `DEPLOYMENT.md` targets
  Vercel and its serverless functions have no persistent/shared disk — a
  file written at runtime to a local folder won't reliably exist for a
  later request. Given four options, the user chose **Vercel Blob**.
  Implementation: `RecipeModel.imageUrl` (`string | null`), validated as
  `null` or an `http(s)://` URL in `lib/recipeValidation.ts`;
  `POST /api/recipes/image-upload` issues a scoped upload token via
  `@vercel/blob/client`'s `handleUpload` (auth-gated, constrained to
  image content-types and a 5MB max) rather than reading the file through
  this server — a client-side upload, so a full-resolution phone photo
  doesn't hit Vercel's ~4.5MB server-upload body limit; the browser talks
  directly to Blob storage via `lib/api/recipes.ts`'s `uploadRecipeImage`.
  `lib/recipeImageStorage.ts` best-effort-deletes the old image when
  replaced or when a recipe is deleted. `recipe-form.tsx` gained an
  upload/preview/replace/remove UI (with a local `URL.createObjectURL`
  preview while the real upload is in flight); `recipe-card.tsx` and the
  calendar's `recipe-details-dialog.tsx` render the image when set,
  otherwise falling back to the pre-existing empty-placeholder. Plain
  `<img>` used throughout instead of `next/image`, since Vercel Blob's
  hostname is per-project and dynamic. **This was built once, fully
  reverted the same session after the user reconsidered whether it was
  worth it, then rebuilt identically once a size-limit misunderstanding
  behind that reconsideration was cleared up** — see DECISIONS.md "Recipe
  image upload (Vercel Blob)" for the full reasoning and that back-and-
  forth, including why the `@vercel/blob@2.8.0` API was verified by
  reading its shipped `.d.ts` files rather than trusted from (possibly
  stale) training-data memory.
- Added a confirmation dialog to the shared app-shell sign-out control. The
  header button now asks "Are you sure you want to sign out?" and offers
  Cancel / Sign out actions; the actual Auth.js sign-out remains a Server
  Action and still redirects to `/login`. The client-only dialog is isolated
  in `features/app-shell/components/sign-out-control.tsx` so `@/auth` and its
  server dependencies stay out of the browser bundle.
- Replaced the Dashboard's hard-coded "This Week's Plan" values with live
  current-week data while preserving the `docs/design-reference/dashboard.png`
  layout. `features/dashboard/components/dashboard-screen.tsx` remains the
  Server Component shell; the new dashboard-local `DashboardOverview` Client
  Component and `useDashboardSummary` hook compose the existing Calendar,
  Recipes, and Shopping List feature queries. Meals Planned counts occupied
  slots; Recipes to Try counts library recipes not assigned this week; Items
  to Buy counts unchecked generated-list lines; Prep Ready is the rounded
  checked/total percentage (`0%` for an empty list). The week pill and the
  Shopping List action's "items remaining" text are dynamic too. Today's
  Highlights now uses today's Calendar entries as well: Dinner shows its
  assigned recipe or red `not allocated yet`; Missing lists unassigned
  Breakfast/Lunch/Dinner slots in red, or green `3 meals already selected`
  when today's three slots are filled. See DECISIONS.md "Dashboard
  current-week metric definitions".
- **Bugfix — creating an ingredient inline mid-recipe (search finds no
  match → Create) saved two duplicate recipes** (reported by another dev;
  root cause confirmed by them after the fix landed — the initial pass at
  this entry incorrectly assumed the symptom was a duplicated *ingredient*
  row and chased a double-submit *race*, which a live test against the
  real Atlas cluster ruled out as the actual cause). Best-supported
  explanation: `IngredientFormDialog`'s popup renders via a `DialogPortal`,
  so its `<form onSubmit>` is physically outside `RecipeForm`'s own
  `<form onSubmit={handleSubmit}>` in the DOM, but remains a descendant in
  the **React component tree** — React's documented portal behavior bubbles
  events along that tree, not the DOM tree. `handleFormSubmit` called
  `event.preventDefault()` but never `event.stopPropagation()`, so
  submitting the ingredient popup could also trigger `RecipeForm`'s own
  submit, saving a (likely incomplete) recipe at that moment; the user's
  later, real "Save Recipe" click then saved a second, complete one.
  **Fix**: a synchronous double-submit guard via `useRef` (not `useState`
  — state updates aren't visible until the next render) added to both
  `features/ingredients/components/ingredient-form-dialog.tsx` (create/edit
  submit handlers) and `features/recipes/components/recipe-form.tsx`
  (`handleSubmit`), set `true` the instant a submit starts and cleared via
  `useEffect` once the mutation settles (success or error) — refs must only
  be written in effects/handlers, never during render (trips the
  `react-hooks/refs` lint rule; the existing "adjust state during render"
  pattern in this codebase is for state, not refs). **Confirmed working by
  the reporting dev.** A more surgical fix at the actual source — adding
  `event.stopPropagation()` in the ingredient dialog's submit handlers —
  was identified but not applied, since the guard already resolved the
  report; worth doing if a similar dialog-in-a-portal-inside-a-form pattern
  resurfaces the issue. `npx tsc --noEmit`, `npm run lint`, `npm run build`
  all pass. See FIXES.md for the full writeup, including the (ultimately
  tangential but still valid) live DB-level test confirming ingredient
  create-duplicate protection is solid.
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
   file) — verify the new sign-out confirmation's Cancel and Sign out paths;
   this has also never been done for: the recipe delete cascade (both
   with and without calendar assignments), the entire Shopping List
   screen (week nav, checkbox toggling incl. optimistic-update rollback on
   a failed request, "Clear Checked"/"Check All", the empty-state message
   for a week with no assignments, and a real cross-family/no-density
   ingredient producing an "(not merged with other units)" line), and
   recipe image upload (upload/replace/remove on Create and Edit Recipe,
   with a real Vercel Blob store — currently only unit-tested with
   `handleUpload` mocked).
3. Ingredient delete is still not implemented (KNOWN_ISSUES.md) — now
   buildable against a reference check on both `RecipeModel` and (new)
   whether the ingredient appears in any current shopping-list generation,
   though the latter is derived data and doesn't need its own check beyond
   the existing recipe-reference one.
4. Vercel project connection / deployment (see DEPLOYMENT.md) — not done
   yet. Once a project exists, create its Blob store too (see
   DEPLOYMENT.md step 3) — recipe image upload needs `BLOB_READ_WRITE_TOKEN`
   and hasn't been exercised against a real store yet, only unit-tested
   with `handleUpload` mocked.
5. Consider adding `event.stopPropagation()` to
   `ingredient-form-dialog.tsx`'s submit handlers as a more direct fix for
   the dialog-in-a-portal-inside-a-form issue described in the "Bugfix"
   entry above and in FIXES.md — not required (the double-submit guard
   already resolved the reported symptom, confirmed by the reporting dev),
   but worth doing if a similar pattern (a portaled dialog's form nested,
   in the React tree, inside another form) causes an unwanted submit
   bubble again elsewhere.

Already done, despite being listed as pending in an earlier version of this
file that a since-resolved merge conflict had left stale: recipe delete's
affected-calendar-day warning + cascade (ARCHITECTURE.md §22, see "Recent
work" above), and the Vitest/rolldown native-binding issue (no longer
reproduces — `npx vitest run` passes, see FIXES.md).

## Validation state

- Recipe image upload: `npx tsc --noEmit`, `npm run lint`, `npm run build`,
  and `npx vitest run` (19 files, 147 tests) all pass. New coverage:
  `app/api/recipes/image-upload/route.test.ts` (auth gate, invalid-body
  400, the `allowedContentTypes`/`maximumSizeInBytes` token config passed
  to `handleUpload`, the `recipe-images/` pathname-prefix guard, and a
  `handleUpload` rejection surfacing as 400) with `@vercel/blob/client`'s
  `handleUpload` mocked; `app/api/recipes/[id]/route.test.ts` gained cases
  for old-image cleanup on replace vs. no-op when unchanged, and
  `DELETE`'s cleanup with vs. without a prior image, with `@vercel/blob`'s
  `del` mocked. `lib/recipeValidation.test.ts` covers the `imageUrl`
  http(s)-only check. **Not exercised end-to-end against a real Vercel
  Blob store** — no `BLOB_READ_WRITE_TOKEN`/store exists yet in this
  environment (see KNOWN_ISSUES.md), so the actual upload/replace/remove
  flow is verified only by the mocked tests above and code review, not a
  real upload. Not manually exercised in a live browser either (no
  browser automation tool available, same limitation noted throughout
  this file).
- Sign-out confirmation: `npx tsc --noEmit`, `npm run lint`, and `npm run
  build` pass. The production build confirms the Server Action can be passed
  into the isolated Client Component without pulling server-only auth/database
  dependencies into the browser bundle. Manual authenticated browser QA is
  still pending.
- Dashboard live metrics/highlights: `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `npx vitest run` all pass (18 files, 136 tests). Focused
  coverage in `features/dashboard/lib/dashboard-summary.test.ts` verifies
  occupied-slot counting, distinct unassigned recipes, unchecked-item totals,
  percentage rounding, the empty-list `0%` rule, today's dinner lookup,
  missing-dinner handling, ordered missing slots, and the all-three-selected
  state. Visual browser QA could not be run: the local app was available at
  `http://localhost:3000`, but no in-app or extension browser connection was
  available in this session.
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
