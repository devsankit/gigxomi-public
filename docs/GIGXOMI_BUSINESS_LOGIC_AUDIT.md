# Gigxomi Business Logic Audit

Date: 2026-05-05
Scope: audit only. No UI redesign, code rewrite, route change, API change, auth change, database change, or business-flow implementation was performed.

## Executive Verdict

Gigxomi has strong foundations for auth, role shells, package/subscription billing, chat operations, service publishing, delivery review, WhatsApp/Instagram plumbing, and Super Admin intelligence placeholders.

Gigxomi is not yet live-ready for the complete marketplace operating system described in the product vision because several critical business circuits are incomplete or split across separate stores:

- The app has two business data layers: legacy Prisma marketplace models and newer app/file-store-backed models.
- Freelancer services, chat conversations, assignments, payment requests, delivery assets, and portfolio drafts do not all use one normalized project/order ledger.
- Agency team requests are disabled.
- Agency task publishing and freelancer applications are mostly static UI/data, not a persisted workflow.
- Assignment is currently conversation assignment, not a full project lifecycle with budget, deadline, acceptance, completion, and payment linkage.
- Freelancer payout requests exist, but they are not linked to completed assignments or agency accounting approval.
- Chat payment requests exist, but they are not the same as freelancer payout requests or Prisma `PayoutRequest` rows.
- Package limits are modeled, but not consistently enforced on managers, team editors, projects, services, storage, WhatsApp seats, or applications.
- Manager permissions exist in UI/store, but API-level enforcement is incomplete.
- Search/demand intelligence events are not implemented as the planned moat-level event stream.

Recommended go-live posture:

- Safe for controlled staging/demo with clear limitations.
- Not safe for full commercial marketplace launch until Critical blockers are closed.

## Files Inspected

Core schema and auth:

- `prisma/schema.prisma`
- `src/lib/auth/types.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/store.ts`
- `src/lib/auth/page-guard.ts`
- `src/lib/api/require-session-role.ts`
- `src/lib/api/resolve-session-tenant.ts`

Billing, packages, subscriptions:

- `src/lib/billing/package-service.ts`
- `src/lib/billing/subscription-service.ts`
- `src/lib/billing/billing-access-service.ts`
- `src/lib/billing/manual-upi-payment-service.ts`
- `src/app/api/billing/subscribe/route.ts`
- `src/app/api/billing/jobs/process-renewals/route.ts`
- `src/app/api/super-admin/packages/route.ts`
- `src/app/api/super-admin/manual-upi-payments/[id]/approve/route.ts`
- `src/app/api/super-admin/manual-upi-payments/[id]/reject/route.ts`

Freelancer flows:

- `src/app/api/freelancer/profile/route.ts`
- `src/app/api/freelancer/verification/route.ts`
- `src/app/api/freelancer/payment-details/route.ts`
- `src/app/api/freelancer/payout-requests/route.ts`
- `src/app/api/freelancer/dashboard/route.ts`
- `src/app/api/freelancer/services/route.ts`
- `src/app/api/freelancer/services/[id]/route.ts`
- `src/app/api/freelancer/services/[id]/submit/route.ts`
- `src/app/api/freelancer/services/[id]/review/route.ts`
- `src/app/api/freelancer/services/[id]/media/video/route.ts`
- `src/app/api/freelancer/services/[id]/media/design/route.ts`
- `src/lib/gigxomi/freelancer-workspace-store.ts`
- `src/components/freelancer/freelancer-section-content.tsx`
- `src/lib/gigxomi/freelancer-data.ts`

Agency, manager, team, CRM:

- `src/app/api/admin/managers/route.ts`
- `src/app/api/admin/managers/[id]/permissions/route.ts`
- `src/app/api/admin/customer-privacy/route.ts`
- `src/app/api/manager/customer-privacy/route.ts`
- `src/app/api/admin/contacts/route.ts`
- `src/app/api/manager/inbox/route.ts`
- `src/app/api/manager/assignments/route.ts`
- `src/app/api/tenants/[tenantId]/team-requests/route.ts`
- `src/app/api/team-requests/[requestId]/respond/route.ts`
- `src/app/api/tenants/[tenantId]/team-seats/route.ts`
- `src/components/admin/admin-section-content.tsx`
- `src/components/manager/manager-section-content.tsx`
- `src/components/crm/crm-dummy-controls.tsx`

Chat, assignment, payment request, delivery:

- `src/app/api/conversations/route.ts`
- `src/app/api/conversations/new/route.ts`
- `src/app/api/conversations/[id]/messages/route.ts`
- `src/app/api/conversations/[id]/assignment/route.ts`
- `src/app/api/conversations/[id]/assignment/respond/route.ts`
- `src/app/api/conversations/[id]/payment-request/route.ts`
- `src/app/api/conversations/[id]/freelancer-customer-access/route.ts`
- `src/app/api/accounting/requests/route.ts`
- `src/app/api/delivery/assets/route.ts`
- `src/app/api/delivery/assets/[id]/approval/route.ts`
- `src/lib/api/conversation-access.ts`
- `src/lib/api/conversation-view-response.ts`
- `src/lib/gigxomi/dummy-platform-store.ts`
- `src/lib/gigxomi/dummy-platform-file-store.ts`
- `src/lib/gigxomi/dummy-platform-db-store.ts`
- `src/lib/gigxomi/delivery-portfolio-store.ts`

Super Admin and intelligence:

- `src/app/api/super-admin/dashboard/route.ts`
- `src/lib/gigxomi/dashboard-overview-data.ts`
- `src/app/api/super-admin/users/route.ts`
- `src/app/api/super-admin/users/[id]/route.ts`
- `src/components/super-admin/super-admin-section-content.tsx`
- `src/components/super-admin/super-admin-live-dashboard.tsx`

Discovery, search, marketing:

- `src/app/api/match/route.ts`
- `src/app/api/services/route.ts`
- `src/app/api/public-growth/events/route.ts`
- `src/lib/gigxomi/public-growth-store.ts`
- `src/lib/gigxomi/business-ecosystem-data.ts`

Role pages discovered:

- Super Admin: overview, agencies, freelancers, approvals, packages, marketing, user accounts via signup/user management, WhatsApp control, WhatsApp flows, billing control, editor economics, platform settings, chat, Instagram inbox redirect.
- Agency Admin: overview, accounting, analytics, assignments, chat, contacts, delivery review, freelancers, integrations, managers, monetization, packages, payout requests, portfolio review, roles, service approvals, system settings, branding, wallet review.
- Manager: overview, accounting, assigned chats, chat, contacts, delivery review, escalations, portfolio review, project tracking, quote review, service review, verification review, wallet review.
- Freelancer: overview, accounting, add service, apply for work, chat, draft services, payouts, portfolio drafts, profile, published services, service preview, services, wallet.

## Data Model Audit

### Implemented Data Layers

Prisma models exist for:

- Legacy marketplace: `User`, `EditorProfile`, `Tenant`, `TeamMembership`, `Service`, `Lead`, `MatchResult`, `Assignment`, `Deal`, `Payout`, `PayoutRequest`, `Quote`, `DeliveryAsset`, `ShowcasePermission`, `Notification`, `PaymentSecurityRecord`.
- New app/auth/billing: `AppAuthUser`, `AppFreelancerWorkspace`, `AppFreelancerService`, `AppConversation`, `AppPublishingDraft`, `Package`, `UserSubscription`, `PaymentTransaction`, `PaymentLog`, `SubscriptionStatusHistory`, `PaymentProviderConfig`.
- YouTube publishing: `PlatformYouTubeConnection`, `PlatformYouTubePublishJob`.

### Main Data Risk

The current app uses multiple overlapping representations:

- `AppAuthUser` is the live auth/user table.
- `User`, `EditorProfile`, `Service`, `Assignment`, `Deal`, `PayoutRequest`, and `Notification` still exist but are not the main live app workflow.
- `AppFreelancerService` stores service payload JSON.
- `AppConversation` stores conversation payload JSON.
- `AppFreelancerWorkspace` stores freelancer profile, verification, payment details, and payout requests as JSON.
- Delivery/portfolio and remaining operational state use local `.gigxomi` JSON stores or JSON snapshots.

Impact:

- Business dashboards can show partial numbers, but no single source of truth exists for project, assignment, delivery, approval, payout, and accounting status.
- Auditing financial and operational state will be hard without normalized tables and event history.
- Live operations can drift because chat payment state, freelancer payout request state, wallet state, and subscription payment state are separate.

## Existing Implemented Flows

### Auth and Role Routing

Implemented:

- Public signup starts via package selection and WhatsApp OTP.
- OTP verification creates/activates session.
- Password login and WhatsApp login routes exist.
- Super Admin login has dedicated owner flow.
- Page guards exist for Admin, Manager, Freelancer, and individual Super Admin pages.
- API role guards exist through `requireSessionRole`.
- Billing access guard exists for Admin and Freelancer layouts.

Important behavior:

- Default dashboards currently route to role chat pages:
  - Super Admin: `/super-admin/chat`
  - Admin: `/admin/chat`
  - Manager: `/manager/chat`
  - Freelancer: `/freelancer/chat`

Gaps:

- Role package status can downgrade agency access to freelancer behavior in auth sync. This is useful, but needs clear product messaging.
- Super Admin layout itself is not guarded, but individual Super Admin pages are guarded.
- Permission-level checks are not as deep as role-level checks.

### Package and Subscription Billing

Implemented:

- Super Admin can manage packages through `/api/super-admin/packages`.
- Package model includes pricing, billing interval, audience, feature flags, seat/project/service/storage limits, upgrade/downgrade paths, commission override, and access flags.
- Public signup requires package selection.
- Free packages can activate immediately.
- Paid package flow creates pending subscription and payment transaction.
- Manual UPI payment approval/rejection exists.
- Manual UPI approval activates subscription and records payment logs.
- Renewal processing exists.
- Super Admin dashboard reads subscription/payment/package data for MRR, pending/failed payments, active subscriptions, renewal risk, and package performance.

Gaps:

- Package limits are mostly not enforced in operational endpoints.
- `assertPlanLimit` exists only for `serviceLimit`, `activeProjectLimit`, and `portfolioItemLimit`, but no active usage was found.
- Manager limits, freelancer/team limits, WhatsApp seats, storage, upload size, active project limits, service publishing limits, analytics access, and automation access are not consistently enforced.
- Upgrade prompts exist conceptually but not as a unified limit-state system.

### Freelancer Registration and Profile

Implemented:

- Public signup captures display name, phone, email, package.
- Role is derived from package audience.
- Freelancer workspace is created lazily in `AppFreelancerWorkspace`.
- Freelancer profile endpoint supports full name, display name, phone, profession, languages, English level, bio, email.
- Verification endpoint stores document type, document number, address, and submitted status.
- Payment details endpoint stores bank name, account number, IFSC, UPI ID, monetization plan.

Gaps:

- Freelancer lifecycle is incomplete. Required states include registered, profile incomplete, pending approval, approved, rejected, active, suspended. Current profile uses `DRAFT`/`COMPLETED`; verification uses `NOT_SUBMITTED`/`SUBMITTED`/`UNDER_REVIEW`/`APPROVED`/`REJECTED`, but no unified freelancer account approval status gates marketplace visibility.
- Profile does not capture full required fields: profile image, skills, categories, experience, portfolio/video links, availability, preferred work type, location/timezone, rating/performance, approval metadata.
- Verification can be submitted, but approval/rejection workflow is not clearly connected to Super Admin approval or service visibility.
- Freelancer dashboard combines real service view events, JSON workspace state, and legacy editor profile fallback. Metrics are partial and not a production-grade ledger.

### Freelancer Services

Implemented:

- Freelancer can create/update services.
- Services include title, summary, category, specialty, description, target audience, delivery time, revisions, base price, tags, SEO fields, deliverables, FAQ, media.
- Service submit/review endpoints exist.
- Admin/Manager/Super Admin can approve/reject service reviews.
- Freelancer can publish through submit route, but it immediately calls approve behavior.
- Public services endpoint lists approved services from the app store.
- Media upload endpoints for video/design return placeholder pending objects.

Gaps:

- Services are stored as `AppFreelancerService` JSON payloads, not normalized `Service` rows for matching, analytics, pricing, approval history, and search.
- Service status lifecycle is present as strings, but not fully enforced with draft -> pending approval -> approved/rejected -> active/paused.
- Freelancer self-submit route approves/publishes directly instead of always requiring Super Admin/Admin approval.
- Media upload is placeholder only; YouTube/Drive storage is not fully connected for service media.
- Service search/demand analytics are not tied to service tags/categories/keywords in a structured event model.

### Chat and Conversation Operations

Implemented:

- Conversations are available to Super Admin, Admin, Manager, and Freelancer.
- Tenant scoping exists for Admin/Manager.
- Freelancer conversation access checks assignment and active agency identity.
- Customer lane and internal lane exist.
- Freelancer direct customer lane is blocked unless explicitly granted.
- Message send supports attachments up to 20 MB.
- WhatsApp/Instagram relay plumbing exists.
- Customer privacy masking exists for managers and freelancers.
- Contact table can update tags, notes, status, and assignee.

Gaps:

- Conversation records are JSON payloads, not normalized project records.
- Manager permissions are not consistently enforced server-side before reading/updating conversations and contacts.
- Contacts API allows Manager role to update contacts; UI checks a simulated manager permission, but API does not fully enforce that manager has `allContacts` or assigned-contact permission.
- Manager privacy endpoint allows Manager to change freelancer phone masking. This may be product-intentional, but it is risky because Agency Admin should usually own privacy settings.

### Conversation Assignment

Implemented:

- Admin/Manager/Super Admin can assign a conversation to a freelancer.
- Assignment validates conversation access.
- Freelancer can accept or pass conversation assignment.
- Push notification dispatch is attempted on assignment.
- Conversation status changes to assigned/active style states.

Gaps:

- Assignment is a chat/conversation assignment, not a full task/project assignment.
- No normalized assignment fields exist in the live app path for brief, budget, deadline, priority, payment terms, revision policy, files, status history, acceptance, completion, and payout linkage.
- Legacy `/api/manager/assignments` is disabled.
- Prisma `Assignment` exists but is linked to legacy `Lead`, not the current `AppConversation` assignment path.

### Delivery and Portfolio Review

Implemented:

- Delivery asset upload exists.
- Delivery upload checks freelancer conversation access.
- Delivery asset can be reviewed/approved/rejected by Super Admin/Admin/Manager.
- Delivery approval can create/update portfolio drafts.
- Portfolio drafts exist for client work and self samples.
- YouTube publishing infrastructure exists.

Gaps:

- Delivery approval does not close a normalized assignment/project lifecycle.
- Approval does not automatically mark project complete, calculate payable amount, or unlock payment request eligibility.
- Revision request lifecycle is not normalized.
- Delivery and portfolio store is separate from the core assignment/payment ledger.

### Chat Payment Requests

Implemented:

- Chat payment request endpoint exists.
- Freelancer can create payment requests only in internal lane.
- Payment request creates PhonePe checkout link.
- Payment request status can be updated: Draft, Sent, Viewed, Paid, Failed, Cancelled.
- Proof attachments can be submitted.
- Accounting endpoint reads payment requests from conversations and computes pending/paid totals.
- Paid freelancer payment requests can create wallet credits in the dummy platform store.

Gaps:

- Chat payment request is not linked to normalized assignment/project completion.
- Chat payment request is not linked to Prisma `PayoutRequest`.
- Agency approval states required by the product are missing: requested, agency_review, approved, rejected, paid, disputed, cancelled.
- Status "Paid" can be confirmed by freelancer or admin for freelancer-payee requests. Agency approval/mark-paid responsibility needs stricter policy.
- Payment proof is metadata only; actual proof upload/storage and UTR validation are not unified.
- Accounting is based on conversation payment requests, not full agency liabilities.

### Freelancer Payout Requests

Implemented:

- Freelancer can save payout details.
- Freelancer can create payout requests with amount and note.
- Payout requests are stored in `AppFreelancerWorkspace` JSON.
- Payout statuses exist in workspace type: REQUESTED, UNDER_REVIEW, APPROVED, PAID, REJECTED.

Gaps:

- Payout request is not tied to assignment/project, delivery approval, wallet balance, chat payment request, agency, or accounting.
- No agency-side approval/rejection/mark paid endpoint for these freelancer payout requests.
- No Super Admin oversight endpoint for these workspace payout requests.
- No validation that requested amount is less than available payable balance.
- No audit trail or notification for payout request lifecycle.

### Agency Managers

Implemented:

- Admin/Super Admin can create manager records.
- Manager list is tenant-scoped for Admin.
- Manager permissions can be toggled in file-store.
- Manager pages exist.
- Manager dashboard computes some live data from conversations.

Gaps:

- Manager account creation does not create `AppAuthUser` login identity.
- Manager limit from package/staff seats is not enforced.
- Manager permissions are mostly UI-level/file-store flags, not strongly enforced at every API route.
- Manager assigned conversation/task scoping is incomplete.
- Billing restriction is route-level by role, not permission-level.

### Super Admin Oversight

Implemented:

- Super Admin has pages for overview, agencies, freelancers, approvals, packages, marketing, user accounts, WhatsApp control, WhatsApp flows, billing control, editor economics, platform settings, and chat.
- Super Admin users API can create internal users except canonical super admin.
- Super Admin can update package access/status on users.
- Super Admin can approve/reject manual UPI package payments.
- Super Admin overview reads real billing/auth/package data and labels missing intelligence sources.

Gaps:

- Super Admin does not have centralized normalized oversight for team requests, task marketplace applications, assignment lifecycle, payout disputes, project completion, or agency liabilities.
- Existing intelligence center has placeholders for demand/search, automation value, no-result searches, payout disputes, and unbilled seats.
- Approval pages exist, but the underlying approval queues are incomplete across freelancers, services, portfolio, payments, team requests, and disputes.

## Missing or Incomplete Core Flows

### Freelancer Core Flow

Required flow:

1. Freelancer signs up.
2. Profile/onboarding state is created.
3. Freelancer completes profile and payout details.
4. Freelancer submits verification.
5. Super Admin approves/rejects freelancer.
6. Freelancer creates services.
7. Services go through approval.
8. Approved services become searchable and matchable.
9. Dashboard shows real assignments, applications, earnings, profile completion, and performance.

Current state:

- Signup, profile, payment details, verification submission, and service creation exist.
- Approval gate for freelancer account is missing/incomplete.
- Service approval exists but freelancer self-submit currently approves.
- Dashboard metrics are partly real, partly fallback/static.

Critical before live:

- Add unified freelancer account lifecycle.
- Require approval before public marketplace visibility.
- Normalize freelancer profile/service fields.
- Connect dashboard metrics to assignments, applications, delivery, and payout ledger.

### Agency + Freelancer Team Request Flow

Required flow:

1. Agency discovers freelancer.
2. Agency sends team request.
3. Freelancer sees request.
4. Freelancer accepts/rejects.
5. Accepted freelancer becomes team member.
6. Agency can assign tasks.
7. Rejected/cancelled/expired states are visible.
8. Removal handles active work and pending payments.

Current state:

- Legacy team request endpoints are disabled.
- Static invite/membership data exists in `business-ecosystem-data`.
- Prisma `TeamMembership` exists, but current live app does not use it end-to-end.

Critical before live:

- Implement persisted `TeamRequest` or modernize `TeamMembership` with request metadata.
- Add agency send request endpoint and freelancer respond endpoint.
- Add notifications and audit logs.
- Enforce team membership before assignment where required.
- Add removal flow with active assignment/payment checks.

### Flow A: Agency Team Freelancer Assignment

Required flow:

1. Agency has active team freelancer.
2. Agency creates project/assignment.
3. Assignment includes client, manager, freelancer, brief, files, deadline, budget, payment terms, priority.
4. Freelancer accepts/declines.
5. Manager/Agency reviews delivery.
6. Assignment completes.
7. Payment becomes payable.

Current state:

- Conversation assignment exists.
- Delivery upload/review exists.
- No normalized assignment/project exists in live app path.

Critical before live:

- Create `ProjectAssignment` or modernize Prisma `Assignment` for current app users/conversations.
- Link assignment to `AppConversation`, agency, manager, freelancer, delivery assets, and payment requests.
- Implement state machine and allowed transitions.

### Flow B: Agency Publishes Task, Freelancers Apply

Required flow:

1. Agency publishes task.
2. Freelancers browse/apply.
3. Agency reviews applicants.
4. Agency shortlists/accepts/rejects.
5. Accepted application becomes assignment.

Current state:

- Freelancer "Apply for Work" page uses static `agencyProjectPosts` and local component state.
- "Apply now" changes client state only; no API persistence.
- No task publishing API found.
- No task application model found.
- No conversion to assignment.

Critical before live:

- Add `PublishedTask` and `TaskApplication` models.
- Add agency publish/list/update APIs.
- Add freelancer apply/withdraw APIs.
- Add agency applicant review APIs.
- Add conversion to assignment.

### Project Completion + Payment Request Flow

Required flow:

1. Freelancer submits work.
2. Agency/Manager approves or requests revision.
3. Assignment becomes completed.
4. Payable amount unlocks.
5. Freelancer requests payment.
6. Agency approves/rejects/marks paid.
7. Accounting reflects liability and paid status.
8. Freelancer earnings update.

Current state:

- Delivery upload/review exists.
- Chat payment request exists.
- Freelancer payout request exists.
- Wallet credit can be created from paid chat payment request.

Gaps:

- No single project completion state.
- No automatic payable balance calculation.
- No link between delivery approval and payout request eligibility.
- No agency review flow for freelancer workspace payout requests.
- No unified accounting ledger.

Critical before live:

- Implement assignment completion state.
- Add payment request model linked to assignment.
- Add agency payout approval UI/API.
- Add ledger entries for pending payable, approved payable, paid, disputed.

### Chat + Payment Request Logic

Required behavior:

- Freelancer can request payment in chat after project completion.
- This must create structured payment request record.
- Agency sees actionable card.
- Request appears in billing/accounting and project detail.
- Status syncs everywhere.

Current state:

- Structured chat payment request exists.
- Accounting endpoint reads conversation payment requests.
- Payment proof/status updates exist.

Gaps:

- Request is not gated by project completion.
- Request does not sync to freelancer payout request model.
- Request does not sync to normalized accounting ledger.
- Agency approval/rejection states are not fully modeled.

## Role Permission Audit

### Super Admin

Implemented:

- Can access Super Admin pages and APIs.
- Can manage users and packages.
- Can approve/reject manual subscription payments.
- Can view cross-platform dashboard data.

Missing:

- Unified approval queue permissions.
- Payout/dispute oversight.
- Package limit override audit trail.
- Event intelligence permissions.

### Agency Admin

Implemented:

- Admin layout requires active billing access.
- Can access Admin pages.
- Can create manager records.
- Can update customer privacy settings.
- Can assign conversations and manage chat.
- Can manage contacts.
- Can view agency packages/subscriptions.

Missing:

- Package limit enforcement.
- Team request send/remove flow.
- Task publish/review application flow.
- Assignment lifecycle management.
- Payable/payout approval ledger.
- Strong audit trail for financial actions.

### Manager

Implemented:

- Manager layout has role guard.
- Manager can view manager pages.
- Manager can view inbox/dashboard/conversations.
- Manager can send messages and assign conversations through role access.
- Manager can see/update contacts through API.

Risks:

- Manager permissions are not consistently enforced at API level.
- Manager can update freelancer phone masking setting through `/api/manager/customer-privacy`.
- Manager contact access appears broader than assigned-only unless UI-level simulated permission blocks it.

Missing:

- Server-side permission checks for each manager capability.
- Assigned conversation/task scoping.
- Billing restrictions by permission.
- Audit log for manager actions.

### Freelancer

Implemented:

- Freelancer layout requires role and active billing access.
- Can view own profile/payment/verification workspace.
- Can create services and edit own services.
- Can view assigned conversations based on assigned identity and active agency.
- Can send internal messages.
- Can request chat payment in internal lane.
- Can upload delivery assets for accessible conversation.
- Can create payout requests.

Missing:

- Account approval gate.
- Team request accept/reject.
- Application persistence.
- Assignment acceptance/decline for normalized projects.
- Payment request gating after completion.
- Earnings ledger tied to completed work.

## Package / Plan Limit Gaps

Existing model fields:

- `serviceLimit`
- `activeProjectLimit`
- `portfolioItemLimit`
- `teamMemberLimit`
- `staffAccountLimit`
- `clientLimit`
- `editorFreelancerLimit`
- `storageLimitMb`
- `maxUploadSizeMb`
- `chatAccess`
- `clientChat`
- `teamChat`
- `whatsappIntegration`
- `aiToolsAccess`
- `analyticsAccess`
- `automationTools`
- `commissionOverridePercent`
- `upgradePathIds`
- `downgradePathIds`

Current enforcement:

- Active billing access is required for Admin and Freelancer layouts.
- `assertPlanLimit` exists but no active usage was found.
- Package feature flags are used mostly for package display and subscription logic, not operational enforcement.

Critical gaps:

- Manager creation does not enforce `staffAccountLimit`.
- Freelancer/team addition does not enforce `teamMemberLimit` or `editorFreelancerLimit`.
- Service creation does not enforce `serviceLimit`.
- Assignment/project creation does not enforce `activeProjectLimit`.
- Portfolio draft creation does not enforce `portfolioItemLimit`.
- Upload does not enforce package storage limits, only per-chat attachment size limits.
- WhatsApp/integration pages do not fully enforce package feature access.

Required plan-limit states:

- allowed
- near_limit
- over_limit
- upgrade_required
- admin_override

## Status Lifecycle Audit

### freelancer_profile

Required:

- registered -> profile_incomplete -> pending_approval -> approved -> active -> suspended
- registered/profile_incomplete -> rejected

Current:

- Profile status: DRAFT, COMPLETED
- Verification status: NOT_SUBMITTED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED

Gap:

- No unified freelancer approval state controlling access and visibility.

### freelancer_service

Required:

- draft -> pending_approval -> approved -> active
- pending_approval -> rejected
- active -> paused -> active

Current:

- Dummy service statuses: Draft, Pending Review, Approved, Rejected, Paused.
- Prisma enum exists: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PAUSED.

Gap:

- Stored as strings in JSON service payloads.
- Freelancer submit route can approve directly.
- No structured approval history.

### team_request

Required:

- sent -> pending -> accepted
- sent/pending -> rejected
- sent/pending -> cancelled
- pending -> expired
- active membership -> removed

Current:

- Prisma `TeamMembershipStatus`: INVITED, REQUESTED, ACTIVE, SUSPENDED, DECLINED.
- Legacy endpoints disabled.
- Static invite data only.

Gap:

- No live request lifecycle.

### published_task

Required:

- draft -> published -> applications_open -> applications_closed -> assigned -> in_progress -> completed
- any pre-completion -> cancelled

Current:

- Static `agencyProjectPosts` only.

Gap:

- No live task model/API/lifecycle.

### task_application

Required:

- applied -> shortlisted -> accepted
- applied/shortlisted -> rejected
- applied/shortlisted -> withdrawn

Current:

- Static `editorApplications`; local UI state for Apply.

Gap:

- No live application model/API/lifecycle.

### assignment/project

Required:

- draft -> assigned -> accepted -> in_progress -> submitted -> under_review -> approved -> delivered -> completed -> payment_requested -> payment_approved -> paid
- revision_requested can loop to in_progress/submitted
- cancelled/disputed terminal or branch states

Current:

- Conversation status: New, Manager Review, Assigned, Active, Closed.
- Legacy `Assignment.status` uses `LeadStatus`.

Gap:

- No normalized project lifecycle.

### delivery_submission

Required:

- draft -> submitted -> under_review -> approved
- under_review -> revision_requested/rejected

Current:

- Delivery asset statuses include PENDING_AGENCY_APPROVAL, AGENCY_APPROVED, AGENCY_REJECTED, PUBLISHING, PUBLISHED, PUBLISH_FAILED.

Gap:

- No explicit revision request object or link to assignment completion.

### revision_request

Required:

- requested -> acknowledged -> resubmitted -> approved/closed

Current:

- Not found as a normalized model.

Gap:

- Missing.

### payment_request

Required:

- requested -> agency_review -> approved -> paid
- requested/agency_review -> rejected
- any active -> disputed/cancelled

Current:

- Chat payment: Draft, Sent, Viewed, Paid, Failed, Cancelled.
- Freelancer payout request: REQUESTED, UNDER_REVIEW, APPROVED, PAID, REJECTED.
- Prisma payout request: REQUESTED, APPROVED, PAID, REJECTED.

Gap:

- Multiple incompatible payment request lifecycles.
- Missing `disputed`.
- Missing assignment link.

### package_subscription

Required:

- pending -> active/trialing -> past_due -> paused/cancelled/expired/revoked
- active -> renewal_pending -> active

Current:

- Prisma has PENDING, ACTIVE, TRIALING, PAST_DUE, PAUSED, CANCELLED, REVOKED, EXPIRED.
- Payment statuses and history exist.

Gap:

- Good foundation; operational access rules and package limits still need enforcement.

### manager_account

Required:

- invited -> active -> suspended/removed

Current:

- Dummy manager account has `active: boolean`.
- `AppAuthUser` supports MANAGER role, but manager creation endpoint does not create app login identity.

Gap:

- No full lifecycle or invitation/auth flow.

### chat_conversation

Required:

- new -> assigned -> active -> waiting_customer/waiting_internal -> completed/closed
- escalated and blocked states as branches

Current:

- New, Manager Review, Assigned, Active, Closed.
- Lead status list can provide more operational stages.

Gap:

- Chat state is not aligned with project/payment/delivery state.

## Notification Audit

Implemented/partial:

- OTP via WhatsApp/password auth.
- Assignment push notification is attempted.
- WhatsApp outbound/inbound delivery plumbing exists.
- Manual UPI WhatsApp message is attempted.

Missing or incomplete:

- Freelancer registration notification to Super Admin.
- Freelancer approval/rejection notification.
- Service approval/rejection notification.
- Team request sent/accepted/rejected notifications.
- Task published/application received notifications.
- Application accepted/rejected notifications.
- Assignment created/accepted/declined notifications.
- Deadline approaching notifications.
- Work submitted/revision requested/project approved notifications.
- Payment requested/approved/rejected/paid notifications.
- Package limit reached notification.
- Subscription expiring/payment failed notification.
- Dispute created notification.

Required notification channels:

- in-app notification table
- email if connected
- WhatsApp where tenant/provider is configured
- dashboard alert stack

Current risk:

- Prisma `Notification` model exists in legacy layer, but current app workflows do not consistently write notification rows.

## Accounting and Billing Audit

### Agency Accounting

Implemented:

- Accounting request API can aggregate conversation payment requests by agency/editor audience.
- Admin payout requests section reads conversation payment requests and wallet credits from dummy platform snapshot.
- Package subscription billing exists separately through `UserSubscription` and `PaymentTransaction`.

Missing:

- Incoming client revenue ledger.
- Outgoing freelancer payable ledger.
- Project-wise profit.
- Pending freelancer payable by assignment.
- Approved payouts.
- Paid payouts.
- Rejected/disputed payout requests.
- Due dates.
- Agency liability report.
- Link between chat payment request, project completion, wallet credit, and payout request.

### Super Admin Billing

Implemented:

- Package MRR, active subscriptions, payment transactions, manual UPI approval, failed/pending payment visibility.

Missing:

- Platform commission ledger for marketplace work.
- Payout dispute oversight.
- Agency liabilities and unpaid high-usage agencies.
- Setup fee tagging precision.
- Unbilled seat usage ledger.

Unclear business model:

- The app currently supports both possibilities:
  - Platform tracks/handles package subscriptions and some payment links.
  - Agency may be responsible for freelancer payouts.

Decision needed before live:

- Choose whether Gigxomi directly handles freelancer payouts or only tracks agency liabilities.
- If platform handles payouts, build wallet and settlement ledger.
- If agency handles payouts, build agency payable approval and proof ledger.

## Dashboard Metric Gaps

### Freelancer Dashboard

Implemented/partial:

- Profile/workspace state.
- Services and service view events.
- Legacy fallback assignments/team metrics.
- Static karma/leader/payout data in components.

Missing:

- Real applications pending.
- Real team requests pending.
- Real active assignments.
- Real submitted work.
- Real revision requests.
- Real completed projects.
- Real pending payment requests tied to assignments.
- Approved/paid earnings ledger.
- Average delivery time.
- Rating/performance.
- Application success rate.

### Agency Dashboard

Implemented/partial:

- Live conversations.
- Tenant users.
- Package status/subscriptions.
- WhatsApp/Instagram connection cards.
- Static/dummy editor/team/project/payout intelligence.

Missing:

- Active projects from normalized assignments.
- Pending applications.
- Team freelancers from persisted membership.
- Manager plan usage.
- Pending freelancer payable from ledger.
- Pending delivery review linked to assignments.
- Overdue tasks.
- Chat SLA history.
- Trust score from real events.
- Bot replies/time saved.

### Manager Dashboard

Implemented/partial:

- Open conversations.
- Assignment-ready editor list.
- Pending payment request proxy.
- Delivery risk proxy.
- Escalation proxy.

Missing:

- Assigned-only task model.
- Real overdue task tracking.
- Real response time metrics.
- Completed task counts.
- Escalation rate.
- Permission-scoped dashboard data.

### Super Admin Dashboard

Implemented/partial:

- MRR/subscription revenue when active subscriptions exist.
- Next-month revenue projection from MRR.
- Active agencies/new agencies from auth/users.
- Renewal risk from package expiry.
- Pending/failed payments from `PaymentTransaction`.
- Active editors from auth/fallback.
- Package/agency/editor supply sections.
- Placeholders for marketplace demand, search quality, automation, marketing.

Missing:

- Search demand graph.
- No-result searches.
- Demand-supply gap engine.
- Editor skill performance from real assignments.
- Churn risk scoring beyond expiry.
- Marketing/SEO connector ingestion.
- Automation time saved/value.
- Payout disputes and unbilled seat usage.

## API Gaps

Critical APIs to add before live:

- `POST /api/team-requests`: agency sends freelancer team request.
- `GET /api/freelancer/team-requests`: freelancer sees requests.
- `POST /api/team-requests/[id]/accept`: freelancer accepts.
- `POST /api/team-requests/[id]/reject`: freelancer rejects.
- `POST /api/team-members/[id]/remove`: agency removes freelancer with active-work checks.
- `POST /api/tasks`: agency publishes task.
- `GET /api/tasks`: freelancers list matched public/team tasks.
- `POST /api/tasks/[id]/applications`: freelancer applies.
- `GET /api/tasks/[id]/applications`: agency sees applicants.
- `POST /api/task-applications/[id]/shortlist`: agency shortlists.
- `POST /api/task-applications/[id]/accept`: agency accepts and creates assignment.
- `POST /api/assignments`: agency creates assignment for team freelancer.
- `POST /api/assignments/[id]/accept`: freelancer accepts.
- `POST /api/assignments/[id]/decline`: freelancer declines.
- `POST /api/assignments/[id]/submit`: freelancer submits work or delivery.
- `POST /api/assignments/[id]/review`: manager/agency approves or requests revision.
- `POST /api/assignments/[id]/complete`: marks project complete.
- `POST /api/assignments/[id]/payment-requests`: freelancer requests payment after completion.
- `POST /api/payment-requests/[id]/approve`: agency approves.
- `POST /api/payment-requests/[id]/reject`: agency rejects with reason.
- `POST /api/payment-requests/[id]/mark-paid`: agency marks paid with proof.
- `GET /api/accounting/payables`: agency payable ledger.
- `GET /api/super-admin/payment-requests`: platform oversight.
- `GET /api/audit-logs`: action/financial audit trail.
- `POST /api/events`: unified intelligence event intake.

APIs currently disabled and needing replacement:

- `/api/tenants`
- `/api/tenants/[tenantId]/team-requests`
- `/api/team-requests/[requestId]/respond`
- `/api/tenants/[tenantId]/team-seats`
- `/api/manager/assignments`
- `/api/payments/security`
- `/api/quotes/propose`
- `/api/quotes/approve`
- `/api/showcase/permission`
- `/api/delivery/link`

## Required Database Fields and Models

Recommended new or modernized models:

- `FreelancerProfile`: app-auth-linked normalized profile fields, approval status, skills, categories, portfolio links, availability, pricing preferences, timezone, profile completion score.
- `FreelancerService`: normalized service title/category/tags/pricing/turnaround/revision/media/approval status/search metadata.
- `TeamRequest`: agencyId, freelancerId, requestedById, message, role/type, terms, visibility, status, expiresAt.
- `TeamMembership`: app-auth-linked, status, activeSeatCounted, permissions, removedAt, removalReason.
- `PublishedTask`: agencyId, title, category, brief, budget, deadline, required skills, visibility, application deadline, status.
- `TaskApplication`: taskId, freelancerId, proposal, quoted amount, turnaround, portfolio/service link, status.
- `ProjectAssignment`: agencyId, managerId, freelancerId, conversationId, taskId/applicationId, title, brief, deadline, budget, payment terms, priority, status.
- `DeliverySubmission`: assignmentId, version, files/links, notes, submittedAt, status.
- `RevisionRequest`: assignmentId, deliverySubmissionId, reason, dueDate, status.
- `PaymentRequest`: assignmentId, freelancerId, agencyId, requestedAmount, approvedAmount, status, reason, proof, paidAt.
- `AgencyAccountingLedger`: agencyId, assignmentId, paymentRequestId, type, amount, status, dueDate.
- `WalletLedger`: freelancerId, assignmentId, paymentRequestId, gross, commission, net, status.
- `AuditLog`: actor, role, action, entityType, entityId, before, after, metadata.
- `EventLog`: eventName, timestamp, actorType, actorId, agencyId, editorId, amount, keyword/query, category/service, source/channel, metadata.
- `Notification`: app-auth-linked modern notification rows.

Fields needing normalization:

- Status should use enums, not arbitrary strings in JSON payloads.
- Monetary values should use Decimal and currency.
- File/proof uploads should be durable assets, not only metadata.
- Actor identity should be stored for every approval/rejection/payment state.

## UI / Page Gaps

Pages/components that exist but need logic completion:

- Freelancer Apply for Work: currently static/local state; needs persisted task/application flow.
- Admin Assignments: currently static operating cards; needs real assignment table/detail drawer.
- Admin Freelancers: currently static operating pool; needs real team membership/request table.
- Admin Payout Requests: reads chat payment requests; needs unified payout/payment request ledger.
- Freelancer Payouts: creates unlinked payout request; needs assignment/earnings linkage.
- Manager Contacts: UI-level permission; needs API-level permission enforcement.
- Delivery Review: upload/review exists; needs assignment/revision/payment linkage.
- Super Admin Approvals: needs unified approval queue across profiles, services, tasks, payments, disputes.

Required UI patterns:

- Table pages for team requests, tasks, applications, assignments, payment requests, ledger, approvals.
- Detail drawers for freelancer, agency, task, application, assignment, payment request.
- Forms for task publishing, assignment creation, package limit settings, manager permission creation.
- Alert stacks for critical payments, overdue assignments, subscription risk, failed webhooks.
- Empty states that state the missing data source and next action.

## Permission and Security Risks

Critical:

- Manager permissions are not consistently enforced server-side.
- Manager can update freelancer masking setting through manager endpoint.
- Team request and task application protections do not exist because flows are missing.
- Payment request status permissions are too loose for freelancer-payee "Paid" confirmation.
- Payout request creation accepts amount without available-balance validation.
- Financial workflows lack immutable audit logs.

High:

- Data stores are split across Prisma JSON rows, file stores, legacy Prisma models, and static data.
- Static/dummy business intelligence can be mistaken for production truth if not clearly labeled.
- Package limit fields exist but do not block over-limit operations.
- Super Admin overview relies on placeholders for several moat metrics.

Medium:

- Freelancer access checks sometimes match by name aliases as fallback.
- Upload size checks exist for chat/delivery, but package storage limits are not enforced.
- Contact updates by managers need assigned-contact restrictions.

## Go-Live Blocker List

Critical before live:

- Auth/role routing confirmed in production environment.
- Freelancer registration and package activation confirmed.
- Unified freelancer profile approval lifecycle.
- Freelancer service creation with real approval gating.
- Agency team request send/accept/reject/remove flow.
- Team membership enforcement before team assignment.
- Agency task publishing flow.
- Freelancer task application flow.
- Agency acceptance converting application into assignment.
- Normalized assignment/project lifecycle.
- Delivery submission and revision flow tied to assignment.
- Project completion state.
- Freelancer payment request after completion.
- Agency approve/reject/mark-paid payment request.
- Accounting shows pending payable, approved payable, paid, rejected, disputed.
- Package limits enforced for managers, freelancers/team, services, projects, portfolio, storage.
- Manager permissions enforced server-side.
- Customer phone masking enforced consistently.
- Financial/action audit logs.
- Dashboards use role-scoped real data or clear empty states.

High priority before broader rollout:

- Notifications for all assignment/payment/team/service states.
- Search/demand event tracking.
- No-result search tracking.
- Payout reports.
- Trust/performance metrics.
- Super Admin payment request/dispute oversight.
- GA/GSC/marketing attribution connectors or clear placeholders.

Medium priority:

- Advanced recommendations.
- SEO integration automation.
- Automation intelligence and bot value model.
- Export tools.
- Advanced package upgrade prompts.

## Recommended Implementation Order

Phase 1: Normalize the core operating ledger.

- Decide source of truth for current app users and marketplace records.
- Create modern normalized models for team requests, memberships, tasks, applications, assignments, deliveries, revisions, payment requests, accounting ledger, audit logs, notifications, and events.
- Migrate or bridge JSON conversation/service rows carefully.

Phase 2: Close agency-freelancer team circuit.

- Agency sends request.
- Freelancer accepts/rejects.
- Membership becomes active.
- Removal handles active work and pending payments.
- Enforce package team limits.

Phase 3: Close task marketplace circuit.

- Agency publishes task.
- Freelancer applies.
- Agency shortlists/accepts/rejects.
- Accepted application creates assignment.

Phase 4: Close assignment/delivery/revision circuit.

- Assignment creation, acceptance, in-progress, submission, review, revision, approval, completion.
- Delivery assets attach to assignment.
- Revision requests become first-class records.

Phase 5: Close payment/accounting circuit.

- Payment request after completion.
- Agency approve/reject/mark-paid.
- Freelancer earnings and payout status.
- Accounting ledger.
- Super Admin oversight.
- Financial audit logs.

Phase 6: Enforce package limits and permissions.

- Manager seats.
- Freelancer/team seats.
- Services.
- Active projects.
- Portfolio/storage/upload.
- WhatsApp/integration access.
- Manager permission middleware/API checks.

Phase 7: Add notifications and intelligence events.

- In-app notifications.
- WhatsApp/email hooks where configured.
- Event tracking for search, assignment, payment, automation, churn risk.
- Dashboard metrics backed by event/ledger data.

Phase 8: Go-live verification.

- End-to-end tests for every role.
- Permission/security tests.
- Payment/accounting reconciliation tests.
- Mobile/responsive smoke tests.
- Production config and webhook verification.

## Final Audit Summary

Implemented enough for staging:

- Role-based shells and many pages exist.
- Auth/signup/package subscription is real enough to test.
- Super Admin package/user/payment controls exist.
- Freelancer profile/payment/verification/service endpoints exist.
- Chat, assignment-to-conversation, delivery upload/review, and payment cards exist.
- Admin/Manager/Freelancer dashboards have partial live data.

Not complete enough for full marketplace live:

- Team request flow is disabled.
- Task marketplace is not persisted.
- Assignment/project lifecycle is not normalized.
- Freelancer payment requests are not linked to completion/accounting.
- Package limits are not enforced.
- Manager permissions are not fully server-enforced.
- Notifications and audit logs are incomplete.
- Search/demand intelligence event moat is not implemented.

Business conclusion:

Gigxomi is architecturally pointed in the right direction, but before going live as a serious marketplace + SaaS operating system, the core business circuits must be made transactional, auditable, permission-safe, and ledger-backed. The next build pass should not be more UI polish. It should close the operating loops: team request -> task/application -> assignment -> delivery/revision -> completion -> payment request -> accounting -> dashboard intelligence.
