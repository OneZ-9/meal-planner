"use client";

import type { ReactElement } from "react";

import { RecipeNotFoundError } from "@/lib/api/recipes";
import { NotFoundPanel } from "@/features/shared";
import { useRecipe } from "../hooks/useRecipe";
import { RecipeForm } from "./recipe-form";
import { RecipeFormSkeleton } from "./recipe-form-skeleton";

type RecipeEditLoaderProps = {
  id: string;
};

// Fetches the recipe being edited client-side (via useRecipe), then hands it
// to RecipeForm — kept separate from RecipeForm so "create" mode never pays
// for a loading state it doesn't need. Recipe existence/ownership is only
// knowable at fetch time (a client-side call, not the route itself), so a
// deleted/foreign recipe renders the shared NotFoundPanel inline rather than
// triggering the framework's route-level app/not-found.tsx.
export const RecipeEditLoader = ({ id }: RecipeEditLoaderProps): ReactElement => {
  const { data: recipe, isLoading, isError, error } = useRecipe(id);

  if (isLoading) {
    return <RecipeFormSkeleton />;
  }

  if (error instanceof RecipeNotFoundError) {
    return (
      <NotFoundPanel
        actionHref="/recipes"
        actionLabel="Back to Recipe Library"
        description="This recipe doesn't exist or may have been deleted."
        title="Recipe not found"
      />
    );
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
