# FIXES.md

> Reusable fixes only — problems likely to recur. Format: Symptom / Cause
> / Solution / Related. Skip one-off typos that won't happen again.

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
