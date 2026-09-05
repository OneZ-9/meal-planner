import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { MEAL_SLOTS } from "@/lib/mealSlot";

const weekdayPlaceholders = Array.from({ length: 7 }, (_, index) => index);

// Mirrors CalendarGrid's 7-day x meal-slot structure (header row + one row
// per MEAL_SLOTS) so the week doesn't collapse to a single line of text
// while it loads.
export const CalendarGridSkeleton = (): ReactElement => (
  <div
    aria-hidden
    className="overflow-x-auto rounded-lg border border-border bg-card"
  >
    <div className="grid min-w-[720px] grid-cols-[96px_repeat(7,1fr)]">
      <div className="border-r border-b border-border bg-secondary" />
      {weekdayPlaceholders.map((index) => (
        <div
          className="space-y-1.5 border-r border-b border-border bg-secondary px-2 py-2 text-center last:border-r-0"
          key={index}
        >
          <Skeleton className="mx-auto h-3 w-8" />
          <Skeleton className="mx-auto h-3 w-4" />
        </div>
      ))}

      {MEAL_SLOTS.map((mealSlot) => (
        <div className="contents" key={mealSlot}>
          <div className="flex items-center border-r border-b border-border px-3 py-3 last:border-b-0">
            <Skeleton className="h-3 w-12" />
          </div>
          {weekdayPlaceholders.map((index) => (
            <div
              className="min-h-[68px] border-r border-b border-border p-1.5 last:border-r-0"
              key={index}
            >
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
