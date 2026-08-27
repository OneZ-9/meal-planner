"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Clock, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// Imported directly from its hook file, not the features/recipes barrel —
// that barrel also re-exports RecipesScreen (a Server Component whose graph
// pulls in @/auth -> mongoose), which breaks the client bundle if pulled in
// here. See FIXES.md "Module not found: Can't resolve 'tls'".
import { useRecipes } from "@/features/recipes/hooks/useRecipes";

export type AssignRecipeTarget = {
  dateKey: string;
  dateLabel: string;
  mealSlot: "breakfast" | "lunch" | "dinner";
  mealSlotLabel: string;
};

type AssignRecipeDialogProps = {
  target: AssignRecipeTarget | null;
  onOpenChange: (open: boolean) => void;
  onSelectRecipe: (recipeId: string) => void;
};

// The recipe picker for a single (day, meal slot) cell (US-5). Assigning to
// an already-occupied slot is the same action as assigning to an empty one
// — the API replaces the existing entry — so this dialog doesn't need to
// know whether it's a first assignment or a replacement.
export const AssignRecipeDialog = ({
  target,
  onOpenChange,
  onSelectRecipe,
}: AssignRecipeDialogProps): ReactElement => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Clear the search whenever the dialog transitions from open to closed, so
  // reopening it for a different cell never shows a stale query. Adjusting
  // state during render (rather than in a useEffect) is the pattern React
  // recommends for this — see ingredient-form-dialog.tsx for the same
  // pattern used elsewhere in this codebase.
  const [wasOpen, setWasOpen] = useState(target !== null);
  const isOpen = target !== null;
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
    }
  }

  const { data: recipes, isLoading } = useRecipes(debouncedQuery);

  return (
    <Dialog onOpenChange={onOpenChange} open={target !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a recipe</DialogTitle>
          <DialogDescription>
            {target && `${target.mealSlotLabel} on ${target.dateLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipes..."
              value={query}
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-border">
            {isLoading && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Loading recipes...
              </p>
            )}

            {!isLoading && (recipes ?? []).length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No recipes found. Create one from the Recipes page first.
              </p>
            )}

            {!isLoading &&
              (recipes ?? []).map((recipe) => (
                <button
                  className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-secondary"
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe.id)}
                  type="button"
                >
                  <span className="truncate text-sm font-medium text-foreground">
                    {recipe.name}
                  </span>
                  {recipe.prepTimeMinutes != null && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {recipe.prepTimeMinutes}m
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
