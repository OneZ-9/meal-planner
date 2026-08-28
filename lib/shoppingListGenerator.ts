import type { RecipeUnit } from "@/lib/models/recipe";
import type { UnitFamily } from "@/lib/models/ingredient";
import {
  formatDisplayQuantity,
  normalizeRecipeQuantity,
  type NormalizedUnit,
} from "@/lib/unitConversion";

export type ShoppingListSourceEntry = {
  ingredientId: string;
  quantity: number;
  unit: RecipeUnit;
};

export type ShoppingListIngredientLookup = Map<
  string,
  { name: string; unitFamily: UnitFamily; densityGPerMl: number | null }
>;

export type ShoppingListLine = {
  // Stable key for this merged line — `${ingredientId}:${resultUnit}` — used
  // to persist/read checked state (US-8) independently of how the totals
  // round or display. Never shown to the user.
  itemKey: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  // True if this line's unit family doesn't match the ingredient's canonical
  // unitFamily and no density was available to convert it (see
  // Unit_Conversion_Algorithm_Spec.md "Edge cases") — the UI can flag this
  // so the user knows it wasn't merged with the ingredient's other entries.
  unmerged: boolean;
};

type Group = {
  ingredientId: string;
  ingredientName: string;
  unit: NormalizedUnit;
  total: number;
  unmerged: boolean;
};

// ARCHITECTURE.md "Core Shopping List Data Flow": normalize -> group by
// canonical ingredient identity -> sum -> round. Ingredients missing from
// `ingredientLookup` (deleted since the recipe was saved) are silently
// dropped, same fail-safe pattern as toCalendarEntryDTO.
export const generateShoppingList = (
  entries: ShoppingListSourceEntry[],
  ingredientLookup: ShoppingListIngredientLookup,
): ShoppingListLine[] => {
  const groups = new Map<string, Group>();

  for (const entry of entries) {
    const ingredient = ingredientLookup.get(entry.ingredientId);
    if (!ingredient) continue;

    const normalized = normalizeRecipeQuantity(entry, ingredient);
    const key = `${entry.ingredientId}:${normalized.unit}`;
    const existing = groups.get(key);
    if (existing) {
      existing.total += normalized.quantity;
      existing.unmerged = existing.unmerged || normalized.unmerged;
    } else {
      groups.set(key, {
        ingredientId: entry.ingredientId,
        ingredientName: ingredient.name,
        unit: normalized.unit,
        total: normalized.quantity,
        unmerged: normalized.unmerged,
      });
    }
  }

  return [...groups.entries()]
    .map(([itemKey, group]) => {
      const display = formatDisplayQuantity(group.total, group.unit);
      return {
        itemKey,
        ingredientId: group.ingredientId,
        ingredientName: group.ingredientName,
        quantity: display.quantity,
        unit: display.unit,
        unmerged: group.unmerged,
      };
    })
    .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
};
