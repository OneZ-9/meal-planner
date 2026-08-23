"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IngredientConflictError, type IngredientDTO } from "@/lib/api/ingredients";
import { useIngredientSearch } from "../hooks/useIngredientSearch";
import { useCreateIngredient } from "../hooks/useCreateIngredient";
import { useUpdateIngredient } from "../hooks/useUpdateIngredient";
import { IngredientFormDialog } from "./ingredient-form-dialog";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; ingredient: IngredientDTO }
  | null;

// Client-side search/create/edit UI for the ingredients page. Kept separate
// from ingredients-screen.tsx (a Server Component) so this "use client"
// module's dependency graph never pulls @/auth (and therefore mongoose,
// which uses Node built-ins like `tls`) into the client bundle — see
// FIXES.md for the build error this split resolves.
export const IngredientsManager = (): ReactElement => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: ingredients, isLoading } = useIngredientSearch(debouncedQuery);
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();

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

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ingredients..."
          value={query}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Loading ingredients...
          </p>
        )}

        {!isLoading && (ingredients ?? []).length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            {debouncedQuery
              ? `No ingredients match "${debouncedQuery}".`
              : "No ingredients yet."}
          </p>
        )}

        {!isLoading &&
          (ingredients ?? []).map((ingredient) => (
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
      </div>

      <IngredientFormDialog
        errorMessage={errorMessage}
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
