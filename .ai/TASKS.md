# TASKS.md

Source: [`.ai/DELIVERY_PLAN.md`](DELIVERY_PLAN.md). User story IDs (US-N)
refer to that plan.

## Done

- [x] Project scaffold: Next.js App Router, TypeScript, Tailwind, all 5
      Mongoose models, stub API routes, git branch structure.
- [x] `.env.example`, README with setup + git workflow.
- [x] US-1 auth implementation: registration UI/API, bcrypt user storage,
      NextAuth credentials login and persisted JWT session, protected dashboard,
      post-login redirect, and sign-out. Per-user API isolation remains a
      required boundary for user-owned modules as those APIs are implemented.
- [x] Dashboard page UI + shared NavBar. "This Week's Plan" now uses live
      current-week Calendar, Recipes, and Shopping List data for Meals Planned,
      Recipes to Try, Items to Buy, and Prep Ready; reference-image sample
      values remain only in the design documentation/example screenshot.
      Today's Highlights also reads today's Calendar slots: Dinner shows the
      assigned recipe or an unallocated warning, while Missing lists empty
      Breakfast/Lunch/Dinner slots or confirms all three are selected.
- [x] Repo pushed to GitHub, all branches live.

## Week 1 — in progress / pending

| Dev | User Story                                                         | Status                                                                                                                                              |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | US-1: signup, login, session, data isolation                       | Implemented; live Atlas browser smoke test pending. Ownership enforcement is ready via `session.user.id`; user-owned feature APIs do not exist yet. |
| B   | Canonical ingredients (seed + typeahead), US-2/3/4 CRUD groundwork | Seed data loaded; search/typeahead API, create, and update (US-3) implemented and tested. Ingredient delete deferred (KNOWN_ISSUES.md). Recipe module (US-2/US-4) implemented — see below. |
| C   | US-5 assign to day/slot, US-9 navigate weeks                       | Implemented — see below.                                                                                                                             |

**Week 1 integration checkpoint** (per spec Section 6): all three modules
demoable together, even shallowly, before Week 2 begins. Not yet reached.

- [x] Recipe module (US-2 create, US-4 edit/delete): `GET/POST /api/recipes`,
      `GET/PATCH/DELETE /api/recipes/[id]`, `lib/recipeValidation.ts`,
      `lib/recipeDto.ts`, `lib/recipeIngredients.ts`,
      `lib/models/recipe.ts` (`RecipeUnit` matches
      `.ai/Unit_Conversion_Algorithm_Spec.md` exactly). `features/recipes/`:
      Recipe Library (`/recipes`, search + tag-derived filters + delete
      confirmation) and a shared Create/Edit form (`/recipes/new`,
      `/recipes/[id]/edit`) reusing `IngredientCombobox` for ingredient
      rows. Recipes have no global scope — always private per user. Recipe
      delete does not yet warn about/cascade calendar assignments
      (ARCHITECTURE.md §22) since the Calendar module doesn't exist yet —
      same deferral pattern as ingredient delete; upgrade both once
      Calendar is built. Verified with `npx tsc --noEmit`, `npm run lint`,
      `npm run build`; `lib/recipeValidation.test.ts`,
      `app/api/recipes/route.test.ts`, `app/api/recipes/[id]/route.test.ts`
      written but unverified by execution — `npx vitest run` fails to
      start on this machine, a pre-existing environment issue (see
      FIXES.md), not caused by this change.

- [x] Calendar module (US-5 assign to day/slot, US-9 navigate weeks):
      `lib/models/calendarEntry.ts` (`CalendarEntryModel`, one unique
      `(userId, date, mealSlot)` per assignment), `lib/mealSlot.ts` (the
      `MealSlot`/`MEAL_SLOTS` source of truth, kept model-free so client
      components can import it without pulling in Mongoose — see FIXES.md),
      `lib/dateWeek.ts` (Mon-Sun week math via `date-fns`),
      `lib/calendarValidation.ts`, `lib/calendarDto.ts`,
      `GET/POST /api/calendar` (week read + assign-or-replace upsert),
      `DELETE /api/calendar/[id]` (remove one assignment). `features/calendar/`:
      `CalendarScreen` (`/calendar`, Weekly Plan grid) with week
      Prev/Today/Next navigation, an assign-recipe dialog (searches the
      user's own recipes via the existing recipe search API), and a meal
      chip with a Change/Remove kebab menu, plus a read-only
      `RecipeDetailsDialog` (name, servings, prep time, tags, ingredients,
      instructions) opened by clicking the chip itself — backed by a
      calendar-local `useRecipeDetails` hook rather than
      `features/recipes/hooks/useRecipe`, see DECISIONS.md. Assigning to an
      occupied slot
      replaces the recipe via the same upsert (no separate "replace" code
      path). Recipe-delete's affected-day warning/cascade (ARCHITECTURE.md
      §22) was intentionally left unimplemented this pass — see
      KNOWN_ISSUES.md. Verified with `npx tsc --noEmit`, `npm run lint`,
      `npm run build`; `lib/dateWeek.test.ts`, `lib/calendarValidation.test.ts`,
      `app/api/calendar/route.test.ts`, `app/api/calendar/[id]/route.test.ts`
      written but unverified by execution — `npx vitest run` still fails to
      start on this machine (pre-existing environment issue, see FIXES.md).

- [x] Recipe delete cascade (ARCHITECTURE.md §22): `DELETE
      /api/recipes/[id]` now removes calendar assignments referencing the
      deleted recipe via `CalendarEntryModel.deleteMany`, and a new
      `GET /api/recipes/[id]/calendar-usage` backs a real affected-day-count
      warning in the delete confirmation dialog (`useRecipeCalendarUsage`).
      `useDeleteRecipe` also invalidates `["calendar"]` queries so an open
      Weekly Plan view drops removed chips. See DECISIONS.md "Recipe delete
      cascade (ARCHITECTURE.md §22)". Verified with `npx tsc --noEmit`,
      `npm run lint`, `npm run build`, and — for the first time this
      project — an actually-passing `npx vitest run` (97/97 tests, 13
      files; the previously-blocking Vitest/rolldown issue no longer
      reproduces on this machine, see FIXES.md). That first real run also
      caught and fixed two unrelated pre-existing bugs (incomplete recipe
      model mocks, case-sensitive tag dedup) — see FIXES.md/DECISIONS.md.

- [x] Shopping List module (US-7 generate, US-8 checklist): full
      density-based unit conversion (reversing the earlier same-family-only
      cut — see DECISIONS.md "Shopping List generation (US-7/US-8)").
      `lib/unitConversion.ts` (`normalizeRecipeQuantity`,
      `formatDisplayQuantity` — the four-step algorithm from
      `.ai/Unit_Conversion_Algorithm_Spec.md`, hand-rolled ratios matching
      its verified test cases exactly), `lib/shoppingListGenerator.ts`
      (group by `ingredientId:resultUnit`, sum, round), `lib/models/
      shoppingListItemState.ts` (checked-state persistence only — the list
      itself is always regenerated live, never stored), `lib/
      shoppingListValidation.ts`, `GET/PATCH /api/shopping-list`
      (`weekStart` query param; PATCH always takes an `itemKeys: string[]`
      so one endpoint covers a single checkbox and the "Clear Checked"/
      "Check All" bulk actions). `features/shopping-list/`:
      `ShoppingListScreen` (`/shopping-list`, DESIGN.md section 30) with
      Prev/Today/Next week navigation (added beyond DESIGN.md's static
      mockup, matching Calendar — the list is genuinely week-scoped),
      optimistic checkbox toggling (`useUpdateShoppingListChecks` — the
      only optimistic mutation in this app, since US-8 is specifically
      about responsiveness while shopping), hand-rolled checkbox/progress-
      bar UI (no new shadcn primitive), and a flat item list instead of
      DESIGN.md's category-grouped layout (no aisle/category field exists;
      see KNOWN_ISSUES.md). Verified with `npx tsc --noEmit`,
      `npm run lint`, `npm run build`, and `npx vitest run` (130/130 tests,
      17 files — new: `lib/unitConversion.test.ts`,
      `lib/shoppingListGenerator.test.ts`,
      `lib/shoppingListValidation.test.ts`,
      `app/api/shopping-list/route.test.ts`). A signed-out HTTP request to
      `/shopping-list` was smoke-tested (307 → `/login`); not otherwise
      manually exercised in a live browser (no browser automation tool
      available, same limitation noted throughout `.ai/CURRENT.md`).

This completes all five MVP modules (Auth, Ingredients, Recipes, Calendar,
Shopping List).

## Week 2 — not started

| Dev | User Story                                           | Priority      |
| --- | ---------------------------------------------------- | ------------- |
| A   | US-7 generate shopping list (same-family conversion) | Done — see above (built with full conversion, not same-family-only) |
| B   | US-4 recipe edit/delete, ingredient creation flow    | Must / Should |
| C   | US-8 checklist, empty states, polish                 | Done — see above |

## Also pending (not story-specific)

- [x] 148-item ingredient seed script (`scripts/seed-ingredients.mjs` +
      `data/ingredients-seed-data.js`) — run against the live Atlas cluster;
      verified 148 docs in the `ingredients` collection, all global
      (`userId: null`), unique `userId_1_name_1` index built.
- [x] Real MongoDB Atlas cluster provisioned + `MONGODB_URI` shared with team
      (in `.env.local`, `meal-planner-live` database).
- [x] Custom ingredients (US-3): `GET/POST /api/ingredients`,
      `PATCH /api/ingredients/[id]`, `lib/ingredientValidation.ts`,
      `features/ingredients/` (search hook, create/update hooks,
      `IngredientCombobox`, standalone `/ingredients` page, reachable
      from `AppNav`). Delete intentionally excluded — see KNOWN_ISSUES.md.
      `/ingredients` supports infinite-scroll pagination and an
      All/My Ingredients/Global scope filter (`GET /api/ingredients`
      returns `{ items, nextCursor }`, params `cursor`/`limit`/`scope`).
      Verified with unit tests (`npm test`) and live end-to-end runs
      against the real Atlas cluster (register → login →
      search/create/update → ownership + duplicate checks → paged
      through all 148 seeded ingredients, then cleaned up).
- [ ] Vercel project connected (see DEPLOYMENT.md).
- [x] Shopping List page UI (`/shopping-list`) — built, see the Shopping
      List module entry above. All six planned pages now exist: Login,
      Dashboard, Ingredients, Recipes (`/recipes`, `/recipes/new`,
      `/recipes/[id]/edit`), Calendar (`/calendar`), Shopping List
      (`/shopping-list`).
- [x] Recipe image upload (not an original spec feature — added on
      request, reversing DECISIONS.md's earlier "no image field" call):
      `RecipeModel.imageUrl`, `lib/recipeValidation.ts` (http(s)-only,
      ≤2000 chars), `POST /api/recipes/image-upload` (issues a scoped
      Vercel Blob client-upload token via `@vercel/blob/client`'s
      `handleUpload`; the file itself uploads straight from the browser,
      never through this server, to stay under Vercel's ~4.5MB
      server-upload body limit), `lib/recipeImageStorage.ts` (best-effort
      old-image cleanup on replace/delete). `recipe-form.tsx` gained an
      upload/preview/replace/remove UI; `recipe-card.tsx` and the
      calendar's `recipe-details-dialog.tsx` render the image when set,
      falling back to the existing empty-placeholder otherwise. Needs a
      real Vercel Blob store + `BLOB_READ_WRITE_TOKEN` to actually
      exercise (see DEVELOPMENT.md/DEPLOYMENT.md) — not yet manually
      tested end-to-end against one. This was built, fully reverted, then
      rebuilt identically the same day — see DECISIONS.md "Recipe image
      upload (Vercel Blob)" for why. Verified with `npx tsc --noEmit`,
      `npm run lint`, `npm run build`, and `npx vitest run` (19 files,
      147 tests).

## Explicitly deferred (Future Features, not MVP)

Density-based cross-family unit conversion, fuzzy ingredient matching,
quantity rounding/display polish, repeat-recipe-across-days, recipe
duplication, drag-and-drop calendar, password reset, household accounts,
nutrition tracking, servings scaling, aisle categorization, recipe
import-from-URL, recipe versioning, batch-cook scaling. Don't build these
unless the spec is explicitly amended — see DECISIONS.md if that happens.
