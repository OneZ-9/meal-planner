import { Schema, model, models, Types, type Document } from "mongoose";

// Units a recipe ingredient row can be entered in. Matches
// .ai/Unit_Conversion_Algorithm_Spec.md's RecipeIngredientEntry.unit exactly,
// so the shopping-list module (US-7, not yet built) can consume this data
// without reshaping it. "whole" is for count ingredients (e.g. "2 eggs");
// the rest are the volume/weight units the conversion algorithm recognizes.
export type RecipeUnit =
  | "tsp"
  | "tbsp"
  | "cup"
  | "fl_oz"
  | "ml"
  | "l"
  | "oz"
  | "lb"
  | "g"
  | "kg"
  | "whole";

export const RECIPE_UNITS: readonly RecipeUnit[] = [
  "tsp",
  "tbsp",
  "cup",
  "fl_oz",
  "ml",
  "l",
  "oz",
  "lb",
  "g",
  "kg",
  "whole",
];

// One ingredient row on a recipe. References a canonical Ingredient by id
// rather than storing its name/unit family inline (see ARCHITECTURE.md
// "Recipe -> Ingredient Boundary") — quantity/unit are recorded as entered
// by the user, in the recipe's own unit, not normalized at write time.
export interface RecipeIngredientEntry {
  ingredientId: Types.ObjectId;
  quantity: number;
  unit: RecipeUnit;
}

// A user's recipe (US-2/US-3/US-4). Unlike ingredients, recipes have no
// global/seeded scope — every recipe is private to the user who created it
// (ARCHITECTURE.md "User Data Isolation"). The calendar assignment module
// (not yet built) will reference recipes by _id, never copy them (see
// "Recipe Edit Data Flow" in ARCHITECTURE.md) so edits stay live.
export interface RecipeDocument extends Document {
  name: string;
  servings: number;
  prepTimeMinutes: number | null;
  tags: string[];
  instructions: string;
  ingredients: RecipeIngredientEntry[];
  // A Vercel Blob URL (https://*.public.blob.vercel-storage.com/recipe-images/...),
  // never a local filesystem path — Vercel's serverless functions don't have
  // a persistent/shared disk, so the file itself lives in Blob storage; this
  // field is just a pointer to it. Null when no image has been uploaded, in
  // which case the UI shows DESIGN.md's empty-image placeholder.
  imageUrl: string | null;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<RecipeIngredientEntry>(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: RECIPE_UNITS },
  },
  { _id: false },
);

const recipeSchema = new Schema<RecipeDocument>(
  {
    name: { type: String, required: true, trim: true },
    servings: { type: Number, required: true, min: 1 },
    prepTimeMinutes: { type: Number, default: null, min: 0 },
    tags: { type: [String], default: [] },
    instructions: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: null },
    // A recipe cannot be saved with zero ingredients (US-2) — enforced here
    // as well as in lib/recipeValidation.ts, per ARCHITECTURE.md's layered
    // validation rule (UI / server / database each enforce independently).
    ingredients: {
      type: [recipeIngredientSchema],
      required: true,
      validate: {
        validator: (value: RecipeIngredientEntry[]) => value.length > 0,
        message: "A recipe must have at least one ingredient.",
      },
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

recipeSchema.index({ userId: 1, name: 1 });

export const RecipeModel =
  models.Recipe || model<RecipeDocument>("Recipe", recipeSchema);
