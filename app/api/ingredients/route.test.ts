import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { IngredientModel } from "@/lib/models/ingredient";
import { GET, POST } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/ingredient", () => ({
  IngredientModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedFind = vi.mocked(IngredientModel.find);
const mockedFindOne = vi.mocked(IngredientModel.findOne);
const mockedCreate = vi.mocked(IngredientModel.create);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildGetRequest = (
  params: Record<string, string> = {},
): NextRequest =>
  ({
    nextUrl: { searchParams: new URLSearchParams(params) },
  }) as unknown as NextRequest;

const buildPostRequest = (body: unknown): Request =>
  new Request("http://localhost/api/ingredients", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("GET /api/ingredients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFindChain = (docs: unknown[]): void => {
    const limit = vi.fn().mockResolvedValue(docs);
    const skip = vi.fn().mockReturnValue({ limit });
    const sort = vi.fn().mockReturnValue({ skip });
    mockedFind.mockReturnValue({ sort } as never);
  };

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(buildGetRequest({ q: "sugar" }));

    expect(response.status).toBe(401);
  });

  it("scopes search to global and the current user's ingredients by default", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockFindChain([
      {
        id: "ing-1",
        name: "Sugar",
        unitFamily: "weight",
        densityGPerMl: null,
        userId: null,
      },
      {
        id: "ing-2",
        name: "Sugar Substitute",
        unitFamily: "weight",
        densityGPerMl: 0.9,
        userId: "user-1",
      },
    ]);

    const response = await GET(buildGetRequest({ q: "sugar" }));
    const body = await response.json();

    expect(mockedFind).toHaveBeenCalledWith({
      $or: [{ userId: null }, { userId: "user-1" }],
      name: { $regex: "sugar", $options: "i" },
    });
    expect(body).toEqual({
      items: [
        { id: "ing-1", name: "Sugar", unitFamily: "weight", densityGPerMl: null, isCustom: false },
        { id: "ing-2", name: "Sugar Substitute", unitFamily: "weight", densityGPerMl: 0.9, isCustom: true },
      ],
      nextCursor: null,
    });
  });

  it("filters to only the current user's ingredients when scope=custom", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockFindChain([]);

    await GET(buildGetRequest({ scope: "custom" }));

    expect(mockedFind).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("filters to only global ingredients when scope=global", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockFindChain([]);

    await GET(buildGetRequest({ scope: "global" }));

    expect(mockedFind).toHaveBeenCalledWith({ userId: null });
  });

  it("returns a nextCursor when more results exist beyond the page limit", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const docs = Array.from({ length: 3 }, (_, index) => ({
      id: `ing-${index}`,
      name: `Ingredient ${index}`,
      unitFamily: "weight",
      densityGPerMl: null,
      userId: null,
    }));
    mockFindChain(docs); // limit + 1 = 3 docs returned for a limit of 2

    const response = await GET(buildGetRequest({ limit: "2", cursor: "0" }));
    const body = await response.json();

    expect(body.items).toHaveLength(2);
    expect(body.nextCursor).toBe(2);
  });
});

describe("POST /api/ingredients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(buildPostRequest({ name: "Sugar", unitFamily: "weight" }));

    expect(response.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await POST(buildPostRequest({ name: "", unitFamily: "weight" }));

    expect(response.status).toBe(400);
  });

  it("returns 409 with the existing ingredient on an exact-match name", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const existing = {
      id: "ing-1",
      name: "Sugar",
      unitFamily: "weight",
      densityGPerMl: null,
      userId: null,
    };
    mockedFindOne.mockReturnValue({
      collation: vi.fn().mockResolvedValue(existing),
    } as never);

    const response = await POST(buildPostRequest({ name: "sugar", unitFamily: "weight" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ingredient).toEqual({
      id: "ing-1",
      name: "Sugar",
      unitFamily: "weight",
      densityGPerMl: null,
      isCustom: false,
    });
  });

  it("creates a custom ingredient owned by the current user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOne.mockReturnValue({
      collation: vi.fn().mockResolvedValue(null),
    } as never);
    mockedCreate.mockResolvedValue({
      id: "ing-3",
      name: "Smoked Paprika",
      unitFamily: "weight",
      densityGPerMl: null,
    } as never);

    const response = await POST(
      buildPostRequest({ name: "Smoked Paprika", unitFamily: "weight" }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith({
      name: "Smoked Paprika",
      unitFamily: "weight",
      densityGPerMl: null,
      userId: "user-1",
    });
    expect(body).toEqual({
      id: "ing-3",
      name: "Smoked Paprika",
      unitFamily: "weight",
      densityGPerMl: null,
      isCustom: true,
    });
  });
});
