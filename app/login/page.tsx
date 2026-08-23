import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In | MealPrep Pro",
  description: "Sign in to plan your meals and organize your shopping.",
};

const LoginPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
};

export default LoginPage;
