# Meal Planner + Auto Shopping List — Feature List (MoSCoW)

Derived from `MEAL_PLANNER_REQUIREMENTS.md` (user stories US-1–US-9,
decisions #1–#11, and the Out of Scope list). Each deferred item is placed
under the module it would eventually belong to, rather than a separate
catch-all bucket, so each module shows its full surface — built and
not-yet-built together.

**M**ust have · **S**hould have · **C**ould have · **W**on't have (this iteration)

| Module | Feature | Priority | Description |
|---|---|---|---|
| Authentication | Sign up / log in | Must | Email + password account creation and login |
| Authentication | Persisted session | Must | User stays logged in across visits without re-authenticating constantly |
| Authentication | Per-user data isolation | Must | Recipes, calendar, and shopping lists are scoped to the logged-in user only |
| Authentication | Household / shared accounts | Won't | Deferred — v1 is single-user only (decision: own account, independently) |
| Canonical Ingredient List | Seeded ingredient list (148 items) | Must | Baseline data — `unitFamily` + `densityGPerMl` — the merge algorithm depends on |
| Canonical Ingredient List | Typeahead search in recipe builder | Must | The mechanism that prevents free-text duplicates when building a recipe |
| Canonical Ingredient List | Create new ingredient (name + unit family) | Must | Escape hatch when an ingredient isn't in the seed list; not creation-blocking |
| Canonical Ingredient List | Near-duplicate check before creating | Should | Prevents accidental duplicate canonical entries; valuable but not launch-blocking |
| Canonical Ingredient List | Optional density, fillable later | Should | Improves conversion accuracy over time without blocking ingredient creation |
| Canonical Ingredient List | Ingredient categorization by aisle | Won't | Deferred stretch feature |
| Recipe Management | Create / edit / delete recipe | Must | Core data entry — nothing downstream works without recipes existing |
| Recipe Management | Recipe requires ≥1 ingredient with qty + unit | Must | Prevents broken, unusable recipes from entering the system |
| Recipe Management | Edits propagate live to calendar & shopping list | Must | The "live reference, not a snapshot" decision — central to correctness |
| Recipe Management | Delete warning + cascade update | Should | Important safety net; a simpler unconditional delete could ship first under time pressure |
| Recipe Management | Recipe duplication | Won't | Deferred — convenience feature, not a pipeline gap |
| Recipe Management | Servings scaling | Won't | Deferred stretch feature |
| Recipe Management | Recipe import from URL | Won't | Deferred stretch feature |
| Recipe Management | Recipe snapshot / versioning | Won't | Deliberately rejected — calendar always reflects the live recipe, by design |
| Weekly Calendar & Meal Assignment | Assign recipe to day + meal slot | Must | Core scheduling mechanism the rest of the app is built around |
| Weekly Calendar & Meal Assignment | One recipe per slot (replace on reassignment) | Must | Defines unambiguous slot behavior |
| Weekly Calendar & Meal Assignment | Navigate between weeks | Must | Without this the calendar only ever shows a single, fixed week |
| Weekly Calendar & Meal Assignment | Repeat a recipe across multiple selected days | Should | High value for meal-preppers, but the app still works without it — just more repetitive manual entry |
| Weekly Calendar & Meal Assignment | Repeat shortcuts ("every day" / "weekdays") | Won't | Deferred — manual multi-select already covers the same cases |
| Weekly Calendar & Meal Assignment | Drag-and-drop calendar | Won't | Deferred UI polish |
| Weekly Calendar & Meal Assignment | Batch-cook quantity scaling | Won't | Deferred — v1 assumes each repeated occurrence is cooked fresh |
| Shopping List Generation | Merge ingredients across the week's recipes | Must | The core value proposition of the entire app |
| Shopping List Generation | Same-family unit normalization (tsp/tbsp/cup→ml; oz/lb→g) | Must | Without this, two entries of the same ingredient in different units can't even merge |
| Shopping List Generation | Cross-family conversion via density (e.g. tbsp sugar → g) | Should | Meaningfully improves usefulness for dry goods measured by volume; same-family-only would still produce a working, if less polished, list |
| Shopping List Generation | Graceful degradation on missing density | Should | Keeps the app from blocking or breaking when ingredient data is incomplete |
| Shopping List Generation | Round to clean display value / switch to kg-L | Could | Formatting polish — a raw decimal is still usable, just less tidy |
| Shopping List Generation | Empty-state for a zero-meal week | Should | Better UX than a blank or broken screen; not core to the generation logic itself |
| Shopping List Generation | Partial-week generation (no minimum threshold) | Must | Defines correct default behavior — blocking on a minimum would actively hurt usability |
| Shopping List Checklist | Checkbox per item | Must | The list needs to be usable while physically shopping |
| Shopping List Checklist | Persist checked state across sessions | Must | Without persistence, checking items off is pointless if the app refreshes mid-shop |
| Nutrition Tracking (deferred) | Per-recipe / weekly macro display | Won't | Explored and reverted (decision #11) — average per-item weight isn't reliable enough to trust |
| Nutrition Tracking (deferred) | Personal daily/weekly nutrition targets | Won't | Depends on the macro feature above; deferred alongside it |

## Quick counts

- **Must have:** 16 — the minimum for a working, correct end-to-end pipeline (auth → recipes → calendar → shopping list → checklist)
- **Should have:** 8 — meaningfully improve accuracy or safety, worth building if the Musts are done with time to spare
- **Could have:** 1 — pure polish, first thing to cut under time pressure
- **Won't have:** 11 — explicitly out of scope for this iteration, already decided in the requirements doc

If the 30-hour budget gets tight, the Should-haves are the first place to look for cuts — none of them break the core loop, they just make it less accurate or less forgiving. The single Could-have (rounding/display formatting) costs almost nothing to defer.
