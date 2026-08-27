import type { ReactElement } from "react";

import { AppNav } from "@/features/app-shell";
import { ShoppingListManager } from "./shopping-list-manager";

// Shopping List screen (DESIGN.md section 30). Server Component shell — the
// interactive week navigation/checklist UI lives in the nested client
// ShoppingListManager, same split as features/recipes, features/ingredients,
// and features/calendar (see FIXES.md).
export const ShoppingListScreen = (): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/shopping-list" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-7 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] lg:py-9">
      <ShoppingListManager />
    </main>
  </div>
);
