import { describe, expect, it } from "vitest";

import {
  normalizeIngredientName,
  validateIngredientInput,
} from "./ingredientValidation";

describe("ingredient validation", () => {
  it("normalizes a valid weight ingredient with density", () => {
    expect(
      validateIngredientInput({
        name: "  Smoked   Paprika  ",
        unitFamily: "weight",
        densityGPerMl: 1.2,
      }),
    ).toEqual({
      success: true,
      values: {
        name: "Smoked Paprika",
        unitFamily: "weight",
        densityGPerMl: 1.2,
      },
    });
  });

  it("accepts an ingredient with no density", () => {
    expect(
      validateIngredientInput({ name: "Chicken Breast", unitFamily: "weight" }),
    ).toEqual({
      success: true,
      values: {
        name: "Chicken Breast",
        unitFamily: "weight",
        densityGPerMl: null,
      },
    });
  });

  it("rejects an empty name", () => {
    expect(
      validateIngredientInput({ name: "   ", unitFamily: "weight" }),
    ).toEqual({
      success: false,
      message: "Ingredient name must be 1 to 80 characters.",
    });
  });

  it("rejects an invalid unit family", () => {
    expect(
      validateIngredientInput({ name: "Sugar", unitFamily: "grams" }),
    ).toEqual({
      success: false,
      message: "Unit family must be weight, volume, or count.",
    });
  });

  it("rejects a non-positive density", () => {
    expect(
      validateIngredientInput({
        name: "Sugar",
        unitFamily: "weight",
        densityGPerMl: 0,
      }),
    ).toEqual({
      success: false,
      message: "Density must be a positive number when provided.",
    });
  });

  it("rejects density on a count ingredient", () => {
    expect(
      validateIngredientInput({
        name: "Egg",
        unitFamily: "count",
        densityGPerMl: 1,
      }),
    ).toEqual({
      success: false,
      message: "Count ingredients cannot have a density.",
    });
  });

  it("normalizeIngredientName collapses whitespace", () => {
    expect(normalizeIngredientName("  Extra   Virgin  Olive  Oil ")).toBe(
      "Extra Virgin Olive Oil",
    );
  });
});
