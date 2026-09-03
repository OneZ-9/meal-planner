import type { ReactElement } from "react";
import Link from "next/link";

import { signOut } from "@/auth";
import { MobileNavControl } from "./mobile-nav-control";
import { SignOutControl } from "./sign-out-control";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Ingredients", href: "/ingredients" },
  { label: "Recipes", href: "/recipes" },
  { label: "Calendar", href: "/calendar" },
  { label: "Shopping List", href: "/shopping-list" },
];

type AppNavProps = {
  activePath: string;
};

export const AppNav = ({ activePath }: AppNavProps): ReactElement => {
  const handleSignOut = async (): Promise<void> => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
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
        <MobileNavControl activePath={activePath} navigation={navigation} />
        <SignOutControl signOutAction={handleSignOut} />
      </div>
    </header>
  );
};
