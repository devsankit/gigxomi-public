# GIGXOMI Onboarding System

## Overview
Implemented a reusable role-based onboarding system that adds:
- Checklist-driven onboarding with progress, skip, collapse, and restart
- Guided tour popovers with highlighted targets
- Empty-state action guidance
- Persistent progress tracking via backend API with localStorage fallback

Design alignment:
- Uses existing Gigxomi tokens and black/lime glossy palette
- No app-wide redesign
- No route/auth changes
- Chat workspace left untouched (checklist hidden on chat routes)

## Architecture

### Frontend Components
- `OnboardingChecklist` (`src/components/onboarding/onboarding-checklist.tsx`)
- `GuidedTourPopover` (`src/components/onboarding/guided-tour-popover.tsx`)
- `OnboardingCoachMark` (`src/components/onboarding/onboarding-coach-mark.tsx`)
- `EmptyStateGuidance` (`src/components/onboarding/empty-state-guidance.tsx`)
- `OnboardingExperience` orchestrator (`src/components/onboarding/onboarding-experience.tsx`)

### Shared Config and Types
- Role + step model: `src/lib/gigxomi/onboarding-types.ts`
- Role checklist definitions: `src/lib/gigxomi/onboarding-config.ts`

### Persistence Layer
- File-backed progress store: `src/lib/gigxomi/onboarding-progress-store.ts`
- API endpoints:
  - `GET/PATCH /api/onboarding/progress`
  - `POST /api/onboarding/complete-step`
  - `POST /api/onboarding/dismiss`
  - `POST /api/onboarding/reset`

### Shell Integration
- Mounted in `InternalAppShell` and enabled by role:
  - Admin, Freelancer, Manager, Super Admin shells pass role props
- Help entry (`Help & Tour`) dispatches restart event

### Empty State Guidance
- Applied in freelancer services empty view:
  - `src/components/freelancer/freelancer-service-management.tsx`

## Role-Based Steps Added

### Freelancer
1. Complete profile (`/freelancer/profile`)
2. Create first service (`/freelancer/add-service`)
3. Submit/publish service (`/freelancer/services`)
4. Apply for work (`/freelancer/apply-for-work`)
5. Team request response (`/freelancer/apply-for-work`)
6. Payout setup (`/freelancer/payouts`)
7. Chat familiarity (`/freelancer/chat`)

### Agency Admin
1. Activate subscription (`/admin/packages`)
2. Agency branding (`/admin/system-settings`)
3. Add manager (`/admin/managers`)
4. Invite freelancer (`/admin/freelancers`)
5. Publish assignment (`/admin/assignments`)
6. Delivery review (`/admin/delivery-review`)
7. WhatsApp setup (`/admin/integrations/whatsapp`)
8. Payments review (`/admin/payout-requests`)

### Manager
1. Chats (`/manager/chat`)
2. Project tracking (`/manager/project-tracking`)
3. Review queue (`/manager/service-review`)
4. Escalations (`/manager/escalations`)
5. Contacts (`/manager/contacts`)

### Super Admin
1. Intelligence center (`/super-admin`)
2. Packages (`/super-admin/packages`)
3. Agencies (`/super-admin/agencies`)
4. Freelancers (`/super-admin/freelancers`)
5. WhatsApp control (`/super-admin/whatsapp-control`)
6. Billing control (`/super-admin/billing-control`)
7. Flow builder (`/super-admin/whatsapp-flows`)

## Completion Logic (Current)

Implemented now:
- Manual complete supported for steps where backend signal is not deterministic yet
- Progress saved via API and fallback storage
- Completion state affects checklist progress and done state

Real-action detection currently wired:
- Through explicit completion actions and server progress API

Real-action auto-detection still needed for strict completion rules:
- Profile required-fields validation rule
- Service status transitions (`pending_approval/approved/published`)
- Task application submitted existence
- Team request pending/response counts
- Payout details validity check
- Active subscription status confirmation from billing source of truth
- WhatsApp connected status from integration health source

## Backend/API Status

Implemented:
- Onboarding progress API namespace with persistent server-side file storage

Not yet implemented:
- Prisma/DB table `user_onboarding_progress`
- Admin ability to reset onboarding for any user

## Persistence Status
- Primary: backend file store (`.gigxomi/onboarding-progress-store.json`)
- Fallback: localStorage (`gx_onboarding_progress_fallback_<ROLE>`) if API unavailable

## Routes Touched
- No route behavior changed
- Onboarding overlay/checklist mounts inside shell UI only
- Chat routes intentionally excluded from checklist rendering

## Phasing Map

### Phase 1 completed
- Architecture, role steps, reusable components, dashboard shell integration

### Phase 2 partial
- Guided tour popover + coachmark delivered
- Additional per-page `data-onboarding-target` markers can be expanded

### Phase 3 partial
- Persistent backend progress API delivered (file store)
- Full DB model + strict event-based completion detection pending

### Phase 4 partial
- Empty-state guidance component delivered and used in freelancer services
- Restart entry added in shell topbar

## Remaining Gaps
1. Migrate onboarding progress from file-store to Prisma table.
2. Add strict backend completion evaluators per step.
3. Expand tour target anchors on key action buttons (not only nav links).
4. Add manager-permission-aware step hiding tied directly to live permission map.
5. Add super-admin user-level onboarding reset API.

## Manual Test Checklist
1. Login first time as each role and confirm checklist appears.
2. Collapse checklist and reopen with Resume.
3. Click step CTA and manually complete steps where allowed.
4. Refresh page and verify progress persists.
5. Skip onboarding and confirm checklist does not reappear immediately.
6. Use `Help & Tour` and confirm tour restarts.
7. Verify checklist is hidden on chat routes.
8. Verify freelancer services empty-state shows "Create your first service" guidance.
9. Break `/api/onboarding/*` temporarily and verify localStorage fallback still preserves progress.
