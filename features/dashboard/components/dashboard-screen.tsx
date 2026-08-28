import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import dashboardReference from "@/docs/design-reference/dashboard.png";
import { AppNav } from "@/features/app-shell";
import { suggestions } from "../data/dashboard-data";
import { DashboardOverview } from "./dashboard-overview";

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
