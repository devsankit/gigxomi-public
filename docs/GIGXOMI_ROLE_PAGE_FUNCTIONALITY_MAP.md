# Gigxomi Role Page Functionality Map

Last reviewed: 2026-05-06

Purpose: this document maps every current role page in the codebase so you can give an elaborate version of each page before the next implementation pass. This is a current-state page map, not a final product spec.

Current status labels:

| Status | Meaning |
| --- | --- |
| Working | Route exists and has meaningful UI/functionality wired. |
| Partial | Route exists, but some data, API, or workflows are still static, file-backed, or incomplete. |
| Redirect | Route exists mainly to redirect to another route. |
| Planning Needed | Route exists but needs clearer product/business requirements before deeper implementation. |

Global rules for all future page elaboration:

| Rule | Detail |
| --- | --- |
| Design system | Use global tokens, existing shell, dark/lime Gigxomi theme, no random colors. |
| Data lists | Use tables for dense management lists. |
| Details | Use side drawer/detail panel for editable record details. |
| Forms | Group fields into clear sections, labels above inputs, one primary action. |
| Actions | One primary action per section, secondary/ghost for supporting actions. |
| Permissions | Every page must define view/edit/approve/delete/export permissions. |
| Data readiness | Clearly mark DB-backed, file-backed, placeholder, and missing API areas. |
| Chat safety | Do not disturb the existing chat page unless specifically requested. |

## 1. Super Admin Pages

Super Admin purpose: platform owner command center for Gigxomi business, agencies, freelancers/editors, packages, revenue, risk, automation, marketing, WhatsApp, and platform settings.

Access: `SUPER_ADMIN` routes are protected through `requirePageRole(["SUPER_ADMIN"])`, except login.

| Page | Route | Current Status | What It Consists Of Now | Main Functionality | Data/API Source | Needs Your Elaborated Version For |
| --- | --- | --- | --- | --- | --- | --- |
| Overview / Intelligence Center | `/super-admin` | Partial | Founder dashboard/intelligence layer. | Shows executive dashboard signals through `SuperAdminLiveDashboard`. Intended for MRR, next revenue, agencies, freelancers, risk, alerts, demand, automation. | `src/components/super-admin/super-admin-live-dashboard.tsx`, dashboard data helpers. | Exact KPI priority, real metrics, alerts, actions, chart widgets, and which metrics must be live vs placeholder. |
| Chat | `/super-admin/chat` | Working | Official platform chat/inbox lane. | Super admin can monitor platform/admin chat workspace. Instagram inbox redirects here with channel query. | `SuperAdminChatSection`, `ChatWorkspace`, conversation APIs. | Whether super admin chat should include all tenants, WhatsApp, Instagram, payment cards, internal notes, and moderation tools. |
| Agencies | `/super-admin/agencies` | Working | Table plus detail drawer for agency accounts. | Search, status filter, package filter, WhatsApp filter, visible count, compact table, view/edit drawer, package/status update. | `SuperAdminAccessControl`, `/api/super-admin/users/[id]`, auth user store, registration packages, WhatsApp states. | Final columns, agency health score, package controls, WhatsApp readiness actions, renewal risk, delete/suspend rules. |
| Freelancers | `/super-admin/freelancers` | Working | Table plus detail drawer for freelancer accounts. | Same access-control pattern as agencies, scoped to freelancer package/access status. | `SuperAdminAccessControl`, auth users, packages, WhatsApp states. | Add service approval summary, wallet status, verification status, package commission, availability, skills, dispute status. |
| Approvals | `/super-admin/approvals` | Partial | Approval cards and queues. | Shows onboarding, WhatsApp activation, payout trust, renewal rescue style queues. | `superAdminDashboardSnapshot` and static business ecosystem data. | Exact approval types, table columns, detail drawer fields, approve/reject/request-change logic. |
| Packages | `/super-admin/packages` | Working | Package management console. | Create/edit packages, audience, billing, price, display copy, visibility, featured state, limits, feature gates, freelancer commission override, save through API. | `SuperAdminPackageManagement`, `/api/super-admin/packages`, registration package store. | Final package matrix, package limits, freelancer commission rules, upgrade/downgrade paths, package analytics, plan enforcement copy. |
| Marketing | `/super-admin/marketing` | Working | Marketing integration and event debug console. | Save GTM, GA4, Search Console, Meta pixel/pixel endpoint, refresh debug feed, view event blueprints and recent public payloads. | `SuperAdminMarketingConsole`, `/api/super-admin/marketing`, public growth store. | Campaign pages, SEO ideas, search keyword demand, conversion attribution, broadcast workflows. |
| User Accounts | `/super-admin/signup` | Working | Internal account creation panel. | Create Admin, Manager, Freelancer internal users with display name, email, phone, password. Lists staging/internal users. | `SuperAdminUserManagement`, `/api/super-admin/users`. | Final user table, permissions, reset password, deactivate user, tenant assignment, role-specific onboarding. |
| WhatsApp Control | `/super-admin/whatsapp-control` | Working/Partial | Platform WhatsApp and OTP control center. | Shows OTP channel health, official number, intent status mix, public auth flow, recent OTP requests, Meta setup panel, tenant WhatsApp setup. | `SuperAdminWhatsAppSection`, public auth intent store, WhatsApp connection file store, Meta setup APIs. | Final WhatsApp provider fields, webhook health, templates, onboarding queue, failed event handling. |
| WhatsApp Flows | `/super-admin/whatsapp-flows` | Partial | Automation builder/list shell. | Lists/builds WhatsApp flows, supports flow builder, validation, nodes, draft/publish intent, runtime placeholders. | `SuperAdminWhatsAppFlowBuilderSection`, flow store, runtime store, `/api/super-admin/whatsapp-flows`. | Final node library, automation business rules, runtime adapters, flow analytics, permissions, campaign flow templates. |
| WhatsApp Flow Builder | `/super-admin/whatsapp-flows/builder/[flowId]` | Partial | Full canvas builder route. | Opens specific flow in full-screen builder with React Flow canvas. | `SuperAdminWhatsAppFlowBuilder`, flow/runs store. | Final UX for canvas, testing, publish, versioning, rollback, delete, logs. |
| Billing Control | `/super-admin/billing-control` | Working/Partial | Platform billing controls. | Payment provider/admin payment controls, pending payment review, reminders, PhonePe/manual UPI controls depending on connected sections. | `SuperAdminBillingSection`, PhonePe config, manual UPI config/payment services, subscription reminder settings. | Final revenue tables, invoices, failed payments, refunds, subscription lifecycle, leakage alerts. |
| Editor Economics | `/super-admin/editor-economics` | Partial | Editor marketplace economics snapshot. | Shows editor/freelancer payout and performance style metrics, active/idle economics, leader/trust info. | Static business ecosystem data and snapshot helpers. | Final payout volume, commission, editor earnings, idle editors, top earners, category ROI, disputes. |
| Platform Settings | `/super-admin/platform-settings` | Working/Partial | Platform-level settings hub. | Groups payment provider settings, subscription reminders, YouTube/Instagram/platform integrations depending on configured panels. | `SuperAdminPlatformSettingsSection`, provider config services, integration cards. | Final settings sections, audit log, environment health, role permissions, theme/token management. |
| Instagram Inbox Redirect | `/super-admin/instagram-inbox` | Redirect | Redirect helper. | Redirects to `/super-admin/chat?channel=instagram`. | Next redirect. | Whether Instagram needs its own page or should remain a channel filter inside Chat. |
| Super Admin Login | `/super-admin/login` | Working | Dedicated owner login route. | Owner login with super admin credentials/phone rules and safe redirect handling. | Super admin config, session helpers, public shell. | Final owner recovery, 2FA, audit logging, lockout, emergency access rules. |

## 2. Agency Admin Pages

Agency Admin purpose: agency owner workspace for chats, managers, freelancers/team editors, subscriptions, assignments, delivery review, contacts, billing, payout requests, integrations, branding, and settings.

Access: `/admin/*` is protected for `ADMIN` and `SUPER_ADMIN`. Billing access is checked through `requireActiveBillingPageAccess()`.

| Page | Route | Current Status | What It Consists Of Now | Main Functionality | Data/API Source | Needs Your Elaborated Version For |
| --- | --- | --- | --- | --- | --- | --- |
| Overview | `/admin` | Working/Partial | Agency dashboard. | Uses `AdminLiveDashboard`; intended to show agency KPIs, chats, seats, plan, work, payout safety. | `/api/admin/dashboard`, `AdminLiveDashboard`, fallback snapshot data. | Final primary metrics, quick actions, smart insights, alerts, live data priority. |
| Role Access | `/admin/roles` | Partial | Role explanation and score model cards. | Explains Admin, Manager, Freelancer roles, karma score, leader score concepts. | Static `adminSnapshot.scoreModel`. | Actual role permission editor, seat limits, masking defaults, approval permissions. |
| Chat Inbox | `/admin/chat` | Working | Agency chat workspace. | Admin can use chat inbox with agency audience. | `ChatWorkspace`, conversation APIs. | Do not disturb unless requested. Later specify assignment cards, payment cards, manager routing, client masking. |
| Managers | `/admin/managers` | Partial | Manager privacy/permission panels. | Shows customer privacy controls and manager permission management UI. | `AdminCustomerPrivacyPanel`, `AdminManagerPermissionsPanel`, `/api/admin/managers` partially. | Create/edit manager flow, package seat enforcement, permission matrix, assigned queues, deactivate rules. |
| Team Editors | `/admin/freelancers` | Partial | Agency editor pool view. | Shows active agency editors from snapshot with membership, karma, leader score, workload, active agency count. | Business ecosystem data snapshots. | Real team table, team request flow, remove freelancer, workload, skills, active assignments, pending payouts. |
| Team Requests / Service Approvals | `/admin/service-approvals` | Partial | Moderation plus team invite/portfolio request area. | Shows service moderation board, team invites, portfolio requests. | `AdminServiceModerationBoard`, snapshot invite/request data. | Split or keep combined, approve/reject logic, request detail drawer, notifications. |
| All Contacts | `/admin/contacts` | Working/Partial | Contact table plus privacy context. | Shows admin contacts table. | `ContactsTable`, CRM controls. | Contact fields, import/export, tags, source, assigned manager, masking, merge duplicates. |
| Subscription Activate | `/admin/packages` | Working | Agency package/subscription page. | Shows current subscription, seats, manager capacity, paid invoices with PDF download. | Prisma `userSubscription`, `paymentTransaction`, `/api/billing/invoices/[id]`. | Upgrade/downgrade UX, plan comparison, usage meter, failed payment, renewal reminders. |
| Assignments | `/admin/assignments` | Partial | Assignment/project operation board. | Shows active agency project posts and assignment context. | Static/snapshot data plus new assignment APIs available separately. | Real assignment table, create assignment, assign freelancer, status lifecycle, project detail drawer. |
| Delivery Review | `/admin/delivery-review` | Working/Partial | Delivery review workspace list. | Review delivery assets/submissions. | `DeliveryReviewWorkspace`, delivery APIs. | Final columns, approve/revision flow, file preview, notes, client delivery action. |
| Delivery Review Detail | `/admin/delivery-review/[id]` | Working/Partial | Delivery detail workspace. | Opens specific delivery review item. | `DeliveryReviewWorkspace`. | Detail layout, version history, comments, approval and revision rules. |
| Portfolio Review | `/admin/portfolio-review` | Working/Partial | Portfolio draft review workspace. | Review and publish freelancer/agency showcase drafts. | `PortfolioDraftWorkspace`, portfolio APIs. | Final public showcase rules, approval workflow, SEO fields, placement, rejection notes. |
| Portfolio Review Detail | `/admin/portfolio-review/[id]` | Working/Partial | Portfolio draft detail workspace. | Opens specific portfolio draft. | `PortfolioDraftWorkspace`. | Detail UX, media preview, publish/reject actions, audit trail. |
| Payout Control | `/admin/wallet-review` | Partial | Wallet/payout review board. | Shows wallet review and payout trust context for agency. | `AdminWalletReviewSection`, snapshot/accounting data. | Pending editor payouts, approve/reject/mark paid, payment proof, dispute flow. |
| Freelancer Payment Requests | `/admin/payout-requests` | Working/Partial | Structured payout request review. | Lists payment requests and payout states for agency/accounting use. | `AdminPayoutRequestsSection`, payment request APIs. | Exact table columns, filters, drawer, bulk actions, manual payout process. |
| Accounting | `/admin/accounting` | Working/Partial | Accounting section for agency. | Shows accounting/payment request data for admin audience. | `AccountingSection audience="admin"`, accounting APIs. | Final ledger, client revenue, editor payables, profit, invoices, exports. |
| Monetization | `/admin/monetization` | Partial | Agency monetization snapshot. | Shows revenue/monetization cards and growth context. | Snapshot data. | Real upsells, campaigns, revenue by client, conversion, package utilization. |
| Integrations | `/admin/integrations` | Partial | Integration overview cards. | Shows integration cards for WhatsApp, PhonePe, YouTube, Drive, Analytics, Search Console, theme. | `AdminIntegrationsOverview`, integration card definitions. | Final setup status, connect/disconnect flows, health checks, errors. |
| WhatsApp API Setup | `/admin/integrations/whatsapp` | Working/Partial | Tenant WhatsApp onboarding. | Shows WhatsApp setup/onboarding for agency tenant. | Session tenant, agency listing store, WhatsApp connection store. | Final onboarding steps, Meta callback, number status, webhook test, template setup. |
| Showcase Page | `/admin/analytics` | Working/Partial | Agency listing/showcase editor. | Edit agency public listing/showcase content and editor options. | `AdminAgencyListingEditor`, agency listing file store. | Rename route maybe; final public profile, SEO metadata, categories, portfolio ordering. |
| Branding | `/admin/theme-branding` | Partial | Branding overview cards. | Shows branding/theme guidance and token-based future controls. | `AdminBrandingSection`. | Real logo upload, colors, public profile theme, preview, token constraints. |
| Agency Settings | `/admin/system-settings` | Working/Partial | Agency listing/settings editor. | Uses agency listing editor for tenant settings and showcase-related data. | `AdminAgencyListingEditor`, agency listing file store. | Privacy settings, manager permissions, masking, workflow defaults, notifications. |

## 3. Manager Pages

Manager purpose: operational workspace for assigned chats, contacts, verification/service/quote review, project tracking, delivery/portfolio review, wallet/accounting visibility, and escalations.

Access: `/manager/*` is protected for `MANAGER` and `SUPER_ADMIN`.

| Page | Route | Current Status | What It Consists Of Now | Main Functionality | Data/API Source | Needs Your Elaborated Version For |
| --- | --- | --- | --- | --- | --- | --- |
| Overview | `/manager` | Redirect | Redirects to chat currently. | Manager overview component exists but route redirects to `/manager/chat`. | Next redirect, `ManagerOverviewSection` unused by route. | Decide whether Manager should open Overview or Chat first. Define overview KPIs if restored. |
| Chat Inbox | `/manager/chat` | Working | Assigned thread inbox. | Manager chat workspace with assigned thread context. | `ChatWorkspace audience="manager"`. | Do not disturb unless requested. Later define assignment, notes, SLA, handoff, masking. |
| Assigned Chats | `/manager/assigned-chats` | Working | Manager assigned chat workspace. | Inspect assigned work, note load, and reroute before escalation. | `ChatWorkspace audience="manager"`. | Difference from `/manager/chat`, filters, ownership, priority, SLA. |
| All Contacts | `/manager/contacts` | Working/Partial | Contact table plus manager privacy panel. | Shows manager-scoped contacts and masking/privacy controls. | `ManagerCustomerPrivacyPanel`, `ContactsTable audience="manager"`. | Exact contact access rules, masked phone, allowed actions, notes/tags. |
| Verification Review | `/manager/verification-review` | Partial | Review queue for freelancer verification. | Shows verification queue cards. | Static verification queue data. | Real verification table, document preview, approve/reject/request more info. |
| Service Review | `/manager/service-review` | Partial | Review queue for freelancer services. | Moderates submitted freelancer listings before discovery/public pages. | `ManagerServiceReviewBoard`. | Manager role in service approval, fields, routing to admin, rejection notes. |
| Quote Review | `/manager/quote-review` | Partial | Operations detail board. | Shows quote review cards, pricing discipline, workload, payout trust blockers. | `ManagerOperationsDetailSection`, manager snapshot. | Real quote table, approval workflow, quote line items, client send action. |
| Project Tracking | `/manager/project-tracking` | Partial | Operations detail board. | Shows project posts and tracking status. | `ManagerOperationsDetailSection`, agency project posts. | Real project/assignment table, status lifecycle, deadlines, owners, blockers. |
| Delivery Review | `/manager/delivery-review` | Working/Partial | Delivery review workspace. | Manager can review delivery assets/submissions. | `DeliveryReviewWorkspace`. | Manager vs admin permissions, approve/request revision/escalate rules. |
| Delivery Review Detail | `/manager/delivery-review/[id]` | Working/Partial | Specific delivery review item. | Opens delivery detail. | `DeliveryReviewWorkspace`. | Exact detail layout and allowed actions. |
| Portfolio Review | `/manager/portfolio-review` | Working/Partial | Portfolio draft review workspace. | Review portfolio drafts. | `PortfolioDraftWorkspace`. | Manager permission to approve vs recommend, notes, escalation to admin. |
| Portfolio Review Detail | `/manager/portfolio-review/[id]` | Working/Partial | Specific portfolio draft. | Opens draft detail. | `PortfolioDraftWorkspace`. | Detail approval rules and audit log. |
| Wallet Review | `/manager/wallet-review` | Partial | Operations detail board for wallet blockers. | Shows assignments blocked by payout trust/delivery approval. | `ManagerOperationsDetailSection`, static cards. | Manager visibility into payouts, what can be approved, what must go to admin. |
| Accounting | `/manager/accounting` | Working/Partial | Accounting section for manager audience. | Shows accounting data with manager-scoped permissions. | `AccountingSection audience="manager"`. | Whether managers can view billing, payables, exports, or only operational finance blockers. |
| Escalations | `/manager/escalations` | Partial | Escalation board. | Shows workload, dispute, payout, delayed client decision risk cards. | `ManagerOperationsDetailSection`, manager risk board. | Real escalation creation, assignment, SLA, resolution, notifications. |

## 4. Freelancer / Editor Pages

Freelancer purpose: editor workspace for chat, services, work applications, profile/verification, wallet, payouts, accounting, portfolio drafts, and service preview.

Access: `/freelancer/*` is protected for `FREELANCER` and `SUPER_ADMIN`. Billing access is checked through `requireActiveBillingPageAccess()`.

| Page | Route | Current Status | What It Consists Of Now | Main Functionality | Data/API Source | Needs Your Elaborated Version For |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/freelancer` | Redirect | Redirects to chat currently. | `FreelancerDashboardSection` exists but route redirects to `/freelancer/chat`. | Next redirect, `FreelancerLiveDashboard` unused by route. | Decide whether freelancer should open Chat or Dashboard first. Define freelancer home metrics. |
| Chat | `/freelancer/chat` | Working | Merged agency inbox. | Freelancer sees assigned threads across active agency memberships. | `ChatWorkspace audience="freelancer"`. | Do not disturb unless requested. Later define client masking, delivery upload, payment request cards. |
| Add Service | `/freelancer/add-service` | Working/Partial | Dynamic service creation form. | Freelancer can create/edit service draft fields and submit service flow. | `FreelancerDynamicAddServiceSection`, freelancer service APIs/file store. | Final service fields, package limits, approval submission, media upload, SEO fields. |
| Draft Services | `/freelancer/draft-services` | Working/Partial | Draft service list. | Shows draft/unpublished service cards/table. | `DraftServicesSection`, service list store. | Final columns, edit/delete/submit, validation, package service limit. |
| Published Services | `/freelancer/published-services` | Working/Partial | Published service list. | Shows approved/live services. | `PublishedServicesSection`, service list store. | Metrics, pause/unpause, public preview, performance analytics. |
| Services Redirect | `/freelancer/services` | Redirect | Redirect helper. | Redirects to `/freelancer/draft-services`. | Next redirect. | Decide whether to keep redirect or create unified My Services page. |
| Service Preview | `/freelancer/services/[id]/preview` | Working/Partial | Freelancer service preview. | Opens a specific service preview if found. | `FreelancerServicePreviewSection`, session, service file store. | Final public/private preview, edit CTA, approval status, share link. |
| Apply for Work | `/freelancer/apply-for-work` | Partial | Agency project/opportunity board. | Shows matched opportunities, agency trust, apply buttons, agency invites, portfolio requests. Current apply state is mostly local UI state. | Agency listing file store, `freelancerSnapshot`. New task APIs exist separately. | Real task marketplace, application API, proposal fields, shortlist/accepted statuses, notifications. |
| Profile | `/freelancer/profile` | Working/Partial | Profile, verification, showcases, agency access. | Save profile, submit verification, view published showcases, memberships and applications. | `/api/freelancer/profile`, `/api/freelancer/verification`, agency listing store, portfolio store. | Final profile fields, skills/categories/pricing/availability, approval state, portfolio management. |
| Wallet | `/freelancer/wallet` | Working/Partial | Wallet balance and ledger. | Shows gross earned, Gigxomi fee, pending clearance, available withdrawal, ledger rows. | `/api/freelancer/wallet`, wallet entries. | Final wallet rules, manual payout settlement, holds, reversals, tax/invoice fields. |
| Accounting | `/freelancer/accounting` | Working/Partial | Accounting section for editor audience. | Shows editor accounting/payment information. | `AccountingSection audience="editor"`. | Exact freelancer ledger, assignment income, payout request visibility, exports. |
| Payouts | `/freelancer/payouts` | Working/Partial | Payout details and request form. | Save bank/UPI details, choose monetization plan, submit payout request, list payout requests. | `/api/freelancer/payment-details`, `/api/freelancer/payout-requests`. | Align with PhonePe/editor wallet model, package-based commission, manual payout process. |
| Portfolio Drafts | `/freelancer/portfolio-drafts` | Working/Partial | Publishing assistant. | Create/edit portfolio/showcase drafts. | `PublishingAssistant mode="portfolio"`, publishing APIs/stores. | Final portfolio draft fields, media source, agency approval, public showcase placement. |
| Portfolio Draft Detail | `/freelancer/portfolio-drafts/[id]` | Working/Partial | Publishing assistant focused on one draft. | Opens draft editor/detail mode. | `PublishingAssistant mode="portfolio"`. | Detail workflow, version history, submit for review, delete/duplicate. |

## 5. Shared Components And APIs To Keep In Mind

| Area | Current Shared Component/API | Used By |
| --- | --- | --- |
| Internal shell | `InternalAppShell` | Super Admin, Admin, Manager, Freelancer shell variants. |
| Chat | `ChatWorkspace` | Super Admin, Admin, Manager, Freelancer chat routes. |
| Accounting | `AccountingSection` | Admin, Manager, Freelancer accounting routes. |
| Delivery review | `DeliveryReviewWorkspace` | Admin and Manager delivery review routes. |
| Portfolio review | `PortfolioDraftWorkspace` | Admin and Manager portfolio review routes. |
| Portfolio creation | `PublishingAssistant` | Freelancer portfolio draft routes. |
| Access table/drawer | `SuperAdminAccessControl` | Super Admin Agencies and Freelancers. |
| Package management | `SuperAdminPackageManagement` | Super Admin Packages. |
| Service management | `FreelancerDynamicAddServiceSection`, `DraftServicesSection`, `PublishedServicesSection` | Freelancer service routes. |
| Payment request circuit | `/api/payment-requests`, `/api/assignments/[id]/payment-request`, `/api/payments/phonepe/editor-payment-return` | Agency/freelancer payment flow. |
| Team request circuit | `/api/tenants/[tenantId]/team-requests`, `/api/freelancer/team-requests`, `/api/team-requests/[id]/respond` | Agency/freelancer team flow. |
| Task/application circuit | `/api/tasks`, `/api/tasks/[id]/applications`, `/api/task-applications/[id]` | Agency task publishing and freelancer applications. |
| Notifications | `/api/notifications`, `/api/notifications/[id]/read` | Cross-role alerts and updates. |

## 6. Pages That Need Product Decisions Before Heavy Implementation

| Decision Area | Pages Affected | Decision Needed |
| --- | --- | --- |
| Default landing page | `/manager`, `/freelancer` | Should these open dashboard overview or chat first? |
| Team requests | `/admin/freelancers`, `/admin/service-approvals`, `/freelancer/apply-for-work`, `/freelancer/profile` | Should team requests be a separate page or embedded in Team Editors/Apply Work? |
| Task marketplace | `/admin/assignments`, `/freelancer/apply-for-work`, `/manager/project-tracking` | Exact publish/apply/accept lifecycle and UI ownership. |
| Payout model | `/freelancer/payouts`, `/freelancer/wallet`, `/admin/payout-requests`, `/admin/accounting`, `/super-admin/billing-control` | Final PhonePe collection, wallet credit, manual payout release, package commission. |
| Package enforcement | `/super-admin/packages`, `/admin/packages`, `/admin/managers`, `/admin/freelancers`, `/freelancer/add-service` | Which package limits block which actions server-side. |
| Manager permissions | `/admin/managers`, all `/manager/*` pages | What managers can view/edit/approve/export and what is masked. |
| Showcase vs analytics naming | `/admin/analytics`, `/admin/system-settings`, `/freelancer/portfolio-drafts` | Whether `/admin/analytics` should be renamed or kept as showcase editor. |
| Approval queues | `/super-admin/approvals`, `/admin/service-approvals`, `/manager/service-review`, `/manager/verification-review` | Which role has final approval and what states exist. |
| WhatsApp automation | `/super-admin/whatsapp-control`, `/super-admin/whatsapp-flows`, `/admin/integrations/whatsapp` | Runtime scope, flow templates, tenant rollout, logs, and failure handling. |

## 7. How To Elaborate Each Page For The Next Pass

For each page you want me to build next, send details in this format:

```md
## Page: <role + page name>
Route: <route>
Goal: <what this page must help the user do>
Primary user: <super admin / agency admin / manager / freelancer>
Must show: <metrics, tables, cards, forms>
Must actions: <create/edit/approve/reject/pay/export/etc.>
Fields: <exact field names>
Statuses: <status lifecycle>
Permissions: <who can view/edit/approve/delete/export>
Data source: <real DB/API/file-backed/needs API>
Empty state: <what user sees when no data>
Error state: <what user sees on failure>
Mobile behavior: <table scroll/card stack/etc.>
Do not change: <routes/chat/sidebar/business rules/etc.>
```

Recommended next elaboration order:

| Order | Page Group | Why |
| --- | --- | --- |
| 1 | Super Admin Packages, Agencies, Freelancers | These define access, plans, and platform control. |
| 2 | Agency Admin Assignments, Team Editors, Payout Requests | These unlock real marketplace operations. |
| 3 | Freelancer Add Service, Apply Work, Wallet/Payouts | These unlock supply and payment flow. |
| 4 | Manager Project Tracking, Delivery Review, Escalations | These make operations manageable. |
| 5 | Dashboards by role | Dashboards should reflect real completed circuits, not guesses. |
