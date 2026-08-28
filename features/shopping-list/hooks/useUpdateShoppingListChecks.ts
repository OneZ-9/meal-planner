import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import {
  updateShoppingListChecks,
  type ShoppingListCheckUpdateInput,
  type ShoppingListWeek,
} from "@/lib/api/shoppingList";

// Optimistic — US-8's whole point is checking items off while shopping, so
// the checkbox must respond immediately rather than waiting on a round
// trip. Rolls back to the pre-mutation snapshot on failure.
export const useUpdateShoppingListChecks = (): UseMutationResult<
  void,
  Error,
  ShoppingListCheckUpdateInput,
  { previous: ShoppingListWeek | undefined }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShoppingListChecks,
    onMutate: async (input) => {
      const queryKey = ["shopping-list", "week", input.weekStart];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ShoppingListWeek>(queryKey);
      if (previous) {
        const itemKeySet = new Set(input.itemKeys);
        queryClient.setQueryData<ShoppingListWeek>(queryKey, {
          ...previous,
          items: previous.items.map((item) =>
            itemKeySet.has(item.itemKey) ? { ...item, checked: input.checked } : item,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["shopping-list", "week", input.weekStart], context.previous);
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", "week", input.weekStart] });
    },
  });
};
