import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { RecipeModel } from "@/lib/models/recipe";
import { GET, POST } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { find: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock("@/lib/models/recipe", () => ({
  RecipeModel: { find: vi.fn(), findOne: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedEntryFind = vi.mocked(CalendarEntryModel.find);
const mockedEntryUpsert = vi.mocked(CalendarEntryModel.findOneAndUpdate);
const mockedRecipeFind = vi.mocked(RecipeModel.find);
const mockedRecipeFindOne = vi.mocked(RecipeModel.findOne);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildGetRequest = (params: Record<string, string> = {}): NextRequest =>
  ({ nextUrl: { searchParams: new URLSearchParams(params) } }) as unknown as NextRequest;

const buildPostRequest = (body: unknown): Request =>
  new Request("http://localhost/api/calendar", {
    method: "POST",
    body: JSON.stringify(body),
  });

const recipeId = new Types.ObjectId().toString();

const mockRecipeSelectChain = (docs: unknown[]): void => {
  mockedRecipeFind.mockReturnValue({ select: vi.fn().mockResolvedValue(docs) } as never);
};

const buildEntryDoc = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  date: "2023-10-24",
  mealSlot: "dinner",
  recipeId,
  ...overrides,
});

describe("GET /api/calendar", () => {
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

  it("scopes the query to the current user and the Mon-Sun week range", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedEntryFind.mockResolvedValue([]);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));
    const body = await response.json();

    expect(mockedEntryFind).toHaveBeenCalledWith({
      userId: "user-1",
      date: { $gte: "2023-10-23", $lte: "2023-10-29" },
    });
    expect(body).toEqual({ weekStart: "2023-10-23", weekEnd: "2023-10-29", items: [] });
  });

  it("resolves recipe name/prep time for each entry", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedEntryFind.mockResolvedValue([buildEntryDoc()] as never);
    mockRecipeSelectChain([
      { id: recipeId, name: "Chicken Bowl", prepTimeMinutes: 20 },
    ]);

    const response = await GET(buildGetRequest({ weekStart: "2023-10-23" }));
    const body = await response.json();

    expect(body.items).toEqual([
      {
        id: "entry-1",
        date: "2023-10-24",
        mealSlot: "dinner",
        recipe: { id: recipeId, name: "Chicken Bowl", prepTimeMinutes: 20 },
      },
    ]);
  });
});

describe("POST /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(
      buildPostRequest({ date: "2023-10-24", mealSlot: "dinner", recipeId }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await POST(
      buildPostRequest({ date: "bad-date", mealSlot: "dinner", recipeId }),
    );

    expect(response.status).toBe(400);
  });

  it("404s when the recipe doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedRecipeFindOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as never);

    const response = await POST(
      buildPostRequest({ date: "2023-10-24", mealSlot: "dinner", recipeId }),
    );

    expect(response.status).toBe(404);
  });

  it("upserts the assignment, replacing whatever previously occupied the slot", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedRecipeFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({ id: recipeId, name: "Chicken Bowl", prepTimeMinutes: 20 }),
    } as never);
    mockedEntryUpsert.mockResolvedValue(buildEntryDoc() as never);

    const response = await POST(
      buildPostRequest({ date: "2023-10-24", mealSlot: "dinner", recipeId }),
    );
    const body = await response.json();

    expect(mockedEntryUpsert).toHaveBeenCalledWith(
      { userId: "user-1", date: "2023-10-24", mealSlot: "dinner" },
      { userId: "user-1", date: "2023-10-24", mealSlot: "dinner", recipeId },
      { upsert: true, new: true },
    );
    expect(response.status).toBe(201);
    expect(body).toEqual({
      id: "entry-1",
      date: "2023-10-24",
      mealSlot: "dinner",
      recipe: { id: recipeId, name: "Chicken Bowl", prepTimeMinutes: 20 },
    });
  });
});
