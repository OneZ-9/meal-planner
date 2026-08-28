import type { CalendarEntryDTO } from "@/lib/api/calendar";
import type { RecipeDTO } from "@/lib/api/recipes";
import type { ShoppingListItemDTO } from "@/lib/api/shoppingList";
import { MEAL_SLOTS, type MealSlot } from "@/lib/mealSlot";

export type DashboardTodayHighlights = {
  dinnerRecipeName: string | null;
  missingMealSlots: MealSlot[];
};

export type DashboardSummary = {
  mealsPlanned: number;
  recipesToTry: number;
  itemsToBuy: number;
  prepReadyPercent: number;
  todayHighlights: DashboardTodayHighlights;
};

// Derives the dashboard's current-week metrics and today's highlights from
// the owning modules' DTOs. A recipe is "to try" when it exists in the
// user's library but is not assigned to any slot in the current week.
export const deriveDashboardSummary = (
  calendarEntries: CalendarEntryDTO[],
  recipes: RecipeDTO[],
  shoppingListItems: ShoppingListItemDTO[],
  todayDateKey: string,
): DashboardSummary => {
  const assignedRecipeIds = new Set(
    calendarEntries.map((entry) => entry.recipe.id),
  );
  const checkedItems = shoppingListItems.filter((item) => item.checked).length;
  const totalItems = shoppingListItems.length;
  const todayEntries = calendarEntries.filter(
    (entry) => entry.date === todayDateKey,
  );
  const assignedTodayMealSlots = new Set(
    todayEntries.map((entry) => entry.mealSlot),
  );
  const dinnerEntry = todayEntries.find((entry) => entry.mealSlot === "dinner");

  return {
    mealsPlanned: calendarEntries.length,
    recipesToTry: recipes.filter((recipe) => !assignedRecipeIds.has(recipe.id))
      .length,
    itemsToBuy: totalItems - checkedItems,
    prepReadyPercent:
      totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100),
    todayHighlights: {
      dinnerRecipeName: dinnerEntry?.recipe.name ?? null,
      missingMealSlots: MEAL_SLOTS.filter(
        (mealSlot) => !assignedTodayMealSlots.has(mealSlot),
      ),
    },
  };
};
