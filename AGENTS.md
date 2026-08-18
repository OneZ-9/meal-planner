<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project state

Next.js app (App Router) for a "Meal Planner + Shopping List Generator" (see `app/layout.tsx` metadata). Still early — `app/page.tsx` renders just a heading. The stack (React Query, Zustand, shadcn/ui, Vitest) is wired up and ready, but no meal-planning domain logic, data layer, or additional routes exist yet.

Keep current — update whenever what's actually built meaningfully changes, same as Project structure below. `README.md`'s own "Project state" section should stay in sync too, as plain status for human readers.

## Commands

- `npm run dev` — start the dev server (Next.js 16, Turbopack by default)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint via `eslint-config-next` (flat config in `eslint.config.mjs`)
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode; `npx vitest run path/to/file.test.tsx` for a single file)
- `npm run format` / `npm run format:check` — Prettier write / check

## Agent workflow

- Run the relevant verification commands (`npm run lint`, `npm test`, `npm run build`) at logical checkpoints, not after every single edit — before marking a task complete, before presenting results, or after a change that could plausibly affect compilation, types, or runtime behavior. Skip it for changes that can't break those (copy/label tweaks, comments, doc-only edits) unless bundled with other changes that do warrant it.
- Do not rewrite external dependency files, settings, or config (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `vitest.config.mts`, etc.) without explicitly notifying the user first — surface what's changing and why rather than silently editing them.

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
- **Testing**: Vitest + React Testing Library + jsdom. Config is `vitest.config.mts` (the `.mts` extension avoids a CJS/ESM warning without setting `"type": "module"` in `package.json`); `vitest.setup.ts` loads `@testing-library/jest-dom` matchers. Tests are co-located next to source as `*.test.tsx` (see `app/page.test.tsx`). For components that read from `@tanstack/react-query` context (e.g. `useQuery`), use `renderWithProviders` from `test/test-utils.tsx` instead of `@testing-library/react`'s bare `render` — it wraps the tree in a fresh `QueryClientProvider` per test.
- **Formatting**: Prettier with default rules (`.prettierrc.json` is intentionally empty); `.prettierignore` excludes `.next` and `node_modules`.
- TypeScript is `strict`, with the `@/*` path alias mapped to the repo root (`tsconfig.json`); the same alias is mirrored in `vitest.config.mts` for tests.
- **Environment variables**: Local overrides go in `.env.local` (gitignored via `.env*` in `.gitignore`); values the browser needs to read must be prefixed `NEXT_PUBLIC_`. Once real variables exist, add an `.env.example` documenting the names (force-add it with `git add -f`, since `.gitignore` ignores all `.env*` files by default).

## Project structure

```
.
├── app/                  # App Router: pages, layouts, providers, co-located tests
│   ├── layout.tsx
│   ├── page.tsx
│   ├── page.test.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/ui/     # shadcn/ui-generated primitives (do not hand-edit; see Stack notes)
├── lib/               # Shared helpers (lib/utils.ts today; lib/api/ once queries exist)
├── test/              # Shared test helpers (test/test-utils.tsx)
├── public/            # Static assets
├── components.json    # shadcn/ui config
├── vitest.config.mts / vitest.setup.ts
└── .env.local         # local-only env overrides (gitignored)
```

This reflects the current layout — update it here as the structure actually changes, don't let it drift into aspiration. `features/` isn't present yet — see Feature-based architecture below for what it will look like once the first feature is built.

## Feature-based architecture

- Group each feature's components and feature-specific logic under `features/<feature-name>/` (e.g. `features/meal-plan/`, `features/shopping-list/`) — don't put feature UI directly in `app/` or in the shared `components/ui/` folder (that's reserved for shadcn/ui primitives).
- Suggested layout inside each feature folder:
  ```
  features/<feature-name>/
  ├── components/   # feature-specific UI components
  ├── hooks/        # feature-specific hooks (state, queries, mutations)
  └── index.ts      # barrel export — what app/ is allowed to import
  ```
- `app/page.tsx` (and other route files) are presentation-only: they import a feature's top-level component from `features/` and render it. See the "contain no state management logic" rule in Page and Layout file conventions below.
- `features/` doesn't exist yet — create it when the first feature lands, following this structure instead of putting components or state directly in `app/`.

## Code style

- Prefer small PRs: one feature/fix per PR.
- Follow existing patterns before introducing new ones.
- Use `const` exclusively. Never `var`, never `let` unless reassignment is needed.
- Keep functions < 60 lines unless there's a strong reason.
- Prefer arrow functions for components and helpers.
- Annotate function return types explicitly.
- Avoid `any`; use `unknown` or a proper generic instead.
- Group imports in this order: react → next → third-party libraries → local (`@/...`).
- Use meaningful names for variables, functions, props, and parameters — avoid generic names (`data`, `item`, `temp`) or single letters, outside of trivial, obvious scopes like a one-line array callback.
- Don't duplicate logic across multiple places — extract it into a function, export it, and import it everywhere it's needed (DRY).

## Page and Layout file conventions

All `page.tsx` and `layout.tsx` files in `app/` must follow these rules:

- Always export a `metadata` const of type `Metadata`
- Function names must end with **`Page`** for pages and **`Layout`** for layouts
- Contain no state management logic — no `useState`, `useReducer`, `useQuery`, `useEffect`, etc. directly in a page or layout file. Import and render a component from `features/` (see Feature-based architecture below) instead; the page's job is only to compose and display it.

## Component conventions

- Default to shadcn/ui primitives (added via `npx shadcn@latest add <name>`) for form elements, cards, dialogs, and similar UI — don't hand-roll a component shadcn already provides.
- Style with Tailwind utility classes; there are no CSS modules in this project.
- Always destructure props in the function signature.
- Named exports only. Never default exports — except `page.tsx`, `layout.tsx`, and `route.ts` files, which Next.js requires to be default exports (see Page and Layout file conventions above).

## Documentation

- Be concise, specific, and value dense
- Give exported components and hooks a short comment describing their intended usage when it isn't obvious from the name and signature.
- Write so that a new developer to this codebase can understand your writing, don’t assume your audience are experts in the topic/area you are writing about.
- Keep `README.md` current as real setup steps, conventions, or gotchas emerge.

## Security

No API routes or auth exist yet, but once they do:

- Validate all inputs server-side (API routes, server actions) — never trust client-supplied data.
- Use HTTP-only, secure cookies and CSRF protection for any session/auth flow; protect authenticated routes via middleware or explicit session checks, not client-side redirects alone.
- Never log secrets/tokens or commit `.env`/secret-bearing files.
- Do not modify auth without explicit instruction; if unsure about a migration, stop and ask.
