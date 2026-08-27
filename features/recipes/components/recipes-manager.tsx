"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RecipeDTO } from "@/lib/api/recipes";
import { useRecipes } from "../hooks/useRecipes";
import { useDeleteRecipe } from "../hooks/useDeleteRecipe";
import { RecipeCard } from "./recipe-card";

const allRecipesFilter = "all";

// Client-side search/filter/delete UI for the Recipe Library. Kept separate
// from recipes-screen.tsx (a Server Component) so this "use client" module's
// dependency graph never pulls @/auth (and therefore mongoose) into the
// client bundle — same split as features/ingredients, see FIXES.md.
export const RecipesManager = (): ReactElement => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTag, setActiveTag] = useState(allRecipesFilter);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeDTO | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: recipes, isLoading } = useRecipes(debouncedQuery);
  const deleteRecipe = useDeleteRecipe();

  // Sidebar filters are derived from the tags actually in use across the
  // user's recipes, rather than DESIGN.md's mockup categories (Favorites,
  // Meal Kits, ...) — those aren't backed by any feature in
  // MEAL_PLANNER_REQUIREMENTS.md, so a fixed list would be decorative only.
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    (recipes ?? []).forEach((recipe) => recipe.tags.forEach((tag) => tagSet.add(tag)));
    return [...tagSet].sort();
  }, [recipes]);

  const filteredRecipes = (recipes ?? []).filter(
    (recipe) => activeTag === allRecipesFilter || recipe.tags.includes(activeTag),
  );

  const clearSearch = (): void => {
    setQuery("");
    setDebouncedQuery("");
  };

  const confirmDelete = (): void => {
    if (!recipeToDelete) return;
    deleteRecipe.mutate(recipeToDelete.id, {
      onSuccess: () => setRecipeToDelete(null),
    });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside
        aria-label="Recipe filters"
        className="shrink-0 rounded-lg border border-border bg-secondary p-3 lg:w-44"
      >
        <p className="px-2 text-sm font-semibold text-foreground">Filters</p>
        <p className="px-2 pb-2 text-xs text-muted-foreground">Organize your view</p>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          <button
            aria-pressed={activeTag === allRecipesFilter}
            className={`rounded-md px-2 py-1.5 text-left text-sm transition ${
              activeTag === allRecipesFilter
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTag(allRecipesFilter)}
            type="button"
          >
            All Recipes
          </button>
          {availableTags.map((tag) => (
            <button
              aria-pressed={activeTag === tag}
              className={`rounded-md px-2 py-1.5 text-left text-sm transition ${
                activeTag === tag
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              key={tag}
              onClick={() => setActiveTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
              Recipe Library
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and organize your meal prep collection.
            </p>
          </div>
          <Link className={buttonVariants({})} href="/recipes/new">
            <Plus className="size-[18px]" /> Create Recipe
          </Link>
        </header>

        <div className="relative mb-5 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 pr-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recipes..."
            value={query}
          />
          {query.length > 0 && (
            <button
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={clearSearch}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading recipes...</p>
        )}

        {!isLoading && filteredRecipes.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {debouncedQuery
                ? `No recipes match "${debouncedQuery}".`
                : activeTag !== allRecipesFilter
                  ? `No recipes tagged "${activeTag}".`
                  : "No recipes yet. Create your first recipe to get started."}
            </p>
            {!debouncedQuery && activeTag === allRecipesFilter && (
              <Link
                className={buttonVariants({ className: "mt-4" })}
                href="/recipes/new"
              >
                <Plus className="size-[18px]" /> Create Recipe
              </Link>
            )}
          </div>
        )}

        {!isLoading && filteredRecipes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                onDelete={() => setRecipeToDelete(recipe)}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setRecipeToDelete(null);
        }}
        open={recipeToDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {recipeToDelete &&
                `"${recipeToDelete.name}" will be permanently deleted. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteRecipe.isPending}
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
