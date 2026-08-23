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

const defaultLimit = 20;
const maxLimit = 100;

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Ingredient module owns search — see ARCHITECTURE.md "Search boundary".
// `scope` narrows to just the global seeded set ("global"), just the
// user's own ("custom"), or both (default "all") — the "hybrid ingredient
// list" decision in DECISIONS.md. Cursor-paginated (offset-based cursor;
// see DECISIONS.md "Ingredient list pagination") so the ingredients page
// can infinite-scroll through the full list instead of a flat cap.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim() ?? "";
  const scope = searchParams.get("scope") ?? "all";
  const cursor = Math.max(0, parsePositiveInt(searchParams.get("cursor"), 0));
  const limit = Math.min(
    maxLimit,
    parsePositiveInt(searchParams.get("limit"), defaultLimit),
  );

  await connectDB();
  const scopeFilter =
    scope === "custom"
      ? { userId: session.user.id }
      : scope === "global"
        ? { userId: null }
        : { $or: [{ userId: null }, { userId: session.user.id }] };

  const filter: Record<string, unknown> = { ...scopeFilter };
  if (query.length > 0) {
    filter.name = { $regex: query, $options: "i" };
  }

  // Fetch one extra document to know whether another page exists, without
  // a separate count query.
  const documents = await IngredientModel.find(filter)
    .sort({ name: 1, _id: 1 })
    .skip(cursor)
    .limit(limit + 1);

  const hasMore = documents.length > limit;
  const items = documents.slice(0, limit).map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    unitFamily: ingredient.unitFamily,
    densityGPerMl: ingredient.densityGPerMl,
    isCustom: ingredient.userId !== null,
  }));

  return NextResponse.json({
    items,
    nextCursor: hasMore ? cursor + limit : null,
  });
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
