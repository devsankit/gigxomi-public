# Gigxomi Shared Component System

Last updated: 2026-05-06
Phase: PASS 2 - Baseline shared component foundation implemented

## Purpose

This document defines the reusable UI component system needed before cleaning role pages. The goal is to stop page-by-page patching and make Super Admin, Agency Admin, Manager, and Freelancer pages feel like one product.

Baseline component implementation now lives in `src/components/ui/product-system.tsx` with tokenized styles in `src/styles/design-tokens.css`. Future passes should reuse these primitives instead of creating page-specific card/table/drawer systems.

Implemented baseline:

- `PageHeader`
- `MetricCard`
- `DashboardSignalCard`
- `SmartInsightCard`
- `StatusBadge`
- `DataTable` / `ManagementTable`
- `DetailDrawer`
- `FormSection`
- `EmptyState`
- `AlertStack`
- `QuickAction` / `QuickActionGrid`
- `SectionTabs`
- `UsageLimitMeter`
- `MoneyAmount`
- `PermissionGate`
- `LockedFeatureCard`
- `IntegrationCard`
- `ProgressIndicator`
- `MetricSparkline`

## Visual Contract

| Token Area | Required Values / Rule |
| --- | --- |
| Background | `--color-bg: #000000`, `--color-bg-soft: #050705` |
| Surfaces | `--color-surface: #0a0d0b`, `--color-surface-soft: #0f130f`, `--color-surface-elevated: #141911`, `--color-surface-gloss: rgba(8, 11, 8, 0.82)` |
| Text | `--color-text-primary: #F5F7FB`, `--color-text-secondary: #B6C0D4`, `--color-text-muted: #7E8AA3` |
| Accent | `--color-primary: #D7FF2F`, `--color-primary-hover: #C8F523`, `--color-primary-soft: rgba(215, 255, 47, 0.08)` |
| Borders | `--color-border: rgba(255,255,255,0.08)`, `--color-border-strong: rgba(210,255,31,0.22)` |
| Status | success, warning, error, info must use tokenized status colors only. |
| Radius/space/shadow | Use global radius, spacing, and shadow tokens only. |

Rules:

- No blue-heavy containers.
- No giant patched wrappers behind page content.
- No random gradients.
- Lime is primary action and active-state accent.
- Compact SaaS typography.
- Cards summarize. Tables manage. Drawers edit. Forms configure.
- Components must support loading, empty, and error states.

## Proposed Component Location

| Component Type | Suggested Location |
| --- | --- |
| Generic primitives | `src/components/ui/gx/` |
| Role-specific composition | `src/components/<role>/` |
| Shared CSS | Existing global/design-token CSS first, then scoped component classes if needed. |
| Types | Co-locate component prop types or create `src/components/ui/gx/types.ts`. |

Do not create a separate visual language inside role folders.

## Component 1: PageHeader

| Field | Spec |
| --- | --- |
| Purpose | Standard header for every non-chat page. |
| Props | `title`, `subtitle`, `badge`, `primaryAction`, `secondaryActions`, `breadcrumbs`, `backHref`, `meta`, `rightSlot`. |
| Used By | Every dashboard/table/settings page. |
| Must Support | Compact title, optional subtitle, one primary action, multiple secondary actions, responsive wrapping. |
| Must Avoid | Duplicate title cards inside page body when shell already has route title. |
| Empty/Error | N/A. |
| Mobile | Stack title and actions. |
| Accessibility | Header should use `h1` only when shell does not already provide one. Otherwise use `h2`/section heading. |

Example usage intent:

```tsx
<PageHeader
  title="Agencies"
  subtitle="Manage agency accounts, packages, WhatsApp readiness, and status."
  primaryAction={{ label: "Add Agency", onClick: openCreate }}
  secondaryActions={[{ label: "Refresh", onClick: refresh }]}
/>
```

## Component 2: MetricCard

| Field | Spec |
| --- | --- |
| Purpose | Compact dashboard signal card. |
| Props | `label`, `value`, `trend`, `status`, `description`, `icon`, `action`, `loading`, `dataSourceLabel`. |
| Used By | Super Admin Overview, Agency Overview, Manager/Freelancer dashboards, finance summaries. |
| Status Tones | Healthy, Watch, Critical, Neutral, Data Source Needed. |
| Must Support | Numeric values, money values, no-data state, optional trend, optional action. |
| Must Avoid | Long paragraphs and decorative overload. |
| Mobile | 1 column, then 2 columns where space allows. |
| Accessibility | Value and label must be readable without color. |

## Component 3: SmartInsightCard

| Field | Spec |
| --- | --- |
| Purpose | Decision-based insight, not raw metric. |
| Props | `severity`, `message`, `impact`, `suggestedAction`, `cta`, `entity`, `amount`, `loading`. |
| Used By | Dashboards and alert-driven pages. |
| Rules | Max 3 insights in primary dashboard view. No filler insights. |
| Severity | Info, Warning, Critical, Opportunity. |
| Empty State | If no strong insight exists, hide section or show simple empty state. |
| Mobile | Stack cards. |

## Component 4: DataTable

| Field | Spec |
| --- | --- |
| Purpose | Standard entity/data management table. |
| Props | `columns`, `rows`, `getRowId`, `filters`, `search`, `rowActions`, `onRowClick`, `loading`, `emptyState`, `errorState`, `density`, `stickyHeader`, `selection`. |
| Used By | Agencies, Freelancers, Team, Assignments, Reviews, Payments, Users, Contacts. |
| Rules | No paragraph text inside rows. Use compact cells and badges. Actions stay compact. Row click opens detail drawer. |
| Empty State | `EmptyState` component inside table shell. |
| Loading State | Skeleton rows. |
| Error State | Inline retry panel. |
| Mobile | Horizontal scroll for dense admin tables; card fallback for important small tables. |
| Accessibility | Table headers, keyboard row actions, visible focus ring. |

Column type examples:

```ts
type DataTableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
};
```

## Component 5: DetailDrawer

| Field | Spec |
| --- | --- |
| Purpose | Standard side panel for viewing/editing a record. |
| Props | `open`, `title`, `subtitle`, `status`, `sections`, `footerActions`, `onClose`, `loading`, `error`, `size`. |
| Used By | Agencies, Freelancers, Users, Assignments, Payments, Contacts, Approvals. |
| Rules | One primary footer action only. Secondary/destructive actions must not compete visually. |
| Sections | Core Info, Business Info, Status/Workflow, History, Admin Actions. |
| Empty State | If record missing, show error and close/back action. |
| Mobile | Full-screen drawer. |
| Accessibility | Focus trap, escape close, labelled title, restore focus. |

## Component 6: FormSection

| Field | Spec |
| --- | --- |
| Purpose | Reusable grouped form area. |
| Props | `title`, `description`, `fields`, `children`, `action`, `secondaryAction`, `validation`, `locked`, `loading`. |
| Used By | Packages, Settings, Profile, Services, Integrations, Payout Details. |
| Rules | Labels above inputs, max width for long forms, grouped fields, one primary action. |
| Empty/Error | Field-level errors plus form-level error. |
| Mobile | One-column fields. |
| Accessibility | Label associations and error descriptions. |

## Component 7: StatusBadge

| Field | Spec |
| --- | --- |
| Purpose | Standard status display across product. |
| Props | `status`, `tone`, `label`, `size`, `icon`, `title`. |
| Used By | All pages. |
| Success | Active, Connected, Approved, Completed, Healthy, Paid. |
| Warning | Pending, At Risk, Needs Review, Expiring, Partially Connected. |
| Error | Failed, Rejected, Critical, Overdue, Disconnected, Unpaid. |
| Neutral | Draft, Scheduled, In Progress, Not Started. |
| Rules | Never rely on color alone. Always show text. |

## Component 8: EmptyState

| Field | Spec |
| --- | --- |
| Purpose | Clear no-data experience. |
| Props | `icon`, `title`, `description`, `action`, `secondaryAction`, `dataSourceNeeded`, `compact`. |
| Used By | Every table/page/list. |
| Required Copy | What is missing, why it matters, what action to take. |
| Examples | No agencies found, no payment requests, prompt search tracking not connected, no services yet. |
| Mobile | Centered but compact. |

## Component 9: AlertStack

| Field | Spec |
| --- | --- |
| Purpose | Urgent action/risk list. |
| Props | `alerts`, `severity`, `cta`, `maxVisible`, `emptyState`, `onAlertClick`. |
| Alert Shape | `severity`, `title`, `impact`, `entity`, `reason`, `recommendedAction`, `cta`. |
| Used By | Dashboards, billing, escalations, approval queues. |
| Rules | Financial alerts must show amount/impact and urgency. |
| Mobile | Stack full width. |

## Component 10: QuickActionGrid

| Field | Spec |
| --- | --- |
| Purpose | Useful actions only, never decorative button clouds. |
| Props | `actions`, `columns`, `density`, `lockedReason`. |
| Action Shape | `label`, `description`, `icon`, `href/onClick`, `disabled`, `permission`, `packageGate`. |
| Used By | Dashboards and operational hubs. |
| Rules | Actions should link to real workflows. Hide or lock unavailable actions. |

## Component 11: SectionTabs

| Field | Spec |
| --- | --- |
| Purpose | Support merged pages without route clutter. |
| Props | `tabs`, `activeTab`, `onTabChange`, `className`. Static server pages may use the same `.gx-section-tabs` / `.gx-section-tab` classes as anchor section links. |
| Used By | Assignments Work Hub, Team and Requests, Review Queue, My Services, Earnings, Settings. |
| Rules | Tabs should represent related workflow states, not random pages. Use query params when deep-linking matters. |
| Mobile | Horizontal scroll tabs. |

## Component 12: UsageLimitMeter

| Field | Spec |
| --- | --- |
| Purpose | Show package usage and limits. |
| Props | `label`, `used`, `limit`, `status`, `description`, `upgradeAction`, `meterTone`. |
| Used By | Packages, Managers, Team, Assignments, Freelancer Services, WhatsApp/Automation limits. |
| Statuses | Allowed, Near Limit, Over Limit, Upgrade Required, Admin Override. |
| Rules | Server-side enforcement still required. UI meter is not enforcement. |

## Component 13: MoneyAmount / CurrencyDisplay

| Field | Spec |
| --- | --- |
| Purpose | Consistent INR/money formatting. |
| Props | `amount`, `currency`, `variant`, `showSign`, `mutedZero`, `precision`, `label`. |
| Used By | Billing, accounting, payouts, wallet, package pricing. |
| Rules | Default INR formatting. Do not concatenate currency strings manually page-by-page. |
| Accessibility | Include currency in accessible label. |

## Component 14: PermissionGate / LockedFeatureCard

| Field | Spec |
| --- | --- |
| Purpose | Show restricted actions/features safely. |
| Props | `allowed`, `reason`, `requiredRole`, `requiredPackage`, `fallback`, `children`, `cta`. |
| Used By | Manager finance, package-gated integrations, freelancer service limits, automation. |
| Rules | Hiding in UI is not enough. Pair with server-side permission checks. |
| Empty State | LockedFeatureCard explains what is locked and how to unlock. |

## Component 15: IntegrationCard

| Field | Spec |
| --- | --- |
| Purpose | Standard integration status card. |
| Props | `name`, `description`, `status`, `provider`, `lastCheckedAt`, `primaryAction`, `secondaryAction`, `healthItems`. |
| Used By | Agency Integrations, Super Admin Platform Settings, WhatsApp Control. |
| Rules | Cards show setup/health/actions. No decorative logos without status. |

## Component 16: Timeline / ActivityLog

| Field | Spec |
| --- | --- |
| Purpose | Show state changes and audit trails. |
| Props | `items`, `emptyState`, `compact`, `entityLabel`. |
| Used By | Assignments, payment requests, approvals, delivery review, users. |
| Rules | Financial and approval actions should eventually write audit events. |

## Page-To-Component Mapping

| Page Group | Required Components |
| --- | --- |
| Super Admin Overview | PageHeader, MetricCard, SmartInsightCard, AlertStack, DataTable, EmptyState, QuickActionGrid. |
| Super Admin Agencies/Freelancers | PageHeader, DataTable, DetailDrawer, StatusBadge, FormSection, UsageLimitMeter. |
| Super Admin Packages | PageHeader, FormSection, UsageLimitMeter, StatusBadge, DataTable/List. |
| Super Admin Approvals | PageHeader, SectionTabs, DataTable, DetailDrawer, StatusBadge, Timeline. |
| Super Admin Billing | PageHeader, MetricCard, DataTable, DetailDrawer, MoneyAmount, AlertStack, FormSection. |
| Agency Work Hub | PageHeader, SectionTabs, DataTable, DetailDrawer, FormSection, StatusBadge, AlertStack. |
| Agency Team and Requests | PageHeader, SectionTabs, DataTable, DetailDrawer, StatusBadge, UsageLimitMeter. |
| Agency Accounting/Payouts | PageHeader, MetricCard, DataTable, DetailDrawer, MoneyAmount, StatusBadge. |
| Manager Review Queue | PageHeader, SectionTabs, DataTable, DetailDrawer, StatusBadge, EmptyState. |
| Manager Project Tracking | PageHeader, DataTable, DetailDrawer, StatusBadge, Timeline. |
| Freelancer My Services | PageHeader, SectionTabs, DataTable/CardList, StatusBadge, EmptyState, UsageLimitMeter. |
| Freelancer Earnings | PageHeader, MetricCard, SectionTabs, DataTable, FormSection, MoneyAmount, StatusBadge. |
| Freelancer Profile | PageHeader, SectionTabs, FormSection, StatusBadge, PermissionGate. |
| Integrations | PageHeader, IntegrationCard, StatusBadge, LockedFeatureCard, EmptyState. |
| Settings | PageHeader, SectionTabs, FormSection, PermissionGate, Timeline. |

## Implementation Plan For PASS 2

| Order | Component | Why First |
| --- | --- | --- |
| 1 | StatusBadge | Every page needs consistent status language. |
| 2 | PageHeader | Removes duplicated page title/cards. |
| 3 | EmptyState | Prevents silent blank pages and fake placeholders. |
| 4 | DataTable | Most management pages depend on this. |
| 5 | DetailDrawer | Enables table + drawer pattern. |
| 6 | FormSection | Packages/settings/profile/services need consistent forms. |
| 7 | MoneyAmount | Finance pages need consistent INR display. |
| 8 | SectionTabs | Enables page merges safely. |
| 9 | UsageLimitMeter | Package enforcement pages need clear limits. |
| 10 | PermissionGate/LockedFeatureCard | Prevents role/package confusion. |
| 11 | AlertStack/SmartInsightCard/QuickActionGrid | Dashboard decision layer. |
| 12 | IntegrationCard/Timeline | Integrations and audit-heavy pages. |

## Component API Guardrails

| Guardrail | Rule |
| --- | --- |
| One primary action | PageHeader, FormSection, DetailDrawer footers should visually expose only one primary action. |
| No page-specific card clones | If a page needs card/table/drawer, use shared component or extend with slots. |
| No random statuses | StatusBadge maps all status strings to standard tones. |
| No raw money formatting | Use MoneyAmount for INR and future currencies. |
| No silent locks | PermissionGate/LockedFeatureCard must explain why something is unavailable. |
| Loading included | DataTable, DetailDrawer, FormSection, and dashboard cards need loading states. |
| Error included | Components must show recoverable error states with retry where possible. |
| Reduced motion | Components respect existing motion tokens and reduced motion preferences. |
| Mobile first fallback | Dense tables must have scroll or card fallback. |

## Suggested Type Shapes

```ts
type ActionConfig = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "secondary" | "ghost" | "destructive";
};

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

type EmptyStateConfig = {
  title: string;
  description: string;
  action?: ActionConfig;
};

type DataTableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
};
```

## Acceptance Criteria For Shared Components

| Criteria | Required |
| --- | --- |
| Token-only styling | Yes. No hardcoded colors, radius, spacing, or shadows. |
| Dark/lime theme alignment | Yes. |
| Mobile behavior | Required for each component. |
| Loading/empty/error states | Required where applicable. |
| Accessibility | Keyboard focus, labels, semantic structure. |
| Reusable props | Components should not know about a specific role unless passed as props. |
| No Chat disruption | Shared components must not override Chat layout globally. |
| Safe migration | Components can coexist with current pages while we migrate page by page. |

## Known Existing Components To Reuse Or Wrap

| Existing Component | Plan |
| --- | --- |
| `ChatWorkspace` | Keep as-is unless explicitly asked. |
| `AccountingSection` | Wrap with PageHeader/tabs later, do not rewrite first. |
| `DeliveryReviewWorkspace` | Reuse inside Assignments/Review Queue tabs before redirecting routes. |
| `PortfolioDraftWorkspace` | Reuse inside Showcase/Review Queue tabs. |
| `SuperAdminAccessControl` | Refactor toward DataTable + DetailDrawer after shared components exist. |
| `SuperAdminPackageManagement` | Refactor toward FormSection/UsageLimitMeter after shared components exist. |
| `FreelancerDynamicAddServiceSection` | Refactor toward FormSection after service spec is approved. |
| `PublishingAssistant` | Reuse for portfolio draft editor. |

## What Not To Build In PASS 2

| Do Not Build | Reason |
| --- | --- |
| New role dashboards | Pages should wait for shared foundation. |
| New APIs | PASS 2 is component foundation, not business logic. |
| Sidebar cleanup | Needs parent pages ready first. |
| Chat redesign | Explicitly out of scope. |
| Heavy animation/3D | Not needed for management UI. |
| Page-specific CSS systems | Defeats consolidation goal. |

## PASS 2 Output Expectations

When PASS 2 starts, output should include:

1. Files changed.
2. Components created or standardized.
3. Which existing pages were not changed.
4. Token audit result for new components.
5. Any global CSS risk.
6. Remaining component gaps before Super Admin page work.
