import type { UnitFamily } from "@/lib/models/ingredient";
import type { RecipeUnit } from "@/lib/models/recipe";

export type RecipeIngredientDTO = {
  ingredientId: string;
  name: string;
  unitFamily: UnitFamily;
  quantity: number;
  unit: RecipeUnit;
};

export type RecipeDTO = {
  id: string;
  name: string;
  servings: number;
  prepTimeMinutes: number | null;
  tags: string[];
  instructions: string;
  ingredients: RecipeIngredientDTO[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredientInput = {
  ingredientId: string;
  quantity: number;
  unit: RecipeUnit;
};

export type RecipeInput = {
  name: string;
  servings: number;
  prepTimeMinutes: number | null;
  tags: string[];
  instructions: string;
  ingredients: RecipeIngredientInput[];
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  return (
    (body && typeof body.message === "string" && body.message) ||
    "Something went wrong. Please try again."
  );
};

export const fetchRecipes = async (query?: string): Promise<RecipeDTO[]> => {
  const searchParams = new URLSearchParams();
  if (query) searchParams.set("q", query);

  const response = await fetch(`/api/recipes?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const body: { items: RecipeDTO[] } = await response.json();
  return body.items;
};

export const fetchRecipe = async (id: string): Promise<RecipeDTO> => {
  const response = await fetch(`/api/recipes/${id}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const createRecipe = async (input: RecipeInput): Promise<RecipeDTO> => {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const updateRecipe = async (
  id: string,
  input: RecipeInput,
): Promise<RecipeDTO> => {
  const response = await fetch(`/api/recipes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const deleteRecipe = async (id: string): Promise<void> => {
  const response = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};
