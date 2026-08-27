import type { MealSlot } from "@/lib/mealSlot";

export type CalendarEntryDTO = {
  id: string;
  date: string;
  mealSlot: MealSlot;
  recipe: {
    id: string;
    name: string;
    prepTimeMinutes: number | null;
  };
};

export type CalendarWeek = {
  weekStart: string;
  weekEnd: string;
  items: CalendarEntryDTO[];
};

export type CalendarAssignmentInput = {
  date: string;
  mealSlot: MealSlot;
  recipeId: string;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  return (
    (body && typeof body.message === "string" && body.message) ||
    "Something went wrong. Please try again."
  );
};

export const fetchCalendarWeek = async (weekStart: string): Promise<CalendarWeek> => {
  const response = await fetch(`/api/calendar?weekStart=${weekStart}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const assignCalendarRecipe = async (
  input: CalendarAssignmentInput,
): Promise<CalendarEntryDTO> => {
  const response = await fetch("/api/calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
};

export const removeCalendarAssignment = async (id: string): Promise<void> => {
  const response = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};
