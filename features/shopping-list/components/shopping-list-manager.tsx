"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ShoppingListItemDTO } from "@/lib/api/shoppingList";
import {
  formatWeekRangeLabel,
  getWeekStart,
  shiftWeek,
  toDateKey,
} from "@/lib/dateWeek";
import { useShoppingList } from "../hooks/useShoppingList";
import { useUpdateShoppingListChecks } from "../hooks/useUpdateShoppingListChecks";

// Formats a shopping-list line's quantity for display. "whole" items show
// as a bare count (e.g. "3"), everything else as "<quantity> <unit>"
// (e.g. "265 g", "1.5 kg") — plain decimal display, no further rounding
// beyond what the generator already applied (DECISIONS.md "Shopping List
// generation (US-7/US-8)").
const formatQuantity = (item: ShoppingListItemDTO): string => {
  const rounded = Math.round(item.quantity * 100) / 100;
  return item.unit === "whole" ? `${rounded}` : `${rounded} ${item.unit}`;
};

// Client-side week navigation + checklist UI for the Shopping List screen
// (US-7/US-8). Kept separate from shopping-list-screen.tsx (a Server
// Component) so this "use client" module's dependency graph never pulls
// @/auth (and therefore mongoose) into the client bundle — same split as
// every other feature module, see FIXES.md.
export const ShoppingListManager = (): ReactElement => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekStartKey = toDateKey(weekStart);

  const { data, isLoading } = useShoppingList(weekStartKey);
  const updateChecks = useUpdateShoppingListChecks();

  const items = data?.items ?? [];
  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);

  const toggleItem = (item: ShoppingListItemDTO): void => {
    updateChecks.mutate({
      weekStart: weekStartKey,
      itemKeys: [item.itemKey],
      checked: !item.checked,
    });
  };

  const checkAll = (): void => {
    const uncheckedKeys = items.filter((item) => !item.checked).map((item) => item.itemKey);
    if (uncheckedKeys.length === 0) return;
    updateChecks.mutate({ weekStart: weekStartKey, itemKeys: uncheckedKeys, checked: true });
  };

  const clearChecked = (): void => {
    const checkedKeys = items.filter((item) => item.checked).map((item) => item.itemKey);
    if (checkedKeys.length === 0) return;
    updateChecks.mutate({ weekStart: weekStartKey, itemKeys: checkedKeys, checked: false });
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
            This Week&apos;s List
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatWeekRangeLabel(weekStart)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-label="Week navigation"
            className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5"
            role="group"
          >
            <button
              aria-label="Previous week"
              className="rounded p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setWeekStart((current) => shiftWeek(current, -1))}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              className={buttonVariants({ variant: "outline", className: "h-auto border-0 px-3 py-1 text-xs" })}
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Next week"
              className="rounded p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setWeekStart((current) => shiftWeek(current, 1))}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            className={buttonVariants({ variant: "outline", className: "text-xs" })}
            disabled={checkedCount === 0}
            onClick={clearChecked}
            type="button"
          >
            Clear Checked
          </button>
          <button
            className={buttonVariants({ className: "text-xs" })}
            disabled={checkedCount === totalCount}
            onClick={checkAll}
            type="button"
          >
            Check All
          </button>
        </div>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Loading your list...</p>}

      {!isLoading && totalCount === 0 && (
        <div className="rounded-lg border border-border bg-card px-5 py-10 text-center">
          <ShoppingCart className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No meals are assigned this week yet. Assign recipes on the Calendar to
            generate a shopping list.
          </p>
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(250px,0.95fr)]">
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5"
                key={item.itemKey}
              >
                <button
                  aria-checked={item.checked}
                  aria-label={item.checked ? `Mark ${item.ingredientName} as not bought` : `Mark ${item.ingredientName} as bought`}
                  className={`flex size-5 shrink-0 items-center justify-center rounded border transition ${
                    item.checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  }`}
                  onClick={() => toggleItem(item)}
                  role="checkbox"
                  type="button"
                >
                  {item.checked && <Check className="size-3.5" />}
                </button>
                <span
                  className={`flex-1 text-sm capitalize ${
                    item.checked ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {item.ingredientName}
                  {item.unmerged && (
                    <span className="ml-2 text-xs text-muted-foreground no-underline">
                      (not merged with other units)
                    </span>
                  )}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  {formatQuantity(item)}
                </span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm font-semibold">List Progress</p>
            <p className="mt-3 text-3xl font-bold">
              {checkedCount}/{totalCount}
            </p>
            <p className="text-xs text-primary-foreground/80">Items Checked</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
              <div
                className="h-full rounded-full bg-primary-foreground"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
