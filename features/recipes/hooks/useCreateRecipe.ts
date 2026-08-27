import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { createRecipe, type RecipeDTO, type RecipeInput } from "@/lib/api/recipes";

export const useCreateRecipe = (): UseMutationResult<
  RecipeDTO,
  Error,
  RecipeInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};
