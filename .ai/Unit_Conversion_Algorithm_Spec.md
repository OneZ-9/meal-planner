# Unit Conversion Algorithm — Implementation Spec

Prepared for handoff to a coding agent (e.g. Claude Code) when building the
Meal Planner shopping-list generation feature. Pairs with
`MEAL_PLANNER_REQUIREMENTS.md` (see US-3 and US-7) and `ingredients-seed-data.js`.

## Purpose

Recipes record ingredient quantities in whatever unit cooking calls for
(tablespoons, cups, grams...). The shopping list needs to merge the same
ingredient across multiple recipes into one accurate total — which requires
converting every entry into a single common unit first. This document
specifies that conversion algorithm precisely enough to implement directly.

## Data model required

Each canonical ingredient document needs two fields beyond its name:

```ts
type Ingredient = {
  name: string;
  unitFamily: "weight" | "volume" | "count";  // the ingredient's natural purchase unit
  densityGPerMl: number | null;                // grams per millilitre; null if not needed
                                                 // (count items, and weight items always
                                                 // entered directly in grams)
};
```

`ingredients-seed-data.js` already ships in this shape for 148 ingredients,
sourced from King Arthur Baking's Ingredient Weight Chart and standard
food-density references (see that file's header comment for detail).

Each recipe ingredient line is:

```ts
type RecipeIngredientEntry = {
  ingredientId: string;   // references the canonical Ingredient
  quantity: number;
  unit: "tsp" | "tbsp" | "cup" | "fl_oz" | "ml" | "l"
      | "oz" | "lb" | "g" | "kg" | "whole";
};
```

## The algorithm — four steps

1. **Same-family normalization.** Convert the entered unit to a single base
   unit within its own family, using fixed physical ratios that are the same
   for every ingredient: volume units → millilitres, weight units → grams.
   Count units (`whole`) are left alone entirely.
2. **Family match check.** If the normalized unit's family already matches
   the ingredient's `unitFamily`, nothing more to do — return as-is.
3. **Cross-family conversion.** If it doesn't match, and the ingredient has a
   `densityGPerMl`, convert into the ingredient's home unit:
   - target is weight → `grams = ml * densityGPerMl`
   - target is volume → `ml = grams / densityGPerMl`
   If `densityGPerMl` is `null`, do **not** convert — mark this line as
   `unmerged` instead (see Edge Cases below).
4. **Group, sum, round.** Group all normalized entries for the week by
   `ingredientId + resultUnit` (plus original unit, for unmerged lines — see
   below), sum the quantities in each group, then round up to a clean
   display value (nearest 5g / 5ml), switching to kg/L above 1000.

Steps 1–2 never need per-ingredient data. Step 3 is the only step that reads
`densityGPerMl`, and only runs for the entries that don't already match the
ingredient's home family — typically the minority of entries for any given
ingredient.

## Reference implementation

```js
const VOLUME_TO_ML = { tsp: 4.92892, tbsp: 14.7868, cup: 236.588, fl_oz: 29.5735, ml: 1, l: 1000 };
const WEIGHT_TO_G  = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 };

function isVolumeUnit(u) { return u in VOLUME_TO_ML; }
function isWeightUnit(u) { return u in WEIGHT_TO_G; }

function normalizeQuantity(entry, ingredient) {
  // Step 1 — same-family normalization (fixed ratio, no ingredient data needed)
  let baseQty, baseFamily;
  if (isVolumeUnit(entry.unit)) {
    baseQty = entry.quantity * VOLUME_TO_ML[entry.unit];
    baseFamily = "volume";
  } else if (isWeightUnit(entry.unit)) {
    baseQty = entry.quantity * WEIGHT_TO_G[entry.unit];
    baseFamily = "weight";
  } else {
    return { qty: entry.quantity, unit: "count" }; // e.g. "3 onions"
  }

  // Step 2 — does it already match the ingredient's home family?
  if (baseFamily === ingredient.unitFamily) {
    return { qty: baseQty, unit: baseFamily === "weight" ? "g" : "ml" };
  }

  // Step 3 — cross-family conversion, using the ingredient's density
  if (ingredient.densityGPerMl == null) {
    return { qty: baseQty, unit: baseFamily === "weight" ? "g" : "ml", unmerged: true };
  }
  return ingredient.unitFamily === "weight"
    ? { qty: baseQty * ingredient.densityGPerMl, unit: "g" }   // ml -> g
    : { qty: baseQty / ingredient.densityGPerMl, unit: "ml" }; // g -> ml
}

function roundUp(value, nearest) {
  return Math.ceil(value / nearest) * nearest;
}

function generateShoppingList(weekEntries, lookupIngredient) {
  const groups = new Map();
  for (const entry of weekEntries) {
    const ingredient = lookupIngredient(entry.ingredientId);
    const n = normalizeQuantity(entry, ingredient);
    // unmerged lines get a unique key so they never combine with the rest
    const key = ingredient.name + ":" + n.unit + (n.unmerged ? ":" + entry.unit : "");
    groups.set(key, (groups.get(key) ?? 0) + n.qty);
  }

  return [...groups].map(([key, total]) => {
    const [name, unit] = key.split(":");
    const nearest = unit === "g" || unit === "ml" ? 5 : 1;
    return { name, quantity: roundUp(total, nearest), unit };
  });
}
```

**Note on `VOLUME_TO_ML` / `WEIGHT_TO_G`:** these fixed ratios are hand-rolled
here for clarity. In the actual app, use the `convert-units` npm package
instead of these two lookup objects — it already handles unit-name variants
(`"tbsp"` vs `"Tbsp"` vs `"tablespoon"`) and rounding precision that are easy
to get subtly wrong by hand over time. Steps 2–4 of the algorithm don't
change either way.

## Verified test cases

These were run and confirmed, not hand-calculated — use them to check any
reimplementation produces the same output.

**Sugar** (`unitFamily: "weight"`, `densityGPerMl: 0.845`):

| Input | Expected output |
|---|---|
| `{ quantity: 2, unit: "tbsp" }` | `{ qty: 24.99, unit: "g" }` |
| `{ quantity: 1, unit: "cup" }` | `{ qty: 199.92, unit: "g" }` |
| `{ quantity: 40, unit: "g" }` | `{ qty: 40, unit: "g" }` |

Summed and rounded up to nearest 5g: **265g sugar**.

**Olive oil** (`unitFamily: "volume"`, `densityGPerMl: 0.913`):

| Input | Expected output |
|---|---|
| `{ quantity: 3, unit: "tbsp" }` | `{ qty: 44.36, unit: "ml" }` |
| `{ quantity: 2, unit: "tbsp" }` | `{ qty: 29.57, unit: "ml" }` |
| `{ quantity: 50, unit: "g" }` | `{ qty: 54.76, unit: "ml" }` |

Summed and rounded up to nearest 5ml: **130ml olive oil**.

## Edge cases & fallback behavior

- **Missing density (`densityGPerMl: null`) on a cross-family entry.** Don't
  guess and don't block — mark the line `unmerged` and group it separately
  (grouping key includes the original unit), so it appears as its own line
  on the shopping list instead of merging incorrectly or failing outright.
  This is the same fallback specified in requirements doc decision #8.
- **Count-family ingredients** (`unitFamily: "count"`) never go through
  Steps 2–3. Quantities in `"whole"` units are summed directly; a recipe
  entering a count ingredient in a weight/volume unit is out of scope for
  v1 (see requirements doc decision #11 — no reliable per-item weight for
  produce/proteins).
- **Rounding granularity** is nearest 5 for grams and millilitres; count
  items round to the nearest whole number (no partial units to round).
- **Display unit switch:** once a rounded total crosses 1000 (g or ml),
  display as kg or L instead — this is a formatting step only, doesn't
  change the underlying stored value or the merge logic.

## Related requirements

- **US-3** (create canonical ingredient): `unitFamily` is required at
  creation; `densityGPerMl` is optional and can be added later — see the
  missing-density fallback above for why that's safe to allow.
- **US-7** (generate shopping list): this document is the full expansion of
  that user story's acceptance criteria around quantity normalization.
