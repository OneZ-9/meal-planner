import { Types } from "mongoose";

import { RECIPE_UNITS, type RecipeUnit } from "@/lib/models/recipe";

export type RecipeIngredientInputValues = {
  ingredientId: string;
  quantity: number;
  unit: RecipeUnit;
};

export type RecipeInputValues = {
  name: string;
  servings: number;
  prepTimeMinutes: number | null;
  tags: string[];
  instructions: string;
  ingredients: RecipeIngredientInputValues[];
};

export type RecipeInputValidation =
  | { success: true; values: RecipeInputValues }
  | { success: false; message: string };

export const normalizeRecipeName = (name: string): string =>
  name.trim().replace(/\s+/g, " ");

const maxTags = 10;
const maxTagLength = 40;
const maxInstructionsLength = 5000;

// Structural validation only — shared by create (POST) and update (PATCH).
// Whether each ingredientId actually resolves to an ingredient the user can
// see is a database concern, checked separately in the API route (see
// ARCHITECTURE.md "Recipe -> Ingredient Boundary" and "Search boundary").
export const validateRecipeInput = (input: unknown): RecipeInputValidation => {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Enter the recipe's details." };
  }

  const candidate = input as Record<string, unknown>;

  const name =
    typeof candidate.name === "string" ? normalizeRecipeName(candidate.name) : "";
  if (name.length < 1 || name.length > 120) {
    return { success: false, message: "Recipe name must be 1 to 120 characters." };
  }

  const servings = candidate.servings;
  if (
    typeof servings !== "number" ||
    !Number.isInteger(servings) ||
    servings < 1
  ) {
    return {
      success: false,
      message: "Servings must be a whole number of at least 1.",
    };
  }

  let prepTimeMinutes: number | null = null;
  if (candidate.prepTimeMinutes !== undefined && candidate.prepTimeMinutes !== null) {
    const prepTime = candidate.prepTimeMinutes;
    if (typeof prepTime !== "number" || !Number.isInteger(prepTime) || prepTime < 0) {
      return {
        success: false,
        message: "Prep time must be a non-negative whole number of minutes.",
      };
    }
    prepTimeMinutes = prepTime;
  }

  let tags: string[] = [];
  if (candidate.tags !== undefined) {
    if (
      !Array.isArray(candidate.tags) ||
      !candidate.tags.every((tag) => typeof tag === "string")
    ) {
      return { success: false, message: "Tags must be a list of text values." };
    }
    const seenTags = new Map<string, string>();
    candidate.tags
      .map((tag) => tag.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .forEach((tag) => {
        const key = tag.toLowerCase();
        if (!seenTags.has(key)) seenTags.set(key, tag);
      });
    tags = [...seenTags.values()];
    if (tags.some((tag) => tag.length > maxTagLength)) {
      return {
        success: false,
        message: `Each tag must be ${maxTagLength} characters or fewer.`,
      };
    }
    if (tags.length > maxTags) {
      return { success: false, message: `A recipe can have at most ${maxTags} tags.` };
    }
  }

  const instructions =
    typeof candidate.instructions === "string" ? candidate.instructions.trim() : "";
  if (instructions.length > maxInstructionsLength) {
    return {
      success: false,
      message: `Instructions must be ${maxInstructionsLength} characters or fewer.`,
    };
  }

  if (!Array.isArray(candidate.ingredients) || candidate.ingredients.length === 0) {
    return { success: false, message: "A recipe must have at least one ingredient." };
  }

  const ingredients: RecipeIngredientInputValues[] = [];
  const seenIngredientIds = new Set<string>();
  for (const rawEntry of candidate.ingredients) {
    if (!rawEntry || typeof rawEntry !== "object") {
      return {
        success: false,
        message: "Each ingredient row must have an ingredient, quantity, and unit.",
      };
    }
    const entry = rawEntry as Record<string, unknown>;

    const ingredientId =
      typeof entry.ingredientId === "string" ? entry.ingredientId : "";
    if (!Types.ObjectId.isValid(ingredientId)) {
      return {
        success: false,
        message: "Each ingredient row must reference a valid ingredient.",
      };
    }
    if (seenIngredientIds.has(ingredientId)) {
      return {
        success: false,
        message: "The same ingredient cannot be added to a recipe twice.",
      };
    }
    seenIngredientIds.add(ingredientId);

    const quantity = entry.quantity;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return {
        success: false,
        message: "Each ingredient needs a quantity greater than 0.",
      };
    }

    const unit = typeof entry.unit === "string" ? entry.unit : "";
    if (!RECIPE_UNITS.includes(unit as RecipeUnit)) {
      return { success: false, message: "Each ingredient needs a valid unit." };
    }

    ingredients.push({ ingredientId, quantity, unit: unit as RecipeUnit });
  }

  return {
    success: true,
    values: { name, servings, prepTimeMinutes, tags, instructions, ingredients },
  };
};
