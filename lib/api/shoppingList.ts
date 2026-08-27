export type ShoppingListItemDTO = {
  itemKey: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unmerged: boolean;
  checked: boolean;
};

export type ShoppingListWeek = {
  weekStart: string;
  weekEnd: string;
  items: ShoppingListItemDTO[];
};

export type ShoppingListCheckUpdateInput = {
  weekStart: string;
  itemKeys: string[];
  checked: boolean;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  return (
    (body && typeof body.message === "string" && body.message) ||
    "Something went wrong. Please try again."
  );
};

export const fetchShoppingList = async (weekStart: string): Promise<ShoppingListWeek> => {
  const response = await fetch(`/api/shopping-list?weekStart=${weekStart}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const updateShoppingListChecks = async (
  input: ShoppingListCheckUpdateInput,
): Promise<void> => {
  const response = await fetch("/api/shopping-list", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};
