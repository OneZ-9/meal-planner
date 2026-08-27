"use client";

import type { ReactElement } from "react";
import { Clock, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecipeDetails } from "../hooks/useRecipeDetails";

type RecipeDetailsDialogProps = {
  recipeId: string | null;
  onOpenChange: (open: boolean) => void;
};

// Read-only recipe view opened by clicking a meal chip in the weekly grid.
// The Calendar module reads recipe data to display it but never owns/edits
// it here (ARCHITECTURE.md "Calendar -> Recipe Boundary") — editing still
// happens on the Recipes page.
export const RecipeDetailsDialog = ({
  recipeId,
  onOpenChange,
}: RecipeDetailsDialogProps): ReactElement => {
  const { data: recipe, isLoading } = useRecipeDetails(recipeId);

  return (
    <Dialog onOpenChange={onOpenChange} open={recipeId !== null}>
      <DialogContent className="sm:max-w-md">
        {isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading recipe...
          </p>
        )}

        {!isLoading && recipe && (
          <>
            <DialogHeader>
              <DialogTitle>{recipe.name}</DialogTitle>
              <DialogDescription>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {recipe.servings} servings
                  </span>
                  {recipe.prepTimeMinutes != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {recipe.prepTimeMinutes}m
                    </span>
                  )}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2">
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recipe.tags.map((tag) => (
                    <span
                      className="rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                  Ingredients
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.ingredientId}>
                      {ingredient.quantity} {ingredient.unit}{" "}
                      <span className="capitalize">{ingredient.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {recipe.instructions && (
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                    Instructions
                  </h3>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {recipe.instructions}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
