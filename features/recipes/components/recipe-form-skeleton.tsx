import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the Create/Edit Recipe form's three sub-sections (DESIGN.md
// Section 29) so RecipeEditLoader's loading state doesn't collapse the page
// to a single line of text while the recipe fetches.
export const RecipeFormSkeleton = (): ReactElement => (
  <div className="rounded-lg border border-border bg-card p-6" aria-hidden>
    <div className="space-y-3 border-b border-border pb-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
    <div className="space-y-3 border-b border-border py-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-3 pt-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full" />
    </div>
  </div>
);
