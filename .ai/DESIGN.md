# DESIGN.md

## MealPrep Pro — UI Design Specification

This document is the visual and interaction contract for the MealPrep Pro application.

It is written so that a coding/design agent can implement the UI without relying on visual guesswork.

### Design reference

The UI is based on the provided Google Stitch prototype and the supplied reference screenshots. Every reference screenshot has a corresponding numbered section below — an agent should never need to open the image to implement the screen.

- login reference: `docs/design-reference/login.png` → Section 9, Login Screen
- Dashboard reference: `docs/design-reference/dashboard.png` → Sections 10–17, Dashboard Screen
- calendar reference: `docs/design-reference/calendar.png` → Section 28, Calendar / Weekly Plan Screen
- create-recipe reference: `docs/design-reference/create-recipe.png` → Section 29, Create Recipe Screen
- shopping-list reference: `docs/design-reference/shopping-list.png` → Section 30, Shopping List Screen
- Recipe Library reference: `docs/design-reference/recipes.png` → Sections 18–27, Recipe Library Screen

When implementing a screen, preserve the **visual hierarchy, proportions, spacing, colors, typography, borders, radii, and interaction patterns** described below.

---

# 1. Overall Visual Direction

MealPrep Pro uses a clean, lightweight productivity-app aesthetic.

The design characteristics are:

- Very light blue/lavender application background.
- White cards and surfaces.
- Dark navy text.
- Deep green as the primary brand/action color.
- Pale blue surfaces for metrics, filters, and selected states.
- Thin light-gray borders.
- Rounded cards and controls.
- Minimal shadows.
- Compact but comfortable spacing.
- Food photography is a major visual element.
- Icons are simple outline-style icons.
- The UI should feel calm, organized, and professional rather than playful.

Do **not** introduce:

- Gradients.
- Heavy shadows.
- Glassmorphism.
- Large decorative illustrations.
- Bright saturated colors unrelated to the existing palette.
- Sharp square cards.
- Dense dashboard widgets.

---

# 2. Core Design Tokens

Use semantic variables. Components must not hard-code these values independently.

These tokens are the source of truth and must be mirrored in `app/globals.css` (the shadcn/Tailwind CSS variables). See the mapping table in 2.3 — if a value in this section changes, update `app/globals.css` in the same change so the running app and this document never drift apart.

## 2.1 Colors

The supplied screenshots indicate the following core palette.

```css
:root {
  /* Application */
  --color-background: #F8F9FF;
  --color-surface: #FFFFFF;
  --color-surface-muted: #EFF4FF;

  /* Brand */
  --color-primary: #006C49;
  --color-primary-hover: #005B3D;
  --color-primary-soft: #E8F5EF;
  --color-on-primary: #FFFFFF;

  /* Text */
  --color-text-primary: #0B1C30;
  --color-text-secondary: #41536A;
  --color-text-muted: #68798D;

  /* Borders */
  --color-border: #D6DDE5;
  --color-border-light: #E3E8EE;

  /* Selected / information */
  --color-selected: #DAE2FD;
  --color-selected-soft: #EFF4FF;

  /* Status */
  --color-success: #00A66A;
  --color-warning: #D99500;
  --color-error: #D92D3A;
  --color-error-soft: #FFE5E7;

  /* Utility */
  --color-icon: #52657A;
}
```

### Color usage

| Color     | Usage                                                        |
| --------- | ------------------------------------------------------------ |
| `#F8F9FF` | Main application background                                  |
| `#FFFFFF` | Cards, navigation, inputs, primary surfaces                  |
| `#EFF4FF` | Metric cards, sidebar/background accents                     |
| `#006C49` | Brand, primary buttons, active navigation, positive emphasis |
| `#006C49` | Solid card background for a high-emphasis summary panel (e.g. Shopping List's "List Progress" card) |
| `#0B1C30` | Main headings and important text                             |
| `#41536A` | Secondary text                                                |
| `#68798D` | Supporting/meta text                                          |
| `#D6DDE5` | Card and control borders                                     |
| `#DAE2FD` | Selected navigation/filter background                        |
| `#D92D3A` | Missing/error status                                          |
| `#E8F5EF` | Soft positive/brand background                                |

Do not use pure black for normal text.

## 2.3 Token → `globals.css` mapping

`app/globals.css` defines these tokens under the shadcn/Tailwind variable names, consumed via semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, etc.). Do not hard-code hex values in components — use the Tailwind classes so a future palette change only requires editing `app/globals.css`.

| This spec (`--color-*`)     | `app/globals.css` variable                          |
| ---------------------------- | ---------------------------------------------------- |
| `--color-background`         | `--background`                                       |
| `--color-text-primary`       | `--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground` |
| `--color-surface`             | `--card`, `--popover`                                 |
| `--color-primary`             | `--primary`, `--sidebar-primary`, `--ring`, `--sidebar-ring` |
| `--color-on-primary`          | `--primary-foreground`, `--sidebar-primary-foreground` |
| `--color-surface-muted`       | `--secondary`, `--muted`, `--sidebar`                 |
| `--color-text-secondary`      | `--secondary-foreground`, `--muted-foreground`, `--sidebar-foreground` |
| `--color-selected`            | `--accent`, `--sidebar-accent`                        |
| `--color-border`              | `--border`, `--input`, `--sidebar-border`             |
| `--color-error`               | `--destructive`                                       |

`--radius` in `app/globals.css` is `0.625rem` (10px), which drives the `radius-sm`/`md`/`lg`/`xl` scale via the multipliers already declared in the `@theme inline` block. That scale lands on `6px`/`8px`/`10px`, matching Section 5 exactly; `radius-xl` computes to `14px` rather than the `12px` in Section 5 — a known, accepted 2px deviation rather than a bug (changing the multiplier would also shift `radius-2xl`/`3xl`/`4xl`).

Dark mode is **not** specified by this document — Section 1 describes a light-only aesthetic and no reference screenshot shows a dark variant. The `.dark` block in `app/globals.css` is a shadcn-default placeholder, not governed by this spec. Do not extend dark-mode support without an explicit product decision (see `.ai/DECISIONS.md`).

---

# 3. Typography

The screenshots use a clean sans-serif UI font.

Use the project's existing font if one is already configured. Otherwise use:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

The project already loads Inter via `next/font/google` in `app/layout.tsx` (`--font-sans`), consumed by `app/globals.css`'s `font-sans` on `html`. Do not add a second font family.

## Typography scale

```css
--font-display: 32px;
--font-page-title: 26px;
--font-section-title: 18px;
--font-card-title: 16px;
--font-body: 14px;
--font-small: 12px;
--font-micro: 11px;
```

### Weight

- Brand: `700`
- Page headings: `700`
- Section headings: `600`
- Card titles: `600`
- Navigation: `400–500`
- Body: `400`
- Button labels: `600`
- Metadata: `400`

### Important

The interface is **not** typography-heavy. Keep text compact.

Do not make normal body text larger than necessary.

---

# 4. Spacing System

Use a 4px base scale.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Common usage:

- Navigation horizontal gap: `18–24px`
- Card padding: `16–18px`
- Page section gap: `28–36px`
- Form/control gap: `12–16px`
- Small metadata gap: `4–8px`
- Dashboard content gutter: approximately `32px`

---

# 5. Border Radius

The UI consistently uses rounded corners.

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px;
--radius-pill: 999px;
```

Use:

- Buttons: `8px`
- Inputs: `8px`
- Cards: `9–12px`
- Metric cards: `6–8px`
- Badges: `4–999px`
- Pills: `999px`

Avoid sharp 0px corners except where the design requires an edge-to-edge image or container.

---

# 6. Borders and Shadows

The design relies more on borders than shadows.

```css
--border-width: 1px;
--shadow-card: 0 1px 3px rgba(11, 28, 48, 0.04);
--shadow-overlay: 0 8px 24px rgba(11, 28, 48, 0.12);
```

Normal cards should primarily use:

```css
border: 1px solid var(--color-border);
```

Do not give every card a strong shadow.

The one exception is a screen with no persistent surface behind it (currently only the Login screen, Section 9): its card may use `--shadow-overlay` since it is the sole focal element on the page.

---

# 7. Application Shell

The application has a persistent top navigation bar on every authenticated screen (Dashboard, Recipe Library, Calendar, Shopping List). The Login screen (Section 9) does not use this shell.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ MealPrep Pro   Dashboard   Ingredients   Recipes   Calendar  Shopping │
│                                                              profile │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    PAGE CONTENT                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Header

Approximate characteristics from the reference:

- White/light surface.
- Height approximately `44–50px`.
- Thin bottom border.
- Brand at the far left.
- Main navigation immediately after the brand.
- Profile/account icon at the right.
- On the Recipe Library screen, the search field appears before the profile icon.

### Brand

```text
MealPrep Pro
```

Appearance:

- Primary green.
- Bold.
- Approximately 18–20px.
- No logo container.
- Text-only brand treatment in the supplied screens.

### Navigation

Items:

```text
Dashboard
Ingredients
Recipes
Calendar
Shopping List
```

`Ingredients` was added after the original 4-item spec, once the
standalone `/ingredients` page (not itself a numbered reference screen in
this document) needed a way to be reached from the UI — see DECISIONS.md
"Custom ingredients feature (US-3)" for why. It sits right after
Dashboard, ahead of Recipes, since ingredients are a prerequisite for
building recipes (a recipe's ingredient rows reference the canonical
ingredient list — see ARCHITECTURE.md §8).

Normal state:

- Dark/blue-gray text.
- Compact typography.

Active state:

- Primary green text.
- Medium/bold weight.
- Green underline beneath the active item.

Example:

```text
Dashboard
─────────
```

The active underline is subtle and should not become a large tab indicator.

---

# 8. Page Container

Desktop pages use a centered/contained content area.

Recommended:

```css
.page-container {
  width: calc(100% - 64px);
  max-width: 1200px;
  margin: 0 auto;
}
```

For the reference viewport, content begins around `32px` from the left edge.

Do not stretch content unnecessarily to the full viewport.

---

# 9. Login Screen

Reference: `docs/design-reference/login.png`.

Unlike every other screen, Login does **not** use the Application Shell (Section 7) — there is no top navigation, since the user is not yet authenticated.

## Layout

A single card is centered both horizontally and vertically on the application background (`--color-background`).

```text
┌───────────────────────────────┐
│           (utensils)          │
│         MealPrep Pro          │
│  Plan your meals, shop smarter │
│                                │
│  Email                        │
│  [ Enter your email        ]  │
│                                │
│  Password      Forgot Password?│
│  [ Enter your password     ]  │
│                                │
│  [        Sign In          ]  │
│                                │
│   IT Support  •  Privacy Policy│
└───────────────────────────────┘
```

## Card

- Background: `--color-surface` (white).
- Width: approximately `400–440px`, responsive with side margins below that.
- Border radius: `--radius-xl` (12px).
- Uses `--shadow-overlay` (the single exception noted in Section 6) since it is the only surface on the page.
- Internal padding: approximately `32–40px`.
- All content centered.

## Icon

- Circular container, approximately `56–64px` diameter.
- Background: `--color-surface-muted` (pale blue).
- Centered outline utensils (fork/knife) icon in `--color-primary`.

## Brand and subtitle

- "MealPrep Pro": bold, dark navy, approximately `24–26px`, centered, directly below the icon.
- "Plan your meals, shop smarter.": secondary text, approximately `14px`, centered.

## Form fields

- Field label ("Email", "Password"): bold, small, dark navy, above the input.
- "Forgot Password?" sits on the same row as the "Password" label, right-aligned, primary green, small, semibold — a link, not a button.
- Inputs: full card width, `--color-surface-muted` or a very light gray background, `1px` `--color-border`, `--radius-md` (8px), comfortable padding (~`12px`).

## Primary action

```css
background: var(--color-primary);
color: var(--color-on-primary);
border-radius: 8px;
height: ~44-48px;
font-weight: 600;
width: 100%;
```

"Sign In" is full width and visually dominant — the only solid-color element in the card besides the icon accent.

## Footer

- Below the button, centered, small, muted text: `IT Support` and `Privacy Policy` separated by a `•` bullet.
- Plain text/links, no button styling.

---

# 10. Dashboard Screen

## 10.1 Header area

The Dashboard starts with:

```text
Welcome back, Chef.
Here's your meal plan overview for the week.
```

Heading:

- Large.
- Dark navy.
- Bold.
- Approximately 26px.

Subtitle:

- Approximately 14px.
- Secondary text.
- Positioned directly below heading.

Spacing:

```text
Page top
  ↓
Heading
  ↓ ~6px
Subtitle
  ↓ ~30px
Main dashboard content
```

---

# 11. Dashboard Main Grid

The main dashboard area uses a two-column layout.

```text
┌──────────────────────────────────────┐ ┌──────────────────────┐
│ This Week's Plan                     │ │ Create New Recipe    │
│                                      │ └──────────────────────┘
│ [14] [4] [32] [100%]                │ ┌──────────────────────┐
│                                      │ │ Plan Next Week    >  │
│ ──────────────────────────────────── │ └──────────────────────┘
│ TODAY'S HIGHLIGHTS                   │ ┌──────────────────────┐
│ [Dinner]              [Missing]      │ │ View Shopping List > │
└──────────────────────────────────────┘ └──────────────────────┘
```

Recommended grid:

```css
grid-template-columns: minmax(0, 2fr) minmax(250px, 0.95fr);
gap: 16px;
```

The left panel is the main weekly summary.

The right panel contains actions.

---

# 12. Weekly Plan Card

Card:

- White background.
- 1px border.
- Rounded corners.
- Approximately 16px internal padding.
- No heavy shadow.

Header:

```text
This Week's Plan                         Nov 12 – Nov 18
```

Title:

- 16px.
- Semibold.

Date range:

- Small pill.
- Pale blue background.
- Small secondary text.

---

# 13. Weekly Metrics

Four equal metric cards appear in one row.

```text
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│    14    │ │     4    │ │    32    │ │   100%   │
│ Meals    │ │ Recipes  │ │ Items    │ │ Prep     │
│ Planned  │ │ to Try   │ │ to Buy   │ │ Ready    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Metric cards:

- Background: `#EFF4FF`
- Thin border.
- Rounded corners.
- Number centered.
- Number uses primary/dark emphasis.
- Label is small.

The `100%` metric uses green to communicate success.

Do not turn the metric cards into large analytics widgets.

Metric values are live and scoped to the current Monday–Sunday week:

- **Meals Planned**: number of occupied calendar slots this week.
- **Recipes to Try**: number of recipes in the user's library that are not
  assigned to any calendar slot this week (a recipe assigned more than once
  is excluded once by recipe identity).
- **Items to Buy**: number of unchecked lines in this week's generated
  shopping list.
- **Prep Ready**: checked shopping-list lines divided by total lines, rounded
  to the nearest whole percent. An empty list displays `0%`.

While these values load, retain the four-card layout and use a compact
placeholder rather than showing the reference screenshot's sample numbers.

---

# 14. Today's Highlights

Separated from metrics by a thin horizontal divider.

Label:

```text
TODAY'S HIGHLIGHTS
```

Style:

- Uppercase.
- Small.
- Semibold.
- Increased letter spacing.
- Secondary/dark text.

Two highlight items appear side by side.

### Dinner

Visual structure:

```text
[ circular blue icon ]  Dinner
                        Lemon Herb Salmon
```

The icon sits in a soft blue circular container.

The recipe name is live: show the recipe assigned to today's `Dinner`
calendar slot. If that slot is empty, show `not allocated yet` in
`--color-error`/the semantic destructive text color. Do not fall back to the
reference screenshot's sample recipe name.

### Missing

Visual structure:

```text
[ circular red alert ]  Missing
                        Fresh Dill (1 bunch)
```

Missing state:

- Red alert icon.
- Light red/pink icon background.
- Status label in secondary text.
- Item name in dark text.

This item is a live completeness check for today's three calendar slots,
ordered `Breakfast`, `Lunch`, `Dinner`:

- If any slots are empty, list their meal names followed by `is not allocated
  yet` for one slot or `are not allocated yet` for multiple slots. Use the red
  alert icon treatment and destructive text color.
- If all three slots are assigned, show `3 meals already selected` with a
  green check icon/text treatment.
- While calendar data loads, preserve the card and show the same compact
  placeholder used by the weekly metrics; do not imply either an error or
  completion before data is available.

---

# 15. Dashboard Action Column

The right column begins with a full-width primary button:

```text
⊕  Create New Recipe
```

Button:

```css
background: #006C49;
color: #FFFFFF;
border-radius: 8px;
height: ~40px;
font-weight: 600;
```

The button should visually dominate the action list.

Below it are action cards.

Examples:

```text
[calendar icon]  Plan Next Week
                 Start drafting your meals
                                              >

[cart icon]      View Shopping List
                 {unchecked items} remaining
                                              >

[sparkle icon]   Auto-Generate Plan
                 Based on favorites
                                              >
```

Each action card:

- White background.
- 1px border.
- Rounded corners.
- Approximately 14–16px vertical padding.
- Icon inside pale blue circular background.
- Title dark.
- Supporting description muted.
- Chevron at right.

---

# 16. Suggested for You

Below the main dashboard grid:

```text
Suggested for You                         View All
```

Section heading:

- 18px.
- Semibold.
- Dark navy.

`View All`:

- Primary green.
- Small.
- Semibold.

---

# 17. Food Image Cards

The dashboard displays a horizontal row of food recommendations.

Each card is image-dominant.

```text
┌──────────────────────┐
│                      │
│      FOOD IMAGE      │
│                      │
│                    ♡ │
└──────────────────────┘
```

Characteristics:

- Large food photography.
- Approximately 3 cards visible at desktop width.
- Rounded corners.
- Image fills card width.
- Heart/favorite icon appears in the top-right corner.
- Favorite icon is placed inside a small white/light circular control.

Use `object-fit: cover`.

Do not distort food images.

---

# 18. Recipe Library Screen

The Recipe Library differs from Dashboard by introducing a left filter sidebar.

Overall structure:

```text
┌───────────────┬──────────────────────────────────────────┐
│ Filters       │ Recipe Library                    Search │
│               │                                          │
│ All Recipes   │ [Recipe Card] [Recipe Card] [Recipe]    │
│ Favorites     │                                          │
│ Quick Meals   │                                          │
│ Vegetarian    │                                          │
│ Meal Kits     │                                          │
└───────────────┴──────────────────────────────────────────┘
```

---

# 19. Recipe Sidebar

Width is approximately `156–190px` in the supplied viewport.

Background:

```css
background: #EFF4FF;
```

A vertical border separates it from the content.

Title:

```text
Filters
```

- 14–16px.
- Semibold.
- Dark navy.

Subtitle:

```text
Organize your view
```

- Small.
- Muted.

Filter items:

```text
▣  All Recipes
♡  Favorites
⏱  Quick Meals
▣  Vegetarian
▣  Meal Kits
```

The active filter (`All Recipes`) has:

- Pale/periwinkle selected background.
- Rounded corners.
- Primary/dark text.
- Full available sidebar width minus small horizontal padding.

---

# 20. Recipe Library Header

Main content starts with:

```text
Recipe Library
Manage and organize your meal prep collection.
```

At the right:

```text
+ Create Recipe
```

Title:

- Approximately 26px.
- Bold.
- Dark navy.

Subtitle:

- Approximately 14px.
- Muted.

The Create Recipe button uses the same primary green style as Dashboard.

---

# 21. Recipe Search

On the Recipe Library screen, the global header contains a search field.

Approximate appearance:

```text
┌──────────────────────────────┐
│ 🔍  Search recipes...        │
└──────────────────────────────┘
```

Characteristics:

- Width approximately `180px`.
- Height approximately `28–32px`.
- Pale blue/light background.
- Thin border.
- Rounded/pill radius.
- Search icon on the left.
- Placeholder in muted text.

Search is visually secondary to the page title and Create Recipe action.

---

# 22. Recipe Cards

Recipe cards use a consistent structure:

```text
┌─────────────────────────────┐
│                             │
│       Recipe image          │
│                       25m   │
├─────────────────────────────┤
│ Mediterranean Quinoa Bowl   │
│                             │
│ Quinoa, cherry tomatoes...  │
│                             │
│ [Vegetarian] [Quick]        │
│                             │
├─────────────────────────────┤
│ Added Oct 12, 2023     ✎ 🗑 │
└─────────────────────────────┘
```

Card:

- White/light surface.
- 1px border.
- Approximately 10px radius.
- No strong shadow.
- Overflow hidden.

---

# 23. Recipe Image

Image occupies the full width of the upper card section.

Recommended:

```css
width: 100%;
aspect-ratio: 1.65 / 1;
object-fit: cover;
```

The exact aspect ratio should follow the reference screen.

Do not place padding around the image.

The image should touch the card's top corners.

---

# 24. Recipe Time Badge

Time appears over the image in the top-right.

Example:

```text
◷ 25m
```

Style:

- White/light pill.
- Small green clock icon.
- Small text.
- Slight transparency is acceptable if needed.
- Positioned approximately 8px from top/right.

---

# 25. Recipe Card Content

Title:

- 16px.
- Semibold.
- Dark navy.
- Single line where possible.
- Truncate with ellipsis when constrained.

Example:

```text
Classic Spaghetti...
```

Description:

- 12–13px.
- Secondary text.
- Approximately 2 lines.
- Line height around 1.4.

Tags:

```text
[Vegetarian] [Quick]
```

Tag appearance:

- Very small.
- Pale green/blue background.
- Primary/dark text.
- Small radius.
- Compact horizontal padding.

Do not make tags visually dominant.

---

# 26. Recipe Card Footer

A thin divider separates content from footer.

Footer:

```text
Added Oct 12, 2023                         ✎  🗑
```

Date:

- Small muted text.

Edit/delete:

- Icon-only actions.
- Dark blue-gray icons.
- Small hit area visually.
- Adequate actual clickable hit area for accessibility.

Delete is a destructive action and should use the destructive confirmation pattern when necessary.

---

# 27. Empty Recipe Image State

If a recipe has no image, use a light blue image placeholder.

```text
┌─────────────────────────────┐
│                             │
│            🖼               │
│                             │
└─────────────────────────────┘
```

Characteristics:

- Same dimensions as a normal recipe image.
- Background: `#EFF4FF`.
- Centered outline image icon.
- Muted green/gray icon.

Do not use a random stock image when the recipe has no image.

---

# 28. Calendar / Weekly Plan Screen

Reference: `docs/design-reference/calendar.png`. Uses the Application Shell (Section 7); "Calendar" is the active nav item.

## Header

```text
Weekly Plan                          ‹  Oct 23 – Oct 29, 2023  ›
```

- Title: approximately 26px, bold, dark navy — matches the Dashboard/Recipe Library page-title treatment.
- Right-aligned week navigation cluster: `‹` (prev week, icon button), the current week's date range (pill/button, white surface with border — clicking it jumps back to the current week, same action a literal "Today" label would have triggered), `›` (next week, icon button). All three are compact, white background, thin border, rounded, grouped tightly together.
- **Deviation from the original reference**: the reference shows a static "Today" label in the middle pill plus a separate date-range subtitle under the title. Implemented instead with the date range itself inside the pill (updating on every Prev/Next click) and no separate subtitle, since showing the same range in two places at once read as redundant — see DECISIONS.md "Week navigation pill shows the date range, not a static 'Today' label".

## Weekly grid

A single card (white surface, 1px border, rounded corners) contains the full week grid.

```text
┌──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Meal │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│Break-│     │chip │     │     │chip │     │     │
│fast  │     │     │     │     │     │     │     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│Lunch │     │chip │chip │chip │     │     │     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│Dinner│     │chip │chip │     │     │chip │     │
└──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

- Header row: `--color-surface-muted` background, weekday abbreviation (bold, small) stacked over the day-of-month number (regular, small, secondary text).
- Leftmost column: meal-slot labels (`Breakfast`, `Lunch`, `Dinner`), narrower than the day columns, secondary text.
- Grid lines: `1px` `--color-border` between every row and column.
- Empty cells: blank, `--color-surface`. Do not render a placeholder icon or "add meal" affordance unless a product requirement adds one — the reference shows plain empty cells.

## Meal chip

Each planned meal is a small chip filling most of its cell:

```text
┌────────────────────┐
│ Salmon & Quinoa   ⋮ │
│ ⏱ 30m               │
└────────────────────┘
```

- Background: `--color-primary-soft` (`#E8F5EF`).
- Border radius: `--radius-md` (8px).
- Recipe name: dark navy, small, semibold, truncates rather than wraps to a third line.
- Metadata row: small clock icon + prep time (`--color-text-secondary`).
- Kebab (`⋮`) menu icon at the top-right of the chip, muted icon color, opens per-meal actions (edit/remove) — do not render it as a full button with a border; it should sit flush inside the chip like the recipe-card edit/delete icons in Section 26.

Do not use a different green than `--color-primary-soft` for the chip background — it must read as the same "planned" affordance across Dashboard highlights and the Calendar grid.

---

# 29. Create Recipe Screen

Reference: `docs/design-reference/create-recipe.png`. Uses the Application Shell (Section 7); "Recipes" is the active nav item (this screen is reached from Recipe Library).

## Header

```text
← Back to Recipes

Create New Recipe
Fill in the details to add a new meal to your collection.
```

- "← Back to Recipes": muted text with a leading chevron, small, sits above the page title, acts as a link back to Section 18 (Recipe Library).
- Title: approximately 26px, bold, dark navy — same page-title treatment as other screens.
- Subtitle: approximately 14px, muted text.

## Form container

A single white card (1px border, `--radius-lg`, internal padding ~24px) holds three sub-sections, each separated by a thin `--color-border` divider. Each sub-section has a heading row: a small `--color-primary` outline icon + a semibold ~16px dark-navy label.

### 29.1 Recipe Basics

Icon: utensils/scissors.

- **Recipe Name** — full-width text input, placeholder e.g. `e.g. Lemon Herb Roasted Chicken`.
- **Prep Time (mins)** and **Servings** — two numeric stepper inputs side by side, each roughly half width, with up/down stepper controls.
- **Categories / Tags** — a row of toggle pill chips (e.g. `Breakfast`, `Dinner`, `Vegan`, `Gluten-Free`):
  - Unselected: white/`--color-surface` background, `1px` `--color-border`, `--color-text-secondary` text.
  - Selected: `--color-primary-soft` background, `--color-primary` border and text (matches the recipe-card tag styling in Section 25).
  - Trailing `+ Add Tag` control uses a dashed/outline pill in the unselected style.

### 29.2 Ingredients

Icon: list/grid.

Each ingredient is one row:

```text
⠿  [ 2 ] [ lbs ▾ ]  Chicken Breast                    🗑
⠿  [ 1 ] [tbsp▾]  Olive Oil                          🗑
⠿  [Qty] [Unit▾]  Search or type ingredient...
```

- `⠿` drag handle: muted icon, far left, indicates rows are reorderable.
- Quantity: narrow numeric input.
- Unit: narrow select/dropdown.
- Ingredient name: wide text input, supports typeahead (`Search or type ingredient...` placeholder on the empty template row) — see `.ai/Unit_Conversion_Algorithm_Spec.md` for how quantity/unit feed shopping-list generation (US-3, US-7).
- Trash icon button at the row end, same icon-button treatment as Section 26's edit/delete icons.
- Below the rows: `+ Add Another Ingredient` — primary green, small, semibold, plus icon, link-style rather than a bordered button.

### 29.3 Instructions

Icon: numbered list.

- A large, resizable textarea (drag handle visible bottom-right), placeholder showing the `Step 1: …` / `Step 2: …` pattern.
- Helper text directly below, small and muted: `Tip: Leave a blank line between steps to separate them.`

## Footer actions

Right-aligned, below the form card:

```text
[ Cancel ]  [ 🖫 Save Recipe ]
```

- `Cancel`: secondary button — white background, `1px` border, dark text.
- `Save Recipe`: primary button (Section 32), with a save/disk icon before the label.

All inputs in this screen use the same field treatment as Login (Section 9): light background, `1px` `--color-border`, `--radius-md` (8px).

---

# 30. Shopping List Screen

Reference: `docs/design-reference/shopping-list.png`. Uses the Application Shell (Section 7); "Shopping List" is the active nav item.

## Header

```text
This Week's List      ‹ March 11 - March 17 ›   [Clear Checked] [Check All]
```

- Title: approximately 26px, bold, dark navy.
- Week navigation cluster (added beyond the static reference, since the list is genuinely week-scoped per US-9): same `‹ [date range pill] ›` pattern as the Calendar screen (Section 28) — no separate date-range subtitle under the title; see that section's "Deviation from the original reference" note and DECISIONS.md "Week navigation pill shows the date range, not a static 'Today' label".
- Top-right button pair: `Clear Checked` (secondary/outline, white background) and `Check All` (primary — filled dark, uses `--color-primary` treatment). Both compact height, `--radius-md`.

## Layout

Two-column grid, same proportions as the Dashboard main grid (Section 11): a wider left column for the list, a narrower right column for progress and promo content.

```css
grid-template-columns: minmax(0, 2fr) minmax(250px, 0.95fr);
gap: 16px;
```

## Grocery list (left column)

Grouped by category (e.g. `Produce`, `Dairy & Refrigerated`). Each group:

- Category heading row: small leaf/drop-style outline icon + semibold dark-navy label, followed by a thin `--color-border` divider spanning the column.
- Items below the divider, each in its own white-surface bordered row (`1px` `--color-border`, `--radius-md`):

```text
☐  Spinach                                    [ 2 bags ]
☑  Cheddar Cheese                              [ 1 block ]
```

  - Checkbox: custom-styled square, unchecked = white with border; checked = filled `--color-primary` with a white checkmark.
  - Item name: dark navy when unchecked; when checked, mute the text color (`--color-text-muted`) to signal completion — do not rely on the checkbox alone to convey state.
  - Quantity: a pill on the row's right edge — `--color-surface-muted` background, `--radius-pill`, small secondary text (e.g. `2 bags`, `5 lbs`, `1 gallon`).

## List Progress card (right column, top)

```text
┌──────────────────────┐
│ List Progress         │
│                       │
│ 1/4         Items     │
│             Checked   │
│ ▬▬▬░░░░░░░░░░░░░░░░░  │
└──────────────────────┘
```

- Background: solid `--color-primary` (the one place besides buttons this token is used as a large fill — see the Section 2.1 color-usage table).
- Text: white/`--color-on-primary`.
- Label "List Progress": small, semibold.
- Fraction ("1/4"): large, bold — the visual focal point of the card.
- "Items Checked" caption: small, softened white.
- Progress bar: thin, white fill over a translucent white track, width reflects checked/total ratio.
- Border radius: `--radius-xl` (~10–12px), padding ~20px.

## Inspiration card (right column, below progress)

- Top: food photo banner, rounded top corners only, `object-fit: cover`.
- Below the image: `Need inspiration?` (semibold, dark navy), `Browse community recipes` (small, muted), `Explore →` (primary green, small, semibold, trailing arrow, link-style).
- Card wrapper: white surface, `1px` border, `--radius-lg`, overflow hidden so the image respects the rounded top corners.

## Page footer

The reference shows a full-width footer bar on this screen:

```text
© 2024 MealPrep Pro. All rights reserved.        Privacy Policy · Terms of Service · Help Center
```

- Background: `--color-surface-muted`.
- Text: muted, small, on both sides — copyright left-aligned, links right-aligned.
- Treat this as the application's global footer (renders below page content on every authenticated screen) rather than a Shopping-List-only element, unless a product requirement restricts it to this screen — flag the ambiguity in `.ai/DECISIONS.md` if/when the footer is implemented.

---

# 31. Iconography

Use a consistent outline icon set.

Icons visible in the reference include:

- User/account
- Search
- Plus
- Calendar
- Shopping cart
- Sparkles
- Chevron right / left
- Heart
- Alert/warning
- Edit
- Delete
- Timer/clock
- Food/meal
- Drag handle (grip/dots)
- Kebab menu (vertical dots)
- Leaf/drop (category)
- Checkmark

Recommended icon size:

```text
16px - metadata
18px - navigation/actions
20px - buttons
24px - feature/action icons
```

Do not mix filled and outlined icon families without a deliberate reason.

---

# 32. Buttons

## Primary

```css
background: #006C49;
color: #FFFFFF;
border: none;
border-radius: 8px;
font-weight: 600;
```

Use for:

- Create Recipe
- Create New Recipe
- Sign In
- Save Recipe
- Check All
- Main submit/save actions

## Secondary

Use white/light background with a subtle border.

Use for:

- Cancel
- Clear Checked
- Week navigation ("Today")

## Toggle / selectable tag

Used for the Categories/Tags chips on Create Recipe (Section 29.1). Same shape as a badge (Section 25 tags) but interactive:

- Unselected: white background, `1px` `--color-border`, secondary text.
- Selected: `--color-primary-soft` background, `--color-primary` border and text.

## Checkbox

Used for Shopping List items (Section 30):

- Unchecked: white fill, `1px` `--color-border`, `--radius-sm`.
- Checked: `--color-primary` fill, white checkmark glyph.

## Icon button

Use a compact icon control for:

- Favorite
- Edit
- Delete
- Account
- Search
- Kebab/overflow menu (Calendar meal chips)

Icon-only controls must have accessible labels.

---

# 33. Responsive Behavior

The screenshots represent desktop/tablet-like layouts. The implementation must not simply scale the screenshot.

## Desktop

Dashboard:

```text
Main summary        Action column
     2fr                1fr
```

Recipe Library:

```text
Sidebar + 3-column recipe grid
```

Shopping List:

```text
Grocery list        Progress + promo
     2fr                1fr
```

## Tablet

- Reduce page gutters.
- Keep dashboard/shopping-list two columns only if enough space exists.
- Reduce recipe grid to two columns.
- Keep sidebar if usable.
- Calendar: keep all 7 day columns if they fit at a reduced width; otherwise allow horizontal scroll within the grid card rather than dropping days.

## Mobile

Dashboard:

```text
Header
Welcome
Weekly Plan
Actions
Suggested Recipes
```

The dashboard two-column layout becomes one column.

Recipe Library:

```text
Header
Search
Filters
Recipe grid
```

Recipe grid becomes one column or two narrow columns depending on available width.

The filter sidebar should become a collapsible/drawer filter.

Calendar:

```text
Header
Week nav
Day selector (one day at a time) or horizontal-scroll grid
Meal slots for the selected day
```

A full 7-column grid does not fit mobile width — collapse to a single active day with day-to-day navigation, or allow horizontal scroll; either is acceptable, but do not shrink the grid until it becomes illegible.

Create Recipe:

```text
Header
Recipe Basics
Ingredients
Instructions
Footer actions (Cancel / Save Recipe)
```

Single column throughout; Prep Time/Servings stack instead of sitting side by side.

Shopping List:

```text
Header
List Progress
Grocery list (grouped)
Inspiration card
Footer
```

Single column — progress and inspiration cards move above or below the list rather than sitting beside it.

---

# 34. Responsive Breakpoints

Use behavior-oriented breakpoints:

```css
--breakpoint-mobile: 640px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
```

Do not use fixed absolute positioning to reproduce the screenshots.

---

# 35. Interaction States

Every interactive element needs:

### Default

Normal reference appearance.

### Hover

Slightly stronger border/background or subtle elevation.

### Focus

Visible accessible focus ring.

### Active/Pressed

Slight visual compression or stronger active treatment.

### Disabled

Reduced contrast without making text unreadable.

---

# 36. Animation

Keep animation subtle.

Recommended:

```css
transition:
  background-color 150ms ease,
  border-color 150ms ease,
  color 150ms ease,
  box-shadow 150ms ease,
  transform 100ms ease;
```

Do not animate large food images or dashboard sections unnecessarily.

---

# 37. Accessibility

The visual design must not compromise accessibility.

Required:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible labels for icon-only controls.
- Sufficient text contrast.
- Form labels.
- Meaningful alt text for recipe images.
- `aria-current="page"` for active navigation where appropriate.
- Do not communicate errors only through red color.
- Do not communicate selected state only through background color.
- Shopping List: checked state must be conveyed by more than the checkbox fill alone (Section 30 requires muted text as well).
- Calendar: meal chips must remain distinguishable without relying on color alone if a colorblind-safe audit is later required (deferred — flag in `.ai/KNOWN_ISSUES.md` if raised).

---

# 38. Agent Implementation Rules

When an agent creates or modifies UI, it MUST follow these rules.

1. Read `DESIGN.md` before implementing UI.
2. Reuse the existing design tokens.
3. Reuse existing components where possible.
4. Do not invent a new primary color.
5. Do not introduce gradients.
6. Do not introduce heavy shadows.
7. Do not change the primary green without a product/design decision.
8. Maintain the light blue application background.
9. Maintain rounded cards and controls.
10. Preserve the dashboard two-column hierarchy on desktop.
11. Preserve the Recipe Library sidebar/filter structure.
12. Preserve the recipe card image-first layout.
13. Preserve the green active navigation treatment.
14. Preserve the pale blue selected/filter surfaces.
15. Preserve the relative visual importance of primary actions.
16. Use responsive layout rather than absolute positioning.
17. Do not replace food photography with generic colored placeholders when an image exists.
18. Do not create a new component variant when an existing component can express the required state.
19. Implement loading, empty, error, disabled, and success states.
20. If a new reusable visual pattern is introduced, update this document.
21. If a token value in Section 2 changes, update the matching CSS variable in `app/globals.css` in the same change (see Section 2.3's mapping table) — never let the two drift apart.
22. Do not hard-code hex colors in components; use the Tailwind semantic classes backed by `app/globals.css` (`bg-primary`, `text-foreground`, `bg-muted`, etc.).

---

# 39. Visual QA Checklist

Before considering a screen complete, compare it against the Stitch/reference design.

## Global

- [ ] Background is light blue/lavender.
- [ ] Primary green is consistent.
- [ ] Text is dark navy rather than pure black.
- [ ] Cards have thin borders.
- [ ] Shadows are subtle.
- [ ] Corner radii are consistent.
- [ ] Typography hierarchy matches the specification.
- [ ] Page gutters are consistent.

## Header

- [ ] MealPrep Pro appears on the left.
- [ ] Navigation follows the brand.
- [ ] Active navigation uses green text and underline.
- [ ] Profile icon is on the right.
- [ ] Recipe screen includes search.

## Login

- [ ] No top navigation bar is rendered.
- [ ] Card is centered and uses the overlay shadow.
- [ ] Sign In button is full width and visually dominant.
- [ ] Forgot Password sits on the Password label row.

## Dashboard

- [ ] Welcome heading is prominent.
- [ ] Weekly Plan is the main left card.
- [ ] Four metrics are displayed in one row on desktop.
- [ ] Today's Highlights appears below the divider.
- [ ] Create New Recipe is the strongest action.
- [ ] Three secondary action cards follow.
- [ ] Suggested for You appears below.
- [ ] Food cards use large images.

## Recipe Library

- [ ] Filter sidebar is visible on desktop.
- [ ] All Recipes is selected.
- [ ] Recipe Library heading is prominent.
- [ ] Create Recipe is top-right.
- [ ] Recipe cards use large image headers.
- [ ] Time badges appear over images.
- [ ] Tags are compact.
- [ ] Footer contains date/edit/delete.
- [ ] Missing images use the light blue placeholder.

## Calendar

- [ ] Weekly Plan heading and date range are left-aligned.
- [ ] Prev/Today/Next controls are grouped top-right.
- [ ] Grid has 7 day columns and Breakfast/Lunch/Dinner rows.
- [ ] Meal chips use the primary-soft background, not the metric-card blue.
- [ ] Empty cells render blank with no placeholder content.

## Create Recipe

- [ ] Back link precedes the page title.
- [ ] Three sub-sections (Basics, Ingredients, Instructions) each have an icon + label heading.
- [ ] Category/tag chips distinguish selected vs. unselected states.
- [ ] Ingredient rows include drag handle, qty, unit, name, and delete.
- [ ] Footer actions (Cancel / Save Recipe) are right-aligned.

## Shopping List

- [ ] Clear Checked / Check All buttons sit top-right of the header.
- [ ] Items are grouped by category with a divider.
- [ ] Checked items are visually muted, not just checkbox-filled.
- [ ] List Progress card uses a solid primary-green background.
- [ ] Inspiration card image has rounded top corners only.

---

# 40. Source-of-Truth Rule

When implementing a UI decision, use this priority:

1. Approved product requirements.
2. This `DESIGN.md`.
3. The latest approved Stitch prototype/reference screenshot.
4. Existing shared application components.
5. Developer implementation preference.

If the agent notices a difference between an existing implementation and this document, the agent should update the implementation to match the design specification unless an explicit product requirement says otherwise.

---

# 41. Important Instruction for AI Coding Agents

**Do not interpret this document as a generic suggestion.**

The colors, spacing, component hierarchy, card treatment, navigation behavior, and responsive structure described here are intentional parts of the MealPrep Pro visual language.

When creating a new screen:

- Match the existing visual language.
- Reuse the same surfaces.
- Reuse the same typography hierarchy.
- Reuse the same primary green.
- Reuse the same radius and border treatment.
- Reuse the same icon style.
- Reuse the same spacing scale.

A new screen should look like it belongs to the same product as the Dashboard and Recipe Library shown in the reference design.
