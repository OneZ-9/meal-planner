import { IngredientModel } from "@/lib/models/ingredient";
import type { IngredientLookup } from "@/lib/recipeDto";
import type { RecipeIngredientEntry } from "@/lib/models/recipe";

export const uniqueIngredientIds = (entries: RecipeIngredientEntry[]): string[] => [
  ...new Set(entries.map((entry) => entry.ingredientId.toString())),
];

// Resolves ingredient name/unitFamily for display (GET routes) — no
// visibility restriction, since a recipe's stored references were already
// valid at write time.
export const buildIngredientLookup = async (
  ingredientIds: string[],
): Promise<IngredientLookup> => {
  if (ingredientIds.length === 0) {
    return new Map();
  }
  const ingredients = await IngredientModel.find({
    _id: { $in: ingredientIds },
  }).select("name unitFamily");
  return new Map(
    ingredients.map((ingredient) => [
      ingredient.id,
      { name: ingredient.name, unitFamily: ingredient.unitFamily },
    ]),
  );
};

// Resolves ingredient name/unitFamily for a recipe being created/updated,
// restricted to ingredients this user can actually see (the global set or
// their own custom ingredients — same rule as ingredient search, see
// ARCHITECTURE.md "Search boundary"). Returns null if any referenced
// ingredient doesn't exist or isn't visible to this user, so the caller can
// reject the write (ARCHITECTURE.md "Recipe -> Ingredient Boundary").
export const resolveVisibleIngredientLookup = async (
  ingredientIds: string[],
  userId: string,
): Promise<IngredientLookup | null> => {
  const visibleIngredients = await IngredientModel.find({
    _id: { $in: ingredientIds },
    $or: [{ userId: null }, { userId }],
  }).select("name unitFamily");

  if (visibleIngredients.length !== ingredientIds.length) {
    return null;
  }

  return new Map(
    visibleIngredients.map((ingredient) => [
      ingredient.id,
      { name: ingredient.name, unitFamily: ingredient.unitFamily },
    ]),
  );
};
