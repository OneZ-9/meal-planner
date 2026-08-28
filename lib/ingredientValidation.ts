import type { UnitFamily } from "@/lib/models/ingredient";

export type IngredientInputValues = {
  name: string;
  unitFamily: UnitFamily;
  densityGPerMl: number | null;
};

export type IngredientInputValidation =
  | { success: true; values: IngredientInputValues }
  | { success: false; message: string };

const unitFamilies: readonly UnitFamily[] = ["weight", "volume", "count"];

export const normalizeIngredientName = (name: string): string =>
  name.trim().replace(/\s+/g, " ");

// Shared by create and update: name + unitFamily are required (US-3);
// densityGPerMl is optional and only meaningful for weight/volume, since
// it's the conversion factor between those two families — count
// ingredients never need it (see ARCHITECTURE.md "Unit Conversion Boundary").
export const validateIngredientInput = (
  input: unknown,
): IngredientInputValidation => {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Enter the ingredient's details." };
  }

  const candidate = input as Record<string, unknown>;
  const name =
    typeof candidate.name === "string"
      ? normalizeIngredientName(candidate.name)
      : "";

  if (name.length < 1 || name.length > 80) {
    return {
      success: false,
      message: "Ingredient name must be 1 to 80 characters.",
    };
  }

  const unitFamily =
    typeof candidate.unitFamily === "string" ? candidate.unitFamily : "";
  if (!unitFamilies.includes(unitFamily as UnitFamily)) {
    return {
      success: false,
      message: "Unit family must be weight, volume, or count.",
    };
  }

  if (
    candidate.densityGPerMl !== undefined &&
    candidate.densityGPerMl !== null
  ) {
    const density = candidate.densityGPerMl;
    if (typeof density !== "number" || !Number.isFinite(density) || density <= 0) {
      return {
        success: false,
        message: "Density must be a positive number when provided.",
      };
    }
    if (unitFamily === "count") {
      return {
        success: false,
        message: "Count ingredients cannot have a density.",
      };
    }
  }

  const densityGPerMl =
    typeof candidate.densityGPerMl === "number" ? candidate.densityGPerMl : null;

  return {
    success: true,
    values: { name, unitFamily: unitFamily as UnitFamily, densityGPerMl },
  };
};
