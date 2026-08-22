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
