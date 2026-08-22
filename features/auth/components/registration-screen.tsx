"use client";

import { type FormEvent, type ReactElement, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { AuthInput } from "./auth-input";
import { AuthMessage } from "./auth-message";
import { AuthShell } from "./auth-shell";

type RegistrationResponse = { message?: string };

export const RegistrationScreen = (): ReactElement => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    if (password !== String(formData.get("confirmPassword") ?? "")) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password,
        }),
      });
      const responseBody = (await response.json()) as RegistrationResponse;

      if (!response.ok) {
        setErrorMessage(
          responseBody.message ?? "Could not create your account.",
        );
        return;
      }

      const signInResult = await signIn("credentials", {
        email: formData.get("email"),
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("We could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Create your account and start planning."
      title="Join MealPrep Pro"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage && <AuthMessage message={errorMessage} />}
        <AuthInput
          autoComplete="name"
          disabled={isSubmitting}
          id="name"
          label="Name"
          name="name"
          placeholder="Enter your name"
          required
          type="text"
        />
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
        <AuthInput
          autoComplete="new-password"
          disabled={isSubmitting}
          id="password"
          label="Password"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
        <AuthInput
          autoComplete="new-password"
          disabled={isSubmitting}
          id="confirmPassword"
          label="Confirm password"
          minLength={8}
          name="confirmPassword"
          placeholder="Enter your password again"
          required
          type="password"
        />
        <Button
          className="mt-2 h-12 w-full text-sm font-semibold"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-semibold text-primary hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};
