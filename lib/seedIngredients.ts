import { IngredientModel, type UnitFamily } from "@/lib/models/ingredient";
import rawSeedIngredients from "@/data/ingredients-seed-data.js";

interface SeedIngredient {
  name: string;
  unitFamily: UnitFamily;
  densityGPerMl: number | null;
}

const seedIngredients = rawSeedIngredients as SeedIngredient[];

// Guarantees the global canonical ingredient list (userId: null) exists,
// seeding it from data/ingredients-seed-data.js on first run. Idempotent —
// upserts by name, safe to call on every server startup. Scoped to
// userId: null so it never touches per-user custom ingredients — see
// DECISIONS.md "hybrid ingredient list".
export const ensureIngredientsSeeded = async (): Promise<void> => {
  const existingCount = await IngredientModel.countDocuments({
    userId: null,
  });

  if (existingCount > 0) {
    console.log(
      `[ingredients] Seeded ingredient list already present (${existingCount} items).`,
    );
    return;
  }

  const now = new Date();
  const operations = seedIngredients.map((ingredient) => ({
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

  await IngredientModel.bulkWrite(operations);
  console.log(
    `[ingredients] No initial ingredients list found. Inserted seeded ingredient list (${seedIngredients.length} items).`,
  );
};
