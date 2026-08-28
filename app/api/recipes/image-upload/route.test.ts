import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { handleUpload } from "@vercel/blob/client";
import { POST } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: vi.fn() }));

const mockedAuth = vi.mocked(auth as () => Promise<Session | null>);
const mockedHandleUpload = vi.mocked(handleUpload);

const asSession = (userId: string): Session => ({
  user: { id: userId, email: "chef@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
});

const buildRequest = (body: unknown): Request =>
  new Request("http://localhost/api/recipes/image-upload", {
    method: "POST",
    body: JSON.stringify(body),
  });

const tokenRequestBody = {
  type: "blob.generate-client-token" as const,
  payload: { pathname: "recipe-images/abc.jpg", multipart: false, clientPayload: null },
};

describe("POST /api/recipes/image-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out request", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(buildRequest(tokenRequestBody));

    expect(response.status).toBe(401);
    expect(mockedHandleUpload).not.toHaveBeenCalled();
  });

  it("rejects an unparseable body", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));

    const response = await POST(
      new Request("http://localhost/api/recipes/image-upload", {
        method: "POST",
        body: "not json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("issues a client token constrained to image content types and a size limit", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedHandleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const tokenConfig = await onBeforeGenerateToken("recipe-images/abc.jpg", null, false);
      expect(tokenConfig.allowedContentTypes).toEqual([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]);
      expect(tokenConfig.maximumSizeInBytes).toBe(5 * 1024 * 1024);
      return { type: "blob.generate-client-token", clientToken: "fake-token" };
    });

    const response = await POST(buildRequest(tokenRequestBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ type: "blob.generate-client-token", clientToken: "fake-token" });
  });

  it("rejects a pathname outside recipe-images/", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedHandleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      await onBeforeGenerateToken("other-path/abc.jpg", null, false);
      throw new Error("unreachable");
    });

    const response = await POST(
      buildRequest({
        type: "blob.generate-client-token",
        payload: { pathname: "other-path/abc.jpg", multipart: false, clientPayload: null },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Recipe images must be uploaded under recipe-images/.");
  });

  it("surfaces a handleUpload failure as a 400", async () => {
    mockedAuth.mockResolvedValue(asSession("user-1"));
    mockedHandleUpload.mockRejectedValue(new Error("boom"));

    const response = await POST(buildRequest(tokenRequestBody));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("boom");
  });
});
