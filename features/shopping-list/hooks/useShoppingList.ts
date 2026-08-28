import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchShoppingList, type ShoppingListWeek } from "@/lib/api/shoppingList";

export const useShoppingList = (weekStart: string): UseQueryResult<ShoppingListWeek> =>
  useQuery({
    queryKey: ["shopping-list", "week", weekStart],
    queryFn: () => fetchShoppingList(weekStart),
  });
