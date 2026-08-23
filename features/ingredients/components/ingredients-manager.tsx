"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IngredientConflictError,
  type IngredientDTO,
  type IngredientScope,
} from "@/lib/api/ingredients";
import { useInfiniteIngredients } from "../hooks/useInfiniteIngredients";
import { useCreateIngredient } from "../hooks/useCreateIngredient";
import { useUpdateIngredient } from "../hooks/useUpdateIngredient";
import { IngredientFormDialog } from "./ingredient-form-dialog";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; ingredient: IngredientDTO }
  | null;

const scopeFilters: { value: IngredientScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "custom", label: "My Ingredients" },
  { value: "global", label: "Global" },
];

// Client-side search/create/edit UI for the ingredients page. Kept separate
// from ingredients-screen.tsx (a Server Component) so this "use client"
// module's dependency graph never pulls @/auth (and therefore mongoose,
// which uses Node built-ins like `tls`) into the client bundle — see
// FIXES.md for the build error this split resolves.
export const IngredientsManager = (): ReactElement => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [scope, setScope] = useState<IngredientScope>("all");
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteIngredients(debouncedQuery, scope);
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();

  const ingredients = data?.pages.flatMap((page) => page.items) ?? [];

  // Infinite scroll: load the next page once the sentinel below the list
  // enters the viewport.
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearSearch = (): void => {
    setQuery("");
    setDebouncedQuery("");
  };

  const closeDialog = (): void => {
    setDialogState(null);
    setErrorMessage(null);
  };

  const handleSubmit = (values: {
    name: string;
    unitFamily: IngredientDTO["unitFamily"];
    densityGPerMl: number | null;
  }): void => {
    setErrorMessage(null);

    if (dialogState?.mode === "create") {
      createIngredient.mutate(values, {
        onSuccess: () => closeDialog(),
        onError: (error) => {
          setErrorMessage(
            error instanceof IngredientConflictError
              ? error.message
              : "We could not create this ingredient. Please try again.",
          );
        },
      });
      return;
    }

    if (dialogState?.mode === "edit") {
      updateIngredient.mutate(
        { id: dialogState.ingredient.id, input: values },
        {
          onSuccess: () => closeDialog(),
          onError: (error) => {
            setErrorMessage(
              error instanceof IngredientConflictError
                ? error.message
                : "We could not update this ingredient. Please try again.",
            );
          },
        },
      );
    }
  };

  const isSubmitting = createIngredient.isPending || updateIngredient.isPending;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
            Ingredients
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your custom ingredients. Global ingredients can&apos;t be
            edited here.
          </p>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-[18px]" /> Add Ingredient
        </Button>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 pr-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ingredients..."
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

        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Filter ingredients by source"
        >
          {scopeFilters.map((filter) => (
            <button
              aria-pressed={scope === filter.value}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                scope === filter.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
              key={filter.value}
              onClick={() => setScope(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Loading ingredients...
          </p>
        )}

        {!isLoading && ingredients.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            {debouncedQuery
              ? `No ingredients match "${debouncedQuery}".`
              : "No ingredients yet."}
          </p>
        )}

        {!isLoading &&
          ingredients.map((ingredient) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 last:border-b-0"
              key={ingredient.id}
            >
              <div>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {ingredient.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ingredient.unitFamily}
                  {ingredient.densityGPerMl != null &&
                    ` · ${ingredient.densityGPerMl} g/ml`}
                </p>
              </div>
              {ingredient.isCustom ? (
                <button
                  aria-label={`Edit ${ingredient.name}`}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setDialogState({ mode: "edit", ingredient })}
                  type="button"
                >
                  <Pencil className="size-4" />
                </button>
              ) : (
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                  Global
                </span>
              )}
            </div>
          ))}

        {!isLoading && ingredients.length > 0 && (
          <div className="px-5 py-4" ref={loadMoreRef}>
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading more...
              </div>
            )}
            {!hasNextPage && (
              <p className="text-center text-xs text-muted-foreground">
                End of the list.
              </p>
            )}
          </div>
        )}
      </div>

      <IngredientFormDialog
        errorMessage={errorMessage}
        onClearError={() => setErrorMessage(null)}
        initialValues={
          dialogState?.mode === "edit"
            ? {
                name: dialogState.ingredient.name,
                unitFamily: dialogState.ingredient.unitFamily,
                densityGPerMl: dialogState.ingredient.densityGPerMl,
              }
            : undefined
        }
        isSubmitting={isSubmitting}
        mode={dialogState?.mode ?? "create"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSubmit={handleSubmit}
        open={dialogState !== null}
      />
    </>
  );
};
