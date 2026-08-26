import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchRecipe, type RecipeDTO } from "@/lib/api/recipes";

// Fetches a single recipe for the edit form's initial values.
export const useRecipe = (id: string): UseQueryResult<RecipeDTO> =>
  useQuery({
    queryKey: ["recipes", "detail", id],
    queryFn: () => fetchRecipe(id),
  });
