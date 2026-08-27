import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { validateRecipeInput } from "@/lib/recipeValidation";
import { toRecipeDTO } from "@/lib/recipeDto";
import {
  buildIngredientLookup,
  resolveVisibleIngredientLookup,
  uniqueIngredientIds,
} from "@/lib/recipeIngredients";
import { RecipeModel } from "@/lib/models/recipe";

type RouteContext = { params: Promise<{ id: string }> };

// Recipes have no global scope, so — unlike ingredients, where a global/
// other-user record is at least visible — a recipe belonging to another
// user must never be distinguishable from one that doesn't exist. Every
// handler below returns 404 (never 403) for "not found or not yours".
export const GET = async (
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  await connectDB();
  const recipe = await RecipeModel.findOne({ _id: id, userId: session.user.id });
  if (!recipe) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  const ingredientLookup = await buildIngredientLookup(
    uniqueIngredientIds(recipe.ingredients),
  );

  return NextResponse.json(toRecipeDTO(recipe, ingredientLookup));
};

// Edits a recipe (US-4). Ingredient/quantity edits take effect immediately
// for any week's shopping list that references this recipe, since the
// calendar holds a live reference rather than a snapshot
// (ARCHITECTURE.md "Recipe Edit Data Flow") — there is nothing extra to
// propagate here, the next shopping-list generation just reads the updated
// recipe.
export const PATCH = async (
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateRecipeInput(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { name, servings, prepTimeMinutes, tags, instructions, ingredients } =
    validation.values;

  await connectDB();
  const recipe = await RecipeModel.findOne({ _id: id, userId: session.user.id });
  if (!recipe) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  const ingredientIds = [...new Set(ingredients.map((entry) => entry.ingredientId))];
  const ingredientLookup = await resolveVisibleIngredientLookup(
    ingredientIds,
    session.user.id,
  );
  if (!ingredientLookup) {
    return NextResponse.json(
      { message: "One or more ingredients could not be found." },
      { status: 400 },
    );
  }

  recipe.name = name;
  recipe.servings = servings;
  recipe.prepTimeMinutes = prepTimeMinutes;
  recipe.tags = tags;
  recipe.instructions = instructions;
  recipe.ingredients = ingredients;
  await recipe.save();

  return NextResponse.json(toRecipeDTO(recipe, ingredientLookup));
};

// Deletes a recipe (US-4). ARCHITECTURE.md's "Recipe Delete Data Flow" calls
// for warning the user with an affected-day count and cascading the delete
// to calendar assignments when the recipe is assigned to the calendar — but
// the Calendar module doesn't exist yet (no calendar-entry model or API), so
// there are no assignments that could exist to check against. This mirrors
// the same deferral already accepted for ingredient delete (see
// KNOWN_ISSUES.md) and should be upgraded once Calendar is built.
export const DELETE = async (
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  await connectDB();
  const deleted = await RecipeModel.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  });
  if (!deleted) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
};
