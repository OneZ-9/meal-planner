import { useState } from "react";

import { useWeekCalendar } from "@/features/calendar/hooks/useWeekCalendar";
import { useRecipes } from "@/features/recipes/hooks/useRecipes";
import { useShoppingList } from "@/features/shopping-list/hooks/useShoppingList";
import { formatWeekRangeLabel, getWeekStart, toDateKey } from "@/lib/dateWeek";
import {
  deriveDashboardSummary,
  type DashboardSummary,
} from "../lib/dashboard-summary";

export type DashboardSummaryQuery = {
  summary: DashboardSummary | null;
  weekLabel: string;
  isLoading: boolean;
  hasError: boolean;
};

// Composes read-only data from Calendar, Recipes, and Shopping List for the
// dashboard without moving any domain logic out of those owning features.
export const useDashboardSummary = (): DashboardSummaryQuery => {
  const [today] = useState(() => new Date());
  const weekStart = getWeekStart(today);
  const weekStartKey = toDateKey(weekStart);
  const todayDateKey = toDateKey(today);
  const calendarQuery = useWeekCalendar(weekStartKey);
  const recipesQuery = useRecipes("");
  const shoppingListQuery = useShoppingList(weekStartKey);
  const isLoading =
    calendarQuery.isLoading ||
    recipesQuery.isLoading ||
    shoppingListQuery.isLoading;
  const hasError =
    calendarQuery.isError || recipesQuery.isError || shoppingListQuery.isError;

  const summary =
    calendarQuery.data && recipesQuery.data && shoppingListQuery.data
      ? deriveDashboardSummary(
          calendarQuery.data.items,
          recipesQuery.data,
          shoppingListQuery.data.items,
          todayDateKey,
        )
      : null;

  return {
    summary,
    weekLabel: formatWeekRangeLabel(weekStart),
    isLoading,
    hasError,
  };
};
