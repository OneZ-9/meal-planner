import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardScreen } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | MealPrep Pro",
  description: "Your weekly meal plan at a glance.",
};

const DashboardPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardScreen />;
};

export default DashboardPage;
