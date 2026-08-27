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
- [x] Dashboard page UI (placeholder data) + shared NavBar.
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
- [ ] Shopping List page UI (`/shopping-list`) — not built yet; no
      shopping-list model or API exists either. Recipes (`/recipes`,
      `/recipes/new`, `/recipes/[id]/edit`) and Calendar (`/calendar`) are
      now built, alongside Login, Dashboard, and Ingredients.

## Explicitly deferred (Future Features, not MVP)

Density-based cross-family unit conversion, fuzzy ingredient matching,
quantity rounding/display polish, repeat-recipe-across-days, recipe
duplication, drag-and-drop calendar, password reset, household accounts,
nutrition tracking, servings scaling, aisle categorization, recipe
import-from-URL, recipe versioning, batch-cook scaling. Don't build these
unless the spec is explicitly amended — see DECISIONS.md if that happens.
