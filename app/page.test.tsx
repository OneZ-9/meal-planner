import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the sign-in experience", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "MealPrep Pro" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
