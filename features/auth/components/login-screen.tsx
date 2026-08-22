import type { ReactElement } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LoginScreen = (): ReactElement => (
  <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10 sm:px-6">
    <section
      aria-labelledby="login-title"
      className="w-full max-w-[510px] rounded-xl border border-border bg-card px-7 py-10 shadow-[0_8px_24px_rgba(11,28,48,0.12)] sm:px-11 sm:py-11"
    >
      <div className="mb-9 flex flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-border bg-secondary text-primary">
          <Utensils aria-hidden="true" className="size-7" strokeWidth={2.3} />
        </div>
        <h1
          id="login-title"
          className="text-[32px] font-bold tracking-[-0.035em] text-foreground"
        >
          MealPrep Pro
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Plan your meals, shop smarter.
        </p>
      </div>

      <form action="/dashboard" className="space-y-5">
        <div className="space-y-2">
          <label
            className="block text-sm font-semibold text-foreground"
            htmlFor="email"
          >
            Email
          </label>
          <input
            autoComplete="email"
            className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label
              className="text-sm font-semibold text-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <Link
              className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="#"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </div>
        <Button
          className="mt-1 h-12 w-full text-sm font-semibold"
          size="lg"
          type="submit"
        >
          Sign In
        </Button>
      </form>

      <footer className="mt-7 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link className="hover:text-primary hover:underline" href="#">
          IT Support
        </Link>
        <span aria-hidden="true">•</span>
        <Link className="hover:text-primary hover:underline" href="#">
          Privacy Policy
        </Link>
      </footer>
    </section>
  </main>
);
