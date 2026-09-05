import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

// Mirrors RecipeCard's layout (image, title, description lines, tags,
// footer) so the grid doesn't visibly reflow once real cards replace it.
export const RecipeCardSkeleton = (): ReactElement => (
  <div className="overflow-hidden rounded-[10px] border border-border bg-card">
    <Skeleton className="aspect-[1.65/1] w-full rounded-none" />
    <div className="space-y-2 px-4 py-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-1/2" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-5 w-14 rounded-sm" />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-10" />
    </div>
  </div>
);
