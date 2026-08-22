import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "MealPrep Pro",
  description: "Plan your meals, shop smarter.",
};

const HomePage = async (): Promise<never> => {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
};

export default HomePage;
