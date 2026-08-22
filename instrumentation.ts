const SEED_RETRY_ATTEMPTS = 3;
const SEED_RETRY_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs once when a new Next.js server instance starts (see
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).
// Used here to guarantee the seeded canonical ingredient list always exists
// before the app serves traffic.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { connectDB } = await import("@/lib/mongodb");
  const { ensureIngredientsSeeded } = await import("@/lib/seedIngredients");

  for (let attempt = 1; attempt <= SEED_RETRY_ATTEMPTS; attempt++) {
    try {
      await connectDB();
      await ensureIngredientsSeeded();
      return;
    } catch (error) {
      // Don't block server startup on a DB issue — local UI-only work runs
      // with a placeholder MONGODB_URI (see DEVELOPMENT.md), so this must be
      // recoverable rather than fatal. Retry a few times first though, since
      // the common real-world case (bad/stale credentials just fixed, Atlas
      // cluster waking up, momentary network blip) is transient and would
      // otherwise silently leave the ingredient list unseeded until the next
      // full server restart.
      const isLastAttempt = attempt === SEED_RETRY_ATTEMPTS;
      console.error(
        `[ingredients] Failed to verify/seed ingredient list on startup ` +
          `(attempt ${attempt}/${SEED_RETRY_ATTEMPTS}):`,
        error,
      );
      if (!isLastAttempt) await sleep(SEED_RETRY_DELAY_MS);
    }
  }
}
