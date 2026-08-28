import { Schema, model, models, Types, type Document } from "mongoose";

export type UnitFamily = "weight" | "volume" | "count";

// A canonical ingredient — either global/seeded or owned by one user (see
// US-2/US-3 in MEAL_PLANNER_REQUIREMENTS.md and the "hybrid ingredient list"
// decision in DECISIONS.md). Recipes reference these by _id rather than
// storing ingredient data inline, so quantities can be normalized and merged
// across recipes when generating a shopping list.
export interface IngredientDocument extends Document {
  name: string;
  unitFamily: UnitFamily;
  // Grams per millilitre, used only to convert a recipe entry made in the
  // *other* unit family into this ingredient's base unit. Null when
  // cross-family conversion isn't expected to be needed (count items, and
  // weight items always entered directly in grams).
  densityGPerMl: number | null;
  // null = global/seeded ingredient, visible to every user. Set = a custom
  // ingredient private to the user who created it. Typeahead search must
  // query both scopes together: `{ $or: [{ userId: null }, { userId: currentUserId }] }`.
  userId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IngredientDocument>(
  {
    name: { type: String, required: true, trim: true },
    unitFamily: {
      type: String,
      required: true,
      enum: ["weight", "volume", "count"],
    },
    densityGPerMl: { type: Number, default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// Exact-match duplicate safeguard, scoped per owner rather than global: the
// seeded set (userId: null) and each user's custom ingredients each enforce
// their own name uniqueness, so two different users — or a user and the
// global set — can independently use the same ingredient name. A flat
// unique-by-name index would incorrectly block that (see DECISIONS.md).
ingredientSchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

export const IngredientModel =
  models.Ingredient ||
  model<IngredientDocument>("Ingredient", ingredientSchema);
