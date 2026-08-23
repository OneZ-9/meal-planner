import type { UnitFamily } from "@/lib/models/ingredient";

export type IngredientDTO = {
  id: string;
  name: string;
  unitFamily: UnitFamily;
  densityGPerMl: number | null;
  isCustom: boolean;
};

export type IngredientInput = {
  name: string;
  unitFamily: UnitFamily;
  densityGPerMl: number | null;
};

export type IngredientScope = "all" | "custom" | "global";

export type IngredientsPage = {
  items: IngredientDTO[];
  nextCursor: number | null;
};

export class IngredientConflictError extends Error {
  ingredient: IngredientDTO | null;

  constructor(message: string, ingredient: IngredientDTO | null) {
    super(message);
    this.name = "IngredientConflictError";
    this.ingredient = ingredient;
  }
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  return (body && typeof body.message === "string" && body.message) ||
    "Something went wrong. Please try again.";
};

const defaultSearchLimit = 20;

export const fetchIngredients = async (params: {
  query?: string;
  scope?: IngredientScope;
  cursor?: number;
  limit?: number;
}): Promise<IngredientsPage> => {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("q", params.query);
  if (params.scope && params.scope !== "all") searchParams.set("scope", params.scope);
  if (params.cursor) searchParams.set("cursor", String(params.cursor));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await fetch(`/api/ingredients?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

// Top-N typeahead results only (no pagination) — for the recipe-picker
// combobox, which narrows via search rather than scrolling. The full
// browsable/paginated list lives behind useInfiniteIngredients instead.
export const searchIngredients = async (
  query: string,
): Promise<IngredientDTO[]> => {
  const page = await fetchIngredients({ query, limit: defaultSearchLimit });
  return page.items;
};

export const createIngredient = async (
  input: IngredientInput,
): Promise<IngredientDTO> => {
  const response = await fetch("/api/ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    const body = await response.json().catch(() => null);
    throw new IngredientConflictError(
      (body && body.message) || "An ingredient with this name already exists.",
      (body && body.ingredient) || null,
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const updateIngredient = async (
  id: string,
  input: IngredientInput,
): Promise<IngredientDTO> => {
  const response = await fetch(`/api/ingredients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    const body = await response.json().catch(() => null);
    throw new IngredientConflictError(
      (body && body.message) || "An ingredient with this name already exists.",
      null,
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};
