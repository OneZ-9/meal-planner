import { describe, expect, it } from "vitest";

import { validateShoppingListCheckUpdate } from "./shoppingListValidation";

describe("validateShoppingListCheckUpdate", () => {
  it("rejects a missing body", () => {
    expect(validateShoppingListCheckUpdate(null)).toEqual({
      success: false,
      message: "Request body is required.",
    });
  });

  it("rejects an invalid weekStart", () => {
    const result = validateShoppingListCheckUpdate({
      weekStart: "not-a-date",
      itemKeys: ["a:g"],
      checked: true,
    });
    expect(result).toEqual({
      success: false,
      message: "A valid weekStart (YYYY-MM-DD) is required.",
    });
  });

  it("rejects an empty itemKeys list", () => {
    const result = validateShoppingListCheckUpdate({
      weekStart: "2026-08-24",
      itemKeys: [],
      checked: true,
    });
    expect(result).toEqual({
      success: false,
      message: "itemKeys must be a non-empty list of strings.",
    });
  });

  it("rejects a non-boolean checked value", () => {
    const result = validateShoppingListCheckUpdate({
      weekStart: "2026-08-24",
      itemKeys: ["a:g"],
      checked: "yes",
    });
    expect(result).toEqual({ success: false, message: "checked must be a boolean." });
  });

  it("accepts a valid single-item update", () => {
    const result = validateShoppingListCheckUpdate({
      weekStart: "2026-08-24",
      itemKeys: ["a:g"],
      checked: true,
    });
    expect(result).toEqual({
      success: true,
      values: { weekStart: "2026-08-24", itemKeys: ["a:g"], checked: true },
    });
  });

  it("accepts a bulk update with multiple item keys", () => {
    const result = validateShoppingListCheckUpdate({
      weekStart: "2026-08-24",
      itemKeys: ["a:g", "b:ml"],
      checked: false,
    });
    expect(result.success).toBe(true);
  });
});
