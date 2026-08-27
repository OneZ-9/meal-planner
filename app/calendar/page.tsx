import type { Metadata } from "next";
import type { ReactElement } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CalendarScreen } from "@/features/calendar";

export const metadata: Metadata = {
  title: "Calendar | MealPrep Pro",
  description: "Assign recipes to days and meal slots for the week.",
};

const CalendarPage = async (): Promise<ReactElement> => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <CalendarScreen />;
};

export default CalendarPage;
