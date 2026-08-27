import type { ReactElement } from "react";

import { AppNav } from "@/features/app-shell";
import { RecipesManager } from "./recipes-manager";

// Recipe Library screen (DESIGN.md Section 18). Server Component shell — the
// interactive search/filter/delete UI lives in the nested client
// RecipesManager, same split as features/ingredients (see FIXES.md).
export const RecipesScreen = (): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/recipes" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-7 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] lg:py-9">
      <RecipesManager />
    </main>
  </div>
);
