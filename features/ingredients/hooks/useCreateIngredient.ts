import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import {
  createIngredient,
  type IngredientDTO,
  type IngredientInput,
} from "@/lib/api/ingredients";

export const useCreateIngredient = (): UseMutationResult<
  IngredientDTO,
  Error,
  IngredientInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
};
