# Meal Planner + Shopping List Generator

A Next.js app for planning meals and generating shopping lists.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required yet — see `.env.local` if that changes.

## Scripts

- `npm run dev` — start the dev server (Next.js 16, Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode)
- `npm run format` / `npm run format:check` — Prettier write / check

## Stack

- Next.js 16 (App Router) + React 19, TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (base-ui primitives, not Radix)
- TanStack React Query for remote/server state, Zustand for local/client state
- Vitest + React Testing Library for tests

## Conventions

Project conventions — feature-folder structure, state management rules, code style, testing patterns — are documented in [AGENTS.md](./AGENTS.md). Read it before contributing.

## Project state

Early stage: the app currently renders a placeholder home page. No meal-planning domain logic, data layer, or additional routes exist yet.
