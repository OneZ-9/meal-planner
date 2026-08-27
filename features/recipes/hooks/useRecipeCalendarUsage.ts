import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchRecipeCalendarUsage } from "@/lib/api/recipes";

// Backs the delete-confirmation dialog's affected-day warning
// (ARCHITECTURE.md "Recipe Delete Data Flow", §22). Disabled while no
// recipe is queued for deletion, same `enabled` guard pattern as
// features/calendar/hooks/useRecipeDetails.
export const useRecipeCalendarUsage = (
  recipeId: string | null,
): UseQueryResult<{ count: number }> =>
  useQuery({
    queryKey: ["recipes", "calendar-usage", recipeId],
    queryFn: () => fetchRecipeCalendarUsage(recipeId as string),
    enabled: recipeId !== null,
  });
