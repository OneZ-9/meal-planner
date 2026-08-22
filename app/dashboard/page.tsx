import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DashboardScreen } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | MealPrep Pro",
  description: "Your weekly meal plan at a glance.",
};

const DashboardPage = (): ReactElement => <DashboardScreen />;

export default DashboardPage;
