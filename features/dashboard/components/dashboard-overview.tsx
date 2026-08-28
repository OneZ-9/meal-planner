"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  CircleCheck,
  PlusCircle,
  Utensils,
} from "lucide-react";

import type { MealSlot } from "@/lib/mealSlot";
import { actions } from "../data/dashboard-data";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const formatMealSlotList = (mealSlots: MealSlot[]): string => {
  const labels = mealSlots.map((mealSlot) => mealSlotLabels[mealSlot]);
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} and ${labels[2]}`;
};

export const DashboardOverview = (): ReactElement => {
  const { summary, weekLabel, isLoading, hasError } = useDashboardSummary();
  const unavailableValue = isLoading ? "…" : "—";
  const todayHighlights = summary?.todayHighlights;
  const dinnerIsMissing = todayHighlights?.dinnerRecipeName === null;
  const missingMealSlots = todayHighlights?.missingMealSlots ?? [];
  const hasMissingMeals = missingMealSlots.length > 0;
  const allMealsSelected = Boolean(todayHighlights) && !hasMissingMeals;
  const missingMealsText = todayHighlights
    ? hasMissingMeals
      ? `${formatMealSlotList(missingMealSlots)} ${missingMealSlots.length === 1 ? "is" : "are"} not allocated yet`
      : "3 meals already selected"
    : unavailableValue;
  const metrics = [
    {
      value: summary?.mealsPlanned ?? unavailableValue,
      label: "Meals Planned",
      emphasized: true,
    },
    {
      value: summary?.recipesToTry ?? unavailableValue,
      label: "Recipes to Try",
      emphasized: false,
    },
    {
      value: summary?.itemsToBuy ?? unavailableValue,
      label: "Items to Buy",
      emphasized: false,
    },
    {
      value: summary ? `${summary.prepReadyPercent}%` : unavailableValue,
      label: "Prep Ready",
      emphasized: true,
    },
  ];

  return (
    <div>
      {hasError && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Some dashboard data could not be loaded. Refresh to try again.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section
          aria-labelledby="weekly-plan-heading"
          aria-busy={isLoading}
          className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_3px_rgba(11,28,48,0.04)]"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="weekly-plan-heading" className="text-base font-semibold">
              This Week&apos;s Plan
            </h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
              {weekLabel}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div
                className="rounded-md border border-border bg-secondary px-2 py-4 text-center"
                key={metric.label}
              >
                <dd
                  className={`text-xl font-semibold ${metric.emphasized ? "text-primary" : "text-foreground"}`}
                >
                  {metric.value}
                </dd>
                <dt className="mt-1 text-[11px] text-muted-foreground">
                  {metric.label}
                </dt>
              </div>
            ))}
          </dl>
          <div className="mt-7 border-t border-border pt-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s Highlights
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <Utensils className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">Dinner</p>
                  <p
                    className={`text-sm font-semibold ${dinnerIsMissing ? "text-destructive" : "text-foreground"}`}
                  >
                    {todayHighlights?.dinnerRecipeName ??
                      (todayHighlights
                        ? "not allocated yet"
                        : unavailableValue)}
                  </p>
                </div>
              </div>
              <div className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${hasMissingMeals ? "bg-destructive/10 text-destructive" : allMealsSelected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
                >
                  {hasMissingMeals ? (
                    <AlertTriangle className="size-4" />
                  ) : allMealsSelected ? (
                    <CircleCheck className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">Missing</p>
                  <p
                    className={`text-sm font-semibold ${hasMissingMeals ? "text-destructive" : allMealsSelected ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {missingMealsText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside aria-label="Dashboard actions" className="space-y-3">
          <Link
            className="flex h-14 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            href="/recipes/new"
          >
            <PlusCircle className="size-[18px]" /> Create New Recipe
          </Link>
          {actions.map(({ title, description, href, icon: Icon }) => (
            <Link
              className="group flex min-h-16 items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
              href={href}
              key={title}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted-foreground">
                  {description ??
                    (summary
                      ? `${summary.itemsToBuy} ${summary.itemsToBuy === 1 ? "item" : "items"} remaining`
                      : isLoading
                        ? "Loading remaining items…"
                        : "Items unavailable")}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
};
