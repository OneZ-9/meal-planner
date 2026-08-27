import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

// Escapes regex metacharacters in user-supplied search text before it's used
// in a $regex filter, so a query like "2%" or "(chicken" can't throw or
// behave unexpectedly.
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Recipe module owns recipe CRUD (ARCHITECTURE.md section 7). Unlike
// ingredients, recipes have no global scope — every list/search is scoped to
// the authenticated user only (ARCHITECTURE.md "User Data Isolation").
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  await connectDB();
  const filter: Record<string, unknown> = { userId: session.user.id };
  if (query.length > 0) {
    filter.name = { $regex: escapeRegExp(query), $options: "i" };
  }

  const recipes = await RecipeModel.find(filter).sort({ createdAt: -1 });
  const ingredientLookup = await buildIngredientLookup(
    uniqueIngredientIds(recipes.flatMap((recipe) => recipe.ingredients)),
  );

  return NextResponse.json({
    items: recipes.map((recipe) => toRecipeDTO(recipe, ingredientLookup)),
  });
};

// Creates a recipe (US-2). A recipe cannot be saved with zero ingredients or
// a missing quantity/unit (validateRecipeInput), and every ingredient row
// must reference an ingredient the user can actually see — the global set or
// their own custom ingredients — never another user's private ingredient
// (ARCHITECTURE.md "Recipe -> Ingredient Boundary").
export const POST = async (request: Request): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateRecipeInput(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { name, servings, prepTimeMinutes, tags, instructions, ingredients } =
    validation.values;

  await connectDB();
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

  const created = await RecipeModel.create({
    name,
    servings,
    prepTimeMinutes,
    tags,
    instructions,
    ingredients,
    userId: session.user.id,
  });

  return NextResponse.json(toRecipeDTO(created, ingredientLookup), { status: 201 });
};
