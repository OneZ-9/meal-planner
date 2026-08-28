import { del } from "@vercel/blob";

// Best-effort cleanup for a recipe's previous image (on replace or recipe
// delete) — never blocks or fails the caller's main operation. A leftover
// Vercel Blob object if this fails is a rare, low-cost accepted risk, same
// "blunt cascade" shape already accepted for the calendar-assignment
// cascade (see KNOWN_ISSUES.md/DECISIONS.md) rather than something worth a
// transaction/retry for.
export const deleteRecipeImageBestEffort = async (
  imageUrl: string | null | undefined,
): Promise<void> => {
  if (!imageUrl) return;
  try {
    await del(imageUrl);
  } catch {
    // Ignored — see comment above.
  }
};
