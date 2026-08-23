import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { IngredientModel } from "@/lib/models/ingredient";
import { PATCH } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/ingredient", () => ({
  IngredientModel: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedFindById = vi.mocked(IngredientModel.findById);
const mockedFindOne = vi.mocked(IngredientModel.findOne);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildRequest = (body: unknown): Request =>
  new Request("http://localhost/api/ingredients/some-id", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

const buildContext = (id: string): { params: Promise<{ id: string }> } => ({
  params: Promise.resolve({ id }),
});

const validId = new Types.ObjectId().toString();
const otherUserId = new Types.ObjectId().toString();

describe("PATCH /api/ingredients/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await PATCH(
      buildRequest({ name: "Sugar", unitFamily: "weight" }),
      buildContext(validId),
    );

    expect(response.status).toBe(401);
  });

  it("404s on a non-ObjectId id", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await PATCH(
      buildRequest({ name: "Sugar", unitFamily: "weight" }),
      buildContext("not-an-id"),
    );

    expect(response.status).toBe(404);
  });

  it("404s when the ingredient doesn't exist", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindById.mockResolvedValue(null);

    const response = await PATCH(
      buildRequest({ name: "Sugar", unitFamily: "weight" }),
      buildContext(validId),
    );

    expect(response.status).toBe(404);
  });

  it("403s when editing a global ingredient", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindById.mockResolvedValue({
      _id: validId,
      userId: null,
      save: vi.fn(),
    } as never);

    const response = await PATCH(
      buildRequest({ name: "Sugar", unitFamily: "weight" }),
      buildContext(validId),
    );

    expect(response.status).toBe(403);
  });

  it("403s when editing another user's ingredient", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindById.mockResolvedValue({
      _id: validId,
      userId: otherUserId,
      save: vi.fn(),
    } as never);

    const response = await PATCH(
      buildRequest({ name: "Sugar", unitFamily: "weight" }),
      buildContext(validId),
    );

    expect(response.status).toBe(403);
  });

  it("409s when renaming to a name that collides", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindById.mockResolvedValue({
      _id: validId,
      userId: "user-1",
      save: vi.fn(),
    } as never);
    mockedFindOne.mockReturnValue({
      collation: vi.fn().mockResolvedValue({ id: "other-ingredient" }),
    } as never);

    const response = await PATCH(
      buildRequest({ name: "Existing Name", unitFamily: "weight" }),
      buildContext(validId),
    );

    expect(response.status).toBe(409);
  });

  it("updates an owned ingredient", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    const save = vi.fn().mockResolvedValue(undefined);
    const ingredient = {
      id: validId,
      _id: validId,
      userId: "user-1",
      name: "Old Name",
      unitFamily: "weight",
      densityGPerMl: null,
      save,
    };
    mockedFindById.mockResolvedValue(ingredient as never);
    mockedFindOne.mockReturnValue({
      collation: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await PATCH(
      buildRequest({ name: "New Name", unitFamily: "volume", densityGPerMl: 1.1 }),
      buildContext(validId),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalled();
    expect(body).toEqual({
      id: validId,
      name: "New Name",
      unitFamily: "volume",
      densityGPerMl: 1.1,
      isCustom: true,
    });
  });
});
