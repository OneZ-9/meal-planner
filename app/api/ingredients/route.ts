import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { validateIngredientInput } from "@/lib/ingredientValidation";
import { IngredientModel } from "@/lib/models/ingredient";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

// Ingredient module owns search — see ARCHITECTURE.md "Search boundary".
// Scoped to the global seeded set plus this user's own custom ingredients
// (the "hybrid ingredient list" decision in DECISIONS.md).
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  await connectDB();
  const filter: Record<string, unknown> = {
    $or: [{ userId: null }, { userId: session.user.id }],
  };
  if (query.length > 0) {
    filter.name = { $regex: query, $options: "i" };
  }

  const ingredients = await IngredientModel.find(filter).sort({ name: 1 }).limit(50);

  return NextResponse.json(
    ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unitFamily: ingredient.unitFamily,
      densityGPerMl: ingredient.densityGPerMl,
      isCustom: ingredient.userId !== null,
    })),
  );
};

// Creates a custom ingredient owned by the current user (US-3). Checks for
// an exact-match (case-insensitive) name in the global set or the user's
// own set first, so a race with the unique index surfaces as a friendly
// "already exists" response rather than a raw duplicate-key error — see
// DECISIONS.md "near-duplicate ingredient check".
export const POST = async (request: Request): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateIngredientInput(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { name, unitFamily, densityGPerMl } = validation.values;

  await connectDB();
  const existing = await IngredientModel.findOne({
    name,
    $or: [{ userId: null }, { userId: session.user.id }],
  }).collation({ locale: "en", strength: 2 });

  if (existing) {
    return NextResponse.json(
      {
        message: "An ingredient with this name already exists.",
        ingredient: {
          id: existing.id,
          name: existing.name,
          unitFamily: existing.unitFamily,
          densityGPerMl: existing.densityGPerMl,
          isCustom: existing.userId !== null,
        },
      },
      { status: 409 },
    );
  }

  try {
    const created = await IngredientModel.create({
      name,
      unitFamily,
      densityGPerMl,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        unitFamily: created.unitFamily,
        densityGPerMl: created.densityGPerMl,
        isCustom: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "An ingredient with this name already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "We could not create this ingredient. Please try again." },
      { status: 500 },
    );
  }
};
