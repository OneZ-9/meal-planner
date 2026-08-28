# FIXES.md

> Reusable fixes only — problems likely to recur. Format: Symptom / Cause
> / Solution / Related. Skip one-off typos that won't happen again.

---
### A recipe ends up with a "duplicate" ingredient (same name, twice)
**Symptom**: While creating/editing a recipe, using the inline "create new
ingredient" flow (search finds no match → Create) and then saving, the
recipe ends up referencing the same-named ingredient twice — visible as two
identical-looking rows in the Create/Edit Recipe form, or as a repeated line
when viewing the recipe elsewhere (e.g. `RecipeDetailsDialog` in the
Calendar module, which lists `recipe.ingredients` keyed by `ingredientId`
with no name-based dedup).
**Cause**: A fast double-click (or Enter-then-click) on "Create ingredient"
can fire the dialog's submit handler twice before React re-renders with
`isSubmitting: true` and disables the button — the `disabled` prop only
takes effect a tick *after* the click that triggered it, leaving a real
window for two `POST /api/ingredients` requests. Each create gets a
different `_id`, so `recipe-form.tsx`'s ingredient-row dedup (which checks
`ingredientId`, correctly, since two different ingredients could coincide by
name across users) can't recognize "two ingredient records with the same
name" as the same thing. The database's unique index
(`{userId,name}`) is the intended last line of defense, but relying on it
alone to *silently* prevent the second write is fragile — it only turns the
race into a 409 error timing-dependently; the real fix is not letting the
double-request happen in the first place. The identical race exists on
"Save Recipe" itself (a fast double-click could send two
create/update-recipe requests).
**Solution**: Added a synchronous double-submit guard using a `useRef`
(not `useState` — state updates aren't visible until the next render, so
they can't close this specific race window) in both
`features/ingredients/components/ingredient-form-dialog.tsx` (its
create/edit submit handlers) and `features/recipes/components/recipe-form.tsx`
(`handleSubmit`). The ref is set `true` synchronously the instant a submit
starts, checked at the top of the handler to reject a same-tick re-entrant
call, and cleared once the mutation actually settles (success *or* error —
so a legitimate retry after a failed submit still works). **Important**:
refs must only be written inside effects or event handlers, never during
render — the existing "adjust state during render" pattern in this
codebase (e.g. `ingredient-form-dialog.tsx`'s `wasOpen` reset block) is
specifically sanctioned for *state*; doing the same to a ref trips the
`react-hooks/refs` ESLint rule and is unsafe under React's rendering
model (a render can be discarded/retried). Use a `useEffect` keyed on the
value you're reacting to instead.
**Live-tested against the real Atlas cluster (this repro theory only
partially confirmed)**: fired two genuinely concurrent
`POST /api/ingredients` requests for the same new name — the app-level
`findOne`-then-`create` check plus the DB's unique index correctly produced
exactly one `201` and one `409`, with only one document ever persisted. A
full create-ingredient → create-recipe → fetch-recipe round trip also came
back clean (single ingredient, single recipe, no duplication) — see
`.ai/CURRENT.md`'s "Bugfix" entry for the exact reproduction commands. So
the specific "two Ingredient documents with the same name" failure mode
described above did **not** reproduce server-side in this environment; the
DB-level protection held under a direct race test. The double-submit guard
is still a real, worthwhile fix (it prevents the double request from firing
at all, rather than depending on 409-timing luck), but it should be treated
as a defensive hardening pass, not a confirmed root-cause fix, until someone
can reproduce the original report with a browser open (Network tab) to see
what actually differs — e.g. a stale/duplicated item rendered from React
Query cache, or a browser-specific double-fire this environment's manual
`curl` race couldn't trigger.
**Related**: DECISIONS.md "Recipe module (US-2/US-4)" (the id-based
ingredient-row dedup), the ingredient duplicate-check entries in
DECISIONS.md/KNOWN_ISSUES.md.

---
### GitHub push fails: "Password authentication is not supported"
**Symptom**: `git push` fails with
`remote: Invalid username or token. Password authentication is not supported for Git operations.`
**Cause**: GitHub removed password auth for git operations; a plain
password in a credential prompt no longer works.
**Solution**: Use a Personal Access Token in place of a password, or (on
Windows, easier) let Git Credential Manager handle it — the credential
popup has a "Sign in with your browser" option that does OAuth instead
of requiring a manually-created token. Click it, authorize in the
browser tab that opens, return to the terminal.
**Related**: DEVELOPMENT.md (git workflow).

---
### `git remote add origin` fails: "remote origin already exists"
**Symptom**: `error: remote origin already exists.`
**Cause**: A remote named `origin` was already set (e.g. from a prior
`git init` in a different environment, or a leftover from cloning).
**Solution**: `git remote set-url origin <correct-url>` instead of `add`.
Always run `git remote -v` first to see what's actually there before
changing it.
**Related**: n/a.

---
### Downloaded project zip is missing recently-added pages
**Symptom**: Extracted project folder is missing a page/folder that was
supposedly just added (e.g. `(dashboard)/dashboard/` folder absent even
though other sibling folders exist).
**Cause**: The deliverable zip was re-generated under the same filename
multiple times across a session; a browser or download manager served a
cached copy from an earlier version instead of the latest.
**Solution**: Re-download using a distinct filename (e.g.
`meal-planner-v3.zip`) to force a fresh download, then delete the old
extracted folder entirely and extract fresh — don't extract over the old
folder, since leftover files can mix versions silently.
**Related**: n/a.

---
### Browser shows default Next.js/Vercel starter page instead of the app
**Symptom**: `localhost:3000` shows "To get started, edit the page.tsx
file" instead of the actual app.
**Cause**: Either (a) `npm run dev` was run from the wrong folder — a
separate, empty `create-next-app` project — or (b) another dev server is
already bound to port 3000 from an earlier session and the browser is
hitting that stale process instead of the new one.
**Solution**: Confirm the terminal's working directory matches the real
project (check for `package.json` and `src/app/(dashboard)/` in `ls`).
If correct, check for a leftover process on port 3000 from another
terminal (`Ctrl+C` it) before retrying `npm run dev`.
**Related**: n/a.

---
### `npx tsc --noEmit` fails with "Cannot find name 'LayoutProps'"
**Symptom**: Typecheck fails on `app/layout.tsx` referencing
`LayoutProps<"/">` with `Cannot find name 'LayoutProps'`.
**Cause**: `LayoutProps` is a Next.js-generated type that only exists
after route types have been generated; a fresh `npm install` / clean
`.next` doesn't have it yet.
**Solution**: Run `npx next typegen` once before typechecking (or just
run `npm run dev` / `npm run build` once, which generates it as a
side effect), then re-run `npx tsc --noEmit`.
**Related**: DEVELOPMENT.md (Build / lint / typecheck).

---
### `convert-units` has no bundled TypeScript types
**Symptom**: `npx tsc --noEmit` errors on `lib/unitConversion.ts`:
`Could not find a declaration file for module 'convert-units'`.
**Cause**: The `convert-units` npm package ships without a `.d.ts`.
**Solution**: `npm install -D @types/convert-units` — a community
type-defs package exists and covers it.
**Related**: DECISIONS.md (same-family unit conversion). **Update**: this
never ended up applying — when Shopping List was actually built, the
conversion ratios were hand-rolled instead of using `convert-units`, to
match `Unit_Conversion_Algorithm_Spec.md`'s verified test cases exactly.
See DECISIONS.md "Shopping List generation (US-7/US-8)".

---
### Server startup fails with `querySrv ENOTFOUND _mongodb._tcp.<cluster>.mongodb.net`
**Symptom**: On `npm run dev`, ingredient seeding (or any DB call) logs
`Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.xxxxx.mongodb.net` with
`syscall: 'querySrv'`. Only happens on some devs' machines, not others,
even though everyone shares the same `MONGODB_URI` (per DEVELOPMENT.md,
there's no local Mongo — everyone points at the same Atlas cluster).
**Cause**: `mongodb+srv://` connection strings require resolving a DNS
**SRV** record, not just a normal A/AAAA lookup. Some networks/VPNs/
routers/ISP DNS resolvers silently drop SRV and TXT queries, so the
`mongodb+srv://` host never resolves — this is a local network/DNS issue
on that dev's machine, not a MongoDB installation problem (no local
MongoDB install is needed at all; the app only ever talks to Atlas).
**Solution**: Have that dev try switching their machine's DNS to
`8.8.8.8`/`1.1.1.1` or turning off any VPN, or (more robust) swap in
Atlas's non-SRV **standard connection string** (Atlas → Connect →
Drivers → "Standard connection string", format
`mongodb://host1,host2,host3/...`) for their own `.env.local` — it skips
the SRV DNS lookup entirely. Also confirm their IP is allowlisted under
Atlas → Network Access (or "Allow access from anywhere" is enabled for
the shared dev project), since that's the next failure they'll hit once
DNS resolves.
**Related**: DEVELOPMENT.md (Database), README.md (Getting started).

---
### `npm run build` fails with "Module not found: Can't resolve 'tls'" (or 'net', 'fs', etc.)
**Symptom**: `next build` errors deep in `node_modules/mongodb/lib/...`
with `Can't resolve 'tls'`, and the import trace ends at a feature
screen component, e.g. `./features/<feature>/components/<screen>.tsx
[Client Component Browser]` → `./auth.ts [Client Component Browser]`.
**Cause**: A screen component had `"use client"` at the top (because it
holds `useState`/React Query hooks) *and* also directly rendered
`<AppNav />`, which imports `signOut` from `@/auth`. `@/auth` pulls in
`lib/mongodb.ts` → `mongoose` → `mongodb`, which use Node-only built-ins
that don't exist in a browser bundle. Once the screen file is a Client
Component, everything it statically imports — including `AppNav` even
though `app-nav.tsx` itself has no `"use client"` — gets pulled into the
client bundle too.
**Solution**: Keep the top-level screen component (the one that renders
`<AppNav />`) as a Server Component (no `"use client"`), same as
`DashboardScreen`. Move any state/hooks into a separate nested
`"use client"` component that does *not* import `AppNav` or anything
else that transitively imports `@/auth`. See
`features/ingredients/components/ingredients-screen.tsx` (server shell)
vs. `ingredients-manager.tsx` (client content) for the pattern.
**Related**: PROJECT.md (state management), DECISIONS.md (custom
ingredients feature).

---
### `npm run build` fails with "Module not found: Can't resolve 'tls'" — variant: importing a plain constant from a model file
**Symptom**: Same `tls`/mongoose error as above, but the import trace ends
at a `lib/models/<x>.ts` file rather than `@/auth` — e.g.
`./lib/models/calendarEntry.ts [Client Component Browser]` imported from a
`"use client"` component that only wanted a small exported constant/type
(e.g. `MEAL_SLOTS`), not the Mongoose model itself.
**Cause**: `lib/models/*.ts` files start with
`import { Schema, model, models, ... } from "mongoose";` — importing
*anything* exported at runtime from that file (not `import type`) evaluates
the whole module, including the Mongoose import, in whatever bundle does
the importing. A client component doing `import { MEAL_SLOTS } from
"@/lib/models/calendarEntry"` pulls Mongoose into the browser bundle even
though it never touches the schema/model export.
**Solution**: Don't export plain constants/types that client code needs
directly from a `lib/models/*.ts` file. Put them in a small model-free
module instead (e.g. `lib/mealSlot.ts`) and have the model file import
*from* that module for its schema `enum`, re-exporting it for convenience
if server code wants a single import path. Client components import the
model-free module. A `import type { X } from "@/lib/models/..."` (type-only)
is always safe regardless, since TypeScript elides it entirely — this only
bites *value* imports (constants, enums-as-objects, functions).
**Related**: The `@/auth` variant above; DECISIONS.md "Calendar module
(US-5/US-9)".

---
### `npx vitest run` now works on this machine — previously-unrun tests exposed two real bugs
**Symptom**: Every prior session (auth/ingredients/recipes/calendar) noted
`npx vitest run` failing to start with `Cannot find native binding...` (a
Vitest 4 `rolldown` optional-dependency issue) and verified new test files
by reading only. As of the recipe-delete-cascade session, `npx vitest run`
starts and completes normally (97 tests, 13 files) with no reinstall or
Node version change — cause of the fix is unknown; it may have been an
`npm`/rolldown release update pulled in by an unrelated `npm install`.
**What running the suite for the first time found**: (1)
`app/api/recipes/route.test.ts` and `app/api/recipes/[id]/route.test.ts`
both mocked `@/lib/models/recipe` with only `{ RecipeModel: {...} }`,
omitting the module's `RECIPE_UNITS` value export that
`lib/recipeValidation.ts` imports at runtime — every POST/PATCH test that
reached validation crashed with "No RECIPE_UNITS export is defined on the
mock." (2) `lib/recipeValidation.ts`'s tag dedup used `new Set(...)`,
which is case-sensitive, so `["Dinner", "dinner"]` produced two tags
instead of one — the test for this (written the same session as the
feature, never executed until now) caught it immediately.
**Solution**: For the mock gap, use `vi.mock("@/lib/models/recipe", async
(importOriginal) => ({ ...(await importOriginal()), RecipeModel: {...}
}))` instead of a bare object literal, so real value exports like
`RECIPE_UNITS` survive alongside the mocked `RecipeModel`. For the dedup
bug, dedupe by `tag.toLowerCase()` into a `Map` (keeps first-seen casing)
instead of a plain `Set`.
**Related**: Every prior `.ai/CURRENT.md` "Validation state" section
(tests "written but unverified by execution"); if this resurfaces on
another machine, `npm ci` in a clean checkout is the first thing to try
before assuming it's a real regression.
