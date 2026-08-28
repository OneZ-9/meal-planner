# Meal Planner + Auto Shopping List — QA Review: Edge Cases, Ambiguities & Failure Scenarios

Adversarial review of `MEAL_PLANNER_REQUIREMENTS.md`, conducted from a hostile
QA perspective: assume every gap will be hit by a real user, not just a
theoretical one. Ranked by risk = likelihood × impact, not by how interesting
each item is to discuss. Items 1, 2, and 5 are unfinished decisions the rest
of the system depends on, not true edge cases — recommended to resolve
before implementation starts, not during it.

---

### 1. Is the canonical ingredient list global or per-user? Never specified.

Every document calls it "a shared canonical list," but US-1 explicitly scopes
recipes, calendar entries, and shopping lists to the logged-in user — and
conspicuously does _not_ mention ingredients. If it's global, one user's bad
density value or sloppy near-duplicate ("Tomatoe" vs. "Tomato") corrupts the
experience for every other user on the platform. If it's per-user, "shared"
is the wrong word everywhere, and the seed script needs to run per-account,
not once. This is a schema decision the entire system is currently undefined
without — not an edge case.

### 2. The rounding rule silently wrecks every spice in every recipe.

"Round up to nearest 5g" applied to 0.5g of cumin produces "5g cumin" — a 10x
overstatement. Spices are in nearly every real recipe, in sub-5g quantities.
This isn't a rare edge case, it's the _typical_ case for an entire ingredient
category, and it directly undermines the one thing the product is supposed
to be better at than a human: accuracy.

### 3. Edit a recipe after partially checking off that week's list — then what?

Ordinary workflow: generate the list, check off sugar, then remember you're
doubling the recipe and go edit it. Does the checkmark survive? Reset? Go
silently stale against a now-wrong quantity? US-4 (live edits) and US-8
(checklist persistence) were each specified in isolation — their
intersection was never addressed, and it's not a rare intersection.

### 4. There's no way to fix a bad canonical ingredient once it exists.

Recipes got a careful, deliberate deletion story (warn, cascade, confirm).
Ingredients got nothing — no edit, no delete, no correction path.
Fat-finger a density value during creation and it's permanent, silently
degrading every recipe that ever references it, forever.

### 5. "Near-duplicate check" has no defined algorithm.

Flagged as genuinely risky for the _shopping-list merge_ earlier in this
project — too many false merges or false misses depending on threshold —
and deliberately avoided there. Then quietly re-introduced as a requirement
for ingredient creation with zero specification of what "near" means. Same
unsolved problem, just moved to a different part of the system.

### 6. No password reset. At all.

A locked-out user has no path back into their account, ever — total,
permanent loss of every recipe and meal plan they've built. Low frequency,
catastrophic severity when it hits.

### 7. No validation bounds on quantity.

Nothing stops `2000 tbsp sugar` (typo for `2`) from sailing straight through
the pipeline onto a shopping list. One fat-fingered entry produces an
obviously broken, trust-destroying result, and nothing in the spec catches
it.

### 8. Multi-step writes aren't guaranteed atomic.

Recipe deletion cascades across three things: the recipe, its calendar
entries, and the shopping list. MongoDB doesn't give that atomicity for
free. If step two fails after step one succeeds, the result is an orphaned
calendar entry pointing at a recipe that no longer exists — and nothing in
the requirements says what should happen then.

### 9. Week start-day and timezone are undefined.

Does the week start Monday or Sunday? What timezone decides which "day" a
meal lands on? Low severity per incident, but it touches literally every
calendar interaction in the app, so the blast radius is wide even if each
individual hit is minor.

### 10. Session lifetime, logout, and concurrent sessions are unspecified.

US-1 says sessions persist — for how long? Is there an explicit logout? What
happens if the same account is open in two tabs and both edit the calendar?
Lowest-stakes item on this list for a single-user personal app, but still a
real gap in a story that's otherwise been specified carefully.

---

## Recommendation

Resolve **#1, #2, and #5** before writing code — they're schema and algorithm
decisions the rest of the system depends on, not bugs to catch later. The
remaining seven are worth a conscious "accept the risk" or "fix it" decision
each, but don't block getting started.
