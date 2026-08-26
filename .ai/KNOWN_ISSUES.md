# KNOWN_ISSUES.md

## MVP limitations (by design — don't "fix" without a spec change)

- **Cross-family unit conversion not supported.** Tablespoons of a dry
  ingredient stay in tablespoons rather than converting to grams. See
  DECISIONS.md for why.
- **Only exact-match ingredient duplicates are blocked.** No fuzzy
  matching — "Tomatoe" and "Tomato" will exist as two separate ingredients.
- **No self-service password recovery.** A locked-out user has no
  recovery path this delivery; manual DB fix is the accepted stopgap.
- **One recipe per calendar slot.** No multi-recipe slots, no offline mode.
- **Custom ingredient delete is not implemented.** Only create + update
  exist. Deleting an ingredient needs a reference check against recipes
  (same pattern as recipe-delete warning on assigned calendar days,
  ARCHITECTURE.md §22) — the Recipe module now exists (`RecipeModel`,
  `app/api/recipes/`), so this is now buildable: query
  `RecipeModel.find({ "ingredients.ingredientId": id })` before allowing
  delete. Still not implemented this session — out of scope for the
  Recipe module itself. See DECISIONS.md "Custom ingredients feature
  (US-3)".
- **Ingredient edit warning has no real affected-recipe count.** The
  "updating this ingredient will affect recipes that use it" confirmation
  shown before saving an edit is generic text, not a live count. The
  Recipe model now exists, but computing this count wasn't part of the
  Recipe module's own scope — upgrade to a real count as a small
  follow-up (query recipes referencing the ingredient's `_id`).
- **Recipe delete has no affected-calendar-day warning or cascade.**
  ARCHITECTURE.md §22 calls for warning the user with an affected-day
  count and removing calendar assignments when a recipe assigned to the
  calendar is deleted — not implemented, because the Calendar module
  doesn't exist yet (no `calendar-entry` model or API). The client shows
  a generic "this cannot be undone" confirmation instead. Upgrade once
  Calendar is built — see DECISIONS.md "Recipe module (US-2/US-4)".

## Accepted risks (per spec)

- Seeded ingredient data may contain errors with no in-app correction
  path — manual database edit is the stopgap.
- Locked-out users have no self-service recovery — same stopgap as above.
- The 2-week timeline is tight once code review/integration overhead is
  subtracted — explicitly flagged as a risk, not a guarantee.

## Explicitly out of scope (Future Features — do not build without a spec update)

- Density-based cross-family conversion
- Fuzzy near-duplicate ingredient matching
- Quantity rounding/display formatting
- Repeat-recipe-across-days
- Recipe duplication
- Drag-and-drop calendar
- Password reset
- Household/shared accounts
- Nutrition tracking with personal targets (explicitly "explored and reverted" per spec)
- Servings scaling
- Aisle categorization
- Recipe import-from-URL
- Recipe snapshot/versioning
- Batch-cook scaling
