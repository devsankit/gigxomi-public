# Gigxomi Page Consolidation And UI Plan

Last updated: 2026-05-06
Source: `docs/GIGXOMI_ROLE_PAGE_FUNCTIONALITY_MAP.md`
Phase: PASS 2/PASS 4/PASS 5/PASS 6/PASS 7 implemented for current safe scope. WhatsApp Flow and deeper backend business-circuit work remain separate.

## Implementation Progress

| Date | Pass | Completed |
| --- | --- | --- |
| 2026-05-06 | PASS 2 | Added baseline shared UI primitives in `src/components/ui/product-system.tsx` and tokenized styles in `src/styles/design-tokens.css`. |
| 2026-05-06 | PASS 7 starter | Cleaned visible Admin, Manager, and Freelancer sidebar items while keeping merged/legacy routes available. |
| 2026-05-06 | Freelancer consolidation | Restored `/freelancer` dashboard landing and created `/freelancer/services` as the unified My Services workspace. |
| 2026-05-06 | Redirect safety | Redirected merged non-chat routes to their parent pages so old links remain valid and navigation clutter reduces. |
| 2026-05-06 | Earnings consolidation | Made `/freelancer/payouts` the Earnings hub with Payout Details, Wallet, and Accounting tabs. |
| 2026-05-06 | Agency hub consolidation | Merged service approvals, team invites, portfolio requests, and delivery review into the Team & Requests / Work Hub parent pages without touching Chat. |
| 2026-05-06 | Manager review consolidation | Made `/manager/service-review` the Review Queue with Services, Verification, Quotes, Delivery, and Portfolio tabs. |
| 2026-05-06 | Finance/showcase preservation | Added wallet-safety context to Agency Payout Requests, monetization context to Agency Accounting, manager finance context to Accounting, and portfolio review into Showcase. |
| 2026-05-06 | Redirect target completion | Preserved Role Access inside Managers and Branding/System guidance inside Agency Settings so redirected routes keep their useful context. |

## Purpose

This document decides what every existing role page should become before we clean UI or consolidate navigation. The goal is to make Gigxomi feel like one serious marketplace operating system, not separate patched dashboards.

## Rules

| Rule | Decision |
| --- | --- |
| Chat safety | Do not disturb existing Chat pages unless explicitly requested. |
| Routes | Do not delete routes first. Hide from sidebar, then redirect only after the target parent page is stable. |
| Design | Use the existing dark/lime token system. No blue-heavy panels, random colors, random radius, random shadow, or page-specific visual language. |
| Components | Build reusable components first, then apply them page by page. |
| Data honesty | Mark DB-backed, file-backed, static, placeholder, and missing API areas clearly. |
| Business value | Keep pages that close revenue, package, team, task, delivery, payment, automation, or permission circuits. |

## Decision Logic

| Decision | Use When |
| --- | --- |
| KEEP + FULLY DEVELOP | Page is core to money, work, packages, team, delivery, payout, automation, permissions, or focused operations. |
| MERGE INTO ANOTHER PAGE | Page is a sub-state, duplicate, low-functionality, or better as a tab/section/drawer. |
| REDIRECT | Page is only a helper or parent route should own the experience. |
| REMOVE / HIDE FROM SIDEBAR | Page creates navigation clutter or is not useful enough for launch. Hide first, do not delete immediately. |
| DEFER | Useful later but not needed for launch. |

## Summary

| Role | Keep | Merge | Redirect | Hide/Remove First | Defer |
| --- | ---: | ---: | ---: | ---: | ---: |
| Super Admin | 13 | 0 | 1 | 2 helper/auth routes | 0 |
| Agency Admin | 11 | 8 | 3 after merge | 4 to 7 sidebar items after merge | 1 optional growth area |
| Manager | 6 | 7 | 1 | 5 after merge | 1 optional reports layer |
| Freelancer | 7 | 5 | 2 after parent pages are ready | 3 after merge | 0 |

## Super Admin Page Decisions

| Route | Current | Priority | Decision | Reason | Final Pattern | Data Needed | Missing Data/API | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/super-admin` | Partial | Launch Critical | KEEP | Founder command center is essential. | Dashboard: signal cards, insights, alerts, widgets. | Users, packages, subscriptions, payments, editors, tasks, search, automation. | Search events, churn score, automation value. | High if placeholders look like live data. |
| `/super-admin/chat` | Working | High | KEEP | Platform communication oversight. | Existing ChatWorkspace. | Conversations, channels, messages. | Admin-specific moderation filters. | Medium; do not disturb. |
| `/super-admin/agencies` | Working | Launch Critical | KEEP | Agency package/status control drives revenue. | Table + detail drawer. | Users, agencies, packages, subscriptions, WhatsApp, activity. | Agency health, renewal risk, unpaid invoices. | Medium. |
| `/super-admin/freelancers` | Working | Launch Critical | KEEP | Controls marketplace supply and freelancer packages. | Table + detail drawer. | Users, profiles, packages, services, wallet, verification. | Supply health and service/wallet summaries. | Medium. |
| `/super-admin/approvals` | Partial | Launch Critical | KEEP | Approvals protect trust, onboarding, payout safety. | Tabs + DataTable + DetailDrawer. | Verification, services, payouts, portfolio, WhatsApp approvals. | Unified approvals API and audit log. | High. |
| `/super-admin/packages` | Working | Launch Critical | KEEP | Packages control revenue, limits, commission. | Package list + editor forms. | Packages, limits, feature gates, subscriptions, usage. | Analytics and upgrade paths. | Medium/High. |
| `/super-admin/marketing` | Working | High | KEEP | Needed for growth/event tracking and future demand intelligence. | Settings forms + event tables. | GTM, GA4, Search Console, pixel config, public events. | Campaign attribution and SEO import. | Medium. |
| `/super-admin/signup` | Working | Launch Critical | KEEP, relabel User Accounts | Internal user creation is needed for operations/testing. | User table + create form/drawer. | Auth users, roles, tenants. | Deactivate, reset password, tenant reassign. | Medium. |
| `/super-admin/whatsapp-control` | Working/Partial | Launch Critical | KEEP | WhatsApp affects OTP, auth, messaging, onboarding. | Ops dashboard + setup panels + event tables. | WhatsApp connection states, OTP intents, webhook events. | Template sync, webhook health, retry logs. | High. |
| `/super-admin/whatsapp-flows` | Partial | High | KEEP | Automation is important, but runtime can be phased. | Flow list + builder entry. | Flow definitions, nodes, runs. | DB-backed versions, delete/clone, runtime adapters. | High. |
| `/super-admin/whatsapp-flows/builder/[flowId]` | Partial | High | KEEP as detail route | Needed for focused flow editing. | Full canvas/detail route. | Flow, nodes, edges, runs. | Versioning, logs, rollback. | High. |
| `/super-admin/billing-control` | Working/Partial | Launch Critical | KEEP | Revenue and payment leakage control. | Finance dashboard + provider settings + tables. | Subscriptions, payments, invoices, failed payments. | Refunds, disputes, projections. | High. |
| `/super-admin/editor-economics` | Partial | High | KEEP | Supply profitability and payout health. | Analytics dashboard + tables. | Editors, assignments, payouts, wallet, categories. | Category ROI, idle supply, dispute rate. | Medium. |
| `/super-admin/platform-settings` | Working/Partial | High | KEEP | Central platform settings and provider health. | Settings tabs/forms. | Provider configs, reminders, integrations. | Audit logs, env health, role policy config. | Medium. |
| `/super-admin/instagram-inbox` | Redirect | Medium | REDIRECT | Separate page adds no value yet. | Redirect to Chat channel. | Channel query. | Separate Instagram workspace later. | Low. |
| `/super-admin/login` | Working | Launch Critical | HIDE FROM SIDEBAR | Auth route should exist but not be workspace nav. | Auth page. | Session/auth config. | 2FA/lockout later. | Medium. |

## Agency Admin Page Decisions

| Route | Current | Priority | Decision | Reason | Target Parent | Final Pattern | Data Needed | Missing Data/API | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Working/Partial | Launch Critical | KEEP | Agency owner command center. | N/A | Dashboard. | Projects, chats, team, managers, package usage, payables, delivery. | Trust score, bot value, real work metrics. | Medium. |
| `/admin/chat` | Working | Launch Critical | KEEP | Core lead/client communication. | N/A | Existing ChatWorkspace. | Conversations, messages, assignment context. | Payment/assignment cards later. | High; do not disturb. |
| `/admin/managers` | Partial | Launch Critical | KEEP | Delegation, manager seats, permission control. | N/A | Table + drawer + permission matrix. | Managers, queues, permissions, masking, package limits. | DB-backed roster, server limits. | High. |
| `/admin/freelancers` | Partial | Launch Critical | KEEP as Team and Requests | Needed for team editors and team requests. | N/A | Section tabs + tables/cards. | Team members, requests, freelancer profiles, services, payouts. | Real team request UI and remove checks. | High. |
| `/admin/service-approvals` | Partial | High | MERGE | Duplicate request/review sub-state. | `/admin/freelancers` | Team and Requests tab. | Services, team invites, portfolio requests. | Unified request model. | Medium. |
| `/admin/contacts` | Working/Partial | High | KEEP | CRM/contact database is useful for operations. | N/A | Table + detail drawer. | Contacts, source, assigned manager, tags, last chat. | Import/export, merge duplicates. | Medium. |
| `/admin/packages` | Working | Launch Critical | KEEP | Subscription, invoices, and usage. | N/A | Usage dashboard + invoice table. | Subscription, invoices, package, usage limits. | Upgrade/downgrade, failed payment recovery. | High. |
| `/admin/assignments` | Partial | Launch Critical | KEEP as Work Hub | Core task/application/assignment/delivery/payment circuit. | N/A | Section tabs + assignment list + delivery review workspace. | Tasks, applications, assignments, deliveries, revisions, payment requests. | Full UI wiring to new APIs. | High. |
| `/admin/delivery-review` | Working/Partial | High | MERGE | Delivery is an assignment state. | `/admin/assignments` | Delivery Review tab. | Submissions, files, revisions. | Assignment linkage. | Medium. |
| `/admin/delivery-review/[id]` | Working/Partial | High | KEEP detail route | Deep links from notifications are useful. | `/admin/assignments` | Detail route/drawer. | Submission, assignment, files, notes. | Audit log. | Medium. |
| `/admin/portfolio-review` | Working/Partial | Medium | MERGE | Portfolio review belongs to showcase. | `/admin/analytics` | Showcase pending review tab. | Portfolio drafts, media, SEO. | Unified showcase model. | Medium. |
| `/admin/portfolio-review/[id]` | Working/Partial | Medium | KEEP detail route | Detail review link is useful. | `/admin/analytics` | Detail route/drawer. | Portfolio draft/media/notes. | Audit log. | Low/Medium. |
| `/admin/wallet-review` | Partial | Launch Critical | MERGE | Wallet review and payout requests should be one finance workflow. | `/admin/payout-requests` or `/admin/accounting` | Payout/Payables tab. | Payment requests, wallet entries, payout proof. | Dispute and proof upload. | High. |
| `/admin/payout-requests` | Working/Partial | Launch Critical | KEEP | Required to approve/reject/mark paid editor payment requests. | N/A | Table + detail drawer. | Payment requests, assignments, wallets. | Proof upload and dispute flow. | High. |
| `/admin/accounting` | Working/Partial | Launch Critical | KEEP | Payables, package invoices, finance clarity. | N/A | Finance dashboard + ledgers. | Payments, subscriptions, payout requests, wallet entries. | Client revenue, profit, export. | High. |
| `/admin/monetization` | Partial | Medium | MERGE or DEFER | Useful only with real revenue/upsell data. | `/admin/accounting` or `/admin` | Monetization tab/insights. | Campaign revenue, upsell, LTV. | Monetization events. | Low/Medium. |
| `/admin/integrations` | Partial | High | KEEP | Integrations affect WhatsApp, payments, analytics, delivery. | N/A | Integration card grid + setup drawers. | Connection status, provider configs. | Health check APIs. | Medium. |
| `/admin/integrations/whatsapp` | Working/Partial | High | KEEP detail page | WhatsApp setup is complex enough for own route. | `/admin/integrations` | Setup wizard/detail. | Tenant WhatsApp connection, Meta data. | Webhook test/template setup. | High. |
| `/admin/analytics` | Working/Partial | High | KEEP, relabel Showcase Page | Route is misnamed but public showcase is useful. | N/A | Showcase editor + portfolio tabs. | Agency listing, portfolio drafts, SEO. | DB-backed listing/showcase. | Medium. |
| `/admin/theme-branding` | Partial | Medium | MERGE | Branding is a settings sub-area for launch. | `/admin/system-settings` | Branding tab. | Logo, colors, public profile theme. | Upload/storage/preview. | Low/Medium. |
| `/admin/system-settings` | Working/Partial | High | KEEP as Settings parent | Owns privacy, workflow, branding, notifications. | N/A | Settings tabs/forms. | Privacy, permissions, workflow, branding, notifications. | DB-backed settings and audit log. | Medium. |
| `/admin/roles` | Partial | Medium | MERGE | Standalone role explanation is not operational. | `/admin/managers` or `/admin/system-settings` | Permissions tab. | Role policies, manager permissions. | Role policy API. | Low. |

## Manager Page Decisions

| Route | Current | Priority | Decision | Reason | Target Parent | Final Pattern | Data Needed | Missing Data/API | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/manager` | Redirect | High | REDIRECT for launch | Manager's main job is chat today. | `/manager/chat` | Redirect. | N/A | Restore overview only with real KPI API. | Low. |
| `/manager/chat` | Working | Launch Critical | KEEP | Main manager communication workspace. | N/A | Existing ChatWorkspace. | Assigned conversations/messages. | SLA/assignment overlays later. | High; do not disturb. |
| `/manager/assigned-chats` | Working | Medium | MERGE or HIDE | Duplicates Chat unless distinct filters exist. | `/manager/chat` | Saved filter/tab. | Same chat data. | Clear distinction. | Low/Medium. |
| `/manager/contacts` | Working/Partial | High | KEEP | Managers need scoped CRM with masking. | N/A | Table + drawer. | Contacts, notes, tags, assigned chats. | Scoped notes/tags API. | Medium. |
| `/manager/verification-review` | Partial | Medium | MERGE | Review sub-state. | `/manager/service-review` | Review Queue tab. | Verification records. | Review queue API. | Medium. |
| `/manager/service-review` | Partial | High | KEEP as Review Queue parent | One review page is clearer. | N/A | Tabs + review boards + delivery/portfolio workspaces. | Services, verification, quotes, delivery, portfolio. | Unified manager review API. | Medium. |
| `/manager/quote-review` | Partial | High | MERGE | Quote is a review type. | `/manager/service-review` | Quote tab. | Quotes, line items, client requests. | Quote workflow API. | Medium. |
| `/manager/project-tracking` | Partial | High | KEEP | Managers need work status, blockers, deadlines. | N/A | Table + timeline/detail drawer. | Assignments, tasks, deadlines, owners. | Manager-scoped assignment rollups. | High. |
| `/manager/delivery-review` | Working/Partial | High | MERGE | Delivery review fits Review Queue. | `/manager/service-review` | Delivery tab. | Delivery submissions/revisions. | Permission rules. | Medium. |
| `/manager/delivery-review/[id]` | Working/Partial | High | KEEP detail route | Deep links are useful. | Review Queue/Project Tracking | Detail route. | Submission, files, notes. | Audit log. | Medium. |
| `/manager/portfolio-review` | Working/Partial | Medium | MERGE | Portfolio belongs in Review Queue. | `/manager/service-review` | Portfolio tab. | Portfolio drafts. | Review API. | Low/Medium. |
| `/manager/portfolio-review/[id]` | Working/Partial | Medium | KEEP detail route | Deep link useful. | Review Queue | Detail route. | Draft/media/notes. | Audit log. | Low. |
| `/manager/wallet-review` | Partial | Medium | MERGE | Finance should be one limited Finance Review view. | `/manager/accounting` | Finance tab. | Payment/payout blockers. | Permission-scoped finance API. | Medium/High. |
| `/manager/accounting` | Working/Partial | Medium | KEEP if permission allows | Useful only if agency grants finance visibility. | N/A | Permission-gated finance review. | Payables, payment blockers, assignment finance. | Strict permission API. | High privacy risk. |
| `/manager/escalations` | Partial | High | KEEP | Escalations reduce delivery/payment/client risk. | N/A | Alert stack + table + drawer. | Escalations, assignments, SLA, blockers. | Escalation CRUD/notifications. | Medium. |

## Freelancer Page Decisions

| Route | Current | Priority | Decision | Reason | Target Parent | Final Pattern | Data Needed | Missing Data/API | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/freelancer` | Redirect | Launch Critical | KEEP + RESTORE DASHBOARD | Freelancer should see work, services, earnings, profile state. | N/A | Dashboard. | Assignments, services, applications, wallet, profile. | Live dashboard rollups. | Medium. |
| `/freelancer/chat` | Working | Launch Critical | KEEP | Core assigned communication. | N/A | Existing ChatWorkspace. | Freelancer conversations. | Payment/delivery action cards later. | High; do not disturb. |
| `/freelancer/add-service` | Working/Partial | Launch Critical | KEEP | Supply creation starts here. | N/A | Multi-section form. | Profile, package limit, service fields, media. | Full DB-backed service schema/media. | High. |
| `/freelancer/draft-services` | Working/Partial | High | MERGE | Draft is service status. | `/freelancer/services` | Draft tab. | Draft services. | Unified service API. | Medium. |
| `/freelancer/published-services` | Working/Partial | High | MERGE | Published is service status. | `/freelancer/services` | Published tab. | Approved services, metrics. | Performance events. | Medium. |
| `/freelancer/services` | Redirect | High | KEEP as My Services | Better unified service management route. | N/A | Tabs + table/cards. | Services by status. | Unified service status API. | Medium. |
| `/freelancer/services/[id]/preview` | Working/Partial | Medium | KEEP detail route | Preview/share/edit reference useful. | My Services | Preview/detail. | Service, media, approval status. | Public preview/share state. | Low. |
| `/freelancer/apply-for-work` | Partial | Launch Critical | KEEP | Closes agency publish task -> freelancer apply. | N/A | Task list/cards + application drawer. | Tasks, applications, services, profile. | UI wiring to task/application APIs. | High. |
| `/freelancer/profile` | Working/Partial | Launch Critical | KEEP | Trust, verification, matching readiness. | N/A | Settings tabs/forms. | Profile, verification, skills, availability, portfolio. | Skills/pricing/availability schema. | High. |
| `/freelancer/wallet` | Working/Partial | Launch Critical | MERGE | Wallet is part of earnings. | `/freelancer/payouts` or future `/freelancer/earnings` | Wallet/Ledger tab. | Wallet entries, balances. | Holds/reversals/tax exports. | High. |
| `/freelancer/accounting` | Working/Partial | Medium | MERGE | Accounting is earnings sub-tab. | Earnings page | Accounting/export tab. | Ledger, payouts, exports. | Export API. | Medium. |
| `/freelancer/payouts` | Working/Partial | Launch Critical | KEEP as Earnings parent | Closes payout details and request flow. | N/A | Earnings tabs + forms/tables. | Payment details, payout requests, wallet, package commission. | Final manual payout proof and export. | High. |
| `/freelancer/portfolio-drafts` | Working/Partial | High | KEEP | Portfolio supports trust and conversion. | N/A | Draft list + editor. | Portfolio drafts, media, approvals. | Version/delete/duplicate. | Medium. |
| `/freelancer/portfolio-drafts/[id]` | Working/Partial | High | KEEP detail route | Specific draft editing. | Portfolio Drafts | Detail/editor route. | Draft/media/notes. | Version history. | Low/Medium. |

## Final Sidebar Plan

### Super Admin

| Group | Visible Items |
| --- | --- |
| Command | Overview, Chat |
| Marketplace | Agencies, Freelancers, Approvals |
| Revenue | Packages, Billing Control, Editor Economics |
| Automation | Marketing, WhatsApp Control, WhatsApp Flows |
| System | User Accounts, Platform Settings |

Hidden/helper routes: `/super-admin/login`, `/super-admin/instagram-inbox`, `/super-admin/whatsapp-flows/builder/[flowId]`.

### Agency Admin

| Group | Visible Items |
| --- | --- |
| Command | Overview, Chat Inbox |
| Work | Assignments |
| Team | Team and Requests, Managers, Contacts |
| Money | Subscription, Payout Requests, Accounting |
| Growth/System | Showcase Page, Integrations, Agency Settings |

Hide after merge: Role Access, Service Approvals, Delivery Review, Portfolio Review, Wallet Review, Monetization, Branding. Their useful context is preserved inside Managers, Team & Requests, Work Hub, Showcase, Payout Requests, Accounting, and Settings.

### Manager

| Group | Visible Items |
| --- | --- |
| Work | Chat Inbox, Project Tracking |
| Reviews | Review Queue |
| Contacts | Contacts |
| Reports | Finance Review if permitted, Escalations |

Hide after merge: Assigned Chats, Verification Review, Quote Review, Delivery Review, Portfolio Review, Wallet Review. Their useful context is preserved inside Chat Inbox, Review Queue, and Finance Review.

### Freelancer

| Group | Visible Items |
| --- | --- |
| Work | Dashboard, Chat, Apply for Work, Portfolio Drafts |
| Services | Add Service, My Services |
| Earnings | Earnings / Wallet and Payouts |
| Profile | Profile |

Hide after merge: Draft Services, Published Services, Wallet, Accounting. `/freelancer/services` is My Services and `/freelancer/payouts` is Earnings.

## Business Circuit Closure

| Circuit Step | Required Page(s) | Current Coverage | Gap |
| --- | --- | --- | --- |
| Freelancer registration to profile | Public signup, Freelancer Profile, Super Admin User Accounts | Partial/Working | Profile needs complete skills, pricing, availability. |
| Freelancer profile to services | Freelancer Add Service, My Services | Partial | Unified service page and package limits. |
| Freelancer service approval | Super Admin Approvals, Agency Team and Requests, Manager Review Queue | Partial | Unified approval records and final owner rules. |
| Agency discovers freelancer | Agency Team and Requests, Super Admin Freelancers | Partial | Discovery/search UI and request flow integration. |
| Agency sends team request | Agency Team and Requests | Partial | UI wiring to team request APIs and package limits. |
| Freelancer accepts/rejects request | Freelancer Dashboard/Profile/Apply Work | Partial | Dedicated request cards and notifications. |
| Agency publishes task | Agency Assignments | Partial | Publish task form and DB-backed list. |
| Freelancer applies for work | Freelancer Apply Work | Partial | Application drawer/API wiring. |
| Agency accepts application | Agency Assignments | Partial | Application accept to assignment UI. |
| Assignment created | Agency Assignments, Manager Project Tracking, Freelancer Dashboard | Partial | Unified role-scoped timeline. |
| Freelancer submits work | Freelancer dashboard/chat/future assignment detail, Agency Assignments | Partial | Clear freelancer delivery entry point. |
| Manager/Agency reviews delivery | Agency Assignments, Manager Review Queue | Working UI consolidation | Parent pages now expose delivery review; assignment linkage and permission rules still need deeper backend hardening. |
| Revision requested | Agency Assignments, Manager Review Queue, Freelancer Dashboard | Partial | Revision UI and notifications. |
| Project completed | Agency Assignments, Freelancer Dashboard | Partial | Completion action and payable state visibility. |
| Freelancer requests payment | Freelancer Earnings/Chat, Agency Payout Requests | Partial/Working backend | UI cards in freelancer context and chat. |
| Agency approves/rejects/marks paid | Agency Payout Requests, Accounting | Partial/Working backend | Payment proof/dispute states. |
| Accounting/payables update | Agency Accounting, Super Admin Billing | Partial | Client revenue/profit/export. |
| Freelancer earnings update | Freelancer Earnings | Partial/Working | Unified earnings page. |
| Notifications generated | Notification API, role dashboards | Partial | Notification center/UI integration. |

## Shared Components Required First

| Component | Priority | Used By |
| --- | --- | --- |
| PageHeader | Launch Critical | Every page. |
| DataTable | Launch Critical | Agencies, Freelancers, Team, Assignments, Finance, Reviews. |
| DetailDrawer | Launch Critical | Entity management and approvals. |
| StatusBadge | Launch Critical | All statuses. |
| EmptyState | Launch Critical | All pages. |
| FormSection | Launch Critical | Packages, Settings, Profile, Services. |
| MoneyAmount | Launch Critical | Billing, payouts, wallet, accounting. |
| UsageLimitMeter | High | Packages, Managers, Team, Services, Tasks. |
| SectionTabs | High | Merged pages. |
| AlertStack | High | Dashboards, escalations, billing risk. |
| SmartInsightCard | Medium | Dashboards. |
| QuickActionGrid | Medium | Dashboards. |
| PermissionGate / LockedFeatureCard | High | Package/role gated features. |

See `docs/GIGXOMI_SHARED_COMPONENT_SYSTEM.md` for component details.

## Implementation Order

| Pass | Scope | Output |
| --- | --- | --- |
| PASS 1 | Planning only | This file and shared component system. |
| PASS 2 | Shared UI foundation | Reusable components and tokenized CSS only. |
| PASS 3 | Super Admin | Packages, Agencies, Freelancers, Approvals, Billing first. Chat untouched. |
| PASS 4 | Agency Admin | Work Hub, Team and Requests, Payout Requests, Accounting, Settings. |
| PASS 5 | Freelancer | Dashboard, My Services, Apply Work, Earnings, Profile. |
| PASS 6 | Manager | Review Queue, Project Tracking, Escalations, Finance permissions. |
| PASS 7 | Navigation cleanup | Hide merged pages, add redirects after parent stability. |
| PASS 8 | Final audit | Build, lint, route checks, responsive checks, permission checks, token audit. |

## Risks Before Coding

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Chat regressions | Critical | Do not touch Chat until explicitly requested. |
| Route deletion breaking links | High | Hide first, redirect later, never delete in first pass. |
| File-backed data mistaken as production | High | Label data source and migrate page by page. |
| Financial permission leaks | Critical | Use PermissionGate and server-side checks. |
| Package limits only hidden in UI | High | Enforce server-side when implementing. |
| Too many tabs after merge | Medium | Only merge workflows with shared context. |
| Blue/patched UI returns | Medium | Use shared components and token-only CSS. |
| Dashboards showing fake intelligence | High | Use Data source needed states for missing metrics. |
