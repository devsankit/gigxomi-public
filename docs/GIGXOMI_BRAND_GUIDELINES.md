# Gigxomi Brand Guidelines

Updated: 2026-06-12

This is the single mandatory source of truth for Gigxomi UI, branding, visual design, tokens, typography, and asset usage.

Before Codex or any developer designs, edits, rebuilds, or reviews a Gigxomi UI, this file must be followed. If another document conflicts with this file, this file wins.

## Mandatory Rule

When a UI decision is unclear:

1. Use existing design tokens.
2. Prefer neutral dark surfaces.
3. Reduce visual noise.
4. Reduce border visibility.
5. Reduce lime usage.
6. Use spacing instead of borders.
7. Use hierarchy instead of color.
8. Match existing Gigxomi patterns.
9. Never introduce blue.
10. Never create a second design language.

## Brand Position

Gigxomi is a premium operating system for video editing agencies, freelance video editors, agency managers, WhatsApp business operations, client communication, workflow management, and marketplace collaboration.

Every interface must feel:

- Premium
- Modern
- Professional
- Operational
- Trustworthy
- Fast
- Dark-first

It must not feel like:

- A generic SaaS template
- A blue enterprise dashboard
- A crypto dashboard
- A gaming UI
- A neon toy app
- A documentation page with forms attached

Quality references are Telegram Premium, Linear, Framer, Stripe Dashboard, Arc Browser, Notion, and Raycast. Use them only as quality benchmarks. Do not copy their colors, layouts, or brand identity.

## Gigxomi Design Personality

Gigxomi should feel like:

- Telegram Premium
- Linear
- Arc Browser
- Stripe Dashboard
- Framer

Gigxomi should not feel like:

- Binance
- Bybit
- Crypto dashboards
- Gaming dashboards
- Cyberpunk interfaces
- Hacker terminals

Design for operational trust, not visual excitement.

## Mandatory Token Rule

Never hardcode colors, spacing, radius, shadows, typography, or motion in page/component styles.

Use the existing token source:

```text
src/styles/design-tokens.css
```

If a new visual need appears, extend tokens first, then consume the token. Do not create a page-specific visual language.

## Background Rule

The Gigxomi background must stay dark black.

Use the existing background tokens and do not lighten the app canvas:

```css
--gx-bg: #000000;
--gx-bg-soft: #050705;
--gx-bg-deeper: #000000;
```

Do not replace the app background with grey, blue-black, slate, navy, purple, or gradient-heavy backgrounds. Surfaces may be slightly elevated, but the base product must remain dark black.

Every full-page shell, including home, public pages, auth, admin, manager, freelancer, sales, and super-admin, must inherit this black app canvas. Do not create bright frame edges around the app.

## Final Black And Lime Lock

Gigxomi uses black as the product environment and lime as the controlled signal layer.

Locked colors:

```css
Canvas: #000000;
Primary surface: #0A0D0B;
Secondary surface: #0F130F;
Elevated surface: #141911;
Default border: rgba(255, 255, 255, 0.04);
Strong neutral border: rgba(255, 255, 255, 0.08);
Brand lime: #D7FF2F;
Lime border: rgba(215, 255, 47, 0.1);
Lime selected border: rgba(215, 255, 47, 0.28);
Lime focus glow: 0 0 0 2px rgba(215, 255, 47, 0.08);
```

Rules:

- The app canvas, sidebars, menus, dashboards, auth pages, and public pages must remain black.
- Selected navigation must use black fill with a lime border, not a lime-filled pill.
- Primary CTAs may be solid lime.
- Secondary buttons should stay black with neutral borders; use lime only on hover/focus border.
- Do not use lime/white shine gradients on buttons.
- Do not use lime radial washes across dashboard panels, cards, sidebars, auth cards, or large sections.
- Use lime for small signals: CTA, selected state, focus ring, pin, progress fill, active badge, key metric.
- Use neutral black surfaces for everything else.

## Scrollbar Rule

Scrollbars must stay visually quiet.

Default scrollbar state:

- Hidden or nearly transparent.
- Very thin.
- No permanent grey rail.
- No visible corner block.
- No thick track beside the page.

Interaction state:

- Scroll thumb may softly appear while the area is hovered, focused, or actively scrolling.
- Thumb must be transparent black/lime-neutral, never white, blue, grey, or browser default.
- Track must remain transparent.

Approved global pattern:

```css
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

*::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

*::-webkit-scrollbar-track,
*::-webkit-scrollbar-corner {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px;
}

*:hover::-webkit-scrollbar-thumb,
*:focus-within::-webkit-scrollbar-thumb {
  background: rgba(215, 255, 47, 0.18);
}
```

Do not use `scrollbar-gutter: stable` on main app canvases unless a specific table layout truly needs it. Stable gutters can create permanent rails and corner artifacts.

## Frame, Corner, And Line Rule

Gigxomi should not look like multiple outlined boxes stitched together.

Rules:

- No permanent outer frame border around full-page shells.
- No visible square scrollbar corner.
- No mixed rounded corner plus hard vertical line at shell edges.
- No heavy white/grey divider lines.
- Sidebars and topbars may use very subtle token borders only when they clarify structure.
- Public/home shell should feel like one black canvas with controlled panels, not a rounded browser frame inside the page.

Use borders sparingly:

```css
border-color: var(--gx-border-soft);
```

Default borders must be nearly invisible black-glass separators:

```css
border: 1px solid rgba(255, 255, 255, 0.04);
```

Lime borders are reserved for active states, selected cards, focus states, success indicators, important KPI highlights, and premium glow moments.

Avoid lime borders for default cards, section frames, tables, forms, inactive tabs, inactive chips, and dashboard frames.

## Accent Budget Rule

Gigxomi lime (`#D7FF2F`) is the brand accent and should remain visible. Do not remove the neon lime identity; remove blue-black surfaces instead.

Use lime only for:

- Primary CTA
- Active navigation item
- Notification badge
- Progress highlight
- Selected state
- Important KPI
- Status indicator
- Focus state
- Premium glow

Do not use lime for:

- Default card borders
- Section borders
- Dashboard frames
- Table borders
- Page backgrounds
- Form outlines
- Inactive chips
- Inactive tabs
- Large backgrounds

If every card is highlighted, nothing is highlighted.

## Map And Location Visualization Rule

Agency maps, coverage canvases, city filters, and location visualizations must follow the black/lime system.

Required:

- Map canvas background must be black.
- Map borders may use a subtle lime border.
- City pins and active location pins may use solid lime.
- Map grid/outline strokes must be neutral or very soft lime.
- Location search fields may use lime focus borders only.
- City/agency pins must be data-driven from agency location fields where possible.

Avoid:

- Blue map tiles.
- Google Maps default visual theme inside the branded surface.
- Bright green map backgrounds.
- Large lime gradients behind the map.
- Multi-color heatmaps unless there is a real operational metric requiring them.

## Visual Hierarchy Rule

Every screen must have:

- Level 1: Primary action
- Level 2: Important metrics
- Level 3: Supporting information
- Level 4: Metadata

No screen should contain more than:

- One primary CTA
- Three major visual focal points
- Five KPI highlights

Everything else must recede visually.

## Dashboard And Sales UI Rule

Operational dashboards must not become static box collections. They need compact visual intelligence that helps the user understand progress without reading every row.

Required dashboard patterns:

- Use live data visuals for funnels, revenue, goal progress, queue health, training progress, and team performance.
- Sales dashboards must include graphical funnel movement, revenue/trend bars, and training ladder progress when the relevant data is available.
- Use CSS-native charts, progress rails, compact bars, and stepped ladder visuals before adding heavy chart libraries.
- Keep graphs dark-first with lime emphasis and muted labels. Do not use blue chart palettes.
- Avoid decorative charts that do not map to real metrics.
- Cards may contain charts, but the page should read as one operational surface, not isolated old dashboard boxes.

## Mobile First Consistency

Mobile is not a redesign of web.

Mobile must inherit:

- Colors
- Typography
- Icons
- Tokens
- Navigation logic
- API contracts
- Business rules

The mobile app should feel like Gigxomi Web compressed into a premium native experience.

Reference quality:

- Telegram Premium
- Notion Mobile
- Linear Mobile

Avoid:

- Material Design default look
- Android default tabs
- Large floating neon buttons
- Oversized navigation bars

## Official Color Tokens

These are the current implemented tokens in code.

| Token | Value | Use |
| --- | --- | --- |
| `--gx-bg` / `--color-bg` | `#000000` | Main app background |
| `--gx-bg-soft` / `--color-bg-soft` | `#050705` | Secondary app background |
| `--gx-bg-deeper` | `#000000` | Deep shell background |
| `--gx-surface` / `--color-surface` | `#0A0D0B` | Primary panels, cards, forms |
| `--gx-surface-soft` / `--color-surface-soft` | `#0F130F` | Nested surfaces, inputs, table headers |
| `--gx-surface-elevated` / `--color-surface-elevated` | `#141911` | Hover and elevated states |
| `--gx-surface-matte` | `#0A0D0B` | Matte app surfaces |
| `--gx-surface-gloss` / `--color-surface-gloss` | `rgba(10, 13, 11, 0.72)` | Black glass panel |
| `--gx-glass-border` | `rgba(255, 255, 255, 0.04)` | Glass border |
| `--gx-text-primary` / `--color-text-primary` | `#F5F7FA` | Primary text |
| `--gx-text-secondary` / `--color-text-secondary` | `#A8AEA2` | Supporting text |
| `--gx-text-muted` / `--color-text-muted` | `#737B70` | Muted labels and metadata |
| `--gx-text-dim` | `#5E665C` | Lowest-emphasis text |
| `--gx-primary` / `--color-primary` | `#D7FF2F` | Lime accent and primary action |
| `--gx-primary-hover` / `--color-primary-hover` | `#C8F523` | Primary hover |
| `--gx-primary-soft` / `--color-primary-soft` | `rgba(215, 255, 47, 0.08)` | Selected/active soft state |
| `--gx-primary-border` | `rgba(215, 255, 47, 0.10)` | Soft lime accent border |
| `--gx-border` / `--color-border` | `rgba(255, 255, 255, 0.04)` | Default black-glass border |
| `--gx-border-soft` / `--color-border-soft` | `rgba(255, 255, 255, 0.03)` | Subtle black-glass border |
| `--gx-border-strong` / `--color-border-strong` | `rgba(255, 255, 255, 0.08)` | Strong neutral border |
| `--gx-success` / `--color-success` | `#A3FF3F` | Healthy, active, approved, paid |
| `--gx-warning` / `--color-warning` | `#FFC857` | Watch, pending, at risk |
| `--gx-error` / `--color-error` | `#FF5A7A` | Failed, overdue, destructive |
| `--gx-info` / `--color-info` | `#A8AEA2` | Small neutral info only |

## Forbidden Colors

Never use these colors for UI panels, cards, sidebars, selected states, gradients, or dashboard backgrounds:

```css
#2563EB
#3B82F6
#60A5FA
#1D4ED8
#0EA5E9
#0284C7
#0F172A
#1E293B
#172033
#0A1220
#0B1424
#111827
#1F2937
#1D2B45
#6366F1
#06B6D4
```

Rules:

- No blue-heavy dashboards.
- No blue sidebars.
- No blue gradients.
- No blue cards.
- No navy glass.
- No slate glass.
- No cyan shadows.
- No cyan/indigo/violet/slate visual systems.
- Info color is allowed only for small labels/status if the token defines it.

## Surface And Gradient Rules

Gigxomi surfaces must be dark, compact, and operational.

Allowed card/surface pattern:

```css
background: linear-gradient(180deg, var(--gx-surface-gloss), var(--gx-surface-soft));
border: 1px solid var(--gx-border);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-soft);
```

Allowed active/selected pattern:

```css
background: var(--gx-primary-soft);
border-color: var(--gx-border-strong);
```

Allowed subtle lime emphasis:

```css
background: linear-gradient(135deg, rgba(215, 255, 47, 0.12), rgba(215, 255, 47, 0.03));
```

Rules:

- Lime is the only brand accent.
- Gloss must be subtle and dark.
- Avoid random gradients.
- Avoid frosted-glass overload.
- Avoid one giant black wrapper around everything.
- Use section spacing, local surfaces, and clear hierarchy.

## Sidebar Rules

Active sidebar items must use a soft lime state, never full lime fill.

Recommended:

```css
background: var(--gx-primary-soft);
border-color: var(--gx-border-strong);
color: var(--gx-text-primary);
```

Do not use:

- Bright full-lime menu blocks
- Blue active items
- Heavy gradients
- Oversized sidebar rows

## Button Rules

Primary buttons:

```css
background: var(--gx-primary);
color: var(--primary-contrast);
```

Secondary buttons:

```css
background: var(--gx-surface-soft);
border: 1px solid var(--gx-border);
color: var(--gx-text-primary);
```

Ghost buttons:

```css
background: transparent;
border-color: transparent;
```

Rules:

- One primary action per form/footer/decision area.
- Destructive actions must not compete visually with the primary action.
- Use Lucide icons in action buttons when the action benefits from fast scanning.

## Typography

Primary app font:

```css
--font-family: var(--font-geist-sans), "Segoe UI", sans-serif;
```

Dashboard typography must be compact.

| Role | Token / Size |
| --- | --- |
| Dense metadata | `--text-xs` |
| Secondary labels | `--text-sm` |
| Body | `--text-base` |
| Card title | `--heading-sm` |
| Section title | `--heading-md` |
| Page title | `--heading-lg` |

Rules:

- Do not use landing-page hero typography inside dashboards.
- Do not import random fonts per page.
- Satoshi/display fonts are allowed only for public or brand-led sections.
- Long educational text belongs in tooltips, accordions, onboarding drawers, or docs, not primary UI panels.

## Spacing, Radius, Shadow, Motion

Use only tokenized values from `src/styles/design-tokens.css`.

Spacing: `--space-1` through `--space-10`

Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full`

Shadows: `--shadow-soft`, `--shadow-card`, `--glow-lime-soft`

Motion: `--motion-fast`, `--motion-normal`, `--motion-slow`, `--ease-out`, `--ease-smooth`

Rules:

- Keep depth subtle.
- Hover may lift slightly and strengthen border.
- Respect reduced-motion behavior.

## Icon And Asset Rules

Use Lucide React for normal UI:

- Sidebar
- Buttons
- Tables
- Filters
- Forms
- Small actions
- Status helpers
- Navigation

Every major dashboard section should have a meaningful icon, chart, progress indicator, table, timeline, or activity signal. Text-only dashboard walls are forbidden.

3D/glossy assets may be used only if they are from one consistent premium family and have source/license documented. Use them sparingly in executive KPI cards, smart insights, empty states, integration cards, and important section headers.

Do not use 3D/glossy assets in dense tables, sidebars, small buttons, or every card.

## Dashboard Rules

Dashboards must feel alive and operational.

Use metrics, charts, progress indicators, activity feeds, timelines, status indicators, tables for management records, drawers for create/edit/view, and tabs for related sections.

Avoid too much explanatory text, empty placeholder boxes, equal-weight card walls, nested cards, and generic admin template layouts.

Default rule:

```text
Cards summarize. Tables manage. Drawers edit. Forms configure. Tabs consolidate.
```

## CRM Rules

CRM/Kanban columns must show stage icon or clear status marker, lead count, revenue/value count where available, and a useful empty state with the next action.

Use HubSpot, Pipedrive, and ClickUp only as quality benchmarks. Keep Gigxomi colors and tokens.

Never use empty placeholder columns as the main experience.

## Chat Rules

Chat can be visually aligned through shared tokens, but do not disturb chat behavior unless explicitly requested.

Reference quality: Telegram latest UI. Keep Gigxomi colors.

Requirements: rounded message bubbles, soft shadows, dark/glass header, premium search, compact composer, smooth interactions, and consistent avatar sizing.

Do not copy Telegram colors.

## Mobile Rules

Mobile and web must share colors, icons, design tokens, typography logic, API contracts, auth, permissions, and business rules.

Use floating glass bottom dock where appropriate, large touch targets, smooth transitions, compact spacing, and consistent radius.

Avoid Android default-looking tabs, oversized navigation bars, mobile-only backend logic, and separate mobile design systems.

Recommended mobile footer:

| Property | Value |
| --- | --- |
| Height | `72px` |
| Radius | `32px` |
| Blur | `20px` |
| Pattern | Floating glass dock |

## Onboarding Rules

Every role should support guided onboarding: Agency Owner, Manager, Freelancer, Admin, and Sales Agent where applicable.

Onboarding must allow resume, skip, restart, and progress visibility.

Do not let onboarding overlays cover operational content by default. Prefer compact chip, drawer, or bottom-sheet behavior.

## Engineering Rules

- Never hardcode colors.
- Always consume design tokens.
- Never duplicate components without a clear reason.
- Never duplicate API contracts.
- Never create mobile-only backend logic.
- Use the same database, APIs, auth, permissions, and business rules across web and mobile.
- Do not rely on UI hiding for security.
- Do not fake production metrics silently.
- Do not ship demo-only data without clear labels.

## Codex Pre-Design Checklist

Before starting any UI implementation, Codex must check:

1. Is this using `src/styles/design-tokens.css` tokens?
2. Are colors black/lime and tokenized?
3. Are forbidden blue/slate/cyan/indigo values absent?
4. Is there one primary action per decision area?
5. Are repeated records shown as tables/lists, not card walls?
6. Are create/edit/detail flows in drawers or focused forms?
7. Are statuses labeled with text, not color alone?
8. Is typography compact and dashboard-appropriate?
9. Are icons from Lucide or approved assets?
10. Does mobile follow the same visual and API system?

## Quality Check Before Merge

Every new or changed UI must pass:

- Uses design tokens
- Uses approved colors
- Uses shared components or established local primitives
- Responsive on mobile and desktop
- Accessible focus and labels
- No duplicate code without reason
- No hardcoded colors
- No blue dashboards
- No random gradients
- No nested card clutter
- Mobile and web stay aligned
- Production-ready empty/loading/error states

If any check fails, the implementation must not be merged.
