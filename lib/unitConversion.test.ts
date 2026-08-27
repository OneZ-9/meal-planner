import { describe, expect, it } from "vitest";

import {
  formatDisplayQuantity,
  normalizeRecipeQuantity,
  roundUpToNearest,
} from "./unitConversion";

// Fixtures mirror .ai/Unit_Conversion_Algorithm_Spec.md's "Verified test
// cases" exactly, including its expected rounded output at 2 decimals.
const sugar = { unitFamily: "weight" as const, densityGPerMl: 0.845 };
const oliveOil = { unitFamily: "volume" as const, densityGPerMl: 0.913 };

const round2 = (value: number): number => Math.round(value * 100) / 100;

describe("normalizeRecipeQuantity", () => {
  it("normalizes tbsp of sugar (cross-family, via density)", () => {
    const result = normalizeRecipeQuantity({ quantity: 2, unit: "tbsp" }, sugar);
    expect(result.unmerged).toBe(false);
    expect(result.unit).toBe("g");
    expect(round2(result.quantity)).toBe(24.99);
  });

  it("normalizes a cup of sugar (cross-family, via density)", () => {
    const result = normalizeRecipeQuantity({ quantity: 1, unit: "cup" }, sugar);
    expect(result.unit).toBe("g");
    expect(round2(result.quantity)).toBe(199.92);
  });

  it("leaves grams of sugar as-is (already the ingredient's home family)", () => {
    const result = normalizeRecipeQuantity({ quantity: 40, unit: "g" }, sugar);
    expect(result).toEqual({ quantity: 40, unit: "g", unmerged: false });
  });

  it("normalizes tbsp of olive oil to ml (already the ingredient's home family)", () => {
    const result = normalizeRecipeQuantity({ quantity: 3, unit: "tbsp" }, oliveOil);
    expect(result.unmerged).toBe(false);
    expect(result.unit).toBe("ml");
    expect(round2(result.quantity)).toBe(44.36);
  });

  it("normalizes grams of olive oil (cross-family, via density)", () => {
    const result = normalizeRecipeQuantity({ quantity: 50, unit: "g" }, oliveOil);
    expect(result.unit).toBe("ml");
    expect(round2(result.quantity)).toBe(54.76);
  });

  it("passes count ('whole') quantities through untouched", () => {
    const result = normalizeRecipeQuantity(
      { quantity: 3, unit: "whole" },
      { unitFamily: "count", densityGPerMl: null },
    );
    expect(result).toEqual({ quantity: 3, unit: "whole", unmerged: false });
  });

  it("marks a cross-family entry unmerged when the ingredient has no density", () => {
    const result = normalizeRecipeQuantity(
      { quantity: 2, unit: "tbsp" },
      { unitFamily: "weight", densityGPerMl: null },
    );
    expect(result.unmerged).toBe(true);
    expect(result.unit).toBe("ml");
    expect(round2(result.quantity)).toBe(29.57);
  });
});

describe("roundUpToNearest", () => {
  it("rounds up to the given step", () => {
    expect(roundUpToNearest(23, 5)).toBe(25);
    expect(roundUpToNearest(25, 5)).toBe(25);
    expect(roundUpToNearest(0.5, 5)).toBe(5);
  });
});

describe("formatDisplayQuantity", () => {
  it("rounds weight up to the nearest 5g", () => {
    // Sugar totals from the spec: 24.99 + 199.92 + 40 = 264.91 -> 265g
    expect(formatDisplayQuantity(264.91, "g")).toEqual({ quantity: 265, unit: "g" });
  });

  it("rounds volume up to the nearest 5ml", () => {
    // Olive oil totals from the spec: 44.36 + 29.57 + 54.76 = 128.69 -> 130ml
    expect(formatDisplayQuantity(128.69, "ml")).toEqual({ quantity: 130, unit: "ml" });
  });

  it("switches to kg once the rounded total reaches 1000g", () => {
    expect(formatDisplayQuantity(999, "g")).toEqual({ quantity: 1, unit: "kg" });
  });

  it("switches to l once the rounded total reaches 1000ml", () => {
    expect(formatDisplayQuantity(1400, "ml")).toEqual({ quantity: 1.4, unit: "l" });
  });

  it("rounds count quantities up to the nearest whole number", () => {
    expect(formatDisplayQuantity(2.4, "whole")).toEqual({ quantity: 3, unit: "whole" });
  });
});
