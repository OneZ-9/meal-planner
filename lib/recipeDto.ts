import type { HydratedDocument } from "mongoose";

import type { UnitFamily } from "@/lib/models/ingredient";
import type { RecipeDocument, RecipeUnit } from "@/lib/models/recipe";

export type RecipeIngredientDTO = {
  ingredientId: string;
  name: string;
  unitFamily: UnitFamily;
  quantity: number;
  unit: RecipeUnit;
};

export type RecipeDTO = {
  id: string;
  name: string;
  servings: number;
  prepTimeMinutes: number | null;
  tags: string[];
  instructions: string;
  ingredients: RecipeIngredientDTO[];
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IngredientLookup = Map<
  string,
  { name: string; unitFamily: UnitFamily }
>;

// Ingredient rows only store an id/quantity/unit (see
// ARCHITECTURE.md "Recipe -> Ingredient Boundary") — the caller resolves
// names/unit families in one batched query and passes them in here, rather
// than each recipe re-fetching its own ingredients.
export const toRecipeDTO = (
  recipe: HydratedDocument<RecipeDocument>,
  ingredientLookup: IngredientLookup,
): RecipeDTO => ({
  id: recipe.id,
  name: recipe.name,
  servings: recipe.servings,
  prepTimeMinutes: recipe.prepTimeMinutes,
  tags: recipe.tags,
  instructions: recipe.instructions,
  ingredients: recipe.ingredients.map((entry) => {
    const info = ingredientLookup.get(entry.ingredientId.toString());
    return {
      ingredientId: entry.ingredientId.toString(),
      name: info?.name ?? "Unknown ingredient",
      unitFamily: info?.unitFamily ?? "count",
      quantity: entry.quantity,
      unit: entry.unit,
    };
  }),
  imageUrl: recipe.imageUrl,
  createdAt: recipe.createdAt.toISOString(),
  updatedAt: recipe.updatedAt.toISOString(),
});
