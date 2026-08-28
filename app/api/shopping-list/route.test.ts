import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel } from "@/lib/models/recipe";
import { IngredientModel } from "@/lib/models/ingredient";
import { ShoppingListItemStateModel } from "@/lib/models/shoppingListItemState";
import { GET, PATCH } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { find: vi.fn() },
}));
vi.mock("@/lib/models/recipe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/models/recipe")>();
  return { ...actual, RecipeModel: { find: vi.fn() } };
});
vi.mock("@/lib/models/ingredient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/models/ingredient")>();
  return { ...actual, IngredientModel: { find: vi.fn() } };
});
vi.mock("@/lib/models/shoppingListItemState", () => ({
  ShoppingListItemStateModel: { find: vi.fn(), findOneAndUpdate: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedCalendarFind = vi.mocked(CalendarEntryModel.find);
const mockedRecipeFind = vi.mocked(RecipeModel.find);
const mockedIngredientFind = vi.mocked(IngredientModel.find);
const mockedStateFind = vi.mocked(ShoppingListItemStateModel.find);
const mockedStateUpsert = vi.mocked(ShoppingListItemStateModel.findOneAndUpdate);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildGetRequest = (params: Record<string, string> = {}): NextRequest =>
  ({ nextUrl: { searchParams: new URLSearchParams(params) } }) as unknown as NextRequest;

const buildPatchRequest = (body: unknown): Request =>
  new Request("http://localhost/api/shopping-list", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

const mockSelectChain = (mockFn: typeof mockedCalendarFind, docs: unknown[]): void => {
  mockFn.mockReturnValue({ select: vi.fn().mockResolvedValue(docs) } as never);
};

const sugarId = new Types.ObjectId().toString();
const recipeId = new Types.ObjectId().toString();

describe("GET /api/shopping-list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));

    expect(response.status).toBe(401);
  });

  it("rejects a missing/invalid weekStart", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await GET(buildGetRequest({ weekStart: "not-a-date" }));

    expect(response.status).toBe(400);
  });

  it("returns an empty list for a week with no assignments", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockSelectChain(mockedCalendarFind, []);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));
    const body = await response.json();

    expect(mockedCalendarFind).toHaveBeenCalledWith({
      userId: "user-1",
      date: { $gte: "2023-10-23", $lte: "2023-10-29" },
    });
    expect(body).toEqual({ weekStart: "2023-10-23", weekEnd: "2023-10-29", items: [] });
    expect(mockedRecipeFind).not.toHaveBeenCalled();
    expect(mockedIngredientFind).not.toHaveBeenCalled();
    expect(mockedStateFind).not.toHaveBeenCalled();
  });

  it("generates, merges checked state, and returns a shopping list line", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockSelectChain(mockedCalendarFind, [{ recipeId }]);
    mockSelectChain(mockedRecipeFind, [
      {
        id: recipeId,
        ingredients: [
          { ingredientId: sugarId, quantity: 2, unit: "tbsp" },
          { ingredientId: sugarId, quantity: 1, unit: "cup" },
        ],
      },
    ]);
    mockSelectChain(mockedIngredientFind, [
      { id: sugarId, name: "Sugar", unitFamily: "weight", densityGPerMl: 0.845 },
    ]);
    mockSelectChain(mockedStateFind, [{ itemKey: `${sugarId}:g`, checked: true }]);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));
    const body = await response.json();

    expect(mockedRecipeFind).toHaveBeenCalledWith({
      _id: { $in: [recipeId] },
      userId: "user-1",
    });
    expect(body.items).toEqual([
      {
        itemKey: `${sugarId}:g`,
        ingredientId: sugarId,
        ingredientName: "Sugar",
        quantity: 225,
        unit: "g",
        unmerged: false,
        checked: true,
      },
    ]);
  });

  it("defaults checked to false when no state document exists", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockSelectChain(mockedCalendarFind, [{ recipeId }]);
    mockSelectChain(mockedRecipeFind, [
      { id: recipeId, ingredients: [{ ingredientId: sugarId, quantity: 1, unit: "whole" }] },
    ]);
    mockSelectChain(mockedIngredientFind, [
      { id: sugarId, name: "Onion", unitFamily: "count", densityGPerMl: null },
    ]);
    mockSelectChain(mockedStateFind, []);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));
    const body = await response.json();

    expect(body.items[0]).toMatchObject({ checked: false });
  });
});

describe("PATCH /api/shopping-list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await PATCH(
      buildPatchRequest({ weekStart: "2023-10-23", itemKeys: ["a:g"], checked: true }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await PATCH(
      buildPatchRequest({ weekStart: "bad-date", itemKeys: ["a:g"], checked: true }),
    );

    expect(response.status).toBe(400);
  });

  it("upserts a checked-state document per item key", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedStateUpsert.mockResolvedValue({} as never);

    const response = await PATCH(
      buildPatchRequest({
        weekStart: "2023-10-23",
        itemKeys: ["a:g", "b:ml"],
        checked: true,
      }),
    );

    expect(response.status).toBe(204);
    expect(mockedStateUpsert).toHaveBeenCalledTimes(2);
    expect(mockedStateUpsert).toHaveBeenCalledWith(
      { userId: "user-1", weekStart: "2023-10-23", itemKey: "a:g" },
      { userId: "user-1", weekStart: "2023-10-23", itemKey: "a:g", checked: true },
      { upsert: true },
    );
  });
});
