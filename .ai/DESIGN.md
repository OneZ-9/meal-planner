# DESIGN.md

## MealPrep Pro — UI Design Specification

This document is the visual and interaction contract for the MealPrep Pro application.

It is written so that a coding/design agent can implement the UI without relying on visual guesswork.

### Design reference

The UI is based on the provided Google Stitch prototype and the supplied reference screenshots:

- login reference :`docs/design-reference/login.png`
- Dashboard reference: `docs/design-reference/dashboard.png`
- calendar reference: `docs/design-reference/calendar.png`
- create-recipe reference: `docs/design-reference/create-recipe.png`
- shopping-list reference: `docs/design-reference/shopping-list.png`
- Recipe Library reference: `docs/design-reference/recipes.png`

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
| `#0B1C30` | Main headings and important text                             |
| `#41536A` | Secondary text                                               |
| `#68798D` | Supporting/meta text                                         |
| `#D6DDE5` | Card and control borders                                     |
| `#DAE2FD` | Selected navigation/filter background                        |
| `#D92D3A` | Missing/error status                                         |
| `#E8F5EF` | Soft positive/brand background                               |

Do not use pure black for normal text.

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

---

# 7. Application Shell

The application has a persistent top navigation bar.

```text
┌─────────────────────────────────────────────────────────┐
│ MealPrep Pro   Dashboard   Recipes   Calendar   Shopping │
│                                                   profile│
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    PAGE CONTENT                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
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
Recipes
Calendar
Shopping List
```

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

# 9. Dashboard Screen

## 9.1 Header area

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

# 10. Dashboard Main Grid

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

# 11. Weekly Plan Card

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

# 12. Weekly Metrics

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

---

# 13. Today's Highlights

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

---

# 14. Dashboard Action Column

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
                 32 items remaining
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

# 15. Suggested for You

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

# 16. Food Image Cards

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

# 17. Recipe Library Screen

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

# 18. Recipe Sidebar

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

# 19. Recipe Library Header

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

# 20. Recipe Search

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

# 21. Recipe Cards

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

# 22. Recipe Image

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

# 23. Recipe Time Badge

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

# 24. Recipe Card Content

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

# 25. Recipe Card Footer

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

# 26. Empty Recipe Image State

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

# 27. Iconography

Use a consistent outline icon set.

Icons visible in the reference include:

- User/account
- Search
- Plus
- Calendar
- Shopping cart
- Sparkles
- Chevron right
- Heart
- Alert/warning
- Edit
- Delete
- Timer/clock
- Food/meal

Recommended icon size:

```text
16px - metadata
18px - navigation/actions
20px - buttons
24px - feature/action icons
```

Do not mix filled and outlined icon families without a deliberate reason.

---

# 28. Buttons

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
- Main submit/save actions

## Secondary

Use white/light background with a subtle border.

## Icon button

Use a compact icon control for:

- Favorite
- Edit
- Delete
- Account
- Search

Icon-only controls must have accessible labels.

---

# 29. Responsive Behavior

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

## Tablet

- Reduce page gutters.
- Keep dashboard two columns only if enough space exists.
- Reduce recipe grid to two columns.
- Keep sidebar if usable.

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

---

# 30. Responsive Breakpoints

Use behavior-oriented breakpoints:

```css
--breakpoint-mobile: 640px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
```

Do not use fixed absolute positioning to reproduce the screenshots.

---

# 31. Interaction States

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

# 32. Animation

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

# 33. Accessibility

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

---

# 34. Agent Implementation Rules

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

---

# 35. Visual QA Checklist

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

---

# 36. Source-of-Truth Rule

When implementing a UI decision, use this priority:

1. Approved product requirements.
2. This `DESIGN.md`.
3. The latest approved Stitch prototype/reference screenshot.
4. Existing shared application components.
5. Developer implementation preference.

If the agent notices a difference between an existing implementation and this document, the agent should update the implementation to match the design specification unless an explicit product requirement says otherwise.

---

# 37. Important Instruction for AI Coding Agents

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
