# PROJECT.md

## Purpose

Meal Planner + Auto Shopping List — plan a week of meals and auto-generate a
de-duplicated shopping list from that plan. Recipes are built once from a
shared ingredient list and reused across weeks; assigning them to a weekly
calendar generates a shopping list with no manual cross-referencing.

Source of truth for product scope: `.ai/ARCHITECTURE.md` at repo root.

## Problem being solved

Meal planning and grocery shopping are normally two disconnected tasks —
the shopping list gets derived from recipes by hand, every week, which
reliably produces missed items, duplicate purchases, and wasted food.
Two specific failure modes drive this:

- **Ingredient duplication**: free-text entry lets the same ingredient be
  typed differently across recipes, so items don't merge on the list.
- **Unit mismatch**: recipes measure in cooking units (tbsp), shopping
  happens in different units.

## Target users

- Structured diet planners tracking macros.
- Fitness-focused meal-preppers batch-planning around workouts.
- Home cooks who want recipes + shopping list in one connected tool.

## Stack

| Layer             | Choice                                                     |
| ----------------- | ---------------------------------------------------------- |
| Frontend/Backend  | Next.js (App Router) + TypeScript + React                  |
| Styling           | Tailwind CSS                                               |
| Database          | MongoDB Atlas via Mongoose                                 |
| Auth              | NextAuth.js, credentials provider, bcrypt                  |
| Hosting           | Vercel                                                     |
| Ingredient search | MongoDB text index                                         |
| Unit conversion   | `convert-units` (npm) — same-family only, see DECISIONS.md |

## Stack notes

- **Next.js 16.3.1** with **React 19.2.8** — significantly newer than typical training data. Read the relevant guide under `node_modules/next/dist/docs/` before implementing routing, data fetching, or layout patterns, since APIs/conventions may have changed.
- `app/layout.tsx` uses the typed layout props helper (`LayoutProps<"/">`) instead of a hand-written `{ children: React.ReactNode }` prop type — this is a newer Next.js typed-routes convention; follow the same pattern for other layouts/pages.
- **Styling**: Tailwind CSS v4 via the `@tailwindcss/postcss` plugin — no `tailwind.config.js`/`.ts`; theme tokens live in `app/globals.css` under `@theme inline` and `:root`/`.dark`.
- **Components**: shadcn/ui, configured via `components.json` (style `base-nova`, base color `neutral`). Generated primitives live in `components/ui/` (e.g. `components/ui/button.tsx`); the `cn()` class-merge helper is in `lib/utils.ts`. Add new components with `npx shadcn@latest add <name>` rather than hand-writing files in `components/ui/`, so they stay in sync with the generated variant/style conventions. Theme customization happens via the CSS custom properties in `app/globals.css`, not a Tailwind config file (v4 has none).
  - This install uses shadcn's **base-ui** primitive library (`@base-ui/react`), not Radix — expect `@base-ui/react/*` imports in generated components, not `@radix-ui/*`.
- **Fonts**: loaded via `next/font/google` in `app/layout.tsx` — Inter mapped to the CSS variable `--font-sans`, Geist Mono mapped to `--font-mono`. Must match exactly what `app/globals.css`'s `@theme inline` block references, or the font silently falls back to default.
- **State management**: split by where the data lives — never duplicate the same value in both.
  - **Remote/server state** (anything fetched from an API): `@tanstack/react-query`, always behind a custom hook — components never call `useQuery`/`useMutation`/`useInfiniteQuery` directly. `QueryClient` is created and provided via the client component `app/providers.tsx`, which wraps `children` inside `app/layout.tsx`.
    - Raw network calls live in `lib/api/` (create it when the first API call is added), e.g. `lib/api/meals.ts` exporting `fetchMeals()`, `createMeal()`.
    - Each feature wraps those calls in its own custom hooks under `features/<feature-name>/hooks/`, e.g. `useMeals()` (wraps `useQuery`), `useCreateMeal()` (wraps `useMutation`) — named for what they return/do, not for the React Query hook underneath. Components import and call `useMeals()`, not `useQuery`.
    - Prefix query keys by domain, e.g. `["meals", id]`, `["shopping-list"]`.
    - `app/providers.tsx` must keep `const [queryClient] = useState(() => new QueryClient())` — not a module-level `const queryClient = new QueryClient()` (leaks the cache across users/requests during SSR) and not an inline `new QueryClient()` in the render body (recreates the cache and cancels in-flight queries on every re-render).
  - **Local/client state shared across components** (UI state, form state, anything not fetched from a server): `zustand`. Create a store per feature, e.g. `features/<feature-name>/hooks/use<Feature>Store.ts`, and export it through that feature's `index.ts` barrel only if another feature actually needs it. `zustand` needs no provider — `create()` stores are usable directly.
  - State that only one component needs stays as plain `useState`/`useReducer` in that component — don't reach for `zustand` just because state exists.
- **Database**: MongoDB via the official `mongodb` driver. `lib/mongodb.ts` exports `mongoClientPromise`, connected from `MONGODB_URI` and cached across HMR reloads in dev so it doesn't reconnect on every file save. Server-only — import it from API routes/server actions, never from client components. Client code still reaches this data exclusively through the React Query custom-hooks + `lib/api/` pattern above, calling those server routes rather than the database directly.
  - Document types for each collection live in `lib/models/<collection>.ts` (e.g. `lib/models/ingredient.ts`) — no ODM/Mongoose is installed, just plain TypeScript interfaces used with the native driver.
  - Collections that need integrity enforcement get a `$jsonSchema` validator, applied via `db.createCollection`/`collMod` in that collection's seed/setup script under `scripts/` (see `scripts/seed-ingredients.mjs`). Run one-off scripts with `node --env-file=.env.local scripts/<name>.mjs` — no `dotenv` dependency needed (Node 20.6+ reads `--env-file` natively). Seed scripts upsert by a natural unique key so they're safe to re-run.
- **Testing**: Vitest + React Testing Library + jsdom. Config is `vitest.config.mts` (the `.mts` extension avoids a CJS/ESM warning without setting `"type": "module"` in `package.json`); `vitest.setup.ts` loads `@testing-library/jest-dom` matchers. Tests are co-located next to source as `*.test.tsx` (see `app/page.test.tsx`). For components that read from `@tanstack/react-query` context (e.g. `useQuery`), use `renderWithProviders` from `test/test-utils.tsx` instead of `@testing-library/react`'s bare `render` — it wraps the tree in a fresh `QueryClientProvider` per test.
- **Formatting**: Prettier with default rules (`.prettierrc.json` is intentionally empty); `.prettierignore` excludes `.next` and `node_modules`.
- TypeScript is `strict`, with the `@/*` path alias mapped to the repo root (`tsconfig.json`); the same alias is mirrored in `vitest.config.mts` for tests.
- **Environment variables**: Local overrides go in `.env.local` (gitignored via `.env*` in `.gitignore`); values the browser needs to read must be prefixed `NEXT_PUBLIC_`. `.env.example` documents the current names (`MONGODB_URI`, `PORT`) with empty values — it must be force-added to git (`git add -f`) since `.gitignore` ignores all `.env*` files by default.
  - `PORT` in `.env.local` does **not** actually change the dev/start server's bound port — verified empirically: Next's CLI resolves the port from a real OS-level `PORT` env var before `.env.local` is loaded, so the file value is too late to matter. To actually change the port, export `PORT` at the shell (e.g. `PORT=4321 npm run dev`) or update the `dev`/`start` scripts in `package.json` to pass `-p` explicitly (needs sign-off per the "don't rewrite config" rule above).

## Terminology

- **Canonical ingredient** — a de-duplicated ingredient entity (148-item
  global seed list + per-user custom entries) that recipes reference by ID,
  not free text. This is what makes shopping-list merging possible.
- **Same-family conversion** — normalizing within a unit family only
  (tsp/tbsp/cup → ml; oz/lb → g). Cross-family (e.g. tbsp of a dry
  ingredient → g) requires ingredient density data and is deferred.
- **Calendar slot** — one (day, meal) cell in the weekly calendar. MVP
  allows exactly one recipe per slot.

## Directory map

Agent: for the current, maintained layout, read the "Project structure" section in `.ai/ARCHITECTURE.md`

## Environments

| Env        | URL                   | Notes                                                      |
| ---------- | --------------------- | ---------------------------------------------------------- |
| Local      | http://localhost:3000 | `.env.local`, placeholder Mongo URI works for UI-only work |
| Production | TBD (Vercel)          | not yet deployed                                           |

No staging environment defined — single-tenant MVP, 2-week delivery window.
