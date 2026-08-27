"use client";

import type { ReactElement } from "react";

import { useRecipe } from "../hooks/useRecipe";
import { RecipeForm } from "./recipe-form";

type RecipeEditLoaderProps = {
  id: string;
};

// Fetches the recipe being edited client-side (via useRecipe), then hands it
// to RecipeForm — kept separate from RecipeForm so "create" mode never pays
// for a loading state it doesn't need.
export const RecipeEditLoader = ({ id }: RecipeEditLoaderProps): ReactElement => {
  const { data: recipe, isLoading, isError, error } = useRecipe(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading recipe...</p>;
  }

  if (isError || !recipe) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "We couldn't load this recipe."}
      </p>
    );
  }

  return <RecipeForm mode="edit" recipe={recipe} />;
};
