import type { HydratedDocument } from "mongoose";

import type { MealSlot } from "@/lib/mealSlot";
import type { CalendarEntryDocument } from "@/lib/models/calendarEntry";

export type CalendarEntryDTO = {
  id: string;
  date: string;
  mealSlot: MealSlot;
  recipe: {
    id: string;
    name: string;
    prepTimeMinutes: number | null;
  };
};

export type RecipeSummaryLookup = Map<
  string,
  { name: string; prepTimeMinutes: number | null }
>;

// The Calendar module reads recipe display data but never owns/duplicates it
// (ARCHITECTURE.md "Calendar -> Recipe Boundary") — the caller resolves
// recipe name/prep time in one batched query and passes it in here, mirroring
// lib/recipeDto.ts's ingredient-lookup pattern.
export const toCalendarEntryDTO = (
  entry: HydratedDocument<CalendarEntryDocument>,
  recipeLookup: RecipeSummaryLookup,
): CalendarEntryDTO | null => {
  const recipe = recipeLookup.get(entry.recipeId.toString());
  if (!recipe) return null;

  return {
    id: entry.id,
    date: entry.date,
    mealSlot: entry.mealSlot,
    recipe: {
      id: entry.recipeId.toString(),
      name: recipe.name,
      prepTimeMinutes: recipe.prepTimeMinutes,
    },
  };
};
