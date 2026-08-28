// Seeds the canonical `ingredients` collection from data/ingredients-seed-data.js.
// Idempotent: upserts by name, safe to re-run.
//
// Usage: node --env-file=.env.local scripts/seed-ingredients.mjs

import mongoose from "mongoose";
import ingredients from "../data/ingredients-seed-data.js";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing required environment variable: MONGODB_URI");
}

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unitFamily: {
      type: String,
      required: true,
      enum: ["weight", "volume", "count"],
    },
    densityGPerMl: { type: Number, default: null },
    // null = global/seeded ingredient, visible to every user (see
    // DECISIONS.md "hybrid ingredient list"). This script only ever seeds
    // global entries.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// Scoped per owner, not global — see lib/models/ingredient.ts for why.
ingredientSchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

async function seedIngredients() {
  await mongoose.connect(uri);

  try {
    // Ensures the unique/collation index is built before the upserts run.
    await Ingredient.init();

    const now = new Date();
    const operations = ingredients.map((ingredient) => ({
      updateOne: {
        filter: { name: ingredient.name, userId: null },
        update: {
          $set: {
            unitFamily: ingredient.unitFamily,
            densityGPerMl: ingredient.densityGPerMl,
            updatedAt: now,
          },
          $setOnInsert: { userId: null, createdAt: now },
        },
        upsert: true,
      },
    }));

    const result = await Ingredient.bulkWrite(operations);
    console.log(
      `Seeded ${ingredients.length} ingredients: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedIngredients().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
