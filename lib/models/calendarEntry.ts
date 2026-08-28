import { Schema, model, models, Types, type Document } from "mongoose";

import { MEAL_SLOTS, type MealSlot } from "@/lib/mealSlot";

export { MEAL_SLOTS, type MealSlot };

// One (day, meal slot) assignment for a user (US-5/US-9). Stores a live
// reference to a Recipe, never a copy (ARCHITECTURE.md "Calendar -> Recipe
// Boundary") so recipe edits/deletes propagate to the shopping list without
// any extra sync step here.
export interface CalendarEntryDocument extends Document {
  userId: Types.ObjectId;
  // Calendar day as "YYYY-MM-DD", not a Date/timestamp — a calendar day has
  // no time component or timezone, and storing it as a plain string avoids
  // UTC-vs-local-midnight drift when comparing against the client's
  // selected week.
  date: string;
  mealSlot: MealSlot;
  recipeId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEntrySchema = new Schema<CalendarEntryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    mealSlot: { type: String, required: true, enum: MEAL_SLOTS },
    recipeId: { type: Schema.Types.ObjectId, ref: "Recipe", required: true },
  },
  { timestamps: true },
);

// One recipe per (user, day, slot) — assigning again on an occupied slot
// replaces the existing entry via upsert (US-5) rather than erroring.
calendarEntrySchema.index({ userId: 1, date: 1, mealSlot: 1 }, { unique: true });
// Supports the recipe-delete cascade (ARCHITECTURE.md section 22): finding
// every calendar entry that references a given recipe before it's deleted.
calendarEntrySchema.index({ userId: 1, recipeId: 1 });

export const CalendarEntryModel =
  models.CalendarEntry ||
  model<CalendarEntryDocument>("CalendarEntry", calendarEntrySchema);
