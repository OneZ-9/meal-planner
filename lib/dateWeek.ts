import { addDays, addWeeks, format, startOfWeek } from "date-fns";

// The weekly calendar (US-5/US-9) always shows Monday–Sunday, matching
// DESIGN.md section 28's Mon...Sun grid. Every week boundary in the app
// (server validation, client navigation) must use this same constant so a
// week never gets computed two different ways.
export const WEEK_STARTS_ON = 1; // Monday

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Calendar days are identified by a plain "YYYY-MM-DD" key, not a Date/
// timestamp — a calendar day has no time-of-day or timezone, and comparing
// Date objects across timezones is exactly the kind of bug that produces an
// off-by-one-day week. All calendar reads/writes key on this string.
export const toDateKey = (date: Date): string => format(date, "yyyy-MM-dd");

export const isValidDateKey = (value: string): boolean => {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

// Parses a "YYYY-MM-DD" key as a local calendar date (midnight local time),
// never via `new Date(string)`, which parses as UTC and can shift the date
// by a day depending on the reader's timezone.
export const fromDateKey = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getWeekStart = (date: Date): Date =>
  startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });

export const getWeekDates = (weekStart: Date): Date[] =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

export const shiftWeek = (weekStart: Date, deltaWeeks: number): Date =>
  addWeeks(weekStart, deltaWeeks);

// e.g. "Oct 23 - Oct 29, 2023" (DESIGN.md section 28 header subtitle).
export const formatWeekRangeLabel = (weekStart: Date): string => {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = format(weekStart, sameMonth ? "MMM d" : "MMM d");
  const endLabel = format(weekEnd, "MMM d, yyyy");
  return `${startLabel} - ${endLabel}`;
};
