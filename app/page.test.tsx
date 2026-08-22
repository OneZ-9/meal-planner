import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HomePage from "./page";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects signed-out visitors to login", async () => {
    mockedAuth.mockResolvedValue(null);

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects signed-in visitors to the dashboard", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-id", email: "alex@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
