import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";

import {
  fetchIngredients,
  type IngredientsPage,
  type IngredientScope,
} from "@/lib/api/ingredients";

const pageSize = 30;

// Backs the full, browsable ingredients list (features/ingredients/
// components/ingredients-manager.tsx) with infinite-scroll pagination —
// unlike useIngredientSearch, which only returns a top-N typeahead slice.
export const useInfiniteIngredients = (
  query: string,
  scope: IngredientScope,
): UseInfiniteQueryResult<InfiniteData<IngredientsPage>> =>
  useInfiniteQuery({
    queryKey: ["ingredients", "list", query, scope],
    queryFn: ({ pageParam }) =>
      fetchIngredients({ query, scope, cursor: pageParam, limit: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
