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
  ARCHITECTURE.md §22) — not buildable until the Recipe module exists.
  Add it then; see DECISIONS.md "Custom ingredients feature (US-3)".
- **Ingredient edit warning has no real affected-recipe count.** The
  "updating this ingredient will affect recipes that use it" confirmation
  shown before saving an edit is generic text, not a live count, because
  the Recipe model doesn't exist yet. Upgrade to a real count once Recipes
  is built — see DECISIONS.md.

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
