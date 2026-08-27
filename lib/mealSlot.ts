// Meal slot type + value list, kept in its own module-free-of-Mongoose file.
// lib/models/calendarEntry.ts re-exports these for the schema enum; client
// components must import from here (or use `import type`) rather than from
// the model file directly — a runtime import of anything from a model file
// pulls in Mongoose (and Node built-ins like `tls`) into the client bundle.
// See FIXES.md "Module not found: Can't resolve 'tls'".
export type MealSlot = "breakfast" | "lunch" | "dinner";

export const MEAL_SLOTS: readonly MealSlot[] = ["breakfast", "lunch", "dinner"];
