export type ShoppingListCheckUpdateValues = {
  weekStart: string;
  itemKeys: string[];
  checked: boolean;
};

export type ShoppingListCheckUpdateValidation =
  | { success: true; values: ShoppingListCheckUpdateValues }
  | { success: false; message: string };

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

// Backs PATCH /api/shopping-list (US-8). `itemKeys` is always an array —
// a single checkbox toggle and the "Check All"/"Clear Checked" bulk actions
// (DESIGN.md section 30) share this one shape, just with a different-length
// array, rather than needing two endpoints.
export const validateShoppingListCheckUpdate = (
  input: unknown,
): ShoppingListCheckUpdateValidation => {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Request body is required." };
  }

  const candidate = input as Record<string, unknown>;

  const weekStart = candidate.weekStart;
  if (typeof weekStart !== "string" || !dateKeyPattern.test(weekStart)) {
    return { success: false, message: "A valid weekStart (YYYY-MM-DD) is required." };
  }

  const itemKeys = candidate.itemKeys;
  if (
    !Array.isArray(itemKeys) ||
    itemKeys.length === 0 ||
    !itemKeys.every((key) => typeof key === "string" && key.length > 0)
  ) {
    return { success: false, message: "itemKeys must be a non-empty list of strings." };
  }

  const checked = candidate.checked;
  if (typeof checked !== "boolean") {
    return { success: false, message: "checked must be a boolean." };
  }

  return { success: true, values: { weekStart, itemKeys, checked } };
};
