## Calendar module (US-5/US-9): scope, date modeling, and library choice

Implemented weekly navigation and recipe assignment: `GET/POST /api/calendar`
(read a week's assignments, assign-or-replace a recipe into a slot),
`DELETE /api/calendar/[id]` (remove one assignment), and the Weekly Plan
screen (`/calendar`). Several scope calls made during planning, recorded
here:

- **`date-fns` was added as a new dependency** for week-boundary math
  (`startOfWeek`, `addDays`, `addWeeks`, `format`). No date library existed
  in `package.json` before this — `date-fns` was chosen over `dayjs`/
  `luxon`/hand-rolled math for being the most widely used, tree-shakeable,
  timezone-simple option for this exact use case (pure calendar-day
  arithmetic, no timezone-aware parsing needed). It's used only for date
  math, not as a UI calendar widget — DESIGN.md's grid (Section 28) has an
  exact custom layout that a packaged calendar-UI library (e.g.
  `react-big-calendar`, FullCalendar) would fight rather than help with, so
  the grid itself is hand-built with Tailwind like every other screen.
- **A calendar day is stored as a plain `"YYYY-MM-DD"` string
  (`lib/dateWeek.ts`'s `toDateKey`/`fromDateKey`), never a `Date`/timestamp.**
  A calendar day has no time-of-day or timezone component; parsing a key
  back to a `Date` always constructs it in local time (`new Date(y, m, d)`),
  never via `new Date(string)` (which parses as UTC and can shift the date
  by a day depending on the reader's timezone). This sidesteps an entire
  class of off-by-one-day bugs at the cost of not being able to do native
  Mongo date-range queries — acceptable at this dataset size per
  ARCHITECTURE.md §36.
- **Weeks are Monday-Sunday** (`WEEK_STARTS_ON = 1` in `lib/dateWeek.ts`),
  matching DESIGN.md Section 28's `Mon...Sun` grid exactly. Every week
  boundary (server validation, client navigation, "Today" button) computes
  through this same constant so a week is never computed two different ways.
- **Assigning to an occupied slot replaces the recipe via upsert, not a
  separate "replace" code path.** `POST /api/calendar` always
  `findOneAndUpdate({userId, date, mealSlot}, ..., {upsert: true})` — ARCHITECTURE.md
  section 9 defines replacement as the expected behavior for an occupied
  slot, so there's no meaningful distinction between "first assignment" and
  "replacement" for the API or the assign-dialog UI to special-case.
- **Empty calendar cells render with no visible icon/affordance**, even
  though they're clickable — DESIGN.md Section 28 explicitly says "Do not
  render a placeholder icon or 'add meal' affordance." The cell is a
  full-size button with only a subtle hover/focus background, satisfying
  both the design constraint (blank by default) and Section 35's
  requirement that every interactive element have a hover/focus state.
- **The meal chip's kebab menu ("Change"/"Remove") is a small hand-rolled
  popover** (open state + click-outside-to-close), not a shadcn/base-ui
  dropdown-menu primitive — no `dropdown-menu.tsx` exists in
  `components/ui/` yet, and adding one was judged out of scope for a
  two-action menu. If a second in-app menu of this kind is needed, add the
  shadcn primitive instead of a third hand-rolled copy.
- **Removing a calendar assignment has no confirmation dialog** — unlike
  recipe/ingredient deletion, ARCHITECTURE.md doesn't call for one here, and
  the action is low-stakes (re-assigning a slot is one click).
- **Recipe-delete's affected-calendar-day warning + cascade
  (ARCHITECTURE.md §22) was implemented in a first pass, then explicitly
  reverted at the user's request** to keep this session's change scoped to
  the Calendar module only, without touching the Recipe module's delete
  flow. As a result, deleting a recipe that's still assigned to the
  calendar currently leaves those assignments in the database pointing at a
  now-deleted recipe (`GET /api/calendar` silently drops any entry whose
  `recipeId` no longer resolves, so it just disappears from the grid rather
  than erroring) — tracked in KNOWN_ISSUES.md as a gap for whoever next
  touches recipe delete.
- **Clicking a meal chip's name/prep-time area opens a read-only recipe
  details dialog** (`RecipeDetailsDialog`), separate from the kebab menu's
  Change/Remove actions. Added a calendar-local
  `features/calendar/hooks/useRecipeDetails.ts` rather than reusing
  `features/recipes/hooks/useRecipe` — that hook has no `enabled` guard,
  and the details dialog is always mounted (only its `open` prop toggles),
  so an unguarded query would fire a wasted `/api/recipes/` fetch with an
  empty id on every calendar page load. The new hook calls the same
  `fetchRecipe` from `lib/api/recipes` and shares its `["recipes",
  "detail", id]` query-key prefix, so the cache still stays in sync with
  the Recipes page.
- **The Calendar UI reuses the existing recipe search API directly**
  (`useRecipes` imported from its hook file, not the `features/recipes`
  barrel) for the assign-recipe dialog's picker, rather than adding a
  calendar-specific recipe list endpoint — same reasoning as ARCHITECTURE.md's
  "Search boundary" for ingredients (don't reimplement search in a
  different module). Imported directly from the hook file rather than
  through `features/recipes/index.ts` because that barrel also exports
  `RecipesScreen` (a Server Component whose module graph pulls in `@/auth`
  → `mongoose`), which would break the calendar page's client bundle — see
  FIXES.md.

## Recipe module (US-2/US-4): scope, cascade deferral, and UI adaptations

Implemented recipe create (`POST /api/recipes`), list+search
(`GET /api/recipes`), single fetch/edit/delete
(`GET`/`PATCH`/`DELETE /api/recipes/[id]`), and the Recipe Library +
Create/Edit Recipe screens. Several scope calls made during planning,
recorded here:

- **Recipe ingredient rows use exactly the unit set defined in
  `.ai/Unit_Conversion_Algorithm_Spec.md`'s `RecipeIngredientEntry`**
  (`tsp/tbsp/cup/fl_oz/ml/l/oz/lb/g/kg/whole`), not a UI-only unit list,
  so the not-yet-built shopping-list module (US-7) can consume stored
  recipe data without a migration. The Create/Edit Recipe form restricts
  the unit dropdown to `whole` only for count-family ingredients and all
  10 weight/volume units otherwise (cross-family entry, e.g. "2 tbsp
  sugar" for a weight-family ingredient, is a deliberate feature of the
  conversion spec, not a bug to block) — but the server only validates
  that the unit is one of the 11 known values, not that it matches the
  ingredient's family, since the spec explicitly allows the mismatch.
- **Recipe delete does not warn about affected calendar days or cascade
  calendar-assignment removal**, unlike what ARCHITECTURE.md §22
  describes. The Calendar module doesn't exist yet (no `calendar-entry`
  model, no calendar API on this branch), so there are no assignments
  that could exist to check against — the client shows a generic "this
  cannot be undone" confirmation instead. This mirrors the exact
  reasoning already accepted for deferring ingredient delete (see below)
  and should be upgraded to a real affected-day-count warning + cascade
  once Calendar is built.
- **No recipe image field or upload.** ARCHITECTURE.md's Recipe fields
  (§7) are name/servings/ingredients only, and DESIGN.md's Create Recipe
  form (§29.1–29.3) has no image input — only the Recipe Card mockup
  (§22–27) shows an image, with an explicit empty-placeholder state
  (§27) for when one is absent. Recipe cards always render that
  placeholder; adding real image upload would need storage
  infrastructure nothing in the spec calls for.
- **No separate recipe description field.** The Recipe Card mockup shows
  descriptive text under the title, but nothing in
  `MEAL_PLANNER_REQUIREMENTS.md`/ARCHITECTURE.md defines a free-text
  description on the Recipe model. Card descriptions are derived at
  render time from the recipe's own ingredient names (first four, joined)
  instead of adding an unmodeled field.
- **Recipe Library sidebar filters are derived from tags actually in use
  across the user's own recipes**, not DESIGN.md's mockup categories
  (`Favorites`, `Quick Meals`, `Vegetarian`, `Meal Kits`) — those aren't
  backed by any feature in the requirements (no favoriting exists
  anywhere in scope), so hard-coding them would be decorative-only.
  "All Recipes" plus one filter chip per distinct tag keeps the same
  visual structure while staying grounded in real data.
- **Recipes have no global/seeded scope, unlike ingredients** — every
  recipe is private to its creator (ARCHITECTURE.md "User Data
  Isolation" / §18 Data Ownership). Consequently `GET`/`PATCH`/
  `DELETE /api/recipes/[id]` return **404, not 403**, for a recipe that
  exists but belongs to another user — existence itself must stay
  private, unlike ingredients (where a global/other-user record is at
  least visible via search, so 403 doesn't leak anything new).
- **Duplicate ingredient rows within one recipe are rejected client-side**
  (and via server validation) rather than silently merged — a recipe
  referencing the same canonical ingredient twice is more likely a UI
  mistake than an intentional two-line recipe, and merging would need an
  arbitrary rule (sum quantities? require matching units?) the spec
  doesn't define.
- **`features/recipes/components/recipe-form.tsx` imports
  `IngredientCombobox` directly from its component file, not the
  `features/ingredients` barrel** — see FIXES.md; the barrel also
  re-exports `IngredientsScreen`, whose module graph pulls in `@/auth` →
  `mongoose`, which broke `npm run build` when imported from this Client
  Component.

## Custom ingredients feature (US-3): CRUD scope, duplicate handling, standalone page

Implemented search/typeahead (`GET /api/ingredients`), create (`POST`), and
update (`PATCH /api/ingredients/[id]`) for canonical ingredients, plus a
reusable `IngredientCombobox` and a standalone `/ingredients` page. Several
scope calls made during planning, recorded here:

- **Delete is intentionally not implemented.** Only create + update
  shipped this pass. Rationale: the Recipe module doesn't exist yet, so
  there's no way to check whether a recipe references an ingredient before
  deleting it (the same reference-check ARCHITECTURE.md §22 requires for
  recipe deletes). Adding delete now would mean either skipping that check
  (unsafe once Recipes exists), or building it speculatively against a
  Recipe model that doesn't exist yet — both worse than just deferring.
  Tracked as a known gap in KNOWN_ISSUES.md for whoever builds Recipes.
- **Editing an ingredient always shows a confirmation warning first**
  ("Updating this ingredient will affect any recipe that already uses it")
  before the `PATCH` fires, client-side, via an `AlertDialog` step in
  `ingredient-form-dialog.tsx`. This is **generic text, not an actual
  affected-recipe count** — computing a real count needs the Recipe model,
  which doesn't exist yet. When Recipes is built, upgrade this to a live
  count the same way recipe-delete already warns with an affected-days
  count (ARCHITECTURE.md §22).
- **Duplicate handling returns 409 with the existing ingredient**, rather
  than letting the unique index throw a raw duplicate-key error. Both
  `POST` and `PATCH` proactively `findOne(...).collation({strength: 2})`
  before writing, matching the existing case-insensitive, per-scope
  uniqueness rule (see "Decisions resolved for this plan" below). This
  keeps the duplicate-key index as a safety net for races, not the
  primary UX path.
- **Ownership rule for edit:** only the ingredient's own creator can
  `PATCH` it. Global ingredients (`userId: null`) and other users'
  ingredients return `403`. This preserves the existing accepted risk
  (bad seeded data has no in-app correction path — manual DB edit is
  still the stopgap) rather than opening a new correction surface.
- **Added a standalone `/ingredients` page, ahead of DESIGN.md.**
  DESIGN.md's reference screens only show ingredient search/create
  embedded inside the not-yet-built Create Recipe screen (§29.2) — there
  is no "manage ingredients" screen in the design spec. Built one anyway
  (explicit user request) so custom ingredients are directly usable
  before Recipes exists. It reuses the same visual tokens/patterns as the
  spec'd screens (card list, primary button, search field) but is not
  itself a spec'd reference screen — don't treat its exact layout as a
  DESIGN.md contract the way the other screens are. `AppNav`'s nav items
  were initially left unchanged (DESIGN.md §7 fixed them to
  Dashboard/Recipes/Calendar/Shopping List), page reachable by direct URL
  only. **Superseded on explicit request**: added `Ingredients` to
  `AppNav` (`features/app-shell/components/app-nav.tsx`), positioned 2nd —
  right after Dashboard, ahead of Recipes — since ingredients are a
  prerequisite for building recipes; updated DESIGN.md §7 to match, so
  the page is now reachable from the persistent top nav on every
  authenticated screen.
- **`IngredientsScreen` is a Server Component; the interactive parts live
  in a nested `IngredientsManager` client component.** Putting the search/
  dialog state directly in a `"use client"` `IngredientsScreen` (which
  also renders `AppNav`) pulled `@/auth` — and therefore `mongoose`/
  `mongodb`, which use Node built-ins like `tls` — into the client bundle
  and broke the production build. See FIXES.md for the exact error.

## Ingredient list pagination + scope filter

The `/ingredients` page originally called the same `GET /api/ingredients`
endpoint the typeahead combobox uses, which capped results at 50 — with
148 seeded ingredients alone, the list was never showing everything.
Fixed by splitting the two use cases:

- **`GET /api/ingredients` now returns `{ items, nextCursor }`** instead
  of a flat array, using offset pagination (`cursor`/`limit` query
  params, default `limit=20`, capped at 100 server-side). The handler
  fetches `limit + 1` documents to know whether another page exists
  without a separate count query. Sort is `{ name: 1, _id: 1 }` (the
  `_id` tiebreaker keeps ordering stable across pages when names repeat
  or ties occur).
- **Offset (`skip`/`limit`), not a cursor encoding the last document.**
  Simpler to reason about and implement, and fine at this dataset size —
  see ARCHITECTURE.md §36 ("MVP is designed for a relatively small
  dataset... do not prematurely introduce complex optimization"). If the
  ingredient list grows enough for `skip` to become a real cost, switch
  to a keyset cursor (`{name, _id} > lastSeen`) then, not now.
  Not paginated further — reuse over the composite `{ name: 1, _id: 1 }`
  index already implied by the current sort — an explicit index isn't
  added yet since it isn't needed at seed-list scale; add one if the
  collection grows large enough for `.sort()` to need it.
- **`scope` query param (`all` | `custom` | `global`, default `all`)**
  narrows the filter to just the user's own ingredients or just the
  seeded set. Exposed in `IngredientsManager` as a 3-way toggle
  (All / My Ingredients / Global), styled per DESIGN.md §32's "Toggle /
  selectable tag" pattern.
- **`useIngredientSearch` (combobox) stays a flat top-N list, not
  paginated** — the recipe-picker typeahead is meant to narrow via
  search, not scroll through the whole list, so it just requests
  `limit=20` and takes `.items`. Only the standalone `/ingredients` page
  got a new `useInfiniteIngredients` hook (`useInfiniteQuery`) + an
  `IntersectionObserver` sentinel at the bottom of the list to
  auto-load the next page — real infinite scroll, not a "Load more"
  button.
- Added a clear ("×") button to both search inputs (`ingredients-manager.tsx`
  and `ingredient-combobox.tsx`) so clearing a search doesn't require
  backspacing manually; it resets both the raw and debounced query state
  immediately (no need to wait out the 300ms debounce).

## DESIGN.md coverage + globals.css token mapping

`DESIGN.md` originally listed all 6 reference screenshots but only documented
Dashboard and Recipe Library in detail; Login, Calendar, Create Recipe, and
Shopping List were referenced but never specified. Added full sections for
all four (renumbered the doc; no external references to the old section
numbers existed). Also retuned `app/globals.css`'s shadcn/Tailwind CSS
variables (`--primary`, `--background`, `--border`, etc., previously
shadcn-default `oklch(...)` values) to the exact hex values from `DESIGN.md`
Section 2, with an explicit mapping table added as Section 2.3.

**Rationale:** components should style via semantic Tailwind classes
(`bg-primary`, `text-foreground`, ...) backed by `globals.css`, not hex
literals — so `globals.css` needs to actually match the spec for that to
work. Two shadcn slots have no 1:1 equivalent in `DESIGN.md`'s token list and
required a judgment call: `--muted-foreground` was mapped to
`--color-text-secondary` (`#41536A`) rather than `--color-text-muted`
(`#68798D`), since shadcn uses that slot broadly (labels, descriptions) and
the lighter value risked failing contrast in more contexts; `--ring` (focus
ring) was mapped to `--color-primary` (`#006C49`) since `DESIGN.md` has no
dedicated focus-ring token and the brand green is the visible-focus color
implied by Section 35 (Interaction States). Dark mode (`.dark` block) was
left untouched and flagged with a comment — `DESIGN.md` Section 1 describes a
light-only aesthetic and no reference screenshot shows a dark variant, so
inventing dark-mode values would be exactly the kind of unrequested
extrapolation `DESIGN.md`'s Agent Implementation Rules warn against.

If this mapping ever needs to change, update both files together —
`DESIGN.md` Section 2.3 documents the pairing so they don't drift.

## Auth approach

Standard email + password login (bcrypt for hashing, NextAuth.js for
session management, same stack decided earlier in this project) — no
external identity provider, no protocol negotiation, no dependency on
another team's ticket queue.

Implementation uses NextAuth v5 credentials with encrypted HTTP-only JWT
session cookies. MongoDB stores only normalized lowercase email addresses and
bcrypt password hashes (cost 12); `session.user.id` is populated from the JWT
subject so future server routes can scope queries without accepting a client
user ID. Registration auto-signs in and redirects to `/dashboard` to avoid a
redundant second credential entry.

**Trade-off:** self-service accounts bring password reset back into scope Password reset is scoped as **time-permitting, not committed** — see the cut list.

## Decisions resolved for this plan

A real team can't proceed on ambiguous decisions the way a solo exploratory
build can. Two are resolved here explicitly:

- **Canonical ingredient list is hybrid: seeded set is global, user-created
  ingredients are private to their creator.** One collection, distinguished
  by a nullable `userId` (`null` = seeded/global, set = user-created).
  Typeahead search queries both scopes together
  (`userId: null OR userId: currentUser`). This meaningfully narrows QA
  review item #4 (no way to fix a bad canonical ingredient): a bad
  user-created entry now only affects the user who made it, not everyone —
  the remaining exposure is an error in the 148-item seeded list itself,
  which is curated once from real sources and much lower-probability than
  arbitrary user input.
- **User identity = a self-registered email/password account.** Signup and
  login flows are back in scope as a direct consequence — they're both
  Must-haves already covered under Authentication in the feature list.
  Password reset specifically is the one piece treated as conditional (see
  cut list) rather than committed, given the fixed 2-week window.
  |

## Features cut or simplified, and why

1. **Cross-family unit conversion (density-based) — cut to same-family-only.**
   Already the single most complex piece of the system (three-step
   pipeline, density curation, degradation logic). The shopping list still
   works without it — just less polished for dry goods measured by volume.
   Highest complexity-to-value ratio item on the list; first thing to go
   under a fixed deadline.
2. **Near-duplicate ingredient check — simplified, not fully dropped.**
   Full fuzzy matching is still cut (no algorithm was ever defined for this —
   QA review item #5 — and designing one properly is scope discovery, not
   implementation). What remains is a cheap, exact-match safeguard: before
   creating a new ingredient, check whether one with the same name (trimmed,
   case-insensitive) already exists in the seeded set _or_ this user's own
   ingredients. This has to be an application-level check, not a flat
   database unique index — a flat index would incorrectly block two
   different users from independently creating the same ingredient name,
   which is valid under the hybrid (per-user) scoping. Still a few hours of
   work, not a redesign — added to Dev B's Week 1 scope below.
3. **Repeat-recipe-across-days — deferred to v2.** Pure convenience; manual
   repeated assignment produces the identical result, just more clicks.
4. **Rollback-safe cascade delete — simplified to a blunt cascade, no
   transaction guarantee.** True atomicity needs Mongo transactions or a
   saga pattern — disproportionate effort for a Should-have. The failure
   mode (an orphaned entry, QA review item #8) is rare and operationally
   fixable if it happens.
5. **Rounding to nearest 5g/5ml with kg/L switching — dropped, plain decimal
   display instead.** Already a Could-have, and the QA review (item #2)
   showed it actively produces wrong-feeling output on small quantities
   (0.5g of cumin rounding up to 5g). Cutting it removes the effort and the
   bug in one move.
6. **"Unmerged line" degradation logic — moot.** Only existed to handle
   missing density; with cross-family conversion cut, there's no
   missing-density case left to degrade from.
7. **Password reset — deferred, not attempted this sprint.** Self-service accounts need their own
   recovery path, but building one (token generation, email delivery,
   expiry handling) is real scope on top of an already full two weeks.
   Explicitly not a stretch goal for anyone on the team — MVP and the core
   pipeline take priority, and treating this as "maybe if time allows"
   risks it quietly competing with actual Must-have work in Week 2. See
   the accepted risk below for the interim stopgap.

## What's still realistically in scope

All 16 original Must-have features, plus delete-warning UI (just the
confirmation dialog, not the transactional safety) and empty-state
handling — both cheap relative to their value, no reason to cut them.

This is a materially complete, correctly-scoped MVP for a fixed 2-week team
delivery — narrower than the original solo plan in exactly the two places
(unit conversion, fuzzy matching) that were already the riskiest,
least-specified parts of the system.

## Accepted risk: no correction path for bad seeded ingredient data

QA review item #4 (no way to fix a bad canonical ingredient once created) is
substantially narrowed by the hybrid scoping decision above, but not fully
resolved: a bad _user-created_ ingredient now only affects the user who made
it, but the 148-item _seeded_ set is still global, and there's no in-app way
to correct a seeded entry if an error is found post-launch. Building that
correction UI is real scope, not a tweak, and doesn't fit the 2-week window.
This is being carried forward as an **explicitly accepted risk**, not a
silent gap: the stopgap is a direct database edit by whoever has Atlas
access, until there's time to build a proper fix. Given the seeded data was
sourced and spot-checked (see `MEAL_PLANNER_REQUIREMENTS.md` >
"Ingredient Seed Data"), this is a low-probability risk, not a likely one.

## Accepted risk: no password reset this sprint (QA review item #6)

Unlike the other items in the cut list, this one isn't just "less polished
without it" — a user who forgets their password and has no reset flow loses
permanent access to their account, and everything in it. This was flagged
in the QA review before the SSO-to-email/password switch, and moving off
SSO reintroduced it directly. It's now confirmed deferred for this delivery,
not a stretch goal — MVP and the core pipeline take priority within the
2-week window. Stopgap for this sprint: a manual "reset this user's
password" path via direct database access, same pattern as the
ingredient-correction stopgap above. Worth stating this explicitly at
delivery rather than letting it surface as a surprise the first time someone
gets locked out.
