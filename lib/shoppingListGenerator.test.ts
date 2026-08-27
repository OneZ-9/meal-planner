import { describe, expect, it } from "vitest";

import { generateShoppingList, type ShoppingListIngredientLookup } from "./shoppingListGenerator";

const sugarId = "sugar-id";
const oliveOilId = "olive-oil-id";
const eggId = "egg-id";

const lookup: ShoppingListIngredientLookup = new Map([
  [sugarId, { name: "Sugar", unitFamily: "weight", densityGPerMl: 0.845 }],
  [oliveOilId, { name: "Olive Oil", unitFamily: "volume", densityGPerMl: 0.913 }],
  [eggId, { name: "Egg", unitFamily: "count", densityGPerMl: null }],
]);

describe("generateShoppingList", () => {
  it("merges the same ingredient across recipes/occurrences, matching the spec's verified sugar total", () => {
    const lines = generateShoppingList(
      [
        { ingredientId: sugarId, quantity: 2, unit: "tbsp" },
        { ingredientId: sugarId, quantity: 1, unit: "cup" },
        { ingredientId: sugarId, quantity: 40, unit: "g" },
      ],
      lookup,
    );

    expect(lines).toEqual([
      {
        itemKey: `${sugarId}:g`,
        ingredientId: sugarId,
        ingredientName: "Sugar",
        quantity: 265,
        unit: "g",
        unmerged: false,
      },
    ]);
  });

  it("matches the spec's verified olive oil total", () => {
    const lines = generateShoppingList(
      [
        { ingredientId: oliveOilId, quantity: 3, unit: "tbsp" },
        { ingredientId: oliveOilId, quantity: 2, unit: "tbsp" },
        { ingredientId: oliveOilId, quantity: 50, unit: "g" },
      ],
      lookup,
    );

    expect(lines).toEqual([
      {
        itemKey: `${oliveOilId}:ml`,
        ingredientId: oliveOilId,
        ingredientName: "Olive Oil",
        quantity: 130,
        unit: "ml",
        unmerged: false,
      },
    ]);
  });

  it("sums count ingredients directly, never converting them", () => {
    const lines = generateShoppingList(
      [
        { ingredientId: eggId, quantity: 2, unit: "whole" },
        { ingredientId: eggId, quantity: 3, unit: "whole" },
      ],
      lookup,
    );

    expect(lines).toEqual([
      {
        itemKey: `${eggId}:whole`,
        ingredientId: eggId,
        ingredientName: "Egg",
        quantity: 5,
        unit: "whole",
        unmerged: false,
      },
    ]);
  });

  it("keeps a cross-family entry with no density as its own unmerged line", () => {
    const flourId = "flour-id";
    const noDensityLookup: ShoppingListIngredientLookup = new Map([
      [flourId, { name: "Flour", unitFamily: "weight", densityGPerMl: null }],
    ]);

    const lines = generateShoppingList(
      [
        { ingredientId: flourId, quantity: 200, unit: "g" },
        { ingredientId: flourId, quantity: 2, unit: "tbsp" },
      ],
      noDensityLookup,
    );

    expect(lines).toHaveLength(2);
    const gramLine = lines.find((line) => line.unit === "g");
    const mlLine = lines.find((line) => line.unit === "ml");
    expect(gramLine).toMatchObject({ quantity: 200, unmerged: false });
    expect(mlLine).toMatchObject({ unmerged: true });
  });

  it("drops entries whose ingredient can't be resolved (deleted since the recipe was saved)", () => {
    const lines = generateShoppingList(
      [{ ingredientId: "missing-id", quantity: 1, unit: "whole" }],
      lookup,
    );

    expect(lines).toEqual([]);
  });

  it("returns lines sorted by ingredient name", () => {
    const lines = generateShoppingList(
      [
        { ingredientId: sugarId, quantity: 1, unit: "g" },
        { ingredientId: eggId, quantity: 1, unit: "whole" },
      ],
      lookup,
    );

    expect(lines.map((line) => line.ingredientName)).toEqual(["Egg", "Sugar"]);
  });
});
