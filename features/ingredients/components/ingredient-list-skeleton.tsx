import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type IngredientListSkeletonProps = {
  rows?: number;
};

// Mirrors an ingredient row's layout (name + unit-family meta, trailing
// edit icon/scope badge) so the list doesn't collapse to a single line of
// text while the first page of results loads.
export const IngredientListSkeleton = ({
  rows = 6,
}: IngredientListSkeletonProps): ReactElement => (
  <div aria-hidden>
    {Array.from({ length: rows }, (_, index) => (
      <div
        className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 last:border-b-0"
        key={index}
      >
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="size-7 rounded-full" />
      </div>
    ))}
  </div>
);
