"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { useFrequentRecipes } from "@/features/calendar/hooks/useFrequentRecipes";

// "Suggested for You" (DESIGN.md sections 16/17), wired to the user's most-
// frequently-assigned recipes across their whole calendar history — see
// DECISIONS.md "Suggested for You: wired to live frequent-recipe data" for
// why this replaced the original static/decorative mockup (no favorites
// feature exists to base suggestions on instead). Each card links to the
// recipe's edit page, the only recipe-detail view outside the calendar.
export const SuggestedRecipes = (): ReactElement | null => {
  const { data: recipes, isLoading } = useFrequentRecipes();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading suggestions...</p>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Assign a few recipes to your calendar and your most-used ones will
        show up here.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Link
          className="group relative flex aspect-[1.48/1] flex-col justify-end overflow-hidden rounded-lg border border-border bg-card"
          href={`/recipes/${recipe.id}/edit`}
          key={recipe.id}
        >
          {recipe.imageUrl ? (
            // Vercel Blob's hostname is dynamic per project — see
            // DECISIONS.md "Recipe image upload (Vercel Blob)" for why this
            // is a plain <img> rather than next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              src={recipe.imageUrl}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <ImageIcon className="size-10 text-muted-foreground/60" />
            </div>
          )}
          <div className="relative bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
            <p className="truncate text-sm font-semibold text-white">
              {recipe.name}
            </p>
            <p className="text-[11px] text-white/80">
              Planned {recipe.count} {recipe.count === 1 ? "time" : "times"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};
