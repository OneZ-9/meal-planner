import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { validateCalendarAssignmentInput } from "./calendarValidation";

const recipeId = new Types.ObjectId().toString();

describe("validateCalendarAssignmentInput", () => {
  it("accepts a valid assignment", () => {
    expect(
      validateCalendarAssignmentInput({
        date: "2023-10-23",
        mealSlot: "dinner",
        recipeId,
      }),
    ).toEqual({
      success: true,
      values: { date: "2023-10-23", mealSlot: "dinner", recipeId },
    });
  });

  it("rejects a malformed date", () => {
    expect(
      validateCalendarAssignmentInput({
        date: "10/23/2023",
        mealSlot: "dinner",
        recipeId,
      }),
    ).toEqual({ success: false, message: "A valid date is required." });
  });

  it("rejects a date that doesn't exist", () => {
    expect(
      validateCalendarAssignmentInput({
        date: "2023-02-30",
        mealSlot: "dinner",
        recipeId,
      }),
    ).toEqual({ success: false, message: "A valid date is required." });
  });

  it("rejects an invalid meal slot", () => {
    expect(
      validateCalendarAssignmentInput({
        date: "2023-10-23",
        mealSlot: "brunch",
        recipeId,
      }),
    ).toEqual({
      success: false,
      message: "Meal slot must be one of: breakfast, lunch, dinner.",
    });
  });

  it("rejects an invalid recipe id", () => {
    expect(
      validateCalendarAssignmentInput({
        date: "2023-10-23",
        mealSlot: "dinner",
        recipeId: "not-an-id",
      }),
    ).toEqual({ success: false, message: "A valid recipe is required." });
  });

  it("rejects a non-object body", () => {
    expect(validateCalendarAssignmentInput(null)).toEqual({
      success: false,
      message: "Invalid request body.",
    });
  });
});
