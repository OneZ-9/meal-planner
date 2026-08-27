"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Clock, MoreVertical } from "lucide-react";

import type { CalendarEntryDTO } from "@/lib/api/calendar";

type MealChipProps = {
  entry: CalendarEntryDTO;
  onView: () => void;
  onChangeRecipe: () => void;
  onRemove: () => void;
};

// A planned meal in the weekly grid (DESIGN.md section 28 "Meal chip").
// Clicking the chip's name/prep-time area opens a read-only recipe details
// view; the separate kebab menu offers the two Calendar-module actions
// US-5 defines: replace the recipe in this slot, or remove the assignment
// entirely.
export const MealChip = ({
  entry,
  onView,
  onChangeRecipe,
  onRemove,
}: MealChipProps): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className="relative rounded-md bg-primary/10 p-2" ref={menuRef}>
      <div className="flex items-start justify-between gap-1">
        <button
          aria-label={`View ${entry.recipe.name}`}
          className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onView}
          type="button"
        >
          <p className="truncate text-xs font-semibold text-foreground">
            {entry.recipe.name}
          </p>
          {entry.recipe.prepTimeMinutes != null && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" /> {entry.recipe.prepTimeMinutes}m
            </p>
          )}
        </button>
        <button
          aria-label={`Options for ${entry.recipe.name}`}
          className="shrink-0 rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <MoreVertical className="size-3.5" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 w-32 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md">
          <button
            className="block w-full px-3 py-1.5 text-left text-xs hover:bg-secondary"
            onClick={() => {
              setIsMenuOpen(false);
              onChangeRecipe();
            }}
            type="button"
          >
            Change
          </button>
          <button
            className="block w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
            onClick={() => {
              setIsMenuOpen(false);
              onRemove();
            }}
            type="button"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
