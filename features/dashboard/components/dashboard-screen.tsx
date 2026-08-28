import type { ReactElement } from "react";
import Link from "next/link";
import { AppNav } from "@/features/app-shell";
import { DashboardOverview } from "./dashboard-overview";
import { SuggestedRecipes } from "./suggested-recipes";

export const DashboardScreen = (): ReactElement => (
  <div className="min-h-screen bg-background">
    <AppNav activePath="/dashboard" />
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1200px] py-7 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] lg:py-9">
      <header className="mb-7">
        <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
          Welcome back, Chef.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s your meal plan overview for the week.
        </p>
      </header>

      <DashboardOverview />

      <section aria-labelledby="suggested-heading" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="suggested-heading" className="text-lg font-semibold">
            Suggested for You
          </h2>
          <Link
            className="text-xs font-semibold text-primary hover:underline"
            href="/recipes"
          >
            View All
          </Link>
        </div>
        <SuggestedRecipes />
      </section>
    </main>
  </div>
);
