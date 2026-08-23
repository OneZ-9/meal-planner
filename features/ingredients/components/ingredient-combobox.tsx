"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useIngredientSearch } from "../hooks/useIngredientSearch";
import { useCreateIngredient } from "../hooks/useCreateIngredient";
import { IngredientFormDialog } from "./ingredient-form-dialog";
import { IngredientConflictError, type IngredientDTO } from "@/lib/api/ingredients";

type IngredientComboboxProps = {
  onSelect: (ingredient: IngredientDTO) => void;
  placeholder?: string;
};

// Typeahead search over the canonical ingredient list (global + the
// current user's own), with an inline "create new ingredient" flow when
// nothing matches (US-3). Reusable wherever a recipe ingredient row needs
// to pick a canonical ingredient — see ARCHITECTURE.md's "Search boundary"
// (Recipe UI never implements ingredient search itself).
export const IngredientCombobox = ({
  onSelect,
  placeholder = "Search or type ingredient...",
}: IngredientComboboxProps): ReactElement => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [conflict, setConflict] = useState<IngredientDTO | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results, isFetching } = useIngredientSearch(debouncedQuery);
  const createIngredient = useCreateIngredient();

  const hasExactMatch = (results ?? []).some(
    (ingredient) => ingredient.name.toLowerCase() === debouncedQuery.toLowerCase(),
  );

  const handleSelect = (ingredient: IngredientDTO): void => {
    onSelect(ingredient);
    setQuery("");
    setDebouncedQuery("");
  };

  const clearSearch = (): void => {
    setQuery("");
    setDebouncedQuery("");
  };

  const handleCreateSubmit = (values: {
    name: string;
    unitFamily: IngredientDTO["unitFamily"];
    densityGPerMl: number | null;
  }): void => {
    createIngredient.mutate(values, {
      onSuccess: (created) => {
        setIsCreateOpen(false);
        setConflict(null);
        handleSelect(created);
      },
      onError: (error) => {
        if (error instanceof IngredientConflictError) {
          setConflict(error.ingredient);
        }
      },
    });
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8 pr-8"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
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

      {debouncedQuery.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Searching...
            </div>
          )}

          {!isFetching &&
            (results ?? []).map((ingredient) => (
              <button
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                key={ingredient.id}
                onClick={() => handleSelect(ingredient)}
                type="button"
              >
                <span className="capitalize">{ingredient.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ingredient.unitFamily}
                </span>
              </button>
            ))}

          {!isFetching && !hasExactMatch && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-secondary"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              <Plus className="size-3.5" /> Create &quot;
              <span className="capitalize">{debouncedQuery}</span>&quot;
            </button>
          )}
        </div>
      )}

      <IngredientFormDialog
        errorMessage={conflict ? "An ingredient with this name already exists." : null}
        onClearError={() => setConflict(null)}
        initialValues={{
          name: debouncedQuery,
          unitFamily: "weight",
          densityGPerMl: null,
        }}
        isSubmitting={createIngredient.isPending}
        mode="create"
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setConflict(null);
          }
        }}
        onSubmit={handleCreateSubmit}
        open={isCreateOpen}
      />
    </div>
  );
};
