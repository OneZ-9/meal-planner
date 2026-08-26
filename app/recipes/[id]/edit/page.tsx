import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RecipeFormScreen } from "@/features/recipes";

export const metadata: Metadata = {
  title: "Edit Recipe | MealPrep Pro",
  description: "Update an existing recipe.",
};

const EditRecipePage = async (
  props: PageProps<"/recipes/[id]/edit">,
): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  return <RecipeFormScreen id={id} mode="edit" />;
};

export default EditRecipePage;
