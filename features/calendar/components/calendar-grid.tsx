"use client";

import type { ReactElement } from "react";

import { toDateKey } from "@/lib/dateWeek";
import type { CalendarEntryDTO } from "@/lib/api/calendar";
import { MEAL_SLOTS, type MealSlot } from "@/lib/mealSlot";
import { MealChip } from "./meal-chip";

const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const cellKey = (dateKey: string, mealSlot: MealSlot): string =>
  `${dateKey}|${mealSlot}`;

type CalendarGridProps = {
  weekDates: Date[];
  entriesByCell: Map<string, CalendarEntryDTO>;
  onCellClick: (dateKey: string, dateLabel: string, mealSlot: MealSlot) => void;
  onViewRecipe: (entry: CalendarEntryDTO) => void;
  onChangeRecipe: (entry: CalendarEntryDTO, dateLabel: string) => void;
  onRemove: (entry: CalendarEntryDTO) => void;
};

// The weekly grid (DESIGN.md section 28): meal-slot rows x day columns.
// Empty cells are clickable "add" targets; occupied cells render a
// MealChip. Assigning to an occupied cell replaces the recipe (US-5), so
// clicking a filled cell's empty space re-opens the same assign dialog.
export const CalendarGrid = ({
  weekDates,
  entriesByCell,
  onCellClick,
  onViewRecipe,
  onChangeRecipe,
  onRemove,
}: CalendarGridProps): ReactElement => (
  <div className="overflow-x-auto rounded-lg border border-border bg-card">
    <div className="grid min-w-[720px] grid-cols-[96px_repeat(7,1fr)]">
      <div className="border-r border-b border-border bg-secondary" />
      {weekDates.map((date) => (
        <div
          className="border-r border-b border-border bg-secondary px-2 py-2 text-center last:border-r-0"
          key={toDateKey(date)}
        >
          <p className="text-xs font-semibold text-foreground">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </p>
          <p className="text-xs text-muted-foreground">{date.getDate()}</p>
        </div>
      ))}

      {MEAL_SLOTS.map((mealSlot) => (
        <div className="contents" key={mealSlot}>
          <div className="flex items-center border-r border-b border-border px-3 py-3 text-xs text-muted-foreground last:border-b-0">
            {mealSlotLabels[mealSlot]}
          </div>
          {weekDates.map((date) => {
            const dateKey = toDateKey(date);
            const dateLabel = date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            });
            const entry = entriesByCell.get(cellKey(dateKey, mealSlot));

            return (
              <div
                className="min-h-[68px] border-r border-b border-border p-1.5 last:border-r-0"
                key={dateKey}
              >
                {entry ? (
                  <MealChip
                    entry={entry}
                    onChangeRecipe={() => onChangeRecipe(entry, dateLabel)}
                    onRemove={() => onRemove(entry)}
                    onView={() => onViewRecipe(entry)}
                  />
                ) : (
                  <button
                    aria-label={`Assign a recipe to ${mealSlotLabels[mealSlot]} on ${dateLabel}`}
                    className="flex h-full w-full items-center justify-center rounded-md text-[11px] text-muted-foreground/50 transition hover:bg-secondary hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onCellClick(dateKey, dateLabel, mealSlot)}
                    type="button"
                  >
                    Assign recipe
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);
