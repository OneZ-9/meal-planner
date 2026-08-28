import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ShoppingListScreen } from "@/features/shopping-list";

export const metadata: Metadata = {
  title: "Shopping List | MealPrep Pro",
  description: "Your generated shopping list for the selected week.",
};

const ShoppingListPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <ShoppingListScreen />;
};

export default ShoppingListPage;
