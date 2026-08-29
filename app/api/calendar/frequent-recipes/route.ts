import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel } from "@/lib/models/recipe";

const SUGGESTION_COUNT = 3;

// Dashboard's "Suggested for You" (DESIGN.md section 16/17): the recipes a
// user has assigned to their calendar most often, across every week they've
// ever planned (not just the currently-viewed one) — a proxy for "recipes
// this user actually likes", since there's no separate favorites feature
// (ARCHITECTURE.md "Calendar -> Recipe Boundary": Calendar only references
// recipes by id, so this aggregates CalendarEntryModel rather than owning
// any of its own state).
export const GET = async (): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();

  const counts = await CalendarEntryModel.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { userId: new Types.ObjectId(session.user.id) } },
    { $group: { _id: "$recipeId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: SUGGESTION_COUNT },
  ]);

  if (counts.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const recipes = await RecipeModel.find({
    _id: { $in: counts.map((entry) => entry._id) },
    userId: session.user.id,
  }).select("name imageUrl prepTimeMinutes");
  const recipeLookup = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  const items = counts
    .map((entry) => {
      const recipe = recipeLookup.get(entry._id.toString());
      if (!recipe) return null;
      return {
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes,
        count: entry.count,
      };
    })
    .filter((item) => item !== null);

  return NextResponse.json({ items });
};
