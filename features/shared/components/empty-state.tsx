import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

// Generic icon + message panel for "no results" states across the app —
// search-not-found (Recipes, Ingredients, Assign Recipe dialog), and other
// empty collections (Shopping List, Suggested for You). Kept in
// features/shared rather than a single feature folder since it has no
// feature-specific logic and is reused across Recipes/Ingredients/Calendar/
// Shopping List/Dashboard — see ARCHITECTURE.md's feature-folder convention.
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): ReactElement => (
  <div
    className={cn(
      "rounded-lg border border-border bg-card px-5 py-10 text-center",
      className,
    )}
  >
    <Icon className="mx-auto mb-3 size-8 text-muted-foreground" />
    {title && (
      <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
    )}
    <p className="text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
