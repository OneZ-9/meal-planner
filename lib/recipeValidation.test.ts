import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { normalizeRecipeName, validateRecipeInput } from "./recipeValidation";

const validIngredientId = new Types.ObjectId().toString();

const validPayload = {
  name: "  Lemon Herb   Chicken  ",
  servings: 4,
  prepTimeMinutes: 25,
  tags: ["Dinner", "Quick", "dinner"],
  instructions: "Step 1: ...\nStep 2: ...",
  ingredients: [{ ingredientId: validIngredientId, quantity: 2, unit: "tbsp" }],
};

describe("recipe validation", () => {
  it("normalizes and accepts a valid recipe", () => {
    const result = validateRecipeInput(validPayload);

    expect(result).toEqual({
      success: true,
      values: {
        name: "Lemon Herb Chicken",
        servings: 4,
        prepTimeMinutes: 25,
        tags: ["Dinner", "Quick"],
        instructions: "Step 1: ...\nStep 2: ...",
        ingredients: [{ ingredientId: validIngredientId, quantity: 2, unit: "tbsp" }],
      },
    });
  });

  it("accepts a recipe with no prep time, tags, or instructions", () => {
    const result = validateRecipeInput({
      name: "Simple Salad",
      servings: 2,
      ingredients: [{ ingredientId: validIngredientId, quantity: 1, unit: "whole" }],
    });

    expect(result).toEqual({
      success: true,
      values: {
        name: "Simple Salad",
        servings: 2,
        prepTimeMinutes: null,
        tags: [],
        instructions: "",
        ingredients: [{ ingredientId: validIngredientId, quantity: 1, unit: "whole" }],
      },
    });
  });

  it("rejects an empty name", () => {
    expect(validateRecipeInput({ ...validPayload, name: "   " })).toEqual({
      success: false,
      message: "Recipe name must be 1 to 120 characters.",
    });
  });

  it("rejects zero ingredients", () => {
    expect(validateRecipeInput({ ...validPayload, ingredients: [] })).toEqual({
      success: false,
      message: "A recipe must have at least one ingredient.",
    });
  });

  it("rejects a non-integer servings count", () => {
    expect(validateRecipeInput({ ...validPayload, servings: 2.5 })).toEqual({
      success: false,
      message: "Servings must be a whole number of at least 1.",
    });
  });

  it("rejects servings below 1", () => {
    expect(validateRecipeInput({ ...validPayload, servings: 0 })).toEqual({
      success: false,
      message: "Servings must be a whole number of at least 1.",
    });
  });

  it("rejects a negative prep time", () => {
    expect(validateRecipeInput({ ...validPayload, prepTimeMinutes: -5 })).toEqual({
      success: false,
      message: "Prep time must be a non-negative whole number of minutes.",
    });
  });

  it("rejects a missing ingredient quantity", () => {
    expect(
      validateRecipeInput({
        ...validPayload,
        ingredients: [{ ingredientId: validIngredientId, unit: "tbsp" }],
      }),
    ).toEqual({
      success: false,
      message: "Each ingredient needs a quantity greater than 0.",
    });
  });

  it("rejects a non-positive ingredient quantity", () => {
    expect(
      validateRecipeInput({
        ...validPayload,
        ingredients: [{ ingredientId: validIngredientId, quantity: 0, unit: "tbsp" }],
      }),
    ).toEqual({
      success: false,
      message: "Each ingredient needs a quantity greater than 0.",
    });
  });

  it("rejects a missing ingredient unit", () => {
    expect(
      validateRecipeInput({
        ...validPayload,
        ingredients: [{ ingredientId: validIngredientId, quantity: 1, unit: "bunch" }],
      }),
    ).toEqual({
      success: false,
      message: "Each ingredient needs a valid unit.",
    });
  });

  it("rejects an ingredient row with an invalid ingredientId", () => {
    expect(
      validateRecipeInput({
        ...validPayload,
        ingredients: [{ ingredientId: "not-an-id", quantity: 1, unit: "tbsp" }],
      }),
    ).toEqual({
      success: false,
      message: "Each ingredient row must reference a valid ingredient.",
    });
  });

  it("rejects the same ingredient added twice", () => {
    expect(
      validateRecipeInput({
        ...validPayload,
        ingredients: [
          { ingredientId: validIngredientId, quantity: 1, unit: "tbsp" },
          { ingredientId: validIngredientId, quantity: 2, unit: "cup" },
        ],
      }),
    ).toEqual({
      success: false,
      message: "The same ingredient cannot be added to a recipe twice.",
    });
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, index) => `tag-${index}`);
    expect(validateRecipeInput({ ...validPayload, tags })).toEqual({
      success: false,
      message: "A recipe can have at most 10 tags.",
    });
  });

  it("normalizeRecipeName collapses whitespace", () => {
    expect(normalizeRecipeName("  Lemon   Herb  Chicken ")).toBe("Lemon Herb Chicken");
  });
});
