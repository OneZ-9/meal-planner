import type { ReactElement } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meal Planner + Shopping List Generator",
  description: "Plan your meals and generate shopping lists with ease",
};

const HomePage = (): ReactElement => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Meal Planner</h1>
    </main>
  );
};

export default HomePage;
