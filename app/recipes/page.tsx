import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RecipesScreen } from "@/features/recipes";

export const metadata: Metadata = {
  title: "Recipes | MealPrep Pro",
  description: "Browse, search, and manage your recipe collection.",
};

const RecipesPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <RecipesScreen />;
};

export default RecipesPage;
