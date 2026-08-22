import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In | MealPrep Pro",
  description: "Sign in to plan your meals and organize your shopping.",
};

const LoginPage = (): ReactElement => <LoginScreen />;

export default LoginPage;
