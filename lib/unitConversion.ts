import type { UnitFamily } from "@/lib/models/ingredient";
import type { RecipeUnit } from "@/lib/models/recipe";

// Fixed physical ratios, matching .ai/Unit_Conversion_Algorithm_Spec.md's
// reference implementation exactly (not the `convert-units` npm package —
// that package's own constants aren't guaranteed to match the spec's
// "Verified test cases" section to the last decimal, and this app's unit
// vocabulary is a small fixed enum, not free-text, so the variant-name
// handling `convert-units` exists for buys nothing here). See DECISIONS.md
// "Shopping List generation (US-7/US-8)".
const VOLUME_TO_ML: Partial<Record<RecipeUnit, number>> = {
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  fl_oz: 29.5735,
  ml: 1,
  l: 1000,
};

const WEIGHT_TO_G: Partial<Record<RecipeUnit, number>> = {
  oz: 28.3495,
  lb: 453.592,
  g: 1,
  kg: 1000,
};

export type NormalizedUnit = "g" | "ml" | "whole";

export type NormalizedQuantity = {
  quantity: number;
  unit: NormalizedUnit;
  // True when this entry's unit family doesn't match the ingredient's own
  // unitFamily and no densityGPerMl was available to convert it — the
  // caller must not merge this into the ingredient's regular total (see
  // Unit_Conversion_Algorithm_Spec.md "Edge cases").
  unmerged: boolean;
};

type IngredientConversionInfo = {
  unitFamily: UnitFamily;
  densityGPerMl: number | null;
};

// The four-step algorithm from .ai/Unit_Conversion_Algorithm_Spec.md:
// 1. same-family normalization (fixed ratio, no ingredient data needed)
// 2. family-match check against the ingredient's own unitFamily
// 3. cross-family conversion via densityGPerMl, if available
// 4. (caller's job) group + sum + round
export const normalizeRecipeQuantity = (
  entry: { quantity: number; unit: RecipeUnit },
  ingredient: IngredientConversionInfo,
): NormalizedQuantity => {
  if (entry.unit === "whole") {
    return { quantity: entry.quantity, unit: "whole", unmerged: false };
  }

  const volumeRatio = VOLUME_TO_ML[entry.unit];
  const baseFamily: "volume" | "weight" = volumeRatio !== undefined ? "volume" : "weight";
  const baseRatio = volumeRatio ?? WEIGHT_TO_G[entry.unit];
  // Every non-"whole" RecipeUnit is in exactly one of the two tables above,
  // so baseRatio is always defined here.
  const baseQuantity = entry.quantity * (baseRatio as number);

  if (baseFamily === ingredient.unitFamily) {
    return {
      quantity: baseQuantity,
      unit: baseFamily === "weight" ? "g" : "ml",
      unmerged: false,
    };
  }

  if (ingredient.densityGPerMl == null) {
    return {
      quantity: baseQuantity,
      unit: baseFamily === "weight" ? "g" : "ml",
      unmerged: true,
    };
  }

  return ingredient.unitFamily === "weight"
    ? { quantity: baseQuantity * ingredient.densityGPerMl, unit: "g", unmerged: false }
    : { quantity: baseQuantity / ingredient.densityGPerMl, unit: "ml", unmerged: false };
};

export const roundUpToNearest = (value: number, nearest: number): number =>
  Math.ceil(value / nearest) * nearest;

export type DisplayQuantity = { quantity: number; unit: string };

// Display-only step, applied after grouping/summing (never before — rounding
// each line separately before merging produces incorrect totals, see
// ARCHITECTURE.md "Shopping List Rounding"). Nearest-5 for g/ml, nearest-1
// for count; switches to kg/L once the rounded total crosses 1000.
export const formatDisplayQuantity = (
  totalQuantity: number,
  unit: NormalizedUnit,
): DisplayQuantity => {
  if (unit === "whole") {
    return { quantity: roundUpToNearest(totalQuantity, 1), unit: "whole" };
  }

  const rounded = roundUpToNearest(totalQuantity, 5);
  if (rounded >= 1000) {
    return { quantity: rounded / 1000, unit: unit === "g" ? "kg" : "l" };
  }
  return { quantity: rounded, unit };
};
