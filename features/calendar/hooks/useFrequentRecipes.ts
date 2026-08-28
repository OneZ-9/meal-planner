import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchFrequentRecipes, type FrequentRecipeDTO } from "@/lib/api/calendar";

// Dashboard's "Suggested for You" (US-independent polish, see DECISIONS.md
// "Suggested for You: wired to live frequent-recipe data") — the user's
// most-assigned recipes across their whole calendar history, not just the
// visible week, so this is deliberately not keyed by weekStart like
// useWeekCalendar.
export const useFrequentRecipes = (): UseQueryResult<FrequentRecipeDTO[]> =>
  useQuery({
    queryKey: ["calendar", "frequent-recipes"],
    queryFn: fetchFrequentRecipes,
  });
