import { upload } from "@vercel/blob/client";

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
  imageUrl: string | null;
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
  imageUrl: string | null;
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

export const fetchRecipeCalendarUsage = async (
  id: string,
): Promise<{ count: number }> => {
  const response = await fetch(`/api/recipes/${id}/calendar-usage`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

// Uploads a recipe image straight from the browser to Vercel Blob storage —
// the file never passes through our own server (see
// app/api/recipes/image-upload/route.ts's "client upload" comment for why:
// Vercel serverless functions cap request bodies at ~4.5MB, which a
// full-resolution photo can exceed). Returns the resulting public URL to
// include as `imageUrl` in the recipe create/update payload.
export const uploadRecipeImage = async (file: File): Promise<string> => {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const pathname = `recipe-images/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/recipes/image-upload",
    contentType: file.type,
  });

  return blob.url;
};
