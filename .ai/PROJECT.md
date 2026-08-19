# PROJECT.md

## Purpose
Meal Planner + Auto Shopping List — plan a week of meals and auto-generate a
de-duplicated shopping list from that plan. Recipes are built once from a
shared ingredient list and reused across weeks; assigning them to a weekly
calendar generates a shopping list with no manual cross-referencing.

Source of truth for product scope: `Meal_Planner_Specification.pdf` at repo root.

## Problem being solved
Meal planning and grocery shopping are normally two disconnected tasks —
the shopping list gets derived from recipes by hand, every week, which
reliably produces missed items, duplicate purchases, and wasted food.
Two specific failure modes drive this:
- **Ingredient duplication**: free-text entry lets the same ingredient be
  typed differently across recipes, so items don't merge on the list.
- **Unit mismatch**: recipes measure in cooking units (tbsp), shopping
  happens in different units.

## Target users
- Structured diet planners tracking macros.
- Fitness-focused meal-preppers batch-planning around workouts.
- Home cooks who want recipes + shopping list in one connected tool.

## Stack
| Layer             | Choice                                                     |
| ----------------- | ---------------------------------------------------------- |
| Frontend/Backend  | Next.js (App Router) + TypeScript + React                  |
| Styling           | Tailwind CSS                                               |
| Database          | MongoDB Atlas via Mongoose                                 |
| Auth              | NextAuth.js, credentials provider, bcrypt                  |
| Hosting           | Vercel                                                     |
| Ingredient search | MongoDB text index                                         |
| Unit conversion   | `convert-units` (npm) — same-family only, see DECISIONS.md |

## Terminology
- **Canonical ingredient** — a de-duplicated ingredient entity (148-item
  global seed list + per-user custom entries) that recipes reference by ID,
  not free text. This is what makes shopping-list merging possible.
- **Same-family conversion** — normalizing within a unit family only
  (tsp/tbsp/cup → ml; oz/lb → g). Cross-family (e.g. tbsp of a dry
  ingredient → g) requires ingredient density data and is deferred.
- **Calendar slot** — one (day, meal) cell in the weekly calendar. MVP
  allows exactly one recipe per slot.
- **Module** — one of the five MVP modules (Auth, Ingredients/Recipes,
  Calendar, Shopping List, Checklist). Each has a single owning developer
  per `CODEOWNERS`.

## Directory map
```
src/
  app/
    (auth)/login, (auth)/signup       # public routes
    (dashboard)/dashboard             # overview page
    (dashboard)/recipes               # recipe library + create/edit
    (dashboard)/calendar              # weekly calendar
    (dashboard)/shopping-list         # generated list + checklist
    api/{auth,ingredients,recipes,calendar,shopping-list,checklist}/
  models/    # Mongoose schemas — User, Ingredient, Recipe, CalendarEntry, ShoppingList
  lib/       # db.ts, auth.ts, unitConversion.ts — shared, cross-module
  components/# one folder per module, mirrors app/ and CODEOWNERS
.ai/         # this context-engineering folder
```

## Environments
| Env        | URL                   | Notes                                                      |
| ---------- | --------------------- | ---------------------------------------------------------- |
| Local      | http://localhost:3000 | `.env.local`, placeholder Mongo URI works for UI-only work |
| Production | TBD (Vercel)          | not yet deployed                                           |

No staging environment defined — single-tenant MVP, 2-week delivery window.
