import type { ReactElement } from "react";

import { AppNav } from "@/features/app-shell";
import { CalendarManager } from "./calendar-manager";

// Weekly Plan / Calendar screen (DESIGN.md section 28). Server Component
// shell — the interactive week navigation/assignment UI lives in the
// nested client CalendarManager, same split as features/recipes and
// features/ingredients (see FIXES.md).
export const CalendarScreen = (): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/calendar" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-7 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] lg:py-9">
      <CalendarManager />
    </main>
  </div>
);
