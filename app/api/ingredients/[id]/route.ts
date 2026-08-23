import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { validateIngredientInput } from "@/lib/ingredientValidation";
import { IngredientModel } from "@/lib/models/ingredient";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

// Updates a custom ingredient (US-4-adjacent CRUD groundwork for the
// Ingredient module). Global/seeded ingredients (userId: null) and other
// users' ingredients are not editable here — see ARCHITECTURE.md's
// "Accepted risk: no correction path for bad seeded ingredient data" and
// DECISIONS.md. The client must show the live-reference edit warning
// (editing affects any recipe that already references this ingredient)
// before calling this route; delete is intentionally not implemented yet.
export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Ingredient not found." }, { status: 404 });
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const validation = validateIngredientInput(requestBody);
  if (!validation.success) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { name, unitFamily, densityGPerMl } = validation.values;

  await connectDB();
  const ingredient = await IngredientModel.findById(id);
  if (!ingredient) {
    return NextResponse.json({ message: "Ingredient not found." }, { status: 404 });
  }

  if (
    ingredient.userId === null ||
    ingredient.userId.toString() !== session.user.id
  ) {
    return NextResponse.json(
      { message: "You can only edit ingredients you created." },
      { status: 403 },
    );
  }

  const collidingIngredient = await IngredientModel.findOne({
    _id: { $ne: ingredient._id },
    name,
    $or: [{ userId: null }, { userId: session.user.id }],
  }).collation({ locale: "en", strength: 2 });

  if (collidingIngredient) {
    return NextResponse.json(
      { message: "An ingredient with this name already exists." },
      { status: 409 },
    );
  }

  try {
    ingredient.name = name;
    ingredient.unitFamily = unitFamily;
    ingredient.densityGPerMl = densityGPerMl;
    await ingredient.save();

    return NextResponse.json({
      id: ingredient.id,
      name: ingredient.name,
      unitFamily: ingredient.unitFamily,
      densityGPerMl: ingredient.densityGPerMl,
      isCustom: true,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "An ingredient with this name already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "We could not update this ingredient. Please try again." },
      { status: 500 },
    );
  }
};
