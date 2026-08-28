import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel } from "@/lib/models/recipe";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { aggregate: vi.fn() },
}));
vi.mock("@/lib/models/recipe", () => ({
  RecipeModel: { find: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedAggregate = vi.mocked(CalendarEntryModel.aggregate);
const mockedRecipeFind = vi.mocked(RecipeModel.find);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const mockRecipeSelectChain = (docs: unknown[]): void => {
  mockedRecipeFind.mockReturnValue({ select: vi.fn().mockResolvedValue(docs) } as never);
};

describe("GET /api/calendar/frequent-recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns an empty list when the user has no calendar history", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedAggregate.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({ items: [] });
    expect(mockedRecipeFind).not.toHaveBeenCalled();
  });

  it("returns the top recipes by assignment count, most-used first", async () => {
    const recipeId1 = new Types.ObjectId();
    const recipeId2 = new Types.ObjectId();
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedAggregate.mockResolvedValue([
      { _id: recipeId1, count: 5 },
      { _id: recipeId2, count: 2 },
    ]);
    mockRecipeSelectChain([
      {
        id: recipeId2.toString(),
        name: "Tomato Soup",
        imageUrl: null,
        prepTimeMinutes: 15,
      },
      {
        id: recipeId1.toString(),
        name: "Chicken Bowl",
        imageUrl: "https://blob.example/chicken.jpg",
        prepTimeMinutes: 20,
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.items).toEqual([
      {
        id: recipeId1.toString(),
        name: "Chicken Bowl",
        imageUrl: "https://blob.example/chicken.jpg",
        prepTimeMinutes: 20,
        count: 5,
      },
      {
        id: recipeId2.toString(),
        name: "Tomato Soup",
        imageUrl: null,
        prepTimeMinutes: 15,
        count: 2,
      },
    ]);
  });

  it("skips a recipe that no longer exists (e.g. deleted) without erroring", async () => {
    const recipeId1 = new Types.ObjectId();
    const recipeId2 = new Types.ObjectId();
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedAggregate.mockResolvedValue([
      { _id: recipeId1, count: 3 },
      { _id: recipeId2, count: 1 },
    ]);
    mockRecipeSelectChain([
      {
        id: recipeId1.toString(),
        name: "Chicken Bowl",
        imageUrl: null,
        prepTimeMinutes: 20,
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.items).toEqual([
      {
        id: recipeId1.toString(),
        name: "Chicken Bowl",
        imageUrl: null,
        prepTimeMinutes: 20,
        count: 3,
      },
    ]);
  });
});
