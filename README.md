# Meal Planner + Shopping List Generator

A Next.js app for planning meals and generating shopping lists.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No local MongoDB install needed — the app connects to a shared MongoDB Atlas cluster. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI` with the Atlas connection string (ask a teammate for the shared dev value). If startup fails with `querySrv ENOTFOUND ...`, your network/DNS is blocking the SRV lookup `mongodb+srv://` URIs need — see the fix in `.ai/FIXES.md`.

## Scripts

- `npm run dev` — start the dev server (Next.js 16, Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode)
- `npm run format` / `npm run format:check` — Prettier write / check
- `node --env-file=.env.local scripts/seed-ingredients.mjs` — seed the canonical ingredients collection (idempotent, safe to re-run)

## Stack

- Next.js 16 (App Router) + React 19, TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (base-ui primitives, not Radix)
- MongoDB for storage
- TanStack React Query for remote/server state, Zustand for local/client state
- Vitest + React Testing Library for tests

## Conventions

Project conventions — feature-folder structure, state management rules, code style, testing patterns — are documented in [AGENTS.md](./AGENTS.md). Read it before contributing.

## Project state

Early stage: the app currently renders a placeholder home page. MongoDB is connected with one seeded collection (canonical ingredients), but no API routes or meal-planning UI exist yet.
