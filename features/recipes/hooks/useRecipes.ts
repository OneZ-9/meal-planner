import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchRecipes, type RecipeDTO } from "@/lib/api/recipes";

// Debounced by the caller (see recipes-manager.tsx) — this hook just wraps
// the query so components never call useQuery directly (PROJECT.md
// state-management convention).
export const useRecipes = (query: string): UseQueryResult<RecipeDTO[]> =>
  useQuery({
    queryKey: ["recipes", "list", query],
    queryFn: () => fetchRecipes(query),
  });
