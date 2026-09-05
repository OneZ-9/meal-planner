import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchRecipe, RecipeNotFoundError, type RecipeDTO } from "@/lib/api/recipes";

// Fetches a single recipe for the edit form's initial values. Retrying a
// 404 can never succeed, so it skips the default retry/backoff — without
// this, RecipeEditLoader's not-found panel would only appear after several
// seconds of pointless retries.
export const useRecipe = (id: string): UseQueryResult<RecipeDTO> =>
  useQuery({
    queryKey: ["recipes", "detail", id],
    queryFn: () => fetchRecipe(id),
    retry: (failureCount, error) =>
      error instanceof RecipeNotFoundError ? false : failureCount < 3,
  });
