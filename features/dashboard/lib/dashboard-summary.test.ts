import { describe, expect, it } from "vitest";

import type { CalendarEntryDTO } from "@/lib/api/calendar";
import type { RecipeDTO } from "@/lib/api/recipes";
import type { ShoppingListItemDTO } from "@/lib/api/shoppingList";
import type { MealSlot } from "@/lib/mealSlot";
import { deriveDashboardSummary } from "./dashboard-summary";

const recipe = (id: string): RecipeDTO => ({
  id,
  name: `Recipe ${id}`,
  servings: 2,
  prepTimeMinutes: null,
  tags: [],
  instructions: "",
  ingredients: [],
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
});

const calendarEntry = (
  id: string,
  recipeId: string,
  mealSlot: MealSlot = "dinner",
  date = "2026-08-24",
): CalendarEntryDTO => ({
  id,
  date,
  mealSlot,
  recipe: { id: recipeId, name: `Recipe ${recipeId}`, prepTimeMinutes: null },
});

const shoppingItem = (
  itemKey: string,
  checked: boolean,
): ShoppingListItemDTO => ({
  itemKey,
  ingredientId: itemKey,
  ingredientName: itemKey,
  quantity: 1,
  unit: "whole",
  unmerged: false,
  checked,
});

describe("deriveDashboardSummary", () => {
  it("counts calendar slots and only recipes not assigned this week", () => {
    const summary = deriveDashboardSummary(
      [
        calendarEntry("entry-1", "recipe-1"),
        calendarEntry("entry-2", "recipe-1"),
      ],
      [recipe("recipe-1"), recipe("recipe-2"), recipe("recipe-3")],
      [],
      "2026-08-24",
    );

    expect(summary.mealsPlanned).toBe(2);
    expect(summary.recipesToTry).toBe(2);
  });

  it("counts unchecked shopping items and rounds checked progress", () => {
    const summary = deriveDashboardSummary(
      [],
      [],
      [
        shoppingItem("item-1", true),
        shoppingItem("item-2", true),
        shoppingItem("item-3", false),
      ],
      "2026-08-24",
    );

    expect(summary.itemsToBuy).toBe(1);
    expect(summary.prepReadyPercent).toBe(67);
  });

  it("reports zero progress for an empty shopping list", () => {
    expect(
      deriveDashboardSummary([], [], [], "2026-08-24").prepReadyPercent,
    ).toBe(0);
  });

  it("shows today's dinner and reports only today's unassigned meal slots", () => {
    const summary = deriveDashboardSummary(
      [
        calendarEntry("entry-1", "recipe-1", "breakfast"),
        calendarEntry("entry-2", "recipe-2", "dinner"),
        calendarEntry("entry-3", "recipe-3", "lunch", "2026-08-25"),
      ],
      [],
      [],
      "2026-08-24",
    );

    expect(summary.todayHighlights.dinnerRecipeName).toBe("Recipe recipe-2");
    expect(summary.todayHighlights.missingMealSlots).toEqual(["lunch"]);
  });

  it("reports an unallocated dinner when today's dinner slot is empty", () => {
    const summary = deriveDashboardSummary(
      [
        calendarEntry("entry-1", "recipe-1", "breakfast"),
        calendarEntry("entry-2", "recipe-2", "lunch"),
      ],
      [],
      [],
      "2026-08-24",
    );

    expect(summary.todayHighlights.dinnerRecipeName).toBeNull();
    expect(summary.todayHighlights.missingMealSlots).toEqual(["dinner"]);
  });

  it("reports no missing slots when all three meals are assigned today", () => {
    const summary = deriveDashboardSummary(
      [
        calendarEntry("entry-1", "recipe-1", "breakfast"),
        calendarEntry("entry-2", "recipe-2", "lunch"),
        calendarEntry("entry-3", "recipe-3", "dinner"),
      ],
      [],
      [],
      "2026-08-24",
    );

    expect(summary.todayHighlights.missingMealSlots).toEqual([]);
  });
});
