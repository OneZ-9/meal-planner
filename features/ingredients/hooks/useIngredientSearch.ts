import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { searchIngredients, type IngredientDTO } from "@/lib/api/ingredients";

// Debounced by the caller (see ingredient-combobox.tsx) — this hook just
// wraps the query so components never call useQuery directly (PROJECT.md
// state-management convention).
export const useIngredientSearch = (
  query: string,
): UseQueryResult<IngredientDTO[]> =>
  useQuery({
    queryKey: ["ingredients", "search", query],
    queryFn: () => searchIngredients(query),
  });
