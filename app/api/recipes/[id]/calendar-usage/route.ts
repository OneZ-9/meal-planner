import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { RecipeModel } from "@/lib/models/recipe";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";

type RouteContext = { params: Promise<{ id: string }> };

// Backs the recipe-delete confirmation dialog (ARCHITECTURE.md "Recipe
// Delete Data Flow", §22): the client checks this before showing the
// warning so it can report how many calendar days are affected. Same
// 404-not-403 rule as the other recipe routes — a recipe belonging to
// another user must never be distinguishable from one that doesn't exist.
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
  const recipe = await RecipeModel.findOne({ _id: id, userId: session.user.id }).select(
    "_id",
  );
  if (!recipe) {
    return NextResponse.json({ message: "Recipe not found." }, { status: 404 });
  }

  const count = await CalendarEntryModel.countDocuments({
    userId: session.user.id,
    recipeId: id,
  });

  return NextResponse.json({ count });
};
