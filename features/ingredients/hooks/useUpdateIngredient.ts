import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import {
  updateIngredient,
  type IngredientDTO,
  type IngredientInput,
} from "@/lib/api/ingredients";

export const useUpdateIngredient = (): UseMutationResult<
  IngredientDTO,
  Error,
  { id: string; input: IngredientInput }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => updateIngredient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
};
