# Meal Planner + Auto Shopping List — Refined Requirements

Based on the interview covering users, workflows, priorities, and edge cases.

## Product Summary

A web app for structured diet planners and fitness-focused meal-preppers to plan
a week of meals and generate an accurate, de-duplicated shopping list from that
plan — without manually cross-referencing recipes by hand. Each user has an
independent, private account; there is no household or shared-plan mode in v1.

The core loop: a user builds a personal recipe library (ingredients selected
from a shared canonical list, not typed as free text), assigns recipes to days
and meal slots on a weekly calendar — including repeating a meal across
multiple days in one action — and generates a shopping list for that week.
Ingredient quantities are normalized to a common unit before merging (e.g. a
recipe's "2 tbsp sugar" converts to grams using that ingredient's density), so
totals are both accurate across recipes and meaningful to read, not just
summed within whatever unit each recipe happened to use. The calendar always
references the *current* version of a recipe, so edits and deletions
propagate immediately to any week that uses them, including already-shopped-for
weeks.

Nutrition tracking was explored but is deferred past v1. The shopping list's
gram-conversion pipeline lowers the engineering cost, but a nutrition-quality
feature also needs a per-item weight for produce and proteins (e.g. average
grams per onion), and that average hides too much natural size variation to
trust for a precision-sensitive use case — even though it's perfectly fine
for a shopping list. Worth revisiting if a more reliable way to estimate
per-item weight becomes worthwhile to build.

## User Stories & Acceptance Criteria

### US-1 — Account creation & login
*As a user, I want to create an account and log in, so that my recipes and meal plan are private to me.*
- User can sign up with email + password and log in to a persisted session
- All recipes, calendar entries, and shopping lists are scoped to the logged-in user only
- Requests for another user's data are rejected

### US-2 — Add a recipe with canonical ingredients
*As a user, I want to build a recipe by selecting ingredients from a shared list, so my shopping list can merge accurately later.*
- User enters a recipe name and servings count
- Each ingredient row is selected via typeahead search against the canonical ingredient list, with a quantity and unit
- A recipe cannot be saved with zero ingredients or a missing quantity/unit

### US-3 — Create a new canonical ingredient
*As a user, I want to add an ingredient that isn't in the list yet, so I'm not blocked from finishing a recipe.*
- If typeahead search returns no match, the user is offered a "create new ingredient" option
- Before creation, the system checks for a near-duplicate name and asks for confirmation if one is found
- Creation requires only a name and a unit family (weight / volume / count) — density, and calorie data if added later, are optional and can be filled in at any time, not required to save the ingredient
- If density is missing for an ingredient, cross-family conversion is simply skipped for it: a recipe entry in a mismatched unit family appears as its own separate, un-merged line on the shopping list rather than blocking recipe creation
- A newly created ingredient is immediately searchable and selectable

### US-4 — Edit and delete recipes
*As a user, I want to edit or delete my recipes, so I can keep them accurate over time.*
- Editing a recipe's ingredients or quantities immediately affects any week's shopping list that references it (live reference, not a snapshot)
- Deleting a recipe that is assigned to one or more calendar days shows a warning with the number of affected days
- On confirmation: the recipe is deleted, its calendar assignments are removed, and affected shopping lists are updated
- Deleting a recipe with no calendar assignments requires no warning

### US-5 — Assign a recipe to a day and meal slot
*As a user, I want to assign a recipe to a specific day and slot, so I can build out my week.*
- User selects a day (within the visible week), a meal slot (breakfast/lunch/dinner), and one of their existing recipes
- Each slot holds exactly one recipe; assigning a new recipe to an occupied slot replaces the previous one

### US-6 — Repeat a meal across multiple days
*As a user, I want to assign the same recipe to several days at once, so I don't have to repeat the same manual step for meals I eat repeatedly.*
- When assigning a recipe, the user manually multi-selects which days to apply it to in one action (no "weekdays only" or "every day" shortcut in v1)
- Each repeated occurrence is stored as an independent calendar entry; removing one doesn't affect the others
- Each occurrence contributes its full ingredient quantities independently to the shopping list (cooked fresh each time — no batch-scaling logic in v1)

### US-7 — Generate a shopping list for a week
*As a user, I want to generate a shopping list for the selected week, so I know what to buy.*
- The list includes ingredients from every recipe assigned anywhere in the selected week
- Quantities are normalized before merging: same-family units convert via fixed ratios (tsp/tbsp/cup/fl oz → ml; oz/lb → g); if an ingredient's natural purchase unit is weight but a recipe entered it by volume, the app converts using that ingredient's density factor (e.g. tbsp of sugar → grams)
- Count-type ingredients (e.g. onion, egg) are not cross-converted — they stay as a count
- Normalized quantities for the same canonical ingredient are summed, then rounded up to a clean display value (nearest 5g / 5ml), switching to kg/L above 1000
- A week with zero assigned meals shows an empty-state message instead of a list
- A partially planned week (e.g. 3 of 21 slots filled) generates a list from just those meals — no minimum threshold required

### US-8 — Check off shopping list items
*As a user, I want to check off items as I shop, so I can track what I still need.*
- Each item has a checkbox
- Checked state persists across sessions (refresh, logout/login) for that specific week's list

### US-9 — Navigate between weeks
*As a user, I want to move between weeks on the calendar, so I can plan ahead or review past weeks.*
- User can navigate forward and backward by week
- Each week's assignments and shopping list are independent of every other week

## Out of Scope (v1)

- Nutrition/macro calculation and display — reconsidered and deferred again (see decision #11 below): produce and protein serving sizes vary too much for a single average weight to be trustworthy for a precision-sensitive feature
- Household or shared accounts / collaborative meal plans
- Batch-cook quantity scaling for repeated meals (each occurrence is counted independently)
- Recipe servings scaling
- Ingredient categorization by aisle
- Recipe import from URL
- Drag-and-drop calendar interactions
- Recipe snapshot/versioning — the calendar always reflects the live recipe, by design
- Any minimum-meals threshold before a shopping list can be generated
- Duplicating an existing recipe as a starting point for a new one
- "Repeat" shortcuts like "every day this week" or "weekdays only" — v1 uses manual multi-day selection only

## Ingredient Seed Data — Source & Methodology

The 148-item canonical ingredient list ships with a `densityGPerMl` value for
most weight- and volume-family ingredients, used to convert between recipe
units and a common base unit for merging. These values were checked against
real published references, not generated at random:

- **Baking and dry pantry items** (flour, sugar, rice, spices, chocolate
  chips, etc.) were cross-checked against
  [King Arthur Baking's Ingredient Weight Chart](https://www.kingarthurbaking.com/learn/ingredient-weight-chart) —
  a professionally published, industry-standard reference for volume-to-weight
  conversion used by both home and professional bakers. Spot checks matched
  exactly: all-purpose flour (120g/cup), granulated sugar (200g/cup),
  chocolate chips (170g/cup).
- **Oils, dairy, and other liquids** not covered by that chart use standard
  food-density figures consistent with published food-science sources — e.g.
  olive oil's density (0.91–0.92 g/mL) matched consistently across multiple
  independent references checked.

These remain cooking-grade approximations, not laboratory measurements — more
than accurate enough for shopping-list totals and recipe scaling, but worth a
direct spot-check against the King Arthur chart if a specific ingredient's
precision is ever in question. This is also why nutrition tracking (decision
#11) was held back: the same rigor doesn't carry over to *per-item* weight for
produce and proteins, where natural size variation is real, not just a gap in
the reference data.

## Resolved Decisions

All six open questions from the interview have been resolved to keep MVP scope tight:

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Multiple recipes per slot? | One recipe per slot; new assignment replaces the old one | Keeps the calendar schema simple — one entry per slot |
| 2 | Repeat via shortcut or manual selection? | Manual multi-day selection only | Covers every case a shortcut would, with less UI to build |
| 3 | Flag removed items after cascade-delete? | No — the pre-delete warning is the single confirmation point | A second after-the-fact notice would be redundant |
| 4 | Limits on recipes/ingredients? | No hard limit for v1 | Not a real constraint at personal-use scale |
| 5 | Recipe duplication feature? | Deferred, not in v1 | Convenience feature, not a pipeline gap — protects the 30-hour scope |
| 6 | Nutrition: raw totals or against a target? | Against a personal target (when nutrition ships, post-MVP) | The value proposition for macro-focused users is hitting a number, not just seeing one |
| 7 | How far should unit conversion go? | Full conversion: same-family (tsp/tbsp/cup → ml; oz/lb → g) plus density-based cross-family (tbsp of sugar → grams) | Makes shopping-list quantities meaningful for dry goods measured by volume, not just liquids; reuses the same per-ingredient data the nutrition feature will need |
| 8 | What's required to create a new ingredient? | Only name + unit family; density is optional, filled in later | Density research shouldn't block someone mid-recipe; missing density just degrades to an un-merged line, same as a genuine unit mismatch |
| 9 | How far should nutrition tracking go? | Full macros (calories, protein, carbs, fat) + personal daily targets compared weekly | Now cheap to add — reuses the gram-conversion pipeline already built for the shopping list; matches what macro-focused users actually need |
| 10 | Count-family ingredients have no weight — can they contribute to nutrition totals? | Added `gramsPerWhole` (nutrition-only; shopping list still shows raw counts) | Without it, protein sources like chicken and eggs — mostly count-family — couldn't contribute to macro totals at all, which would break the feature for most real recipes |
| 11 | Is an average `gramsPerWhole` accurate enough to trust for macros? | No — nutrition tracking and the weekly target reverted to deferred (out of scope for v1) | Unlike density (a physical constant), a single average weight per item hides real variation — a "medium onion" can reasonably range ±40% by size. A shopping list tolerates that; a precision-sensitive feature like macro tracking shouldn't be built on it |

No open questions remain blocking MVP implementation. Decision #7 supersedes the earlier "staple vs. produce" rendering idea discussed in conversation — gram-based totals are informative enough on their own, so that separate flag is no longer needed. Decisions #9–10 remain here as a record of what was explored; #11 is the final call for v1.
