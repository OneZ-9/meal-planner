import type { Metadata } from "next";
import type { ReactElement } from "react";

import { auth } from "@/auth";
import { AppNav } from "@/features/app-shell";
import { NotFoundPanel } from "@/features/shared";

export const metadata: Metadata = {
  title: "Page not found | MealPrep Pro",
};

// Global 404 — Next.js renders this for any unmatched route (or an explicit
// notFound() call) inside app/layout.tsx, so it never gets a nested layout's
// nav automatically. Checks the session itself to decide whether to show the
// authenticated app shell (signed-in user landed on a bad URL) or a bare
// centered card matching the Login screen's unauthenticated treatment.
const NotFound = async (): Promise<ReactElement> => {
  const session = await auth();

  const panel = (
    <NotFoundPanel
      actionHref={session?.user ? "/dashboard" : "/login"}
      actionLabel={session?.user ? "Back to Dashboard" : "Back to Login"}
      description="The page you're looking for doesn't exist or may have been moved."
      title="Page not found"
    />
  );

  if (session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav activePath="" />
        <main className="mx-auto flex w-[calc(100%-32px)] max-w-[1200px] items-center justify-center py-16 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)]">
          {panel}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {panel}
    </div>
  );
};

export default NotFound;
