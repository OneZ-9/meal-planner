import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { deleteRecipe } from "@/lib/api/recipes";

export const useDeleteRecipe = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      // The route cascades to calendar assignments (ARCHITECTURE.md §22),
      // so any open Weekly Plan view must refetch to drop the removed chips.
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
};
