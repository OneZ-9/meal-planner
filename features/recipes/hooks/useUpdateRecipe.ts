import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { updateRecipe, type RecipeDTO, type RecipeInput } from "@/lib/api/recipes";

export const useUpdateRecipe = (): UseMutationResult<
  RecipeDTO,
  Error,
  { id: string; input: RecipeInput }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => updateRecipe(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};
