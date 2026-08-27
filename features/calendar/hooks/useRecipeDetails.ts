import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchRecipe, type RecipeDTO } from "@/lib/api/recipes";

// Fetches one recipe for the read-only details dialog opened from a meal
// chip (US-5). A calendar-local hook rather than reusing
// features/recipes/hooks/useRecipe (which has no `enabled` guard) — this
// query must stay disabled while no chip is selected, since the dialog
// component is always mounted (its open/closed state is just a prop).
export const useRecipeDetails = (
  recipeId: string | null,
): UseQueryResult<RecipeDTO> =>
  useQuery({
    queryKey: ["recipes", "detail", recipeId],
    queryFn: () => fetchRecipe(recipeId as string),
    enabled: recipeId !== null,
  });
