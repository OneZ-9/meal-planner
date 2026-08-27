import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addDays } from "date-fns";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { validateCalendarAssignmentInput } from "@/lib/calendarValidation";
import { toCalendarEntryDTO, type RecipeSummaryLookup } from "@/lib/calendarDto";
import { fromDateKey, isValidDateKey, toDateKey } from "@/lib/dateWeek";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel } from "@/lib/models/recipe";

const buildRecipeLookup = async (
  recipeIds: string[],
): Promise<RecipeSummaryLookup> => {
  if (recipeIds.length === 0) return new Map();
  const recipes = await RecipeModel.find({ _id: { $in: recipeIds } }).select(
    "name prepTimeMinutes",
  );
  return new Map(
    recipes.map((recipe) => [
      recipe.id,
      { name: recipe.name, prepTimeMinutes: recipe.prepTimeMinutes },
    ]),
  );
};

// Calendar module owns weekly navigation + recipe assignment (ARCHITECTURE.md
// section 9). Every read/write is scoped to the authenticated user only —
// weeks and their assignments are independent per user and per week (US-9).
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
  const entries = await CalendarEntryModel.find({
    userId: session.user.id,
    date: { $gte: weekStartParam, $lte: weekEndKey },
  });

  const recipeLookup = await buildRecipeLookup(
    [...new Set(entries.map((entry) => entry.recipeId.toString()))],
  );

  return NextResponse.json({
    weekStart: weekStartParam,
    weekEnd: weekEndKey,
    items: entries
      .map((entry) => toCalendarEntryDTO(entry, recipeLookup))
      .filter((dto) => dto !== null),
  });
};

// Assigns a recipe to a day/meal slot (US-5). Each (date, mealSlot) holds
// exactly one recipe — assigning to an occupied slot replaces the previous
// recipe via upsert rather than erroring (ARCHITECTURE.md "Weekly Calendar
// Module": "Replacement of recipes in occupied slots").
export const POST = async (request: Request): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateCalendarAssignmentInput(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { date, mealSlot, recipeId } = validation.values;

  await connectDB();
  // Recipes have no global scope (unlike ingredients) — a recipe belonging
  // to another user must 404, never reveal it exists (see recipe routes'
  // "404, not 403" rule in DECISIONS.md).
  const recipe = await RecipeModel.findOne({
    _id: recipeId,
    userId: session.user.id,
  }).select("name prepTimeMinutes");
  if (!recipe) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  const entry = await CalendarEntryModel.findOneAndUpdate(
    { userId: session.user.id, date, mealSlot },
    { userId: session.user.id, date, mealSlot, recipeId },
    { upsert: true, new: true },
  );

  const recipeLookup: RecipeSummaryLookup = new Map([
    [recipe.id, { name: recipe.name, prepTimeMinutes: recipe.prepTimeMinutes }],
  ]);

  return NextResponse.json(toCalendarEntryDTO(entry, recipeLookup), { status: 201 });
};
