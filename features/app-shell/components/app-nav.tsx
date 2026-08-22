import type { ReactElement } from "react";
import Link from "next/link";
import { CircleUserRound, Menu } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Recipes", href: "/recipes" },
  { label: "Calendar", href: "/calendar" },
  { label: "Shopping List", href: "/shopping-list" },
];

type AppNavProps = {
  activePath: string;
};

export const AppNav = ({ activePath }: AppNavProps): ReactElement => (
  <header className="border-b border-border bg-card">
    <div className="mx-auto flex h-14 w-[calc(100%-32px)] max-w-[1200px] items-center gap-5 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)]">
      <Link
        className="shrink-0 text-lg font-bold tracking-[-0.025em] text-primary"
        href="/dashboard"
      >
        MealPrep Pro
      </Link>
      <nav
        aria-label="Main navigation"
        className="hidden h-full items-center gap-5 sm:flex"
      >
        {navigation.map((item) => {
          const isActive = item.href === activePath;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-full items-center text-xs transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "font-semibold text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground"}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        aria-label="Open navigation menu"
        className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
        type="button"
      >
        <Menu className="size-5" />
      </button>
      <button
        aria-label="Open account menu"
        className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
      >
        <CircleUserRound className="size-[18px]" />
      </button>
    </div>
  </header>
);
