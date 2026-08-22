import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegistrationScreen } from "@/features/auth";

export const metadata: Metadata = {
  title: "Create Account | MealPrep Pro",
  description: "Create your MealPrep Pro account.",
};

const RegisterPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <RegistrationScreen />;
};

export default RegisterPage;
