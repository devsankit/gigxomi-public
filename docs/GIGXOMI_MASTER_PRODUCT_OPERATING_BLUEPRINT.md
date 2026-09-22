# Gigxomi Master Product Operating Blueprint

Updated: 2026-05-06  
Status: Source of truth for product, business logic, go-live readiness, and phased implementation. For branding and visual design, use `docs/GIGXOMI_BRAND_GUIDELINES.md`.

## 1. Purpose

This document consolidates the existing Gigxomi planning, audit, design-system, business-flow, WhatsApp automation, billing, onboarding, and page-consolidation artifacts into one operating blueprint.

Use this file before starting any future implementation pass. It exists to stop scattered decisions, prevent page-by-page patching, and keep Gigxomi moving toward one coherent marketplace operating system.

Gigxomi is not a generic admin template. It is a video editor/freelancer marketplace plus SaaS operating system for agencies, managers, freelancers/editors, and the platform owner.

## 2. Consolidated Source Artifacts

| Artifact | Consolidated Into This Blueprint |
| --- | --- |
| `docs/GIGXOMI_BRAND_GUIDELINES.md` | Mandatory brand, token, typography, icon, dashboard, CRM, chat, mobile, and Codex pre-design rules. |
| `docs/GIGXOMI_SHARED_COMPONENT_SYSTEM.md` | Required reusable PageHeader, DataTable, DetailDrawer, MetricCard, StatusBadge, EmptyState, AlertStack, tabs, money, permission, and integration components. |
| `docs/GIGXOMI_PAGE_CONSOLIDATION_AND_UI_PLAN.md` | Keep, merge, redirect, hide, and defer decisions by role. |
| `docs/GIGXOMI_ROLE_PAGE_FUNCTIONALITY_MAP.md` | Page-by-page role functionality and expected page contents. |
| `docs/GIGXOMI_ROLE_BASED_UI_LOGIC_AUDIT.md` | Role connection, permission, color, button, input, dashboard, messy UI, API, and responsive audit findings. |
| `docs/GIGXOMI_PAGE_UI_API_VERIFICATION.md` | Current page/API readiness matrix and remaining production risks. |
| `docs/GIGXOMI_PRODUCT_DASHBOARD_PAGE_SYSTEM.md` | Master role/page architecture, page logic, permissions, event moat, and roadmap. |
| `docs/GIGXOMI_BUSINESS_LOGIC_AUDIT.md` | Earlier full business logic gaps and go-live blockers. |
| `docs/GIGXOMI_GO_LIVE_BUSINESS_FLOW_AUDIT.md` | Updated database-backed marketplace spine and remaining limitations. |
| `docs/AGENCY_DASHBOARD_PLAN.md` | Agency overview hierarchy, BI layers, tiering, smart insights, alerts, and UI patterns. |
| `docs/SUPER_ADMIN_INTELLIGENCE_CENTER.md` | Founder command center, intelligence modules, deep analytics, event tracking, and defensibility layer. |
| `docs/GIGXOMI_AUTOMATION_BUILDER_PLAN.md` | Automation builder scope, WhatsApp flow-builder direction, and runtime requirements. |
| `docs/GIGXOMI_AUTOMATION_RUNTIME_ENGINE.md` | Runtime node execution, webhook handling, queues, and safety requirements. |
| `docs/WHATSAPP_FLOW_BUILDER_PRODUCTION_READINESS.md` | DB-backed WhatsApp flow storage, webhook security, validation, tenant resolution, and known runtime limits. |
| `docs/WHATSAPP_FLOW_BUILDER_UI_API_AUDIT.md` | WhatsApp builder UI/API gaps and production-readiness recommendations. |
| `docs/WHATSAPP_FLOWS_RELEASE_CHECKLIST.md` | WhatsApp flow release gates and deployment checks. |
| `docs/phonepe-billing-implementation.md` | PhonePe env vars, webhook/return URLs, package registration payment behavior, and renewals. |
| `docs/operations/self-hosted-postgres.md` | VPS/local Postgres deployment target, migration path, rollback, and DATABASE_URL rules. |
| `docs/GIGXOMI_ONBOARDING_SYSTEM.md` | Guided onboarding components, persistence model, role steps, and missing backend work. |
| `docs/typography-audit.md` | Compact type scale and dashboard typography cleanup needs. |
| `docs/company-knowledge-base.md` | Brand positioning, tagline, SEO, and customer themes. |
| `README.md` | Current default Next.js readme state; should eventually point contributors to this master blueprint. |
| `UI_UX_AUDIT_BRIEF.md` | Route inventory, shells, route groups, high-impact UI files, and current visual risk areas. |
| `mobile-app/README.md` | Mobile WebView shell, push setup, deep-link expectations. |
| `public/icons/README.md` | Integration icon sources and licensing note. |
| `public/sounds/README.md` | Chat notification sound placement and fallback behavior. |

Dependency/runtime docs under `.tools/` are intentionally not treated as Gigxomi product artifacts.

## 3. Product North Star

Gigxomi should become a data-driven marketplace operating system for video editing and creative delivery.

The product must help:

| User | Main Outcome |
| --- | --- |
| Super Admin / Platform Owner | Understand revenue, risk, marketplace demand, supply gaps, package economics, automation value, and urgent action items. |
| Agency Admin | Run agency operations, chats, managers, freelancers, assignments, delivery, payouts, subscription, and integrations. |
| Manager | Handle assigned chats, project tracking, delivery review, escalations, and contacts inside allowed permissions. |
| Freelancer / Editor | Manage profile, services, applications, assignments, delivery, revisions, wallet, payment requests, and portfolio. |

The moat is not UI decoration. The moat is marketplace intelligence: prompt/search behavior, demand-supply gaps, editor performance, agency health, package economics, automation intelligence, payment leakage, and trust signals.

## 4. Non-Negotiable Engineering Guardrails

- Do not disturb ChatWorkspace unless explicitly scoped.
- Do not redesign sidebars/shells casually.
- Do not change auth, API contracts, database logic, billing logic, route behavior, or business rules during UI-only passes.
- Do not remove routes before hiding or redirecting safely.
- Do not create page-specific visual systems.
- Do not fake production metrics silently.
- Do not ship demo-only data without clear labels.
- Do not rely on UI hiding for permission/security.
- Do not hardcode colors, spacing, radius, shadows, or typography in page components.
- Do not implement all roles in one giant pass.

## 5. Final Visual System

Gigxomi visual direction is black-lime, compact, premium, and operational.

Allowed color system:

| Token | Value / Meaning |
| --- | --- |
| `--color-bg` / `--gx-bg` | `#000000`, black app canvas. |
| `--color-bg-soft` / `--gx-bg-soft` | `#050705`, sidebar/soft areas. |
| `--color-surface` / `--gx-surface` | `#0a0d0b`, cards/tables/forms. |
| `--color-surface-soft` / `--gx-surface-soft` | `#0f130f`, table headers, secondary surfaces. |
| `--color-surface-elevated` / `--gx-surface-elevated` | `#141911`, hover/elevated states. |
| `--color-surface-gloss` / `--gx-surface-gloss` | `rgba(8, 11, 8, 0.82)`, subtle premium gloss. |
| `--color-text-primary` / `--gx-text-primary` | `#F5F7FB`, main text. |
| `--color-text-secondary` / `--gx-text-secondary` | `#B6C0D4` or `#C4CDDA`, secondary text. |
| `--color-text-muted` / `--gx-text-muted` | `#7E8AA3` or `#7F8A9E`, muted metadata. |
| `--color-primary` / `--gx-primary` | `#D7FF2F`, primary brand/action/accent. |
| `--color-primary-hover` / `--gx-primary-hover` | `#C8F523`, hover accent. |
| `--color-primary-soft` / `--gx-primary-soft` | `rgba(210,255,31,0.14)`, active/selected soft state. |
| `--color-border` / `--gx-border` | `rgba(255,255,255,0.08)`, default border. |
| `--color-border-strong` / `--gx-primary-border` | `rgba(210,255,31,0.22-0.24)`, active/selected border. |
| `--color-success` / `--gx-success` | `#22C55E`, success only. |
| `--color-warning` / `--gx-warning` | `#F59E0B`, warning only. |
| `--color-error` / `--gx-error` | `#EF4444`, error/destructive only. |
| `--color-info` / `--gx-info` | `#38BDF8`, true info status only, never panels/cards. |

Visual rules:

- Lime is the only brand accent.
- Blue is allowed only for true info badges/status, not panels or cards.
- No blue-heavy containers, dashboard panels, table wrappers, or flow nodes.
- No random gradients, purple/cyan/orange decoration, or gaming UI.
- Cards summarize. Tables manage. Drawers edit. Forms configure. Tabs consolidate.
- Reduce visible explanatory copy by 50-70 percent on operational screens.
- Use fewer boxes, fewer borders, stronger hierarchy, and more functional workspace patterns.

## 6. Typography And Density

- Primary app font: Geist Sans.
- Mono/data font: Geist Mono.
- Optional display font: Satoshi only for public/brand sections, not internal dashboards.
- Dashboard type must be compact.
- Page titles must not feel like landing-page hero headings.
- Section titles should be small, clear, and operational.
- Card titles should be compact.
- Metric values should be strong but clean.
- Long educational text belongs in tooltips, accordions, onboarding drawers, or documentation, not primary UI cards.

## 7. Shared Component Contract

All future page work should reuse or extend the shared component system in `src/components/ui/product-system.tsx` and tokenized CSS in `src/styles/design-tokens.css`.

| Component | Required Use |
| --- | --- |
| `PageHeader` | Every non-chat page. Avoid duplicate page title boxes inside the body. |
| `MetricCard` / `DashboardSignalCard` | Dashboard/summary metrics only; keep short. |
| `SmartInsightCard` | Maximum 3 decision-oriented insights. No filler. |
| `DataTable` / `ManagementTable` | Agencies, freelancers, managers, contacts, assignments, reviews, payments, payouts, approvals, services, work listings. |
| `DetailDrawer` | View/edit/create records. One primary footer action only. |
| `FormSection` | Settings, profile, package, integration, payout, service setup forms. |
| `StatusBadge` | All statuses with labels. Never color alone. |
| `EmptyState` | What is missing, why it matters, action/CTA if available. |
| `AlertStack` | Business-risk alerts with entity, severity, impact, recommended action, CTA. |
| `QuickActionGrid` | Real workflow actions only. No decorative button clouds. |
| `SectionTabs` | Merge related page states without navigation clutter. |
| `UsageLimitMeter` | Package and feature limits. |
| `MoneyAmount` | Billing, payouts, wallet, accounting, revenue. |
| `PermissionGate` / `LockedFeatureCard` | Package gates, role gates, manager restrictions. |
| `IntegrationCard` | Integration connection status and setup actions. |
| `Timeline` / `ActivityLog` | Record history, financial/state changes, assignment progress. |

## 8. Final Page And Navigation Direction

### Super Admin

Visible groups:

| Group | Pages |
| --- | --- |
| Command | Overview / Intelligence Center, Chat |
| Marketplace | Agencies, Freelancers, Approvals |
| Revenue | Packages, Billing Control, Editor Economics |
| Automation | Marketing, WhatsApp Control, WhatsApp Flows |
| System | User Accounts, Platform Settings |

Hidden/helper routes:

- `/super-admin/login`
- `/super-admin/instagram-inbox` redirects to Chat with Instagram channel context.
- WhatsApp builder detail routes stay deep-link routes, not sidebar items.

Super Admin implementation priority:

1. Packages and billing must remain functionally solid.
2. Agencies and freelancers must stay table + drawer management pages.
3. Approvals should unify all pending approval queues.
4. Intelligence Center should only show real or clearly labelled missing data.
5. WhatsApp Flows must remain DB-backed and validated before production use.

### Agency Admin

Visible groups:

| Group | Pages |
| --- | --- |
| Command | Overview, Chat Inbox |
| Work | Assignments / Work Hub |
| Team | Team and Requests, Managers, Contacts |
| Money | Subscription, Payout Requests, Accounting |
| Growth/System | Showcase, Integrations, Agency Settings |

Merged/hidden from sidebar:

- Role Access -> Managers / Settings.
- Service Approvals -> Team and Requests.
- Delivery Review -> Assignments / Work Hub.
- Portfolio Review -> Showcase.
- Wallet Review -> Payout Requests.
- Monetization -> Accounting.
- Branding -> Agency Settings.

Agency implementation priority:

1. Managers table + drawer + package limit enforcement.
2. Team and Requests tabs with real team request lifecycle.
3. Work Hub tabs for tasks, applications, assignments, delivery, revisions, completed, payment requests.
4. Payout Requests and Accounting tables with payment request state sync.
5. Settings tabs with compact forms and no onboarding overlap.

### Manager

Visible groups:

| Group | Pages |
| --- | --- |
| Work | Chat Inbox, Project Tracking |
| Reviews | Review Queue |
| Contacts | Contacts |
| Reports | Finance Review if permitted, Escalations |

Merged/hidden:

- Assigned Chats -> Chat.
- Verification Review, Quote Review, Delivery Review, Portfolio Review -> Review Queue.
- Wallet Review -> Accounting / Finance Review.

Manager implementation priority:

1. Keep Chat primary unless a real workload dashboard is restored.
2. Project Tracking must be assigned-scope only.
3. Review Queue should be tabbed and permission-aware.
4. Finance Review must be server-side permission-gated.
5. Contact masking must be enforced beyond UI.

### Freelancer / Editor

Visible groups:

| Group | Pages |
| --- | --- |
| Work | Dashboard, Chat, Apply for Work, Portfolio Drafts |
| Services | Add Service, My Services |
| Earnings | Earnings / Wallet and Payouts |
| Profile | Profile |

Merged/hidden:

- Draft Services and Published Services -> My Services tabs.
- Wallet and Accounting -> Earnings / Payouts tabs.

Freelancer implementation priority:

1. Dashboard should show profile completion, services, applications, assignments, revisions, earnings, payout status, and quick actions.
2. Services should use one My Services workspace with tabs.
3. Apply for Work must connect to real marketplace tasks and duplicate-application prevention.
4. Earnings must sync payment requests, wallet credits, payout details, ledger, and manual payout state.
5. Profile must persist skills, pricing, availability, portfolio, payout details, and verification state.

## 9. Core Business Circuits To Keep Closed

A flow is live-ready only when it has database-backed records, clear status lifecycle, role permissions, working UI entry points, API/server actions, dashboard/accounting updates where needed, states, and E2E testing with real accounts.

| Circuit | Target State | Current Consolidated Status |
| --- | --- | --- |
| Freelancer registration -> package -> profile | Freelancer chooses package during signup, role routes correctly, profile lifecycle exists. | Implemented/partial. Needs real account regression testing and profile lifecycle hardening. |
| Profile -> service creation -> approval -> published service | Services belong to freelancer, can be submitted, reviewed, approved, searched, and displayed. | UI exists; service source-of-truth still needs DB normalization in some paths. |
| Agency discovers freelancer -> sends team request -> freelancer responds | Team request creates structured record, notification, membership on accept, no membership on reject. | Core tables/services implemented; needs browser E2E with real accounts. |
| Agency publishes task -> freelancer applies -> agency accepts | Published task creates application; accepted application creates assignment. | Core DB spine implemented; needs E2E browser test and dashboard sync verification. |
| Assignment -> delivery -> revision -> completion | Freelancer accepts/submits; manager/agency reviews; revisions and completion update lifecycle. | Core tables/services implemented; UI and permission edges need deeper QA. |
| Completed work -> editor payment request -> PhonePe collection -> wallet credit | Request creates structured record, platform collects via PhonePe, editor receives internal wallet credit after collection, manual payout tracked later. | Implemented conceptually and in core service; must be provider-tested with real credentials. |
| Agency payout/accounting sync | Agency sees pending/approved/paid/disputed payable states; accounting reflects liability and payout history. | Partial. Needs unified accounting views and legacy chat/payment path migration. |
| Package/plan limit enforcement | Manager seats, freelancer seats, active tasks, services, WhatsApp/automation, branding, analytics enforced server-side. | Partial. Enforcement exists in some write paths; broad server-side coverage still needed. |
| Manager permissions/masking | Managers see only allowed chats/tasks/contacts/finance; phone masking works server-side. | Partial/high risk. Needs endpoint-level guard audit. |
| Notifications | State changes create in-app notifications and later email/WhatsApp dispatch. | In-app spine implemented for new flows; dispatch and full trigger coverage incomplete. |

## 10. Payment, Packages, And Accounting Decisions

Payment model:

- PhonePe split payments are not assumed.
- When an editor/freelancer requests payment through the internal lane, the platform receives the full PhonePe payment first.
- After successful PhonePe status/webhook verification, the editor receives an internal wallet credit.
- Manual payout to editors remains the operational payout model for now.
- The wallet credit and manual payout state must stay separate from platform collection state.
- Payment requests must be structured DB records, not plain chat text.

Commission model:

- Freelancer commission is decided by the freelancer package purchased during registration.
- Super Admin controls package setup.
- Commission should use `Package.commissionOverridePercent` when available.
- If no override exists, current fallback is 30 percent.
- Package changes must be audited, because they affect future wallet credits and economics.

Billing requirements:

- Free packages activate immediately after OTP verification.
- One-time paid packages create pending subscription/payment transaction and activate only after verified PhonePe success.
- Recurring packages create pending subscription/mandate setup and activate only after verified setup/subscription success.
- Renewal jobs use `BILLING_JOB_SECRET`.
- Required PhonePe variables must be set before production: `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`, `PHONEPE_ENV`, `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD`, `APP_BASE_URL`, `BILLING_JOB_SECRET`.

## 11. Data And Intelligence Moat

Gigxomi should collect marketplace intelligence as structured events, not just display dashboards.

Required intelligence assets:

| Asset | Purpose |
| --- | --- |
| Search Demand Graph | Tracks what users search, which categories trend, and which keywords convert. |
| Supply Graph | Tracks editor skills, pricing, performance, availability, and portfolio quality. |
| Demand-Supply Gap Engine | Finds high-demand/low-supply categories and SEO/content opportunities. |
| Trust & Quality Graph | Tracks SLA, reliability, disputes, revision rate, agency/editor quality. |
| Revenue Intelligence | Tracks package performance, renewal behavior, churn risk, upsell opportunities. |
| Automation Intelligence | Tracks bot replies, time saved, handoffs, missed intents, webhook failures. |

Core events to implement or harden:

- `user_signup`
- `user_login`
- `agency_created`
- `agency_subscription_started`
- `agency_subscription_renewed`
- `agency_subscription_cancelled`
- `package_selected`
- `package_upgraded`
- `package_downgraded`
- `payment_success`
- `payment_failed`
- `prompt_search_submitted`
- `prompt_search_result_clicked`
- `prompt_search_no_result`
- `editor_profile_viewed`
- `editor_contact_clicked`
- `chat_started`
- `bot_reply_sent`
- `human_handoff`
- `editor_approved`
- `editor_rejected`
- `editor_assigned`
- `task_created`
- `task_submitted`
- `task_approved`
- `revision_requested`
- `payout_created`
- `payout_paid`
- `dispute_created`
- `whatsapp_connected`
- `whatsapp_disconnected`
- `campaign_sent`
- `campaign_clicked`
- `renewal_risk_detected`
- `churn_risk_detected`

Every event should include timestamp, actor type, actor id, role, agency id if applicable, editor id if applicable, amount if applicable, keyword/query if applicable, category/service if applicable, source/channel, and metadata JSON.

## 12. Dashboard Direction

### Super Admin Intelligence Center

Layer 1: Executive Command Center. Founder understands business health in 3 seconds.

Maximum 8 executive signals:

1. MRR / Subscription Revenue.
2. Projected Next-Month Revenue.
3. Active Agencies.
4. New Agencies This Month.
5. Churn / Renewal Risk.
6. Pending + Failed Payments.
7. Active Editors / Freelancers.
8. Marketplace Demand Score.

Layer 2: Smart Insights and Intelligence Modules. Explain what to do and why.

Layer 3: Deep Analytics. Investigate revenue, agencies, editors, search, campaigns, packages, risk, and automation.

Rules:

- Max 3 Smart Insights.
- Every alert shows impact, entity, reason, urgency, recommended action, CTA.
- No fake intelligence without data-source labels.
- No giant patched wrapper or blue cards.

### Agency Dashboard

Primary view should show 6-8 useful metrics only:

- Revenue / payables if tracked.
- Active projects.
- Active chats.
- Pending approvals/reviews.
- Editor utilization.
- Bot replies/time saved converted to value.
- Trust score.
- Subscription/payment status.

Add Smart Insights with interpretation and suggested action.

### Manager Dashboard

If restored, it should show workload, not decoration:

- Assigned chats.
- Assigned tasks.
- Pending reviews.
- Overdue items.
- Escalations.
- Response time.

Otherwise, manager landing may remain Chat-first.

### Freelancer Dashboard

Must be useful and actionable:

- Profile completion.
- Active services.
- Pending applications.
- Active assignments.
- Revisions.
- Earnings pending.
- Payout status.
- Quick actions: Add service, Apply for work, View assignments, Setup payout.

## 13. WhatsApp Automation And Flow Builder

Current consolidated status:

- WhatsApp flow CRUD and runtime are DB-backed when `DATABASE_URL` is available.
- Local file fallback is only for non-production without `DATABASE_URL`.
- Production fails closed if `DATABASE_URL` is missing.
- Webhook signature validation uses raw body HMAC SHA-256 with `META_APP_SECRET`.
- Unsafe tenant fallback was removed; no tenant match means no flow execution and no outbound message.
- Server validation blocks unsafe/unready nodes before publish.
- Auth Intent Lookup is builder-only and blocked for generic runtime publish until a backend adapter is ready.

Required WhatsApp environment variables:

- `DATABASE_URL`
- `META_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_APP_ID`

Remaining WhatsApp risks:

- Integration connection state should move from existing store into secure normalized integration tables with encrypted credentials.
- Runtime adapters for advanced nodes need production review.
- Builder and runtime need browser E2E tests after each migration.
- WhatsApp flows should not reintroduce blue panels or random node colors.

## 14. Onboarding System

Current direction:

- Onboarding should guide role-specific setup but not block work.
- Default state should be compact/docked.
- Expanded panel must use blur/opaque dark surface so background text does not collide.
- Chat pages should not be obstructed by onboarding overlays.
- Progress should persist per user.

Required onboarding behavior:

- Role-specific steps.
- Minimize/close/skip controls.
- Restart from Help & Tour.
- Mobile bottom-sheet or compact mode.
- No blue styling.
- No large floating obstruction.

## 15. Mobile App Notes

- Mobile app is an Expo/WebView shell pointing to the deployed web app.
- Push notifications should include `deepLinkUrl`, for example `/chat?conversationId=<id>`.
- Backend URL must point to the deployed web app.
- Firebase `google-services.json` is required for Android push.
- Mobile work depends on web routes and deep links remaining stable.

## 16. Asset And Sound Notes

- Normal UI icons should use Lucide unless an existing consistent icon system is already in place.
- 3D/glossy assets are allowed only in controlled places: selected KPI cards, integrations, empty states, quick actions, and selected section headers.
- No 3D icons in dense tables, small buttons, badges, forms, or every card.
- Existing integration 3D icon sources are documented in `public/icons/README.md`.
- Chat notification audio should be placed at `public/sounds/chat-notification.mp3`; browser/generator fallback exists if missing.

## 17. Current Readiness Summary

| Area | Readiness | Notes |
| --- | --- | --- |
| Route coverage | Good | Most planned pages/routes exist, with many redirects/merges already in place. |
| Build/lint/typecheck | Good on latest known pass | Recent checks passed after onboarding and migration fixes. Run again after each code pass. |
| Visual system | Improving | Black-lime tokens exist; remaining legacy surfaces must continue to be cleaned. |
| Shared components | Baseline implemented | Adoption across all pages is still uneven. |
| Super Admin pages | Broad UI exists | Some data is partial/placeholders; packages/agencies/freelancers are strongest. |
| Agency pages | Partially consolidated | Managers, Team & Requests, Work Hub, Payouts improved; settings/full drawers still need work. |
| Manager pages | Mostly merged/redirected | Needs permission-scoped review/project/finance hardening. |
| Freelancer pages | Broad UI exists | Services and earnings need continued unification and DB source-of-truth hardening. |
| Business flows | Core spine improved | E2E browser testing with real accounts remains mandatory. |
| Payments | Implemented direction | PhonePe real credential/webhook testing remains critical. |
| WhatsApp flows | Production path improved | Secure integration table and E2E runtime tests remain. |
| Security/permissions | Partial | Route guards exist; endpoint-level role/tenant/masking audit remains high priority. |
| Notifications | Partial | In-app notification spine exists; trigger coverage and dispatch incomplete. |
| Intelligence/moat | Planned | Search/demand event tracking still missing. |

## 18. Missing Items To Implement

### Critical Before Real Client Launch

| Gap | Required Implementation |
| --- | --- |
| Full E2E role testing | Create real Super Admin, Agency Admin, Manager, and Freelancer test accounts and test circuits in browser. |
| PhonePe production/sandbox verification | Test checkout, return, webhook, failed payment, retry, subscription activation, and wallet credit. |
| Structured payment request sync | Ensure chat payment action, freelancer earnings, agency payout requests, accounting, and wallet all use the same DB record. |
| Server-side permission scoping | Prove tenant/agency/user ownership on every write/read API, not only layouts. |
| Manager finance/masking guard | Enforce permission and customer masking server-side. |
| Staging health protection | Ensure `/staging-health` is not exposed publicly in production. |
| Audit trail | Add/complete normalized audit logs for financial and status transitions. |
| Legacy store migration plan | Migrate production-critical file-backed services/chat/contacts/managers/integrations to DB or clearly mark as staging-only. |

### High Priority Before Real Users

| Gap | Required Implementation |
| --- | --- |
| DB-backed freelancer services | Normalize service fields, approval status, portfolio media, tags, pricing, turnaround, visibility. |
| Agency settings tabs | Convert settings into Profile, Branding, Showcase, Privacy, Notifications forms. |
| Assignment/payment/detail drawers | Add drawers for assignment detail, payment request detail, service approval, freelancer profile. |
| Package limit enforcement | Enforce manager seats, freelancer/team seats, active tasks, services, WhatsApp, automation, branding, analytics server-side. |
| Notifications | Add state-change triggers for team request, task application, assignment, delivery, revision, payment, package limits, subscription/payment failure. |
| WhatsApp integration persistence | Store connection state and credentials in secure normalized tables. |
| Dashboard real-data wiring | Replace placeholder intelligence with computed DB/events data or clear empty states. |

### Medium Priority

| Gap | Required Implementation |
| --- | --- |
| Search/demand intelligence | Add prompt/search event pipeline and Super Admin demand analytics. |
| SEO/marketing intelligence | Connect GA4/Search Console or show clear setup placeholders. |
| Mobile responsive polish | Verify tables, drawers, onboarding, builder, and dashboard collapse behavior. |
| Public marketplace source-of-truth | Use approved DB services and profiles for public service/agency pages. |
| Export tools | Add safe exports for finance, payouts, agencies, users where permitted. |

### Low Priority / Future

| Gap | Required Implementation |
| --- | --- |
| Advanced recommendation engine | Use demand-supply graph after event history exists. |
| Automated bank/UPI payouts | Add provider later if manual payout becomes bottleneck. |
| Advanced 3D assets | Add only where useful and licensed, not as a layout substitute. |
| Separate Instagram workspace | Keep redirect to Chat until real separate workflow exists. |

## 19. Phased Implementation Roadmap

### Phase 0: Release Stability

- Keep code compiling.
- Fix migration/deployment blockers immediately.
- Run lint, typecheck, build, db:migrate:deploy, db:verify after schema/API work.
- Protect staging/internal routes.
- Do not touch ChatWorkspace unless scoped.

### Phase 1: Shared UI Hardening

- Ensure PageHeader, DataTable, DetailDrawer, FormSection, StatusBadge, EmptyState, AlertStack, SectionTabs, PermissionGate, MoneyAmount, and UsageLimitMeter are used consistently.
- Remove remaining duplicate title boxes and giant patched wrappers.
- Continue black-lime token audit.

### Phase 2: Super Admin First

- Packages: full package CRUD, limits, commission, audit logs.
- Agencies/Freelancers: table + drawer, status, package, wallet/verification/usage summaries.
- Approvals: unified approval queue.
- Billing/Editor Economics: real payment/package/payout data.
- Platform Settings/WhatsApp: secure provider state.

### Phase 3: Agency Admin

- Managers: DB-backed, package limit, permission matrix, masking.
- Team and Requests: invite/request/accept/remove with active assignment/payment checks.
- Work Hub: publish tasks, applications, assignments, delivery, revisions, completed, payment requests.
- Accounting/Payouts: payment request states, wallet credits, manual payout proof, ledger.
- Settings/Integrations/Showcase: compact tabs/forms.

### Phase 4: Manager

- Project Tracking: assigned-scope only.
- Review Queue: services, verification, quotes, delivery, portfolio tabs.
- Contacts: masking and assigned-scope only.
- Escalations: real status/actions/notifications.
- Finance: permission-gated or hidden.

### Phase 5: Freelancer

- Dashboard: actionable metrics and quick actions.
- My Services: unified tabs and DB-backed service lifecycle.
- Apply for Work: real tasks/applications.
- Earnings: payment requests, wallet, payout history, ledger, payout details.
- Profile/Portfolio: complete persistent matching/trust data.

### Phase 6: Intelligence Moat

- Event tracking pipeline.
- Search Demand Graph.
- Supply Graph.
- Demand-Supply Gap Engine.
- Trust & Quality Graph.
- Revenue and Automation intelligence.

### Phase 7: Final Go-Live Audit

- Role-by-role browser QA.
- API permission fuzzing.
- Responsive audit.
- Color/token audit.
- Empty/loading/error audit.
- Payment/webhook audit.
- Database migration audit.
- Production env audit.

## 20. Definition Of Done

A page is done when:

- It follows the correct pattern: dashboard, table, drawer, form, tabs, chat, or integration.
- It has a clear PageHeader and one main purpose.
- It uses shared components instead of custom page systems.
- It uses tokens only.
- It has loading, empty, error, permission/locked, and disabled states where applicable.
- Visible actions are real, not console-only or fake-success.
- Data persists after refresh where required.
- Row/detail actions are scoped to the correct tenant/user.
- Mobile behavior is at least safe with no horizontal page overflow.
- It does not duplicate another page's purpose.

A business flow is done when:

- It has DB-backed records.
- It has a status lifecycle.
- It has role and tenant permissions server-side.
- It has UI entry points for every actor.
- It has API/server actions.
- It updates dashboards/accounting where needed.
- It creates notifications/audit logs where needed.
- It can be tested with real accounts end to end.

A design pass is done when:

- No blue-heavy panels remain.
- No hardcoded color/radius/shadow/spacing remains in touched UI.
- Text is compact and action-oriented.
- Management lists use tables.
- Details use drawers.
- Settings use forms.
- Explanations move to accordions/tooltips/docs.

## 21. Required Checks Before Push Or Deploy

For normal UI/docs changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

For database/schema/API changes:

```bash
npm run db:migrate:deploy
npm run db:generate
npm run db:verify
npm run lint
npx tsc --noEmit
npm run build
```

For VPS deployment:

```bash
npm run db:migrate:deploy
npm run db:verify
pm2 restart gigxomi --update-env || pm2 start npm --name gigxomi -- start
pm2 save
```

Do not hardcode `DATABASE_URL`. It must come from environment variables.

## 22. Environment And Deployment Notes

Postgres target:

- Use private local VPS Postgres where possible.
- App `DATABASE_URL` example shape: `postgresql://gigxomi_app:<password>@127.0.0.1:5432/gigxomi?schema=public`.
- Do not expose Postgres publicly.
- Rollback is switching `DATABASE_URL` and restarting the app.

Production-critical environment groups:

- Database: `DATABASE_URL`.
- PhonePe: all `PHONEPE_*` plus `APP_BASE_URL` and `BILLING_JOB_SECRET`.
- WhatsApp/Meta: `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_APP_ID`.
- Local-only WhatsApp bypass: `WHATSAPP_WEBHOOK_SIGNATURE_BYPASS=true` only outside production.

## 23. Working Agreement For Future Codex Passes

Before any future implementation pass:

1. Read this document first.
2. Identify the phase being worked on.
3. Do not mix Super Admin, Agency, Manager, and Freelancer implementation in one uncontrolled pass.
4. Keep ChatWorkspace untouched unless the task explicitly targets chat.
5. Prefer shared components and token classes.
6. Preserve current worker changes and avoid reverting unrelated work.
7. If other workers modify the same files, inspect and integrate the newest code rather than overwriting.
8. Run checks appropriate to the change.
9. Document missing backend/data requirements instead of faking production behavior.
10. Keep the product serious, compact, operational, black-lime, and decision-focused.

## 24. What Was Missing And Implemented In This Pass

Missing item found: the project had many useful artifact documents, but no single consolidated future-facing source of truth tying together product direction, role pages, UI system, business circuits, payments, WhatsApp automation, onboarding, deployment, and go-live gates.

Implemented now:

- Created this master blueprint document as the canonical planning and execution guide.
- Consolidated product artifacts from `docs/`, root UI audit notes, mobile shell notes, icon/sound asset notes, PhonePe notes, and self-hosted Postgres notes.
- Preserved all existing specialized docs for detail-level reference.

Not implemented in this pass:

- No app UI, auth, API, database, payment, WhatsApp runtime, or route behavior was changed.
- Remaining product gaps are intentionally documented as phased implementation work because they are business-critical and should be implemented with focused QA, not patched silently from documentation consolidation.
