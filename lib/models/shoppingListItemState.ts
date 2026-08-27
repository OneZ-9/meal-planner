import { Schema, model, models, Types, type Document } from "mongoose";

// Persists only the checked/unchecked state of a shopping-list line (US-8).
// The shopping list itself is never stored — it's regenerated live from the
// Calendar + Recipe + Ingredient modules on every read (ARCHITECTURE.md
// "Core Shopping List Data Flow"), same "no snapshot" philosophy as Calendar
// -> Recipe. `itemKey` is the same `${ingredientId}:${resultUnit}` grouping
// key the generator produces (see lib/shoppingListGenerator.ts), so a
// checked state naturally goes stale/unreferenced (never errors) if the
// underlying recipes/assignments change enough to remove that line — same
// tolerance for dangling references already accepted elsewhere in this app
// (see KNOWN_ISSUES.md).
export interface ShoppingListItemStateDocument extends Document {
  userId: Types.ObjectId;
  // "YYYY-MM-DD" Monday of the week this checked state belongs to — same
  // date-key convention as CalendarEntryDocument.date (lib/dateWeek.ts).
  weekStart: string;
  itemKey: string;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shoppingListItemStateSchema = new Schema<ShoppingListItemStateDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekStart: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    itemKey: { type: String, required: true },
    checked: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

shoppingListItemStateSchema.index(
  { userId: 1, weekStart: 1, itemKey: 1 },
  { unique: true },
);

export const ShoppingListItemStateModel =
  models.ShoppingListItemState ||
  model<ShoppingListItemStateDocument>(
    "ShoppingListItemState",
    shoppingListItemStateSchema,
  );
