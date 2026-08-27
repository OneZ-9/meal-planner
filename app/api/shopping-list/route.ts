import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addDays } from "date-fns";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { fromDateKey, isValidDateKey, toDateKey } from "@/lib/dateWeek";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel, type RecipeIngredientEntry } from "@/lib/models/recipe";
import { IngredientModel } from "@/lib/models/ingredient";
import { ShoppingListItemStateModel } from "@/lib/models/shoppingListItemState";
import {
  generateShoppingList,
  type ShoppingListIngredientLookup,
  type ShoppingListSourceEntry,
} from "@/lib/shoppingListGenerator";
import { validateShoppingListCheckUpdate } from "@/lib/shoppingListValidation";

// The Shopping List module (ARCHITECTURE.md section 11/12): reads the
// selected week's calendar assignments, resolves each assigned recipe's
// ingredients, normalizes/merges quantities, and merges in this user's
// persisted checked state for that week. The list itself is never stored —
// it's regenerated on every GET, same "live reference, no snapshot"
// philosophy as Calendar -> Recipe (ARCHITECTURE.md "Recipe Edit Data
// Flow") — only the checked/unchecked bits persist (US-8).
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const weekStartParam = request.nextUrl.searchParams.get("weekStart");
  if (!weekStartParam || !isValidDateKey(weekStartParam)) {
    return NextResponse.json(
      { message: "A valid weekStart (YYYY-MM-DD) is required." },
      { status: 400 },
    );
  }

  const weekStart = fromDateKey(weekStartParam);
  const weekEndKey = toDateKey(addDays(weekStart, 6));

  await connectDB();

  const calendarEntries = await CalendarEntryModel.find({
    userId: session.user.id,
    date: { $gte: weekStartParam, $lte: weekEndKey },
  }).select("recipeId");

  const recipeIds = [...new Set(calendarEntries.map((entry) => entry.recipeId.toString()))];
  const recipes =
    recipeIds.length === 0
      ? []
      : await RecipeModel.find({
          _id: { $in: recipeIds },
          userId: session.user.id,
        }).select("ingredients");

  // US-6: each calendar occurrence contributes its recipe's ingredients
  // independently, even if the same recipe is assigned to several slots.
  const recipeIngredientsById = new Map<string, RecipeIngredientEntry[]>(
    recipes.map((recipe) => [recipe.id, recipe.ingredients]),
  );
  const sourceEntries: ShoppingListSourceEntry[] = calendarEntries.flatMap((entry) => {
    const ingredients = recipeIngredientsById.get(entry.recipeId.toString());
    if (!ingredients) return [];
    return ingredients.map((ingredient) => ({
      ingredientId: ingredient.ingredientId.toString(),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    }));
  });

  const ingredientIds = [...new Set(sourceEntries.map((entry) => entry.ingredientId))];
  const ingredients =
    ingredientIds.length === 0
      ? []
      : await IngredientModel.find({ _id: { $in: ingredientIds } }).select(
          "name unitFamily densityGPerMl",
        );
  const ingredientLookup: ShoppingListIngredientLookup = new Map(
    ingredients.map((ingredient) => [
      ingredient.id,
      {
        name: ingredient.name,
        unitFamily: ingredient.unitFamily,
        densityGPerMl: ingredient.densityGPerMl,
      },
    ]),
  );

  const lines = generateShoppingList(sourceEntries, ingredientLookup);

  const checkedStates =
    lines.length === 0
      ? []
      : await ShoppingListItemStateModel.find({
          userId: session.user.id,
          weekStart: weekStartParam,
        }).select("itemKey checked");
  const checkedByItemKey = new Map(
    checkedStates.map((state) => [state.itemKey, state.checked]),
  );

  return NextResponse.json({
    weekStart: weekStartParam,
    weekEnd: weekEndKey,
    items: lines.map((line) => ({
      ...line,
      checked: checkedByItemKey.get(line.itemKey) ?? false,
    })),
  });
};

// Updates checked/unchecked state for one or more shopping-list lines
// (US-8). Always upserts by (userId, weekStart, itemKey) rather than
// requiring the line to already have a state document, since a line's first
// check is exactly when no document exists yet.
export const PATCH = async (request: Request): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateShoppingListCheckUpdate(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { weekStart, itemKeys, checked } = validation.values;

  await connectDB();
  await Promise.all(
    itemKeys.map((itemKey) =>
      ShoppingListItemStateModel.findOneAndUpdate(
        { userId: session.user.id, weekStart, itemKey },
        { userId: session.user.id, weekStart, itemKey, checked },
        { upsert: true },
      ),
    ),
  );

  return new NextResponse(null, { status: 204 });
};
