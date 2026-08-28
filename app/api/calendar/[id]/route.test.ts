import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CalendarEntryModel } from "@/lib/models/calendarEntry";
import { DELETE } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/models/calendarEntry", () => ({
  CalendarEntryModel: { findOneAndDelete: vi.fn() },
}));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedFindOneAndDelete = vi.mocked(CalendarEntryModel.findOneAndDelete);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildRequest = (): Request =>
  new Request("http://localhost/api/calendar/some-id", { method: "DELETE" });

const buildContext = (id: string): { params: Promise<{ id: string }> } => ({
  params: Promise.resolve({ id }),
});

const validId = new Types.ObjectId().toString();

describe("DELETE /api/calendar/[id]", () => {
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

  it("404s when the assignment doesn't exist or isn't owned by this user", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue(null);

    const response = await DELETE(buildRequest(), buildContext(validId));

    expect(mockedFindOneAndDelete).toHaveBeenCalledWith({
      _id: validId,
      userId: "user-1",
    });
    expect(response.status).toBe(404);
  });

  it("removes an owned assignment", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedFindOneAndDelete.mockResolvedValue({ id: validId } as never);

    const response = await DELETE(buildRequest(), buildContext(validId));

    expect(response.status).toBe(204);
  });
});
