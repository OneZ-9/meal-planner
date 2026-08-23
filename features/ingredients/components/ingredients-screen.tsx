import type { ReactElement } from "react";

import { AppNav } from "@/features/app-shell";
import { IngredientsManager } from "./ingredients-manager";

// Standalone ingredient management page — not part of DESIGN.md's reference
// screens (those only show ingredient search/create embedded inside the
// not-yet-built Create Recipe screen). Added ahead of the Recipe module so
// custom ingredients (US-3) are directly usable now — see DECISIONS.md.
export const IngredientsScreen = (): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/ingredients" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-7 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] lg:py-9">
      <IngredientsManager />
    </main>
  </div>
);
