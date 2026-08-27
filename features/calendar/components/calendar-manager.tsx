"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { CalendarEntryDTO } from "@/lib/api/calendar";
import {
  formatWeekRangeLabel,
  getWeekDates,
  getWeekStart,
  shiftWeek,
  toDateKey,
} from "@/lib/dateWeek";
import type { MealSlot } from "@/lib/mealSlot";
import { useAssignRecipe } from "../hooks/useAssignRecipe";
import { useRemoveAssignment } from "../hooks/useRemoveAssignment";
import { useWeekCalendar } from "../hooks/useWeekCalendar";
import { AssignRecipeDialog, type AssignRecipeTarget } from "./assign-recipe-dialog";
import { CalendarGrid, cellKey } from "./calendar-grid";
import { RecipeDetailsDialog } from "./recipe-details-dialog";

const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

// Client-side week navigation + assignment UI for the Calendar screen
// (US-5/US-9). Kept separate from calendar-screen.tsx (a Server Component)
// so this "use client" module's dependency graph never pulls @/auth (and
// therefore mongoose) into the client bundle — same split as
// features/recipes and features/ingredients, see FIXES.md.
export const CalendarManager = (): ReactElement => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [assignTarget, setAssignTarget] = useState<AssignRecipeTarget | null>(null);
  const [viewingRecipeId, setViewingRecipeId] = useState<string | null>(null);

  const weekStartKey = toDateKey(weekStart);
  const { data, isLoading } = useWeekCalendar(weekStartKey);
  const assignRecipe = useAssignRecipe();
  const removeAssignment = useRemoveAssignment();

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const entriesByCell = useMemo(() => {
    const map = new Map<string, CalendarEntryDTO>();
    (data?.items ?? []).forEach((entry) => {
      map.set(cellKey(entry.date, entry.mealSlot), entry);
    });
    return map;
  }, [data]);

  const openAssignDialog = (
    dateKey: string,
    dateLabel: string,
    mealSlot: MealSlot,
  ): void => {
    setAssignTarget({ dateKey, dateLabel, mealSlot, mealSlotLabel: mealSlotLabels[mealSlot] });
  };

  const handleSelectRecipe = (recipeId: string): void => {
    if (!assignTarget) return;
    assignRecipe.mutate(
      { date: assignTarget.dateKey, mealSlot: assignTarget.mealSlot, recipeId },
      { onSuccess: () => setAssignTarget(null) },
    );
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
            Weekly Plan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatWeekRangeLabel(weekStart)}
          </p>
        </div>
        <div
          aria-label="Week navigation"
          className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5"
          role="group"
        >
          <button
            aria-label="Previous week"
            className="rounded p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setWeekStart((current) => shiftWeek(current, -1))}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            className={buttonVariants({ variant: "outline", className: "h-auto border-0 px-3 py-1 text-xs" })}
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            type="button"
          >
            Today
          </button>
          <button
            aria-label="Next week"
            className="rounded p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setWeekStart((current) => shiftWeek(current, 1))}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your week...</p>
      ) : (
        <CalendarGrid
          entriesByCell={entriesByCell}
          onCellClick={openAssignDialog}
          onChangeRecipe={(entry, dateLabel) =>
            setAssignTarget({
              dateKey: entry.date,
              dateLabel,
              mealSlot: entry.mealSlot,
              mealSlotLabel: mealSlotLabels[entry.mealSlot],
            })
          }
          onRemove={(entry) => removeAssignment.mutate(entry.id)}
          onViewRecipe={(entry) => setViewingRecipeId(entry.recipe.id)}
          weekDates={weekDates}
        />
      )}

      <AssignRecipeDialog
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        onSelectRecipe={handleSelectRecipe}
        target={assignTarget}
      />

      <RecipeDetailsDialog
        onOpenChange={(open) => {
          if (!open) setViewingRecipeId(null);
        }}
        recipeId={viewingRecipeId}
      />
    </div>
  );
};
