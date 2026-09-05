import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the two-column list + "List Progress" card layout (DESIGN.md
// Section 30) so the page doesn't collapse to a single line of text while
// the week's list generates.
export const ShoppingListSkeleton = (): ReactElement => (
  <div
    aria-hidden
    className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(250px,0.95fr)]"
  >
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <li
          className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5"
          key={index}
        >
          <Skeleton className="size-5 shrink-0 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>

    <div className="rounded-xl bg-primary/10 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
    </div>
  </div>
);
