import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { IngredientModel } from "@/lib/models/ingredient";
import { RecipeModel } from "@/lib/models/recipe";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { del } from "@vercel/blob";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/recipe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/models/recipe")>();
  return {
    ...actual,
    RecipeModel: { findOne: vi.fn(), findOneAndDelete: vi.fn() },
  };
});
vi.mock("@/lib/models/ingredient", () => ({
  IngredientModel: { find: vi.fn() },
}));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { deleteMany: vi.fn() },
}));
vi.mock("@vercel/blob", () => ({ del: vi.fn() }));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedFindOne = vi.mocked(RecipeModel.findOne);
const mockedFindOneAndDelete = vi.mocked(RecipeModel.findOneAndDelete);
const mockedIngredientFind = vi.mocked(IngredientModel.find);
const mockedCalendarDeleteMany = vi.mocked(CalendarEntryModel.deleteMany);
const mockedDel = vi.mocked(del);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildRequest = (body?: unknown): Request =>
  new Request("http://localhost/api/recipes/some-id", {
    method: body === undefined ? "GET" : "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const buildContext = (id: string): { params: Promise<{ id: string }> } => ({
  params: Promise.resolve({ id }),
});

const mockIngredientFindChain = (docs: unknown[]): void => {
  mockedIngredientFind.mockReturnValue({
    select: vi.fn().mockResolvedValue(docs),
  } as never);
};

const validId = new Types.ObjectId().toString();
const ingredientId = new Types.ObjectId().toString();

const buildRecipeDoc = (overrides: Record<string, unknown> = {}) => ({
  id: validId,
  name: "Chicken Bowl",
  servings: 2,
  prepTimeMinutes: 20,
  tags: ["Dinner"],
  instructions: "Cook it.",
  ingredients: [{ ingredientId, quantity: 2, unit: "tbsp" }],
  imageUrl: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const validPatchBody = {
  name: "Chicken Bowl",
  servings: 3,
  ingredients: [{ ingredientId, quantity: 1, unit: "cup" }],
};

describe("GET /api/recipes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(buildRequest(), buildContext(validId));

    expect(response.status).toBe(401);
  });

  it("404s on a non-ObjectId id", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await GET(buildRequest(), buildContext("not-an-id"));

    expect(response.status).toBe(404);
  });

  it("404s when the recipe doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOne.mockResolvedValue(null);

    const response = await GET(buildRequest(), buildContext(validId));

    expect(mockedFindOne).toHaveBeenCalledWith({ _id: validId, userId: "user-1" });
    expect(response.status).toBe(404);
  });

  it("returns the recipe with resolved ingredient names", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOne.mockResolvedValue(buildRecipeDoc() as never);
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);

    const response = await GET(buildRequest(), buildContext(validId));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ingredients[0]).toMatchObject({ name: "Sugar", unitFamily: "weight" });
  });
});

describe("PATCH /api/recipes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await PATCH(buildRequest(validPatchBody), buildContext(validId));

    expect(response.status).toBe(401);
  });

  it("404s on a non-ObjectId id", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await PATCH(buildRequest(validPatchBody), buildContext("bad-id"));

    expect(response.status).toBe(404);
  });

  it("rejects invalid input", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await PATCH(
      buildRequest({ name: "", servings: 2, ingredients: [] }),
      buildContext(validId),
    );

    expect(response.status).toBe(400);
  });

  it("404s when the recipe doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOne.mockResolvedValue(null);

    const response = await PATCH(buildRequest(validPatchBody), buildContext(validId));

    expect(response.status).toBe(404);
  });

  it("rejects a recipe referencing an ingredient the user can't see", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOne.mockResolvedValue(buildRecipeDoc() as never);
    mockIngredientFindChain([]);

    const response = await PATCH(buildRequest(validPatchBody), buildContext(validId));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("One or more ingredients could not be found.");
  });

  it("updates an owned recipe", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const recipe = buildRecipeDoc();
    mockedFindOne.mockResolvedValue(recipe as never);
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);

    const response = await PATCH(buildRequest(validPatchBody), buildContext(validId));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(recipe.save).toHaveBeenCalled();
    expect(recipe.servings).toBe(3);
    expect(body.servings).toBe(3);
  });

  it("deletes the old image from Blob storage when it's replaced", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const recipe = buildRecipeDoc({ imageUrl: "https://blob.example/old.jpg" });
    mockedFindOne.mockResolvedValue(recipe as never);
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);

    await PATCH(
      buildRequest({ ...validPatchBody, imageUrl: "https://blob.example/new.jpg" }),
      buildContext(validId),
    );

    expect(mockedDel).toHaveBeenCalledWith("https://blob.example/old.jpg");
  });

  it("does not touch Blob storage when the image is unchanged", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const recipe = buildRecipeDoc({ imageUrl: "https://blob.example/same.jpg" });
    mockedFindOne.mockResolvedValue(recipe as never);
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);

    await PATCH(
      buildRequest({ ...validPatchBody, imageUrl: "https://blob.example/same.jpg" }),
      buildContext(validId),
    );

    expect(mockedDel).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/recipes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await DELETE(buildRequest(), buildContext(validId));

    expect(response.status).toBe(401);
  });

  it("404s on a non-ObjectId id", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await DELETE(buildRequest(), buildContext("bad-id"));

    expect(response.status).toBe(404);
  });

  it("404s when the recipe doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(null);

    const response = await DELETE(buildRequest(), buildContext(validId));

    expect(mockedFindOneAndDelete).toHaveBeenCalledWith({
      _id: validId,
      userId: "user-1",
    });
    expect(response.status).toBe(404);
  });

  it("deletes an owned recipe and cascades to its calendar assignments", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(buildRecipeDoc() as never);
    mockedCalendarDeleteMany.mockResolvedValue({ acknowledged: true, deletedCount: 2 });

    const response = await DELETE(buildRequest(), buildContext(validId));

    expect(response.status).toBe(204);
    expect(mockedCalendarDeleteMany).toHaveBeenCalledWith({
      userId: "user-1",
      recipeId: validId,
    });
  });

  it("does not touch calendar assignments when the recipe isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(null);

    await DELETE(buildRequest(), buildContext(validId));

    expect(mockedCalendarDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes the recipe's image from Blob storage when it had one", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(
      buildRecipeDoc({ imageUrl: "https://blob.example/old.jpg" }) as never,
    );

    await DELETE(buildRequest(), buildContext(validId));

    expect(mockedDel).toHaveBeenCalledWith("https://blob.example/old.jpg");
  });

  it("does not call Blob storage when the deleted recipe had no image", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(buildRecipeDoc() as never);

    await DELETE(buildRequest(), buildContext(validId));

    expect(mockedDel).not.toHaveBeenCalled();
  });
});
