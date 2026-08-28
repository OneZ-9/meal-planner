# DEVELOPMENT.md

## Local setup

```bash
npm install
cp .env.example .env.local   # see Environment variables below
npm run dev                  # http://localhost:3000
```

Root `/` redirects to `/login`. `/dashboard` and every other `(dashboard)`
route is protected. The Dashboard now reads live Calendar, Recipes, and
Shopping List APIs for its current-week metrics and today's highlights, so it
requires a working `MONGODB_URI`; it is no longer a placeholder-only UI route.
Anything hitting `app/api/*` (recipe save, login, dashboard summaries, etc.)
requires a real `MONGODB_URI`.

## Environment variables

| Var           | Required for              | Notes                                                                                                             |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI` | any API route / real auth | MongoDB Atlas connection string. Placeholder value lets the app boot for UI-only work but any DB call will throw. |
| `AUTH_SECRET` | auth                      | Required outside Auth.js development fallback; generate with `openssl rand -base64 32`.                           |
| `AUTH_URL`    | auth                      | Optional locally (`http://localhost:3000`); set to the canonical deployed URL in production.                      |
| `BLOB_READ_WRITE_TOKEN` | recipe image upload | Vercel Blob read-write token. Create a Blob store under the Vercel dashboard's Storage tab (needs a Vercel project linked, even for local dev), or run `vercel env pull .env.local` once one exists. Without it, recipe create/edit still works — the image upload button will just fail with an error toast; nothing else depends on this var. |

## Commands

- `npm run dev` — start the dev server (Next.js 16, Turbopack by default)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint via `eslint-config-next` (flat config in `eslint.config.mjs`)
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode; `npx vitest run path/to/file.test.tsx` for a single file)
- `npm run format` / `npm run format:check` — Prettier write / check

## Database

MongoDB Atlas, free/low tier (per spec Assumptions). No local Mongo —
everyone points at the same Atlas cluster during the 2-week delivery
(single shared dev database, per Scope: single-tenant app, small team).

Seed data: the 148-item canonical ingredient list lives in
`data/ingredients-seed-data.js`. It's also seeded automatically —
`instrumentation.ts` (`register()`) runs `lib/seedIngredients.ts` once when
the Next.js server starts: it counts global ingredients (`userId: null`)
and inserts the seed list only if none exist, logging either
`"Seeded ingredient list already present (N items)."` or
`"No initial ingredients list found. Inserted seeded ingredient list (N items)."`
A DB error here is logged, not thrown, so the server still starts against a
placeholder `MONGODB_URI` for UI-only work. To seed manually instead (e.g.
against a different environment), run
`node --env-file=.env.local scripts/seed-ingredients.mjs` — also idempotent,
upserts by ingredient name.

## Conventions

- **Route groups** `(auth)` and `(dashboard)` are folder-only, no URL
  segment — don't confuse this with the actual `/dashboard` sub-route.
- **Models**: every Mongoose schema uses `models.X || model("X", schema)`
  to survive Next.js hot reload without redefinition errors. Follow this
  pattern for any new model.
- **API routes**: co-locate under `app/api/<module>/route.ts`. Auth check
  first, then `connectDB()`, then the Mongoose call. See ARCHITECTURE.md
  for the auth boundary contract every route must follow.
- **Styling**: Tailwind only, using the CSS variables defined in
  `globals.css` (`bg-background`, `bg-surface`, `text-muted`, `bg-brand`,
  etc.) — don't hardcode hex colors in components, extend `globals.css`
  instead so the design stays consistent across the 3 devs' pages.
- **Icons**: `lucide-react`, already installed.
- **Commits**: Conventional-ish (`feat(module): ...`, `chore: ...`,
  `merge: ...`). Branch naming: `feature/<module>-<short-desc>`.

### Code style

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

### Page and Layout file conventions

All `page.tsx` and `layout.tsx` files in `app/` must follow these rules:

- Always export a `metadata` const of type `Metadata`
- Function names must end with **`Page`** for pages and **`Layout`** for layouts
- Contain no state management logic — no `useState`, `useReducer`, `useQuery`, `useEffect`, etc. directly in a page or layout file. Import and render a component from `features/` (see Feature-based architecture below) instead; the page's job is only to compose and display it.

### Component conventions

- Default to shadcn/ui primitives (added via `npx shadcn@latest add <name>`) for form elements, cards, dialogs, and similar UI — don't hand-roll a component shadcn already provides.
- Style with Tailwind utility classes; there are no CSS modules in this project.
- Always destructure props in the function signature.
- Named exports only. Never default exports — except `page.tsx`, `layout.tsx`, and `route.ts` files, which Next.js requires to be default exports (see Page and Layout file conventions above).

## Agent workflow

- Run the relevant verification commands (`npm run lint`, `npm test`, `npm run build`) at logical checkpoints, not after every single edit — before marking a task complete, before presenting results, or after a change that could plausibly affect compilation, types, or runtime behavior. Skip it for changes that can't break those (copy/label tweaks, comments, doc-only edits) unless bundled with other changes that do warrant it.
- Do not rewrite external dependency files, settings, or config (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `vitest.config.mts`, etc.) without explicitly notifying the user first — surface what's changing and why rather than silently editing them.

## Testing

Vitest + React Testing Library run via `npm test -- --run`. Tests currently
cover the root auth redirect and registration input validation. The spec's
full functional success measure remains a manual end-to-end check:
"signup → recipe → calendar assignment → shopping list → checklist."

## Documentation

- Be concise, specific, and value dense
- Give exported components and hooks a short comment describing their intended usage when it isn't obvious from the name and signature.
- Write so that a new developer to this codebase can understand your writing, don’t assume your audience are experts in the topic/area you are writing about.
- Keep `README.md` current as real setup steps, conventions, or gotchas emerge.

## Security

Auth routes live at `app/api/auth/[...nextauth]` and
`app/api/auth/register`. When adding or changing authenticated APIs:

- Validate all inputs server-side (API routes, server actions) — never trust client-supplied data.
- Use HTTP-only, secure cookies and CSRF protection for any session/auth flow; protect authenticated routes via middleware or explicit session checks, not client-side redirects alone.
- Never log secrets/tokens or commit `.env`/secret-bearing files.
- Do not modify auth without explicit instruction; if unsure about a migration, stop and ask.
