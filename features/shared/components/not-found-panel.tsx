import type { LucideIcon } from "lucide-react";
import { Compass } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { buttonVariants } from "@/components/ui/button";

type NotFoundPanelProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  icon?: LucideIcon;
};

// Shared "this doesn't exist" panel — used both for the route-level 404
// (app/not-found.tsx) and for a resource that 404s after the route itself
// resolved (e.g. editing a deleted/foreign recipe, see
// features/recipes/components/recipe-edit-loader.tsx). Kept in
// features/shared since it isn't owned by any one feature.
export const NotFoundPanel = ({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = Compass,
}: NotFoundPanelProps): ReactElement => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-12 text-center shadow-[0_1px_3px_rgba(11,28,48,0.04)]">
    <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
      <Icon className="size-6" />
    </span>
    <div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
    <Link className={buttonVariants({})} href={actionHref}>
      {actionLabel}
    </Link>
  </div>
);
