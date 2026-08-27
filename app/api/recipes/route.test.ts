import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { IngredientModel } from "@/lib/models/ingredient";
import { RecipeModel } from "@/lib/models/recipe";
import { GET, POST } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/recipe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/models/recipe")>();
  return {
    ...actual,
    RecipeModel: { find: vi.fn(), create: vi.fn() },
  };
});
vi.mock("@/lib/models/ingredient", () => ({
  IngredientModel: { find: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedRecipeFind = vi.mocked(RecipeModel.find);
const mockedRecipeCreate = vi.mocked(RecipeModel.create);
const mockedIngredientFind = vi.mocked(IngredientModel.find);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildGetRequest = (params: Record<string, string> = {}): NextRequest =>
  ({ nextUrl: { searchParams: new URLSearchParams(params) } }) as unknown as NextRequest;

const buildPostRequest = (body: unknown): Request =>
  new Request("http://localhost/api/recipes", {
    method: "POST",
    body: JSON.stringify(body),
  });

const ingredientId = "507f1f77bcf86cd799439011";

const buildRecipeDoc = (overrides: Record<string, unknown> = {}) => ({
  id: "recipe-1",
  name: "Chicken Bowl",
  servings: 2,
  prepTimeMinutes: 20,
  tags: ["Dinner"],
  instructions: "Cook it.",
  ingredients: [{ ingredientId, quantity: 2, unit: "tbsp" }],
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

const mockIngredientFindChain = (docs: unknown[]): void => {
  mockedIngredientFind.mockReturnValue({
    select: vi.fn().mockResolvedValue(docs),
  } as never);
};

const validPostBody = {
  name: "Chicken Bowl",
  servings: 2,
  prepTimeMinutes: 20,
  tags: ["Dinner"],
  instructions: "Cook it.",
  ingredients: [{ ingredientId, quantity: 2, unit: "tbsp" }],
};

describe("GET /api/recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(buildGetRequest());

    expect(response.status).toBe(401);
  });

  it("scopes the list to the current user and includes resolved ingredient names", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const sort = vi.fn().mockResolvedValue([buildRecipeDoc()]);
    mockedRecipeFind.mockReturnValue({ sort } as never);
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);

    const response = await GET(buildGetRequest());
    const body = await response.json();

    expect(mockedRecipeFind).toHaveBeenCalledWith({ userId: "user-1" });
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: "recipe-1",
      name: "Chicken Bowl",
      ingredients: [
        { ingredientId, name: "Sugar", unitFamily: "weight", quantity: 2, unit: "tbsp" },
      ],
    });
  });

  it("filters by name when a search query is given", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const sort = vi.fn().mockResolvedValue([]);
    mockedRecipeFind.mockReturnValue({ sort } as never);

    await GET(buildGetRequest({ q: "chicken" }));

    expect(mockedRecipeFind).toHaveBeenCalledWith({
      userId: "user-1",
      name: { $regex: "chicken", $options: "i" },
    });
  });
});

describe("POST /api/recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(buildPostRequest(validPostBody));

    expect(response.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await POST(buildPostRequest({ name: "", servings: 2, ingredients: [] }));

    expect(response.status).toBe(400);
  });

  it("rejects a recipe referencing an ingredient the user can't see", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockIngredientFindChain([]);

    const response = await POST(buildPostRequest(validPostBody));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("One or more ingredients could not be found.");
    expect(mockedRecipeCreate).not.toHaveBeenCalled();
  });

  it("creates a recipe owned by the current user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockIngredientFindChain([
      { id: ingredientId, name: "Sugar", unitFamily: "weight" },
    ]);
    mockedRecipeCreate.mockResolvedValue(buildRecipeDoc() as never);

    const response = await POST(buildPostRequest(validPostBody));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedRecipeCreate).toHaveBeenCalledWith({
      name: "Chicken Bowl",
      servings: 2,
      prepTimeMinutes: 20,
      tags: ["Dinner"],
      instructions: "Cook it.",
      ingredients: [{ ingredientId, quantity: 2, unit: "tbsp" }],
      userId: "user-1",
    });
    expect(body.id).toBe("recipe-1");
    expect(body.ingredients[0]).toMatchObject({ name: "Sugar", unitFamily: "weight" });
  });
});
