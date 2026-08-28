import type { ReactElement } from "react";

import { AppNav } from "@/features/app-shell";
import { RecipeEditLoader } from "./recipe-edit-loader";
import { RecipeForm } from "./recipe-form";

type RecipeFormScreenProps = { mode: "create" } | { mode: "edit"; id: string };

// Create/Edit Recipe screen (DESIGN.md Section 29). Server Component shell,
// same split as RecipesScreen/IngredientsScreen (see FIXES.md) — the actual
// form is a nested "use client" component.
export const RecipeFormScreen = (props: RecipeFormScreenProps): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/recipes" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[860px] py-7 sm:w-[calc(100%-48px)] lg:py-9">
      {props.mode === "create" ? (
        <RecipeForm mode="create" />
      ) : (
        <RecipeEditLoader id={props.id} />
      )}
    </main>
  </div>
);
