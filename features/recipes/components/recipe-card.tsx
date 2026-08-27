import type { ReactElement } from "react";
import Link from "next/link";
import { Clock, ImageIcon, Pencil, Trash2 } from "lucide-react";

import type { RecipeDTO } from "@/lib/api/recipes";

type RecipeCardProps = {
  recipe: RecipeDTO;
  onDelete: () => void;
};

// Preview text built from the recipe's own ingredient names (DESIGN.md
// Section 22's card mockup shows an ingredient-derived description) —
// there's no separate free-text description field on the Recipe model,
// since ARCHITECTURE.md's Recipe fields are name/servings/ingredients only.
const buildIngredientPreview = (recipe: RecipeDTO): string => {
  const names = recipe.ingredients.map((ingredient) => ingredient.name);
  const preview = names.slice(0, 4).join(", ");
  return names.length > 4 ? `${preview}...` : preview;
};

const formatAddedDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const RecipeCard = ({ recipe, onDelete }: RecipeCardProps): ReactElement => (
  <article className="overflow-hidden rounded-[10px] border border-border bg-card">
    <div className="relative flex aspect-[1.65/1] items-center justify-center bg-secondary">
      <ImageIcon className="size-10 text-muted-foreground/60" />
      {recipe.prepTimeMinutes != null && (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
          <Clock className="size-3 text-primary" /> {recipe.prepTimeMinutes}m
        </span>
      )}
    </div>

    <div className="space-y-2 px-4 py-3">
      <h3 className="truncate text-base font-semibold text-foreground">
        {recipe.name}
      </h3>
      {recipe.ingredients.length > 0 && (
        <p className="line-clamp-2 text-[13px] leading-[1.4] text-muted-foreground">
          {buildIngredientPreview(recipe)}
        </p>
      )}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              className="rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
      <span className="text-xs text-muted-foreground">
        Added {formatAddedDate(recipe.createdAt)}
      </span>
      <div className="flex items-center gap-1">
        <Link
          aria-label={`Edit ${recipe.name}`}
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={`/recipes/${recipe.id}/edit`}
        >
          <Pencil className="size-4" />
        </Link>
        <button
          aria-label={`Delete ${recipe.name}`}
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  </article>
);
