import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { RecipeModel } from "@/lib/models/recipe";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/recipe", () => ({
  RecipeModel: { findOne: vi.fn() },
}));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { countDocuments: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedFindOne = vi.mocked(RecipeModel.findOne);
const mockedCountDocuments = vi.mocked(CalendarEntryModel.countDocuments);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildRequest = (): Request =>
  new Request("http://localhost/api/recipes/some-id/calendar-usage");

const buildContext = (id: string): { params: Promise<{ id: string }> } => ({
  params: Promise.resolve({ id }),
});

const validId = new Types.ObjectId().toString();

const mockRecipeFindOneChain = (doc: unknown): void => {
  mockedFindOne.mockReturnValue({
    select: vi.fn().mockResolvedValue(doc),
  } as never);
};

describe("GET /api/recipes/[id]/calendar-usage", () => {
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

    const response = await GET(buildRequest(), buildContext("bad-id"));

    expect(response.status).toBe(404);
  });

  it("404s when the recipe doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockRecipeFindOneChain(null);

    const response = await GET(buildRequest(), buildContext(validId));

    expect(mockedFindOne).toHaveBeenCalledWith({ _id: validId, userId: "user-1" });
    expect(response.status).toBe(404);
    expect(mockedCountDocuments).not.toHaveBeenCalled();
  });

  it("returns the number of calendar days the recipe is assigned to", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockRecipeFindOneChain({ id: validId });
    mockedCountDocuments.mockResolvedValue(3);

    const response = await GET(buildRequest(), buildContext(validId));
    const body = await response.json();

    expect(mockedCountDocuments).toHaveBeenCalledWith({
      userId: "user-1",
      recipeId: validId,
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({ count: 3 });
  });
});
