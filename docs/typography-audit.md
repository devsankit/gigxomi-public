# Gigxomi Typography Audit

## Summary
- The app was using overlapping typography systems at the same time: legacy `--font-size-*` variables, newer `--text-*` aliases, and many component-level one-off sizes.
- Shared UI selectors existed, but internal screens still overrode them heavily with larger headings, repeated bold weights, and inconsistent small-text sizing.
- The visual result was louder than a premium product UI, especially in page titles, sidebar navigation, card headings, buttons, pills, and tables.

## Existing Shared Typography Classes
- `section-heading`: shared heading utility, but still overridden larger in auth/public surfaces.
- `section-label` / `eyebrow` / `app-page-kicker`: uppercase label treatment used for page and section kickers.
- `muted-copy`: shared secondary body text utility.
- `meta-pill`: widely used metadata label treatment.
- Sidebar and topbar text relied on base layout selectors rather than a dedicated compact nav scale.

## Main Inconsistencies
- Multiple small-text sizes were in active use: `0.72rem`, `0.74rem`, `0.76rem`, `0.78rem`, `0.8rem`, `0.82rem`, `0.84rem`, `0.88rem`, `0.95rem`, `1rem`, and more.
- `font-weight: 700` and `font-weight: 600` appeared repeatedly across page titles, cards, pills, buttons, and tables without a consistent hierarchy.
- Several internal surfaces still used marketing-style heading sizes or custom clamps, especially:
  - auth/public page headings
  - dashboard topbars
  - freelancer workspace titles
  - card title `strong` elements
- Sidebar, chips, buttons, and table text were all slightly different from one another even though they serve the same dense-product UI role.

## Oversized or Loud Areas
- Page titles in internal workspaces and public auth surfaces.
- Section headings that should read as product UI labels rather than marketing headers.
- Sidebar navigation labels that felt too bulky for a premium dark rail.
- Card titles and table primary text that were too close in size to page-level headings.
- Button and chip text that leaned too bold and too large for compact product controls.

## New Mapping Target
- `section-heading` -> compact page title
- `section-label` -> compact label/eyebrow
- `muted-copy` -> secondary body text
- `meta-pill` -> compact label/caption
- sidebar nav selectors -> dedicated nav text token
- topbar labels/titles -> shared label + page title system
- table selectors -> dedicated table header/body tokens
- card `strong` headings -> shared card-title treatment

## Compact Type Scale Adopted
- Page title: `22px / 600 / 1.2`
- Section title: `16px / 600 / 1.3`
- Card title: `15px / 600 / 1.35`
- Body text: `14px / 400 / 1.55`
- Secondary body: `13px / 400 / 1.5`
- Label text: `12px / 500 / 1.35`
- Caption text: `11px / 500 / 1.35`
- Sidebar nav text: `15px / 500 / 1.35`
- Table header: `12px / 600 / 1.3`
- Table body: `13px / 400 / 1.45`
- Button text: `13px / 500 / 1.2`
- Metric text: `20px / 600 / 1.1`

## Scope of Refactor
- Typography tokens and shared text utilities in `globals.css`
- Navigation, topbar, buttons, pills, cards, tables, labels, and helper copy routed onto the compact scale
- No business logic changes
