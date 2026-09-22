# Gigxomi Product Dashboard Page System

## Phase 1 Scope

This document is the master blueprint for Gigxomi dashboards and operational pages. It defines product structure, page intent, UI patterns, business logic requirements, data needs, permissions, and implementation sequencing before any role dashboard is redesigned.

Phase 1 is documentation only. No routes, APIs, auth, database logic, dashboard UI, shell behavior, or business workflows should be changed in this phase.

## Product Scope Decision

Gigxomi should keep only pages that are workable, logical, and useful for daily operations. The product does not need a large admin surface just because a route exists. During implementation, pages can be merged, simplified, hidden, or removed when they do not support a real business workflow.

Package management is a core platform capability. Super Admin must be able to manage packages, pricing, limits, billing cycles, visibility, upgrade/downgrade behavior, and package analytics. Agency Admin should only manage their own subscription/package activation, usage, invoices, and upgrade/downgrade options.

Chat pages are protected. Do not disturb, redesign, remove, or restructure chat pages unless explicitly requested later. Chat can be visually aligned only through shared shell/design tokens if needed, but chat workflows, routing, responsiveness, and behavior must remain untouched.

### Page Keep / Merge / Remove Rule

Before implementing or refactoring any page, classify it:

| Decision | Rule |
| --- | --- |
| Keep | The page supports a recurring operational workflow, decision, approval, payment, assignment, or setting. |
| Merge | The page overlaps strongly with another page and can become a tab, section, filter, or detail panel. |
| Hide for later | The page is strategically useful but backend/data is not ready. |
| Remove | The page is not used, duplicates another workflow, or creates confusion without business value. |
| Protect | The page is sensitive or already working and should not be touched without explicit approval. |

Chat pages are marked as Protect by default.

## Product North Star

Gigxomi is a marketplace plus SaaS operating system for agencies, managers, freelancers/editors, and the platform owner. The product must help each role make faster operational decisions while building a defensible data intelligence layer around marketplace demand, supply quality, revenue behavior, automation value, and workflow reliability.

The product should not feel like a generic admin template. It should feel like a compact dark command center where every page answers a business question, exposes useful actions, and uses the same UI grammar.

## Global Product Design System

### Theme Direction

The Gigxomi interface uses an exact dark black/neon SaaS theme:

| Foundation | Rule |
| --- | --- |
| Base | Neutral black and charcoal backgrounds only. |
| Surfaces | Glossy glassmorphism containers with subtle depth, not heavy blur. |
| Accent | Lime/neon green is the primary accent for brand, action, positive state, and active state. |
| Risk | Red and orange appear only for risk, failed, overdue, warning, and destructive states. |
| Density | Compact SaaS typography and tight dashboard rhythm. |
| Style limits | No blue-heavy panels, random colors, random gradients, gaming UI, or childish 3D overload. |

### Required Token Categories

All page-level and component-level styling must come from global tokens:

| Token Category | Purpose |
| --- | --- |
| `background` | App canvas and deep page backgrounds. |
| `surface` | Primary cards, tables, drawers, panels. |
| `surface-soft` | Secondary panels and nested sections. |
| `surface-gloss` | Controlled premium glass surfaces. |
| `border` | Default low-contrast dividers and outlines. |
| `border-strong` | Active, selected, or high-attention borders. |
| `text-primary` | Main readable text. |
| `text-secondary` | Supporting labels and metadata. |
| `text-muted` | Low-emphasis helper text. |
| `primary-lime` | Primary brand action and positive signal. |
| `primary-lime-soft` | Subtle brand tint backgrounds. |
| `success` | Active, connected, approved, completed, healthy, paid. |
| `warning` | Pending, at risk, expiring, needs review. |
| `error` | Failed, rejected, critical, overdue, disconnected, unpaid. |
| `info` | Informational and neutral pending system states. |
| `radius` | All card, input, drawer, modal, badge, and button radii. |
| `shadow` | Subtle elevation only. |
| `glow` | Minimal lime focus or high-value metric emphasis. |
| `spacing` | All margins, paddings, gaps, and grid rhythm. |
| `typography` | Sizes, weights, line-height, and families. |
| `motion` | Transitions, ease curves, skeleton shimmer, drawer/modal motion. |

### Exact Brand Token Mapping

Gigxomi's app dashboard theme maps to these tokens:

| Token | Value |
| --- | --- |
| `--color-bg` | `#000000` |
| `--color-bg-soft` | `#050705` |
| `--color-surface` | `#0a0d0b` |
| `--color-surface-soft` | `#0f130f` |
| `--color-surface-elevated` | `#141911` |
| `--color-surface-gloss` | `rgba(8, 11, 8, 0.82)` |
| `--color-text-primary` | `#F5F7FB` |
| `--color-text-secondary` | `#B6C0D4` |
| `--color-text-muted` | `#7E8AA3` |
| `--color-primary` | `#D7FF2F` |
| `--color-primary-hover` | `#C8F523` |
| `--color-primary-soft` | `rgba(210, 255, 31, 0.14)` |
| `--color-border` | `rgba(255, 255, 255, 0.08)` |
| `--color-border-strong` | `rgba(210, 255, 31, 0.22)` |
| `--color-success` | `#22C55E` |
| `--color-warning` | `#F59E0B` |
| `--color-error` | `#EF4444` |
| `--color-info` | `#38BDF8` |
| `--shadow-card` | `0 10px 30px rgba(0, 0, 0, 0.28)` |
| `--shadow-soft` | `0 4px 18px rgba(0, 0, 0, 0.18)` |
| `--glow-lime-soft` | `0 0 0 1px rgba(210, 255, 31, 0.08), 0 8px 24px rgba(210, 255, 31, 0.04)` |

No dashboard page should use a giant black patched wrapper behind content. Use app background, spacing, subtle section grouping, and glossy dark cards instead.

### Typography System

| Use | Font |
| --- | --- |
| Primary app UI | Geist Sans |
| Metrics, logs, IDs, API labels | Geist Mono |
| Optional marketing/display | Satoshi |

Rules:

- Dashboard UI uses Geist Sans.
- Technical/data text may use Geist Mono.
- Satoshi is reserved for public marketing or large brand-led sections.
- Do not mix heading fonts inside dashboard pages.
- Do not import random fonts per page.
- Use `--font-sans`, `--font-mono`, and `--font-display`.

### Icon and 3D Asset System

Normal UI icons use Lucide React for sidebar, buttons, tables, filters, forms, navigation, and small actions.

Icon size tokens:

| Token | Size |
| --- | --- |
| `--icon-xs` | `14px` |
| `--icon-sm` | `16px` |
| `--icon-md` | `20px` |
| `--icon-lg` | `24px` |

3D/glossy assets must use one consistent premium family only. If assets are unavailable, use Lucide icons inside glossy lime-accent containers as fallback. Final 3D assets belong in `public/assets/icons/3d/` and must have source/license documented in `docs/GIGXOMI_BRAND_GUIDELINES.md`.

Allowed 3D placements: Super Admin executive KPI cards, Smart Insights, Empty States, Quick Actions, Integration Cards, and selected important section headers.

Disallowed 3D placements: sidebar, dense tables, long rows, small buttons, badges, forms, and every card by default.

### Future Theme Customization Rule

Gigxomi must be themeable by changing tokens only. Components and pages must not hardcode hex colors, arbitrary shadows, random border radii, or one-off spacing. If a new visual need appears, add or extend a token first, then consume that token through a shared class or component.

## Global UI Pattern System

### 1. Dashboard Pattern

Used for overview pages, executive signal views, and summary intelligence.

Required structure:

| Element | Purpose |
| --- | --- |
| Page header | Role-specific title, one-line context, optional right-side action. |
| Signal cards | Maximum 6 to 8 primary metrics in the first viewport. |
| Smart insights | Maximum 3 action-oriented insights. |
| Alert stack | Urgent items with impact, affected entity, urgency, and CTA. |
| Quick actions | Useful actions only, no decorative buttons. |
| Compact data widgets | Mini charts, progress bars, status breakdowns, and small tables. |

Rules:

- Dashboards answer what matters now, why it matters, and what action to take.
- No marketing hero sections.
- No paragraph-heavy cards.
- Cards summarize; tables investigate.

### 2. Table Pattern

Used for users, agencies, editors, payments, payouts, assignments, approvals, invoices, campaigns, logs, and other dense operational data.

Required structure:

| Element | Rule |
| --- | --- |
| Search | Always above the table when row count can exceed one page. |
| Filters | Compact controls for status, role, package, category, date, or owner. |
| Table | Compact rows, no paragraph text inside rows. |
| Row click | Opens a detail panel for investigation or editing. |
| Row actions | Minimal actions such as View, Edit, Review, Retry. |

Rules:

- Actions should not be buried inside cards.
- Dense entity management must not use card grids except on narrow mobile screens.
- Mobile can use compact list cards only when tables become unusable.

### 3. Detail Panel Pattern

Used for agency details, editor details, assignment details, payment details, approval details, ticket/chat details, and other row-driven investigation.

Required structure:

| Element | Rule |
| --- | --- |
| Header | Entity name, status badge, close action. |
| Sections | Grouped fields by business meaning. |
| Timeline/history | Include where auditability matters. |
| Footer | One primary action only. |

Rules:

- Save, Approve, or Submit can be the only primary action in a panel.
- Destructive actions must be secondary/destructive and visually lower priority.
- Detail panels should preserve current page context.

### 4. Form Pattern

Used for create/edit manager, package setup, integration setup, profile setup, onboarding forms, settings, and workflow configuration.

Required structure:

| Element | Rule |
| --- | --- |
| Grouped sections | Fields grouped by business task. |
| Labels | Labels above inputs. |
| Validation | Inline errors, helper text, and disabled states. |
| Width | Max-width constrained for readability. |
| Footer | One primary action plus cancel/secondary action. |

### 5. Card Pattern

Used for integrations, summary blocks, empty states, dashboard widgets, and action summaries.

Not used for:

- Dense lists.
- Entity management.
- Operational records that need filtering, sorting, or audit trails.

### 6. Empty State Pattern

Every empty state must include:

| Element | Purpose |
| --- | --- |
| What is missing | Clear state label. |
| Why it matters | One sentence of business context. |
| What action to take | CTA or next operational step. |
| CTA button | Only when the action exists and is permitted. |

### 7. Status System

Statuses must never rely on color alone. Every status requires a text label and tokenized badge style.

| Type | Labels |
| --- | --- |
| Success | Active, Connected, Approved, Completed, Healthy, Paid |
| Warning | Pending, At risk, Needs review, Expiring, Partially connected |
| Error | Failed, Rejected, Critical, Overdue, Disconnected, Unpaid |
| Neutral | Draft, Scheduled, In progress, Not started |

### 8. Button Hierarchy

| Button Type | Rule |
| --- | --- |
| Primary | One per section maximum. |
| Secondary | Supporting actions. |
| Ghost | Low-emphasis actions. |
| Destructive | Delete, reject, expire, disconnect only; never default primary. |

## Existing Code Inventory

### Public and System Routes

| Area | Existing routes |
| --- | --- |
| Public | `/`, `/pricing`, `/contact`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/unauthorized`, `/subscription-required` |
| Public content | `/knowledge-base`, `/knowledge-base/[slug]`, `/services/[slug]`, `/agency/[slug]`, `/editor` |
| Legal/system | `/privacy-policy`, `/terms-and-conditions`, `/disclaimer`, `/staging-health`, `/codedocs` |
| Payment/integration | `/payment/[transactionId]`, `/meta/whatsapp/callback`, `/chat` |

### Super Admin Routes

Existing:

`/super-admin`, `/super-admin/agencies`, `/super-admin/approvals`, `/super-admin/billing-control`, `/super-admin/chat`, `/super-admin/editor-economics`, `/super-admin/freelancers`, `/super-admin/instagram-inbox`, `/super-admin/login`, `/super-admin/marketing`, `/super-admin/packages`, `/super-admin/platform-settings`, `/super-admin/signup`, `/super-admin/whatsapp-control`, `/super-admin/whatsapp-flows`, `/super-admin/whatsapp-flows/builder/[flowId]`

Missing or needs route confirmation:

`/super-admin/user-accounts`, `/super-admin/search-intelligence`, `/super-admin/marketplace-demand`, `/super-admin/recommendation-quality`

### Agency Admin Routes

Existing:

`/admin`, `/admin/accounting`, `/admin/analytics`, `/admin/assignments`, `/admin/chat`, `/admin/contacts`, `/admin/delivery-review`, `/admin/delivery-review/[id]`, `/admin/freelancers`, `/admin/integrations`, `/admin/integrations/whatsapp`, `/admin/managers`, `/admin/monetization`, `/admin/packages`, `/admin/payout-requests`, `/admin/portfolio-review`, `/admin/portfolio-review/[id]`, `/admin/roles`, `/admin/service-approvals`, `/admin/system-settings`, `/admin/theme-branding`, `/admin/wallet-review`

Missing or needs route confirmation:

`/admin/team-requests`, `/admin/subscription`, `/admin/showcase`, `/admin/settings`

### Manager Routes

Existing:

`/manager`, `/manager/accounting`, `/manager/assigned-chats`, `/manager/chat`, `/manager/contacts`, `/manager/delivery-review`, `/manager/delivery-review/[id]`, `/manager/escalations`, `/manager/portfolio-review`, `/manager/portfolio-review/[id]`, `/manager/project-tracking`, `/manager/quote-review`, `/manager/service-review`, `/manager/verification-review`, `/manager/wallet-review`

Missing or needs route confirmation:

`/manager/assignments`, `/manager/reports`

### Freelancer Routes

Existing:

`/freelancer`, `/freelancer/accounting`, `/freelancer/add-service`, `/freelancer/apply-for-work`, `/freelancer/chat`, `/freelancer/draft-services`, `/freelancer/payouts`, `/freelancer/portfolio-drafts`, `/freelancer/portfolio-drafts/[id]`, `/freelancer/profile`, `/freelancer/published-services`, `/freelancer/services`, `/freelancer/services/[id]/preview`, `/freelancer/wallet`

Missing or needs route confirmation:

`/freelancer/assignments`, `/freelancer/upload-delivery`, `/freelancer/revisions`, `/freelancer/notifications`

### Existing Component Areas

| Area | Existing component families |
| --- | --- |
| Shared UI | `dashboard-primitives`, `dashboard-visuals`, `internal-app-shell`, `app-select` |
| Super Admin | Shell, access control, live dashboard, package management, marketing console, WhatsApp sections, flow builder, payment controls |
| Agency Admin | Shell, live dashboard, section content, integrations overview, dummy controls |
| Manager | Shell, section content, dummy controls |
| Freelancer | Shell, live dashboard, service management, workspace, publishing assistant |

## Role-Based Product Architecture

## Super Admin / Platform Owner

### Business Purpose

The platform owner controls Gigxomi business health, SaaS revenue, marketplace demand, supply quality, package performance, payments, platform risk, marketing intelligence, and automation reliability.

### Main Responsibilities

| Responsibility | Description |
| --- | --- |
| Revenue control | Monitor MRR, ARR, renewals, failed payments, churn risk, and package growth. |
| Marketplace control | Understand demand, missing supply, editor quality, search quality, and category gaps. |
| Operational governance | Manage agencies, editors, approvals, billing, settings, WhatsApp, and platform workflows. |
| Growth strategy | Use search, SEO, campaign, and conversion data to decide what to promote or build. |
| Risk control | Detect money leakage, payment failures, churn signals, disputes, and automation failures. |

### Allowed Pages

All Super Admin pages listed in this blueprint, plus audit and system pages where implemented.

### Forbidden Actions

Super Admin should not bypass audit logging for destructive actions, directly mutate payment outcomes without a recorded reason, expose masked private data without permission context, or manually edit production intelligence metrics without traceability.

### Key Metrics

MRR, projected next-month revenue, ARR, active agencies, new agencies, churn risk, pending and failed payments, active editors, demand score, no-result search rate, package-wise MRR, editor approval queue, automation value saved.

### Key Alerts

Failed payments, overdue invoices, high-value renewal risk, disconnected WhatsApp numbers, failed onboarding, no-result search spikes, payout disputes, missing supply for high-demand categories, webhook failures.

### Primary Dashboard Layout

Executive Signal Bar, Smart Insights, Critical Alerts, Revenue Intelligence, Package Intelligence, Agency Health, Marketplace Demand, Search Quality, Editor Supply, Marketing/SEO, Automation Intelligence, Financial Leakage.

## Agency Admin

### Business Purpose

Agency Admin runs an agency workspace: clients, chats, managers, editors, assignments, delivery review, subscriptions, payments, branding, integrations, and automation.

### Main Responsibilities

| Responsibility | Description |
| --- | --- |
| Agency operations | Monitor active projects, chats, approvals, editor load, and delivery status. |
| Team control | Manage managers, editors, permissions, assignment load, and quality review. |
| Client workflow | Manage contacts, chats, delivery, portfolio approval, and client trust. |
| Subscription control | Track package, billing, usage, invoices, and upgrade/downgrade needs. |
| Automation setup | Connect WhatsApp, Instagram, Drive, YouTube, Analytics, and automation flows. |

### Allowed Pages

Agency Admin can access all `/admin` workspace pages permitted by package and role settings.

### Forbidden Actions

Agency Admin cannot access other agencies, platform-wide revenue, editor platform economics outside their agency scope, Super Admin settings, or private platform intelligence unless explicitly exposed.

### Key Metrics

Agency revenue, active projects, active chats, pending approvals, editor utilization, bot replies, time saved, trust score, subscription status, payment status, SLA risk.

### Key Alerts

Overdue tasks, missed chats, failed WhatsApp connection, expiring package, unpaid invoice, editor overload, pending delivery approval, client escalation, failed automation.

### Primary Dashboard Layout

Signal cards for revenue/projects/chats/approvals/subscription, Smart Insights, Critical Alerts, Active Work, Recent Activity, Quick Actions, Integrations, Performance Snapshot.

## Manager

### Business Purpose

Manager handles assigned conversations, assignments, delivery tracking, approvals, and client communication without unrestricted access to agency or client private data.

### Main Responsibilities

| Responsibility | Description |
| --- | --- |
| Conversation handling | Manage assigned chats, bot handoffs, notes, and escalation. |
| Task coordination | Track assignments, deadlines, editor submissions, and client approval. |
| Delivery review | Review work quality, request changes, and escalate when needed. |
| Reporting | Track handled chats, response time, completed work, and escalation rate. |

### Allowed Pages

Manager can access assigned chats, allowed contacts, assigned work, delivery review, reports, and permitted review queues.

### Forbidden Actions

Manager cannot change package/subscription, access billing unless permitted, see unauthorized client numbers if masking is enabled, directly contact editor/client outside allowed workflow, or access other managers' private queues unless delegated.

### Key Metrics

Assigned chats, open tasks, overdue tasks, pending client replies, bot handoffs, SLA risk, completed tasks, average response time.

### Key Alerts

Overdue assignment, missed client reply, SLA breach risk, bot handoff waiting, delivery blocked, approval delay, escalation needed.

### Primary Dashboard Layout

Workload Signal Bar, Priority Queue, Assigned Chats, Due Today, SLA Risk, Recent Handoffs, Quick Actions.

## Freelancer / Editor

### Business Purpose

Freelancer/Editor receives assigned tasks, uploads work, handles revisions, tracks earnings, maintains portfolio/skills, and manages delivery status without access to sensitive agency or client data.

### Main Responsibilities

| Responsibility | Description |
| --- | --- |
| Delivery | Complete assigned tasks, upload work, respond to revisions, and meet deadlines. |
| Earnings | Track pending payouts, paid payouts, deductions, disputes, and wallet. |
| Profile quality | Maintain portfolio, skills, pricing, availability, and approval status. |
| Communication | Use platform-controlled chat/workflow only. |

### Allowed Pages

Editor can access own overview, assigned work, upload/delivery, revisions, earnings/payouts, profile/skills, services, portfolio drafts, and notifications.

### Forbidden Actions

Editor should not see client contact details unless explicitly allowed, full agency financials, unrelated agency work, platform-wide editor economics, or direct client contact outside platform rules.

### Key Metrics

Assigned tasks, pending deadlines, completed tasks, revision requests, earnings, payout status, rating/performance, approval status.

### Key Alerts

New assignment, deadline risk, revision request, payout update, profile approval/rejection, missing portfolio requirement, blocked upload.

### Primary Dashboard Layout

Work Signal Bar, Due Soon, Revision Queue, Earnings Snapshot, Upload CTA, Performance Snapshot, Notifications.

## Super Admin Page Plans

### 1. Super Admin Overview / Intelligence Center

| Field | Plan |
| --- | --- |
| Purpose | Founder command center for business health and platform intelligence. |
| Primary question | Is Gigxomi growing, leaking money, missing supply, or facing urgent operational risk today? |
| Layout pattern | Dashboard Pattern. |
| Key sections | Executive Signal Bar, Smart Insights, Critical Alerts, Revenue Intelligence, Package Intelligence, Agency Health, Editor Supply, Search Demand, Search Quality, Marketing/SEO, Automation/Bot Intelligence, Financial Leakage. |
| Key actions | Review renewals, follow up payments, approve editors, view demand gaps, review no-result searches, connect analytics, send renewal campaign. |
| Required data | Subscription revenue, agency counts, package subscriptions, payment status, editor count/status, search events, campaign data, automation events. |
| Missing backend needs | Search event pipeline, no-result tracking, marketing analytics integrations, automation value calculation, churn risk scoring. |
| States | Loading signal skeletons, missing data source cards, no alerts state, integration connection empty states. |

### 2. Agencies

| Field | Plan |
| --- | --- |
| Purpose | Manage agency accounts, packages, activation, WhatsApp readiness, renewal risk. |
| Primary question | Which agencies need activation, billing, WhatsApp, renewal, or health intervention? |
| Layout pattern | Table Pattern plus Detail Panel Pattern. |
| Table columns | Agency/User, Role, Status, WhatsApp, Package, Expiry, Last Activity, Renewal Risk, Actions. |
| Detail sections | Core Info, Package Control, WhatsApp Readiness, Activity/Health, Admin Actions, Audit History. |
| Key actions | View, edit, activate, pause, expire, save changes, manage WhatsApp. |
| Required data | Agency profile, package, billing status, expiry, activity, WhatsApp connection, onboarding state. |
| Missing backend needs | Renewal risk scoring, activity health score, package utilization, WhatsApp onboarding stage history. |
| States | No agencies found, filters empty, loading rows, save error, permission denied. |

### 3. Freelancers / Editors

| Field | Plan |
| --- | --- |
| Purpose | Manage marketplace supply and editor quality. |
| Primary question | Which editors should be approved, promoted, paid, improved, or removed from supply? |
| Layout pattern | Table Pattern plus Detail Panel Pattern. |
| Table columns | Editor, Approval Status, Skills/Categories, Price Range, Availability, Rating, Workload, Payout Status, Disputes, Actions. |
| Detail sections | Profile, Portfolio, Skills/Pricing, Availability, Performance, Assignments, Payouts, Disputes, Approval Actions. |
| Key actions | Approve, reject, request changes, feature/promote, suspend, view portfolio. |
| Required data | Editor profile, skills, pricing, rating, work history, portfolio, payout/dispute data. |
| Missing backend needs | Demand-supply matching, editor reliability score, idle editor detection, category ROI. |
| States | No editors, no pending approvals, portfolio missing, loading, review error. |

### 4. Approvals

| Field | Plan |
| --- | --- |
| Purpose | Review pending agencies, editors, work, portfolio, payment, and system approvals. |
| Primary question | What needs a decision, how urgent is it, and what is the risk of delay? |
| Layout pattern | Table Pattern plus Detail Panel Pattern. |
| Table columns | Type, Severity, Submitted By, Entity, Category, Submitted Date, SLA, Status, Actions. |
| Detail sections | Submission Details, Evidence/Files, Review Notes, History, Decision Actions. |
| Key actions | Approve, reject, request changes, escalate. |
| Required data | Approval queues, submitted entity, files, notes, reviewer, status history. |
| Missing backend needs | Unified approval queue API, severity scoring, SLA timers, audit trail standardization. |
| States | Queue empty, item unavailable, reviewer conflict, action failure. |

### 5. Packages

| Field | Plan |
| --- | --- |
| Purpose | Create and manage SaaS/agency packages. |
| Primary question | Which packages drive revenue and what limits/features control customer value? |
| Layout pattern | Table Pattern plus Form Pattern and analytics widgets. |
| Table columns | Package, Price, Billing Cycle, Visibility, Agencies, MRR, Seat Limit, WhatsApp Limit, Automation Limit, Status, Actions. |
| Detail sections | Package Basics, Pricing, Feature Limits, Upgrade/Downgrade Rules, Visibility, Analytics. |
| Key actions | Create, edit, publish/unpublish, archive, duplicate, adjust limits, manage billing cycle, manage visibility, save. |
| Required data | Package config, subscriptions, usage, feature limits, billing cycle, analytics. |
| Missing backend needs | Upgrade/downgrade rule engine, package utilization analytics, feature entitlement audit. |
| States | No packages, package in use warning, validation errors, save conflicts. |

Package management authority:

| Role | Allowed package capability |
| --- | --- |
| Super Admin | Full package management, pricing, feature limits, visibility, upgrade/downgrade rules, analytics, activation/deactivation. |
| Agency Admin | Own subscription activation, plan view, usage, invoices, upgrade/downgrade request or purchase flow. |
| Manager | No package management unless agency grants read-only package status. |
| Freelancer/Editor | No package management. |

### 6. Marketing

| Field | Plan |
| --- | --- |
| Purpose | Manage growth campaigns, SEO ideas, and demand-based promotion. |
| Primary question | Which channels, keywords, campaigns, and categories are creating growth? |
| Layout pattern | Dashboard Pattern plus Table Pattern. |
| Table columns | Campaign, Segment, Channel, Status, Sent, Clicks, Conversion, Revenue, Actions. |
| Detail sections | Campaign Setup, Segment, Message, Performance, Revenue Attribution. |
| Key actions | Create campaign, send broadcast, create SEO idea, review keyword, export segment. |
| Required data | Campaigns, source/medium, search demand, signup attribution, conversion, revenue. |
| Missing backend needs | GA/GSC connectors, campaign attribution, keyword-to-signup conversion. |
| States | Analytics not connected, no campaigns, no keyword data, campaign failure. |

### 7. User Accounts

| Field | Plan |
| --- | --- |
| Purpose | Manage users across platform roles. |
| Primary question | Who has access, what role do they have, and are there security or activity risks? |
| Layout pattern | Table Pattern plus Detail Panel Pattern. |
| Table columns | User, Role, Agency, Status, Last Login, Permissions, Masking, Account Health, Actions. |
| Detail sections | Identity, Role/Permissions, Agency Scope, Login Activity, Privacy Controls, Security Actions. |
| Key actions | Change role, suspend, reset access, update masking, save. |
| Required data | Users, roles, agency ownership, login history, permissions, masking settings. |
| Missing backend needs | Unified permission matrix, account health score, session/audit logs. |
| States | No users, role conflict, permission denied, save error. |

### 8. WhatsApp Control

| Field | Plan |
| --- | --- |
| Purpose | Platform-level WhatsApp API operations. |
| Primary question | Which WhatsApp connections are healthy, broken, onboarding, or blocking revenue/workflows? |
| Layout pattern | Table Pattern plus health widgets. |
| Table columns | Agency, Number, Connection Status, API Onboarding, Webhook Health, Template Status, Last Event, Failed Events, Actions. |
| Detail sections | Number Details, Onboarding, Webhooks, Templates, Message Delivery, Failure Log. |
| Key actions | Connect/manage, retry webhook, review templates, disconnect, save. |
| Required data | WhatsApp numbers, API status, webhook events, templates, delivery status. |
| Missing backend needs | Webhook health logs, template sync, delivery failure categorization. |
| States | Not connected, webhook failure, templates pending, loading logs. |

### 9. WhatsApp Flows

| Field | Plan |
| --- | --- |
| Purpose | Automation builder and bot intelligence. |
| Primary question | Which flows save time, convert users, or fail/handoff too often? |
| Layout pattern | Table Pattern plus builder/detail flow pages. |
| Table columns | Flow, Status, Trigger, Agencies, Bot Replies, Conversion, Handoff Rate, Failures, Actions. |
| Detail sections | Flow Setup, Triggers, Steps, Audience, Performance, Failure Log. |
| Key actions | Create, edit, activate, pause, duplicate, inspect failures. |
| Required data | Flows, triggers, replies, handoffs, conversion, failures. |
| Missing backend needs | Flow analytics, intent tracking, time saved calculations. |
| States | No flows, inactive flow, failed flow, builder validation error. |

### 10. Billing Control

| Field | Plan |
| --- | --- |
| Purpose | Payments, invoices, subscriptions, and revenue leakage. |
| Primary question | What money is collected, pending, failed, overdue, or at risk? |
| Layout pattern | Dashboard Pattern plus Table Pattern. |
| Table columns | Invoice/Payment, Agency, Package, Amount, Status, Due Date, Method, Failure Reason, Actions. |
| Detail sections | Payment Details, Invoice, Subscription, Failure History, Follow-up Actions, Audit. |
| Key actions | Retry, mark follow-up, issue refund, export, send reminder. |
| Required data | Payments, invoices, subscriptions, refunds, renewals, failure reasons. |
| Missing backend needs | Revenue leakage scoring, payment failure history, automated reminder tracking. |
| States | No failed payments, no invoices, payment provider unavailable, retry error. |

### 11. Editor Economics

| Field | Plan |
| --- | --- |
| Purpose | Understand editor payouts, platform commission, and supply monetization. |
| Primary question | Which editors/categories create revenue, risk, disputes, or idle capacity? |
| Layout pattern | Dashboard Pattern plus Table Pattern. |
| Table columns | Editor, Category, Earnings, Payouts, Commission, Completed Work, Disputes, Idle Days, ROI, Actions. |
| Detail sections | Earnings, Payouts, Commission, Performance, Disputes, Category Economics. |
| Key actions | Review payout, inspect disputes, feature editor, investigate idle supply. |
| Required data | Payouts, earnings, commission, tasks/orders, disputes, ratings, categories. |
| Missing backend needs | Category ROI, editor monetization revenue, idle editor detection. |
| States | No payout data, no disputes, economics tracking unavailable. |

### 12. Platform Settings

| Field | Plan |
| --- | --- |
| Purpose | System controls for branding, theme, integrations, permissions, privacy, and notifications. |
| Primary question | Which platform-wide rules and integrations control product behavior? |
| Layout pattern | Form Pattern plus settings tables. |
| Sections | Branding, Theme Tokens, Integrations, Role Permissions, Privacy Rules, Notifications, Audit Settings. |
| Key actions | Save settings, test integration, update permission preset, reset token group. |
| Required data | Global settings, theme tokens, integration credentials/status, role permissions, notification preferences. |
| Missing backend needs | Settings audit logs, permission preset versioning, token preview environment. |
| States | Missing integration, unsaved changes, permission conflict, save failure. |

## Agency Admin Page Plans

### 1. Agency Overview

| Field | Plan |
| --- | --- |
| Purpose | Agency owner command center. |
| Pattern | Dashboard Pattern. |
| Key metrics | Revenue, active projects, active chats, pending approvals, editor utilization, bot replies, time saved, trust score, subscription status, payment status. |
| Actions | Add editor, assign work, approve tasks, send broadcast, connect integration, renew/upgrade package. |
| Permissions | Agency Admin only; managers can see limited operational overview if allowed. |
| Missing data | Trust score, time saved value, editor utilization, subscription risk. |
| States | No projects, no chats, integrations not connected, subscription expired. |

### 2. Chat Inbox

| Field | Plan |
| --- | --- |
| Purpose | Manage client communication. |
| Pattern | Table/list workspace plus detail conversation panel. |
| Columns/items | Client, assigned manager, source, bot/human, SLA, last message, priority, status. |
| Actions | Assign, reply, add note, escalate, mark resolved. |
| Permissions | Phone visibility depends on masking; managers see assigned chats only. |
| Missing data | SLA tracking, bot handoff reason, masked/unmasked audit. |
| States | No chats, no assigned chats, failed message send, disconnected WhatsApp. |

### 3. Managers

| Field | Plan |
| --- | --- |
| Purpose | Create and manage managers. |
| Pattern | Table Pattern plus Detail Panel/Form Pattern. |
| Columns | Manager, Email, Queue, Permissions, Phone Masking, Active Status, Assigned Conversations, Last Login, Actions. |
| Actions | Invite, edit, activate/deactivate, assign queue, save. |
| Permissions | Agency Admin controls managers; managers cannot edit own permission scope. |
| Missing data | Queue load, manager performance, permission templates. |
| States | No managers, invite pending, invalid permission mix. |

### 4. Team Editors

| Field | Plan |
| --- | --- |
| Purpose | Manage agency editors. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Editor, Skill, Current Workload, Availability, Performance, Assignment Status, Rating, Actions. |
| Actions | Assign, remove from team, view work, adjust availability if allowed. |
| Permissions | Agency Admin can manage; managers may view or assign if allowed. |
| Missing data | Workload score, performance score, availability sync. |
| States | No editors, editor unavailable, assignment conflict. |

### 5. Team Requests

| Field | Plan |
| --- | --- |
| Purpose | Manage requests from editors/managers. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Request Type, Submitted By, Project, Priority, Due Date, Status, Actions. |
| Actions | Approve, reject, request clarification, assign owner. |
| Permissions | Agency Admin or permitted managers. |
| Missing data | Unified request model, SLA rules, audit history. |
| States | No requests, overdue requests, action failure. |

### 6. All Contacts

| Field | Plan |
| --- | --- |
| Purpose | Client/contact database. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Contact, Masked Phone, Source, Last Chat, Assigned Manager, Lead/Client Tag, Status, Actions. |
| Actions | Assign manager, update tag, add note, start chat. |
| Permissions | Masking rules apply by role; exports require explicit permission. |
| Missing data | Contact source attribution, lifecycle stage, consent tracking. |
| States | No contacts, masked access denied, source missing. |

### 7. Subscription Activate

| Field | Plan |
| --- | --- |
| Purpose | Package and billing control for agency. |
| Pattern | Dashboard Pattern plus Form/Checkout Pattern. |
| Metrics | Current plan, usage, seat billing, invoices, expiry, upgrade opportunities. |
| Actions | Activate, upgrade, downgrade, renew, pay invoice, download invoice. |
| Permissions | Agency owner/admin only. |
| Missing data | Seat usage, entitlement checks, upgrade proration. |
| States | No active package, payment pending, invoice failed, package expired. |

### 8. Assignments

| Field | Plan |
| --- | --- |
| Purpose | Assign projects/tasks. |
| Pattern | Table Pattern plus Detail Panel/Form Pattern. |
| Columns | Project, Client, Editor, Deadline, Status, Priority, Delivery Stage, Actions. |
| Actions | Create, assign editor, update status, request revision, close. |
| Permissions | Agency Admin and permitted managers. |
| Missing data | Workload conflict detection, deadline risk, status automation. |
| States | No assignments, overdue tasks, editor unavailable, save conflict. |

### 9. Delivery Review

| Field | Plan |
| --- | --- |
| Purpose | Approve editor submissions before client delivery. |
| Pattern | Table Pattern plus media/detail review panel. |
| Columns | Project, Editor, Submitted File, Revision Status, Quality Status, Due Date, Actions. |
| Actions | Approve, request changes, add notes, deliver to client. |
| Permissions | Agency Admin and permitted managers. |
| Missing data | Version history, media preview metadata, quality checklist. |
| States | No submissions, preview unavailable, review conflict. |

### 10. Portfolio Review

| Field | Plan |
| --- | --- |
| Purpose | Approve work to showcase. |
| Pattern | Table Pattern plus media review panel. |
| Columns | Work, Category, Editor, Visibility, Approval Status, Submitted Date, Actions. |
| Actions | Approve, reject, request changes, set visibility. |
| Permissions | Agency Admin or brand/content permission. |
| Missing data | SEO metadata, public showcase visibility, category taxonomy. |
| States | No portfolio submissions, missing file, approval failed. |

### 11. Payout Control

| Field | Plan |
| --- | --- |
| Purpose | Agency-side payouts. |
| Pattern | Dashboard Pattern plus Table Pattern. |
| Columns | Editor, Earned, Pending Payout, Paid, Deductions, Dispute, Status, Actions. |
| Actions | Approve payout, mark paid, dispute, export. |
| Permissions | Agency Admin or finance permission only. |
| Missing data | Payout ledger, deductions model, dispute workflow. |
| States | No payouts, pending approval, payment failed. |

### 12. Accounting

| Field | Plan |
| --- | --- |
| Purpose | Agency financial control. |
| Pattern | Dashboard Pattern plus Table Pattern. |
| Metrics | Revenue, expenses, pending payments, invoices, profit. |
| Actions | Export, review invoice, mark expense, reconcile payment. |
| Permissions | Agency Admin and finance-permitted users only. |
| Missing data | Profit model, expense categories, reconciliation. |
| States | No invoices, no expenses, export unavailable. |

### 13. Monetization

| Field | Plan |
| --- | --- |
| Purpose | Agency growth and upsell tracking. |
| Pattern | Dashboard Pattern. |
| Metrics | Revenue per client, subscription revenue, campaign performance, upsell opportunities. |
| Actions | Send campaign, create upsell list, review top clients. |
| Permissions | Agency Admin and permitted growth managers. |
| Missing data | Client revenue attribution, campaign-to-revenue conversion. |
| States | No campaigns, no revenue data, attribution missing. |

### 14. Integrations

| Field | Plan |
| --- | --- |
| Purpose | Connect WhatsApp, Instagram, Drive, YouTube, Analytics. |
| Pattern | Integration Card Pattern plus setup forms. |
| Cards | WhatsApp, Instagram, Drive, YouTube, Analytics. |
| Actions | Connect, manage, test, disconnect. |
| Permissions | Agency Admin only unless delegated. |
| Missing data | Health checks, provider-specific status, reconnect flow. |
| States | Not connected, partially connected, failed health check. |

### 15. Showcase Page

| Field | Plan |
| --- | --- |
| Purpose | Public agency portfolio. |
| Pattern | Table/Card management plus Form Pattern. |
| Data | Videos, categories, visibility, SEO metadata, public agency slug. |
| Actions | Add work, edit metadata, publish/unpublish, preview. |
| Permissions | Agency Admin and content permission. |
| Missing data | SEO fields, public preview validation, category schema. |
| States | No showcase items, unpublished profile, invalid media. |

### 16. Branding

| Field | Plan |
| --- | --- |
| Purpose | Agency brand settings. |
| Pattern | Form Settings Template. |
| Fields | Logo, colors, typography, public profile, social links. |
| Actions | Upload, preview, save, reset. |
| Permissions | Agency Admin only. |
| Missing data | Brand token mapping, preview environment. |
| States | Missing logo, invalid file, save failed. |

### 17. Agency Settings

| Field | Plan |
| --- | --- |
| Purpose | Privacy, workflow, permissions, notifications. |
| Pattern | Form Settings Template plus permission matrix. |
| Sections | Masking settings, manager permissions, freelancer restrictions, notification settings, workflow rules. |
| Actions | Save, reset, test notification. |
| Permissions | Agency owner/admin only. |
| Missing data | Permission templates, audit logs, workflow rule engine. |
| States | Unsaved changes, permission conflict, save error. |

## Manager Page Plans

### 1. Manager Overview

| Field | Plan |
| --- | --- |
| Purpose | Show assigned workload and urgency. |
| Pattern | Dashboard Pattern. |
| Metrics | Assigned chats, open tasks, overdue tasks, pending client replies, bot handoffs, SLA risk. |
| Actions | Open priority chat, review overdue task, escalate, add note. |
| Permissions | Manager sees own assigned scope unless supervisor permission exists. |
| Missing data | SLA risk model, queue load, handoff reason. |
| States | No assigned work, no urgent items, data unavailable. |

### 2. Assigned Chats

| Field | Plan |
| --- | --- |
| Purpose | Manage assigned chat queue. |
| Pattern | Chat list plus detail conversation panel. |
| Items | Client, masked/unmasked phone, last message, priority, assigned project, notes, SLA. |
| Actions | Reply, note, escalate, resolve. |
| Permissions | Masking based on agency setting; assigned chats only. |
| Missing data | Masking audit, SLA timers, priority rules. |
| States | No assigned chats, message send failed, disconnected channel. |

### 3. Assignments

| Field | Plan |
| --- | --- |
| Purpose | Track project/task execution. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Task, Editor, Deadline, Status, Client Approval, Delivery State, Priority, Actions. |
| Actions | Update status, request revision, escalate, add note. |
| Permissions | Assigned or delegated tasks only. |
| Missing data | Assignment ownership, revision history, delivery stage model. |
| States | No assignments, overdue tasks, editor blocked. |

### 4. Delivery Review

| Field | Plan |
| --- | --- |
| Purpose | Review editor submissions. |
| Pattern | Table Pattern plus review panel. |
| Columns | Submission, Editor, Project, Due Date, Quality Notes, Status, Actions. |
| Actions | Approve, request changes, escalate to agency admin. |
| Permissions | Managers can review only if allowed. |
| Missing data | Quality checklist, media preview, escalation reason. |
| States | No submissions, preview failed, permission denied. |

### 5. Contacts

| Field | Plan |
| --- | --- |
| Purpose | View allowed contacts. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Contact, Masked Phone, Source, Last Chat, Tag, Status, Actions. |
| Actions | Add note, tag, open chat. |
| Permissions | Contact scope and phone masking enforced. |
| Missing data | Contact ownership, masking reason, consent. |
| States | No contacts, masked access denied. |

### 6. Reports

| Field | Plan |
| --- | --- |
| Purpose | Manager performance reporting. |
| Pattern | Dashboard Pattern plus compact tables. |
| Metrics | Chats handled, average response time, completed tasks, escalation rate, SLA misses. |
| Actions | Export if permitted, review details. |
| Permissions | Manager sees own reports; agency admin sees team reports. |
| Missing data | Response-time events, task completion events, export permission. |
| States | No report data, tracking unavailable. |

## Freelancer / Editor Page Plans

### 1. Editor Overview

| Field | Plan |
| --- | --- |
| Purpose | Show work, deadlines, earnings, and performance. |
| Pattern | Dashboard Pattern. |
| Metrics | Assigned tasks, pending deadlines, completed tasks, revision requests, earnings, rating/performance, payout status. |
| Actions | Open assignment, upload work, respond to revision, view payout. |
| Permissions | Editor sees own work only. |
| Missing data | Performance score, earnings forecast, deadline risk. |
| States | No assignments, no earnings yet, profile pending approval. |

### 2. My Assignments

| Field | Plan |
| --- | --- |
| Purpose | List assigned tasks. |
| Pattern | Table/List Pattern plus Detail Panel. |
| Columns | Project/Task, Brief, Deadline, Status, Revision Notes, Manager Notes, Actions. |
| Actions | View brief, upload work, ask question, mark progress. |
| Permissions | Own assignments only. |
| Missing data | Version history, secure brief access, status workflow. |
| States | No assignments, overdue, upload blocked. |

### 3. Upload / Delivery

| Field | Plan |
| --- | --- |
| Purpose | Submit work for review. |
| Pattern | Form Pattern plus version history. |
| Fields | File/link upload, notes, version, assignment, submit. |
| Actions | Upload, save draft, submit for review. |
| Permissions | Own assigned task only. |
| Missing data | Storage validation, file virus scan, versioning. |
| States | Upload failed, unsupported file, submitted successfully. |

### 4. Revisions

| Field | Plan |
| --- | --- |
| Purpose | Manage requested changes. |
| Pattern | Table Pattern plus Detail Panel. |
| Columns | Task, Revision Reason, Feedback, Due Date, Status, Actions. |
| Actions | View feedback, upload revision, ask clarification. |
| Permissions | Own revisions only. |
| Missing data | Revision SLA, feedback attachments, version compare. |
| States | No revisions, overdue revision, resubmit failed. |

### 5. Earnings / Payouts

| Field | Plan |
| --- | --- |
| Purpose | Track earnings and payouts. |
| Pattern | Dashboard Pattern plus Table Pattern. |
| Columns | Work, Earned Amount, Pending, Paid, Deductions, Dispute, Date, Actions. |
| Actions | View payout, raise dispute, download statement if allowed. |
| Permissions | Own payouts only. |
| Missing data | Payout ledger, dispute reason, payment provider status. |
| States | No earnings, payout pending, payout failed. |

### 6. Profile / Skills

| Field | Plan |
| --- | --- |
| Purpose | Maintain portfolio, skills, pricing, availability, and approval status. |
| Pattern | Form Pattern plus Portfolio Table/Card Pattern. |
| Fields | Bio, skills, categories, pricing, availability, portfolio, approval status. |
| Actions | Save profile, submit for approval, add portfolio item. |
| Permissions | Editor edits own profile; platform/agency approves visibility. |
| Missing data | Skill taxonomy, approval status history, profile completeness score. |
| States | Profile incomplete, approval pending, rejected with reason. |

### 7. Notifications

| Field | Plan |
| --- | --- |
| Purpose | Show actionable system updates. |
| Pattern | Table/List Pattern. |
| Items | New assignment, revision request, payout update, approval/rejection, deadline warning. |
| Actions | Mark read, open related entity. |
| Permissions | Own notifications only. |
| Missing data | Notification preferences, read state, related entity links. |
| States | No notifications, unread filter empty. |

## Privacy and Permission System

### Role Permission Matrix

| Capability | Super Admin | Agency Admin | Manager | Freelancer/Editor |
| --- | --- | --- | --- | --- |
| View platform revenue | Yes | No | No | No |
| View agency revenue | Yes | Own agency | Only if permitted | No |
| View client phone | Yes with audit | Own agency based on masking | Only if permitted | No unless explicitly allowed |
| Manage packages | Yes | Own subscription only | No | No |
| Manage agencies | Yes | No | No | No |
| Manage managers | No unless platform support | Own agency | No | No |
| Manage editors | Platform-wide | Own/team scope | Assign/review if permitted | Own profile only |
| Approve editor/platform supply | Yes | Agency portfolio/work approvals | Delivery approvals if permitted | No |
| Export data | Yes with audit | Own agency if permitted | Usually no | Own statements only |
| Delete/archive entities | Yes with audit | Scoped and permissioned | No or limited | No |

### Privacy Rules

| Area | Rule |
| --- | --- |
| Customer phone masking | Must be configurable by agency and enforced for managers/editors. |
| Client data visibility | Role, assignment, and agency scope must control visibility. |
| Assignment visibility | Users see only assigned or owned work unless admin permission exists. |
| Financial visibility | Platform, agency, manager, and editor financial scopes must be separate. |
| Chat visibility | Managers see assigned chats; editors should not see client chats unless workflow allows it. |
| Editor identity visibility | Agency may see assigned/team editors; client-facing exposure must be controlled. |
| Audit logs | Required for role changes, masking overrides, approvals, payments, destructive actions, and manual status changes. |

### Every Page Must Document

Who can view, who can edit, who can approve, who can delete, who can export, and who sees masked data.

## Business Logic Checklist

Every page implementation must answer these questions before coding:

| Question | Required answer |
| --- | --- |
| What data is shown? | Entity, fields, derived metrics, filters, and default sort. |
| Who owns the data? | Platform, agency, manager, editor, or external provider. |
| What action changes state? | Button/action, target entity, new state, required validation. |
| What API is required? | Endpoint, method, payload, response, error states. |
| What validation is required? | Field validation, permission validation, workflow validation. |
| What happens after save? | Toast, refresh, drawer close, audit log, notification. |
| What notification triggers? | Recipient, channel, template, timing. |
| What audit log is needed? | Actor, old value, new value, reason, timestamp. |
| What permission is required? | View/edit/approve/delete/export/masking scope. |
| What empty state is shown? | Missing entity, why it matters, action. |
| What error state is shown? | Clear message, retry path, fallback action. |

## Data Intelligence / Moat Layer

The data moat is created by capturing operational events across demand, supply, revenue, workflow, automation, and quality. Competitors can copy UI, but they cannot copy historical marketplace intelligence.

### Event Schema

Every event should support the same standard fields:

| Field | Description |
| --- | --- |
| `event_name` | Canonical event name. |
| `timestamp` | Server timestamp. |
| `actor_id` | User or system actor id. |
| `actor_role` | Super Admin, Agency Admin, Manager, Freelancer, System. |
| `entity_id` | Main affected entity id. |
| `agency_id` | Agency id when applicable. |
| `editor_id` | Editor id when applicable. |
| `amount` | Payment, payout, subscription, or revenue amount when applicable. |
| `keyword_query` | Search/prompt text when applicable. |
| `category_service` | Category or service taxonomy value. |
| `source` | Channel, provider, campaign, or UI source. |
| `metadata` | JSON payload for event-specific context. |

### Required Events

| Event | Purpose |
| --- | --- |
| `user_signup` | Track acquisition and user creation. |
| `user_login` | Track activity and account health. |
| `agency_created` | Track agency growth and onboarding. |
| `agency_subscription_started` | Track new subscription revenue. |
| `agency_subscription_renewed` | Track retention and renewal behavior. |
| `agency_subscription_cancelled` | Track churn. |
| `package_selected` | Track package intent. |
| `package_upgraded` | Track expansion revenue. |
| `package_downgraded` | Track contraction risk. |
| `payment_success` | Track collected revenue. |
| `payment_failed` | Track leakage and billing risk. |
| `prompt_search_submitted` | Build search demand graph. |
| `prompt_search_result_clicked` | Measure result quality. |
| `prompt_search_no_result` | Detect supply gaps. |
| `editor_profile_viewed` | Track supply interest. |
| `editor_contact_clicked` | Track conversion intent. |
| `chat_started` | Track demand-to-conversation movement. |
| `bot_reply_sent` | Measure automation coverage. |
| `human_handoff` | Detect automation limits. |
| `editor_approved` | Track supply activation. |
| `editor_rejected` | Track supply quality filtering. |
| `editor_assigned` | Track supply utilization. |
| `task_created` | Track operational workload. |
| `task_submitted` | Track delivery velocity. |
| `task_approved` | Track completed value. |
| `revision_requested` | Track quality/rework. |
| `payout_created` | Track editor economics. |
| `payout_paid` | Track payout completion. |
| `dispute_created` | Track trust and financial risk. |
| `whatsapp_connected` | Track integration readiness. |
| `whatsapp_disconnected` | Track workflow risk. |
| `campaign_sent` | Track marketing activity. |
| `campaign_clicked` | Track marketing engagement. |

### Defensibility Assets

| Asset | Description |
| --- | --- |
| Search Demand Graph | What users search, which categories trend, and which keywords convert. |
| Supply Graph | Which editors exist, skills, pricing, performance, availability, and reliability. |
| Demand-Supply Gap Engine | High-demand/low-supply categories, missing editor categories, SEO/content opportunities. |
| Trust & Quality Graph | Editor reliability, agency reliability, SLA patterns, disputes, revision rates. |
| Revenue Intelligence | Package performance, churn indicators, renewal behavior, upsell opportunities. |
| Automation Intelligence | Bot replies, time saved, handoff patterns, missed intents, workflow failures. |

## Pixel-to-Pixel UI Consistency Rules

Every page must follow the same:

| System | Rule |
| --- | --- |
| Page header | Title, subtitle, optional right-side action, consistent spacing. |
| Container style | Neutral dark/glossy tokenized surfaces only. |
| Spacing rhythm | Tokenized section gaps and compact grid rhythm. |
| Card style | Same radius, border, surface, hover, and shadow. |
| Table style | Same utility bar, compact rows, badges, row actions. |
| Drawer style | Same width, header, section grouping, footer. |
| Form style | Same label placement, input sizing, validation, max width. |
| Status badges | Same label mapping and tokenized colors. |
| Button hierarchy | One primary action per section. |
| Mobile behavior | No horizontal overflow; tables adapt or become compact list rows. |

No page should look like a separate product.

## Page Templates

### 1. Dashboard Template

Use for role overview and intelligence pages.

Structure:

1. Page Header
2. Executive/Role Signal Bar
3. Smart Insights
4. Alert Stack
5. Main Grid
6. Quick Actions
7. Supporting Data Widgets
8. Missing Data/Integration States

### 2. Table Management Template

Use for entity management pages.

Structure:

1. Page Header
2. Utility Bar
3. Table
4. Row Click Detail Panel
5. Empty/Loading/Error States

### 3. Detail Drawer Template

Use for row investigation and scoped editing.

Structure:

1. Header with entity name and status
2. Grouped content sections
3. Optional timeline/history
4. Secondary/destructive actions grouped away from footer
5. Footer with one primary action

### 4. Form Settings Template

Use for setup and configuration pages.

Structure:

1. Page Header
2. Form sections
3. Validation and helper text
4. Preview/test area when useful
5. Footer with one primary action

### 5. Integration Card Template

Use for integration setup.

Structure:

1. Integration name
2. Status badge
3. Business value line
4. Health details
5. CTA to connect/manage/test

### 6. Empty State Template

Use when data is absent or integration is not connected.

Structure:

1. Clear empty title
2. Why it matters
3. Action to fix it
4. CTA when permitted
5. Data source label if backend/integration is missing

### 7. Alert Stack Template

Use for urgent operational issues.

Structure:

1. Alert title
2. Severity and urgency
3. Financial or operational impact
4. Affected entity
5. Reason
6. Recommended action
7. CTA

## Planned Pages by Role

| Role | Planned pages |
| --- | --- |
| Super Admin | Overview, Agencies, Freelancers/Editors, Approvals, Packages, Marketing, User Accounts, WhatsApp Control, WhatsApp Flows, Billing Control, Editor Economics, Platform Settings |
| Agency Admin | Overview, Chat Inbox, Managers, Team Editors, Team Requests, All Contacts, Subscription Activate, Assignments, Delivery Review, Portfolio Review, Payout Control, Accounting, Monetization, Integrations, Showcase Page, Branding, Agency Settings |
| Manager | Overview, Assigned Chats, Assignments, Delivery Review, Contacts, Reports |
| Freelancer/Editor | Overview, My Assignments, Upload/Delivery, Revisions, Earnings/Payouts, Profile/Skills, Notifications |

## Existing vs Missing vs Refactor Needs

### Pages Already Existing

| Role | Existing coverage |
| --- | --- |
| Super Admin | Overview, Agencies, Approvals, Billing Control, Chat, Editor Economics, Freelancers, Instagram Inbox, Marketing, Packages, Platform Settings, WhatsApp Control, WhatsApp Flows, Flow Builder |
| Agency Admin | Overview, Accounting, Analytics, Assignments, Chat, Contacts, Delivery Review, Freelancers, Integrations, WhatsApp Integration, Managers, Monetization, Packages, Payout Requests, Portfolio Review, Roles, Service Approvals, System Settings, Theme Branding, Wallet Review |
| Manager | Overview, Accounting, Assigned Chats, Chat, Contacts, Delivery Review, Escalations, Portfolio Review, Project Tracking, Quote Review, Service Review, Verification Review, Wallet Review |
| Freelancer | Overview, Accounting, Add Service, Apply For Work, Chat, Draft Services, Payouts, Portfolio Drafts, Profile, Published Services, Services, Service Preview, Wallet |

### Missing or Unclear Pages

| Role | Missing or unclear |
| --- | --- |
| Super Admin | User Accounts, Search Intelligence, Marketplace Demand, Recommendation Quality |
| Agency Admin | Team Requests, Subscription Activate as a distinct page, Showcase Page, Agency Settings as a distinct route |
| Manager | Assignments as a distinct route, Reports |
| Freelancer | My Assignments, Upload/Delivery, Revisions, Notifications |

### Pages Needing Refactor

| Area | Refactor need |
| --- | --- |
| Super Admin pages | Apply shared dashboard/table/drawer templates consistently after shared UI foundation exists. |
| Agency Admin pages | Move dense operational pages to table/detail patterns and remove card-list management where present. |
| Manager pages | Tighten role scope, masking, assigned-only views, and compact workload prioritization. |
| Freelancer pages | Separate services/profile from actual assigned work, delivery, revision, and payout workflows. |

### Page Rationalization Candidates

These pages should be reviewed before implementation to avoid building unnecessary screens:

| Area | Candidate | Recommended decision |
| --- | --- | --- |
| Super Admin | `/super-admin/chat` | Protect. Do not disturb chat behavior. Only revisit if a platform chat-control requirement is explicitly approved. |
| Agency Admin | `/admin/chat` | Protect. Do not disturb existing chat workflow. |
| Manager | `/manager/chat` and `/manager/assigned-chats` | Protect. Keep current chat behavior; future work should focus only on surrounding workload/assignment context. |
| Freelancer | `/freelancer/chat` | Protect. Do not refactor unless editor chat workflow is explicitly redesigned. |
| Agency Admin | `/admin/roles` and `/admin/system-settings` | Consider merge into Agency Settings if they duplicate permissions/settings. |
| Agency Admin | `/admin/packages` and planned Subscription page | Keep only if roles are clear: packages for subscription/package view, subscription for billing activation if separate flow is needed. Otherwise merge. |
| Agency Admin | `/admin/wallet-review`, `/admin/payout-requests`, `/admin/accounting` | Consider merge under Accounting/Payout Control if workflows overlap. |
| Manager | Review queue routes such as quote/service/verification/wallet review | Keep only queues that managers truly operate; merge into a unified Review Queue if data/actions overlap. |
| Freelancer | Service draft/published/service management routes | Keep if marketplace service publishing is active; otherwise merge into Profile/Skills and Portfolio. |

## Shared UI Components Needed

| Component | Purpose |
| --- | --- |
| DashboardSignalCard | Standard KPI card with value, trend, status, interpretation. |
| SmartInsightCard | Action-oriented insight with issue, impact, CTA. |
| AlertStack | Urgent issues with severity, impact, entity, action. |
| DataWidgetCard | Compact chart/progress/status summary container. |
| ManagementTable | Tokenized table with search/filter slot, row click, compact rows. |
| DetailDrawer | Shared side panel with header, sections, footer, one primary action. |
| FormSection | Grouped form block with compact spacing and validation. |
| StatusBadge | Canonical status label and tokenized style system. |
| EmptyState | Consistent missing data/integration state. |
| QuickAction | Compact action tile/button with permission-aware disabled state. |
| IntegrationCard | Connection status, health, and CTA. |
| MetricSparkline | Lightweight visual trend placeholder/component. |
| ProgressIndicator | Seat usage, SLA, utilization, completion. |

## Business Logic Gaps

| Gap | Affected areas |
| --- | --- |
| Unified permission matrix | All roles and pages. |
| Customer phone masking audit | Agency Admin, Manager, Freelancer, Contacts, Chat. |
| Event tracking pipeline | Intelligence dashboards, search, revenue, automation, workflow. |
| Search demand tracking | Super Admin Overview, Marketplace Demand, SEO, Recommendation Quality. |
| No-result search tracking | Demand-supply gap, editor onboarding strategy. |
| Churn/renewal risk scoring | Super Admin, Agencies, Billing, Agency Overview. |
| Package utilization tracking | Packages, Subscription, Revenue Intelligence. |
| Editor workload/utilization | Agency Overview, Team Editors, Assignments, Editor Economics. |
| SLA tracking | Chat Inbox, Manager Overview, Delivery Review, Alerts. |
| Automation value calculation | Agency Overview, Super Admin Automation, WhatsApp Flows. |
| Unified approval queue | Super Admin Approvals, Agency Reviews, Manager Reviews. |
| Audit log standardization | Payments, permissions, approvals, settings, masking overrides. |

## Missing APIs and Data Sources

| Data/API | Needed for |
| --- | --- |
| Event ingestion API | Moat layer, intelligence dashboards, search analytics, automation analytics. |
| Search analytics API | Prompt demand, no-result searches, recommendation quality. |
| Revenue intelligence API | MRR, ARR, projected revenue, expansion/churned MRR. |
| Package utilization API | Seats billed vs used, feature limits, upgrade opportunities. |
| Agency health API | Login activity, onboarding, WhatsApp readiness, payment risk. |
| Editor supply API | Skills, pricing, workload, approval, disputes, demand-supply gaps. |
| Marketing analytics connectors | Google Analytics, Search Console, campaign attribution. |
| WhatsApp health API | Webhooks, message delivery, templates, failed events. |
| Automation analytics API | Bot replies, handoff, time saved, missed chats. |
| Audit log API | Permission changes, masking overrides, payment/status actions. |

## Permission and Privacy Risks

| Risk | Mitigation |
| --- | --- |
| Managers seeing unmasked client data | Enforce masking at API and UI level; audit overrides. |
| Editors seeing client/private agency data | Scope all editor APIs to assigned work and permitted fields. |
| Agency Admin seeing platform-wide intelligence | Separate platform and agency analytics endpoints. |
| Destructive actions without audit | Require reason, actor, old/new values, and timestamp. |
| Export leaking private data | Permission-gated export with masking and audit. |
| Payment state edited manually | Require provider reconciliation and audit trail. |
| Cross-agency data leakage | Agency ID must be server-enforced, not client-filtered only. |

## Implementation Roadmap

### PASS 1: Documentation and Page Architecture Only

Create this master blueprint, confirm existing routes/pages, define patterns, roles, permissions, data needs, missing APIs, and safe sequencing.

### PASS 2: Shared UI Foundation

Implement reusable shared patterns only:

- Dashboard card template
- Table template
- Detail drawer template
- Form section template
- Status badge system
- Empty state component
- Alert stack component
- Quick action component

Do not redesign role pages in this pass.

Phase 2 implementation source:

| Foundation item | Source |
| --- | --- |
| Shared React primitives | `src/components/ui/product-system.tsx` |
| Tokenized class styles | `src/styles/design-tokens.css` |
| Protected areas | Chat pages remain untouched unless explicitly approved. |

Reusable components created for future phases:

| Component | Use |
| --- | --- |
| `DashboardSignalCard` | Executive and role overview KPI cards. |
| `SmartInsightCard` | Maximum 3 decision-oriented insights. |
| `AlertStack` | Financial, operational, renewal, and workflow alerts. |
| `ManagementTable` | Table pattern for agencies, editors, payments, approvals, assignments, users. |
| `DetailDrawer` | Row-click detail panel with grouped sections. |
| `FormSection` | Settings and create/edit forms with grouped fields. |
| `StatusBadge` | Standardized status labels and colors. |
| `EmptyState` | Missing data or integration states. |
| `QuickAction` | Compact dashboard actions. |
| `IntegrationCard` | WhatsApp, Instagram, Analytics, Drive, YouTube cards. |
| `DataWidgetCard` | Compact analytics widgets. |
| `ProgressIndicator` | Seat usage, SLA health, utilization, completion. |
| `MetricSparkline` | Lightweight trend visuals. |

Phase 2 does not migrate existing pages automatically. Future passes should import these components and replace page-specific patterns role-by-role.

### PASS 3: Super Admin Pages

Implement Super Admin pages first using shared components:

- Overview / Intelligence Center
- Agencies
- Freelancers / Editors
- Approvals
- Packages
- Marketing
- User Accounts
- WhatsApp Control
- WhatsApp Flows
- Billing Control
- Editor Economics
- Platform Settings

Rules:

- Preserve existing logic.
- Do not change auth, routes, APIs, or database unless explicitly approved.
- Document missing backend needs per page.

### PASS 4: Agency Admin Pages

After Super Admin is stable, implement Agency Admin pages using shared components:

- Overview
- Chat Inbox
- Managers
- Team Editors
- Team Requests
- Contacts
- Subscription
- Assignments
- Delivery Review
- Portfolio Review
- Payout Control
- Accounting
- Monetization
- Integrations
- Showcase
- Branding
- Settings

### PASS 5: Manager Pages

After Agency Admin is stable, implement Manager pages:

- Overview
- Assigned Chats
- Assignments
- Delivery Review
- Contacts
- Reports

### PASS 6: Freelancer / Editor Pages

After Manager role is stable, implement Freelancer pages:

- Overview
- My Assignments
- Upload / Delivery
- Revisions
- Earnings / Payouts
- Profile / Skills
- Notifications

### PASS 7: Mobile and Responsive Polish

Audit all dashboards, tables, drawers, forms, cards, and shell interactions for no horizontal overflow and usable mobile density.

### PASS 8: Business Logic Gap Report

Document missing APIs, state transitions, notifications, audit logs, permissions, and data tracking by role/page.

### PASS 9: Token Audit and Visual Consistency Pass

Verify no hardcoded colors, random spacing, random radius, random shadows, blue-heavy panels, inconsistent badges, or page-specific design language remains.

## Recommended Implementation Order

| Order | Work |
| --- | --- |
| 1 | Finish and review this blueprint. |
| 2 | Rationalize pages into Keep, Merge, Hide for later, Remove, or Protect. |
| 3 | Build shared UI components and templates only. |
| 4 | Migrate Super Admin pages role-by-role using templates, starting with Overview, Agencies, Packages, Billing, and Freelancers. |
| 5 | Stabilize permissions, missing-data states, and intelligence placeholders. |
| 6 | Migrate Agency Admin pages. |
| 7 | Migrate Manager pages. |
| 8 | Migrate Freelancer pages. |
| 9 | Run responsive, token, permission, and business logic audits. |

## Risky Areas Before Coding

| Risk | Why it matters |
| --- | --- |
| Building all roles at once | Creates inconsistent UI, duplicated patterns, and permission bugs. |
| UI redesign before shared components | Causes patched CSS and visual drift. |
| Keeping every existing route without questioning it | Creates a bloated product with pages nobody uses. |
| Refactoring chat too early | Chat is workflow-sensitive and already working; disturbing it can break core communication. |
| Client-side-only permission filtering | Can leak data across agency/role boundaries. |
| Fake intelligence values | Misleads founder decisions; use explicit missing-data states instead. |
| Hardcoded styling | Breaks future theme customization. |
| Mixing cards and tables incorrectly | Makes dense operational pages hard to manage. |
| Missing audit logs | Breaks trust for payments, approvals, privacy overrides, and settings. |
| Search intelligence not tracked early | Delays the defensibility moat. |

## Phase Completion Output

### Files Created or Updated

`docs/GIGXOMI_PRODUCT_DASHBOARD_PAGE_SYSTEM.md`

### All Pages Discovered in Code

See Existing Code Inventory.

### All Planned Pages by Role

See Planned Pages by Role.

### Which Pages Already Exist

See Existing vs Missing vs Refactor Needs.

### Which Pages Are Missing

See Missing or Unclear Pages.

### Which Pages Need Refactor

Most operational pages need template alignment after PASS 2, especially table/detail management pages and role dashboards.

### Shared UI Components Needed

See Shared UI Components Needed.

### Business Logic Gaps

See Business Logic Gaps.

### Missing APIs/Data Sources

See Missing APIs and Data Sources.

### Permission/Privacy Risks

See Permission and Privacy Risks.

### Suggested Implementation Order

See Recommended Implementation Order.

### Risky Areas Before Coding

See Risky Areas Before Coding.
