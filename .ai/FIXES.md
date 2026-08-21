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
**Related**: DECISIONS.md (same-family unit conversion).
