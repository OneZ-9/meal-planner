import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { auth } from "@/auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Authorizes and tracks client-side recipe image uploads (see
// `lib/api/recipes.ts`'s `uploadRecipeImage`). The file itself goes straight
// from the browser to Vercel Blob storage, never through this server — this
// route only issues a scoped, short-lived upload token (`handleUpload` from
// `@vercel/blob/client`). Using the "client upload" pattern rather than
// reading the file into this route and calling `put()` server-side avoids
// Vercel's ~4.5MB request-body limit on serverless functions, which a
// full-resolution phone photo can easily exceed. See DECISIONS.md "Recipe
// image upload (Vercel Blob)".
export const POST = async (request: Request): Promise<NextResponse> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("recipe-images/")) {
          throw new Error("Recipe images must be uploaded under recipe-images/.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
};
