"use client";

import { type FormEvent, type ReactElement, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { AuthInput } from "./auth-input";
import { AuthMessage } from "./auth-message";
import { AuthShell } from "./auth-shell";

export const LoginScreen = (): ReactElement => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("Email or password is incorrect.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Plan your meals, shop smarter."
      title="MealPrep Pro"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage && <AuthMessage message={errorMessage} />}
        <AuthInput
          autoComplete="email"
          disabled={isSubmitting}
          id="email"
          label="Email"
          name="email"
          placeholder="Enter your email"
          required
          type="email"
        />
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
            className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </div>
        <Button
          disabled={isSubmitting}
          className="mt-1 h-12 w-full text-sm font-semibold"
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to MealPrep Pro?{" "}
        <Link
          className="font-semibold text-primary hover:underline"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};
