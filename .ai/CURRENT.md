# CURRENT.md

> Update this file at the end of every work session. It's the first thing
> a teammate (or an AI agent) should read to pick up where you left off.
> Keep it short — details belong in TASKS.md / DECISIONS.md / FIXES.md.

## Objective (right now)

Set up context-engineering docs (this `.ai/` folder) so all 3 developers
and any AI coding agents have consistent project context before Week 1
module work starts.

## Recent work

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

1. Each dev checks out their `feature/*` branch and starts their Week 1
   user story (see TASKS.md for the exact breakdown).
2. Recipes and Calendar pages are still unbuilt (UI only exists for
   Login and Dashboard so far).
3. With ingredients seeded, Dev B can move on to the search/typeahead API
   and US-2/US-3/US-4 recipe CRUD.

## Validation state

- `npx tsc --noEmit` — clean.
- Manually verified `/login` and `/dashboard` render correctly via a
  running dev server (checked actual HTML output, not just source).
- No automated tests exist yet (see DEVELOPMENT.md Testing section).
- API routes are still stubs (`{message: "... not yet implemented"}`) —
  none of the 5 modules' actual CRUD logic is built yet, only the models
  and folder scaffolding.
