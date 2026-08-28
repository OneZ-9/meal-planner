import { describe, expect, it } from "vitest";

import { normalizeEmail, validateRegistrationInput } from "./auth-validation";

describe("registration validation", () => {
  it("normalizes a valid registration", () => {
    expect(
      validateRegistrationInput({
        name: "  Alex Cook  ",
        email: " Alex@Example.COM ",
        password: "mealplan123",
      }),
    ).toEqual({
      success: true,
      values: {
        name: "Alex Cook",
        email: "alex@example.com",
        password: "mealplan123",
      },
    });
  });

  it("rejects short passwords", () => {
    expect(
      validateRegistrationInput({
        name: "Alex Cook",
        email: "alex@example.com",
        password: "short",
      }),
    ).toEqual({
      success: false,
      message: "Password must be 8 to 128 characters.",
    });
  });

  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  USER@Example.com ")).toBe("user@example.com");
  });
});
