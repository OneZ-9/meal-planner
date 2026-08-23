import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Heart,
  PlusCircle,
  Utensils,
} from "lucide-react";
import dashboardReference from "@/docs/design-reference/dashboard.png";
import { AppNav } from "@/features/app-shell";
import { actions, metrics, suggestions } from "../data/dashboard-data";

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

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section
          aria-labelledby="weekly-plan-heading"
          className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_3px_rgba(11,28,48,0.04)]"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="weekly-plan-heading" className="text-base font-semibold">
              This Week&apos;s Plan
            </h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
              Nov 12 - Nov 18
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div
                className="rounded-md border border-border bg-secondary px-2 py-4 text-center"
                key={metric.label}
              >
                <dd
                  className={`text-xl font-semibold ${"emphasized" in metric && metric.emphasized ? "text-primary" : "text-foreground"}`}
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
                  <p className="text-sm font-semibold">Lemon Herb Salmon</p>
                </div>
              </div>
              <div className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">Missing</p>
                  <p className="text-sm font-semibold">Fresh Dill (1 bunch)</p>
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
                  {description}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </aside>
      </div>

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <article
              className="group relative aspect-[1.48/1] overflow-hidden rounded-lg border border-border bg-card [container-type:inline-size]"
              key={suggestion.name}
            >
              <Image
                alt={suggestion.name}
                className={`absolute top-[-169.3cqw] h-auto w-[333.6cqw] max-w-none transition-transform duration-300 group-hover:scale-[1.01] ${suggestion.imageClass}`}
                placeholder="blur"
                priority
                src={dashboardReference}
              />
              <button
                aria-label={`Add ${suggestion.name} to favorites`}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground backdrop-blur-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
              >
                <Heart className="size-[18px]" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  </div>
);
