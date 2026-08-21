// Runs once when a new Next.js server instance starts (see
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).
// Used here to guarantee the seeded canonical ingredient list always exists
// before the app serves traffic.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { ensureIngredientsSeeded } = await import("@/lib/seedIngredients");

    await connectDB();
    await ensureIngredientsSeeded();
  } catch (error) {
    // Don't block server startup on a DB issue — local UI-only work runs
    // with a placeholder MONGODB_URI (see DEVELOPMENT.md), so this must be
    // recoverable rather than fatal.
    console.error(
      "[ingredients] Failed to verify/seed ingredient list on startup:",
      error,
    );
  }
}
