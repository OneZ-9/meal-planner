# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

Complete US-1 account registration, credentials login, persisted sessions,
authenticated dashboard access, and sign-out.

## Recent work

- Implemented US-1 authentication in this checkout: `/register` creates a
  normalized-email user with a bcrypt hash in MongoDB, then signs the user in;
  `/login` uses NextAuth credentials and redirects successful logins to
  `/dashboard`; `/dashboard` is protected server-side; the app nav signs out.
- Added the `User` Mongoose model (`users` collection, unique email index),
  Auth.js route handler/config, server-side registration validation, JWT session
  user IDs, auth UI states, and unit coverage for registration validation and
  root redirects.
- Added `next-auth@5.0.0-beta.32` and `bcryptjs@3.0.3`; `.env.example` now
  documents `MONGODB_URI`, `AUTH_SECRET`, and `AUTH_URL`.

- Real MongoDB Atlas cluster is live (`meal-planner-live` DB, `MONGODB_URI`
  in `.env.local`). Ran `scripts/seed-ingredients.mjs` against it — verified
  148 global ingredients (`userId: null`) in the `ingredients` collection,
  unique `userId_1_name_1` index built. Ingredient module's data layer is
  ready; search/typeahead API and recipe CRUD still unbuilt.
- Scaffolded Next.js App Router project, all 5 Mongoose models, stub API
  routes for every module.
- Built `/login` page (real NextAuth wiring) matching the reference design.
- Built `/dashboard` page (placeholder data) + shared NavBar used by every
  `(dashboard)` route.
- Pushed to GitHub: `OneZ-9/meal-planner`, branches `main`, `develop`,
  `feature/auth-signup`, `feature/dashboard-overview`,
  `feature/ingredients-typeahead`, `feature/calendar-assign`.
- `.ai/DESIGN.md` now fully specifies all 6 reference screens (added Login,
  Calendar, Create Recipe, Shopping List — previously only Dashboard and
  Recipe Library were documented). `app/globals.css`'s shadcn CSS variables
  were retuned to match `DESIGN.md`'s exact palette (see DECISIONS.md); any
  page built from here on gets the correct colors automatically via the
  semantic Tailwind classes.
- Diagnosed a teammate's `querySrv ENOTFOUND _mongodb._tcp.<cluster>...`
  startup error: it's their machine's network/DNS blocking the SRV lookup
  `mongodb+srv://` needs, not a missing local MongoDB install (none is
  needed — everyone points at the shared Atlas cluster). Documented the
  fix in `FIXES.md` and clarified `README.md`'s "Getting started" section
  to say so explicitly instead of the misleading "requires a running
  MongoDB instance."
- `AGENTS.md`'s "After pulling/merging" section reworded: reconciling
  `.ai/` docs against incoming commits is now a standing, self-triggered
  step an agent runs automatically after any pull/fetch+merge/merge/
  rebase (or on noticing one already happened), not something that
  waits on a dev remembering to ask for it.

## Blocker

None currently.

## Next action

1. Set a strong `AUTH_SECRET` locally and in the deployment environment, then
   manually exercise registration/login against the intended Atlas database.
2. Apply `auth()` checks and `session.user.id` ownership filters to every
   user-owned API as recipe/calendar/shopping-list routes are implemented.
3. Recipes and Calendar pages remain unbuilt.

## Validation state

- `npx tsc --noEmit` and `npm run lint` — clean after the auth change.
- `npm test -- --run` passes (2 files, 5 tests); coverage includes registration
  validation and root auth redirects.
- `npm run build` passes; local HTTP smoke checks return 200 for `/login` and
  `/register`, and 307 `/login` for a signed-out `/dashboard` request. A live
  account-creation smoke test was intentionally not run against the shared DB.
- API routes are still stubs (`{message: "... not yet implemented"}`) —
  non-auth module CRUD is not built yet.
