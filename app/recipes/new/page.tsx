import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RecipeFormScreen } from "@/features/recipes";

export const metadata: Metadata = {
  title: "Create Recipe | MealPrep Pro",
  description: "Add a new recipe to your collection.",
};

const NewRecipePage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <RecipeFormScreen mode="create" />;
};

export default NewRecipePage;
