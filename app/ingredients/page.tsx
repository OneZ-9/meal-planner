import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { IngredientsScreen } from "@/features/ingredients";

export const metadata: Metadata = {
  title: "Ingredients | MealPrep Pro",
  description: "Search and manage your custom ingredients.",
};

const IngredientsPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <IngredientsScreen />;
};

export default IngredientsPage;
