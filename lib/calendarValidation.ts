import { Types } from "mongoose";

import { isValidDateKey } from "@/lib/dateWeek";
import { MEAL_SLOTS, type MealSlot } from "@/lib/mealSlot";

export type CalendarAssignmentInput = {
  date: string;
  mealSlot: MealSlot;
  recipeId: string;
};

type ValidationResult =
  | { success: true; values: CalendarAssignmentInput }
  | { success: false; message: string };

// Structural validation for POST /api/calendar (US-5). Server-side only —
// UI validation on the assign dialog is a separate, non-authoritative layer
// (ARCHITECTURE.md "Validation Boundaries").
export const validateCalendarAssignmentInput = (
  body: unknown,
): ValidationResult => {
  if (typeof body !== "object" || body === null) {
    return { success: false, message: "Invalid request body." };
  }

  const { date, mealSlot, recipeId } = body as Record<string, unknown>;

  if (typeof date !== "string" || !isValidDateKey(date)) {
    return { success: false, message: "A valid date is required." };
  }

  if (typeof mealSlot !== "string" || !MEAL_SLOTS.includes(mealSlot as MealSlot)) {
    return {
      success: false,
      message: `Meal slot must be one of: ${MEAL_SLOTS.join(", ")}.`,
    };
  }

  if (typeof recipeId !== "string" || !Types.ObjectId.isValid(recipeId)) {
    return { success: false, message: "A valid recipe is required." };
  }

  return {
    success: true,
    values: { date, mealSlot: mealSlot as MealSlot, recipeId },
  };
};
