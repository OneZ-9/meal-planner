# KNOWN_ISSUES.md

## MVP limitations (by design — don't "fix" without a spec change)

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
- **Recipe delete cascade has no transactional guarantee.** Deleting a
  recipe (`DELETE /api/recipes/[id]`) now cascades to remove its calendar
  assignments (`ARCHITECTURE.md` §22, implemented — see DECISIONS.md
  "Recipe delete cascade (ARCHITECTURE.md §22)"), but the two writes
  aren't wrapped in a Mongo transaction. If the process dies between the
  recipe delete and the `CalendarEntryModel.deleteMany` call, a calendar
  entry can be left pointing at a deleted recipe. This fails safe:
  `toCalendarEntryDTO` already drops any entry whose recipe lookup misses,
  so a dangling entry is silently invisible rather than erroring — same
  accepted-risk shape as DECISIONS.md's "blunt cascade" call.
- **Shopping List has no aisle/category grouping.** DESIGN.md's mockup
  groups items under headings like "Produce"/"Dairy & Refrigerated", but
  `Ingredient` has no category field and aisle categorization is an
  explicit MoSCoW "Won't" — the list renders flat instead. See
  DECISIONS.md "Shopping List generation (US-7/US-8)".
- **A replaced/removed recipe image can leave an orphaned Vercel Blob
  object.** Cleanup (`lib/recipeImageStorage.ts`'s
  `deleteRecipeImageBestEffort`) is best-effort, not transactional — if
  the delete call to Blob storage fails after the Mongo write already
  succeeded, the old image file is simply never removed. No user-visible
  effect (the recipe's `imageUrl` field is correct either way), just
  accumulating unused storage. Same accepted-risk shape as the calendar
  cascade below. See DECISIONS.md "Recipe image upload (Vercel Blob)".
- **Recipe image upload can't be exercised locally without a real Vercel
  Blob store.** `BLOB_READ_WRITE_TOKEN` must point at an actual store
  (Vercel dashboard → Storage, or `vercel env pull`) — there's no local
  mock/stub. Without it, everything else in Create/Edit Recipe still
  works; only the image upload button fails.
- **A shopping-list checked-state row can go unreferenced.** If a recipe
  is edited/deleted or a calendar assignment is removed such that an
  ingredient no longer appears in a week's generated list, any
  `ShoppingListItemState` document for that line simply stops being read —
  it isn't cleaned up, same dangling-reference tolerance already accepted
  for calendar entries above and for ingredient/recipe references
  elsewhere in this app.

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
