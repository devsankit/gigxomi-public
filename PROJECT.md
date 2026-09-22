# Project: Gigxomi Chat & Permissions Architecture (Phase 1 & Phase 2)

## Architecture
Gigxomi's multi-tenant collaboration platform provides multi-inbox chat (Customer Lane vs Internal Lane) across Desktop Web and Mobile Companion apps. Phase 1 & 2 harden private chat security, decouple editor customer-lane viewing from sending, guarantee non-destructive editor removal with complete audit preservation, and centralize permission capability resolution into a single canonical resolver.

```
                  ┌──────────────────────────────────────────────┐
                  │  src/lib/api/conversation-access.ts          │
                  │  resolveConversationPermissions()            │
                  └──────────────────────┬───────────────────────┘
                                         │ returns ConversationPermissions
                     ┌───────────────────┴────────────────────┐
                     ▼                                        ▼
    ┌───────────────────────────────────┐  ┌───────────────────────────────────┐
    │ Backend Projection & Storage      │  │ API Endpoints & Notification Hub  │
    │ dummy-platform-store.ts           │  │ messages/route.ts                 │
    │ - getVisibleMessages (stripping)  │  │ mobile-chat-push-recipients.ts    │
    │ - projectConversation (summary/   │  │ mobile-chat-push.ts               │
    │   unread/lane capabilities)       │  │ conversation-realtime.ts          │
    │ - unassignConversationEditors     │  │ (FCM & Realtime private suppression│
    └────────────────┬──────────────────┘  └──────────────────┬────────────────┘
                     │                                        │
                     ├───────────────────┬────────────────────┤
                     ▼                                        ▼
    ┌───────────────────────────────────┐  ┌───────────────────────────────────┐
    │ Desktop Web Workspace             │  │ Mobile Companion App              │
    │ src/components/chat/              │  │ D:/Gigxomi/gigxomi-mobile/        │
    │   chat-workspace.tsx              │  │ app/chat/[id].tsx                 │
    │ - "Read-only: Client messaging    │  │ - "Read-only: Client messaging    │
    │   disabled by agency" banner      │  │   disabled by agency" banner      │
    │ - Composer disabled when          │  │ - Disabled composer, lock icon    │
    │   canSendCustomerMessage is false │  │ - Zero touches to obsolete trees  │
    └───────────────────────────────────┘  └───────────────────────────────────┘
```

## Feature Inventory
Every feature identified during the Survey phase is mapped to an implementation milestone below.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Centralized Capability Resolver (R4) | Canonical `resolveConversationPermissions` returning 7 boolean capability flags | M1 | ORIGINAL_REQUEST R4; docx §13 |
| 2 | Backend Private Message Stripping (R1) | Server-side projection eliminates all `visibility="client_private"` messages for non-admin/manager roles | M1 | ORIGINAL_REQUEST R1; docx §5 |
| 3 | Summary & Preview Isolation (R1) | `conversation.summary` and latest-message previews computed strictly from audience-visible messages | M1 | ORIGINAL_REQUEST R1; docx §5.1 |
| 4 | Unread Badge Counter Isolation (R1) | Lane unread counters mathematically exclude private messages for freelancers | M1 | ORIGINAL_REQUEST R1; docx §5.2 |
| 5 | Editor Customer-Lane Read vs. Send Decoupling (R2) | Decouple `canViewCustomerLane` (true for assigned editors) from `canSendCustomerMessage` (governed by toggle and transport) | M1 | ORIGINAL_REQUEST R2; docx §6 |
| 6 | Non-Destructive Editor Removal (R3) | Revoke conversation access immediately on unassignment while retaining 100% of messages, media, notes, and payments | M1 | ORIGINAL_REQUEST R3; docx §8 |
| 7 | Assignment Audit History Schema (R3) | Structured audit entries on conversation record tracking assigned date, removed date, role, and actor | M1 | ORIGINAL_REQUEST R3; docx §8 |
| 8 | Customer Lane Send Blocking & HTTP 403 (R2) | `POST /api/conversations/[id]/messages` enforces HTTP 403 when `canSendCustomerMessage` is false | M2 | ORIGINAL_REQUEST R2; docx §6 |
| 9 | Realtime Event Private Suppression (R1) | `publishConversationRealtimeEvent` omits freelancer user IDs when `visibility === "client_private"` | M2 | ORIGINAL_REQUEST R1; docx §5 |
| 10 | Push Notification Private Suppression (R1, R3) | FCM push dispatch suppresses notifications to freelancers for private messages and unassigned editors | M2 | ORIGINAL_REQUEST R1, R3; docx §5 |
| 11 | Desktop Web Read-Only Banner & Composer (R5) | Customer lane displays `"Read-only: Client messaging disabled by agency"` banner and disables composer | M3 | ORIGINAL_REQUEST R5; docx §6 |
| 12 | Mobile Companion Read-Only Integration (R5) | Mobile chat screen displays matching read-only banner, locked customer tab, and disabled composer | M4 | ORIGINAL_REQUEST R5; docx §6 |
| 13 | Mobile Capability Model & Hook Alignment (R4, R5) | `MobileConversation` includes `ConversationCapabilities`; `useChats.ts` respects decoupled customer view | M4 | ORIGINAL_REQUEST R4, R5 |
| 14 | Automated E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite validating security, permissions, audit preservation, and edge cases | E2E-Track | ORIGINAL_REQUEST criteria |
| 15 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing, outbox edge cases, concurrent access, and audit integrity | M5 | Project Pattern Phase 2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test harness, opaque-box test cases (Tiers 1-4), publish TEST_READY.md | none | COMPLETED |
| M1 | Core Permissions & Backend Projection | Capability resolver, private message stripping, read/send decoupling, audit schema in `conversation-access.ts` and `dummy-platform-store.ts` | none | COMPLETED |
| M2 | Realtime, Push Recipient & Message API Hardening | HTTP 403 enforcement, push recipient filtering, and realtime event recipient isolation | M1 | COMPLETED |
| M3 | Desktop Web UI Read-Only Integration | Customer lane read-only banner and composer disablement in `chat-workspace.tsx` | M1 | COMPLETED |
| M4 | Mobile Companion UI Read-Only Integration | Mobile read-only banner, composer lock, and capability type integration in `D:/Gigxomi/gigxomi-mobile` | M1 | COMPLETED |
| M5 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Run 100% of E2E suite (Phase 1); adversarial testing with Challenger loop (Phase 2); full typecheck | M1, M2, M3, M4, E2E | COMPLETED |

## Interface Contracts

### 1. Centralized Capability Resolver (`src/lib/api/conversation-access.ts`)
```ts
export type ConversationPermissions = {
  canViewConversation: boolean;
  canViewCustomerLane: boolean;
  canViewInternalLane: boolean;
  canViewPrivateMessages: boolean;
  canSendCustomerMessage: boolean;
  canSendInternalMessage: boolean;
  canManageParticipants: boolean;
};

export type ResolvePermissionsInput = {
  user: {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "FREELANCER" | "CUSTOMER" | "SALES_AGENT";
    email?: string | null;
    tenantId?: string | null;
  };
  membership?: {
    role?: string;
    status?: string;
    permissions?: string[];
    scope?: {
      clientIds?: string[];
      projectIds?: string[];
      editorIds?: string[];
    };
  } | null;
  conversation: {
    id: string;
    tenantId: string;
    assignedFreelancerId?: string | null;
    assignedFreelancerName?: string | null;
    freelancerCollaborators?: Array<{ freelancerId: string; freelancerName?: string }>;
    assignmentOffers?: Array<{ freelancerId: string; status: string }>;
    freelancerCustomerLaneAccess?: boolean;
    isInAppCustomerThread?: boolean;
  };
  transportState?: "ready" | "demo" | "blocked";
};

export function resolveConversationPermissions(input: ResolvePermissionsInput): ConversationPermissions;
```

### 2. Conversation Response Contract (`DummyConversationView` & `MobileConversation`)
```ts
export type DummyConversationView = {
  // ... existing fields ...
  capabilities: ConversationPermissions;
  laneCapabilities: Record<DummyConversationLane, {
    visible: boolean;
    writable: boolean;
    reason?: string;
  }>;
  assignmentHistory?: DummyConversationAssignmentHistoryEntry[];
};
```

### 3. Read-Only Banner Contract (Web & Mobile)
- When `activeLane === "customer"` and `canSendCustomerMessage === false`:
  - Banner Text: `"Read-only: Client messaging disabled by agency"`
  - Composer Textarea / TextInput: `disabled={true}` / `editable={false}`
  - Attachment / Voice / Send buttons: `disabled={true}`

## Code Layout
- Web & API: `D:/Gigxomi/gigxomi-web`
  - Access resolution: `src/lib/api/conversation-access.ts`
  - In-memory & projection store: `src/lib/gigxomi/dummy-platform-store.ts`
  - Push notification filtering: `src/lib/mobile-chat-push-recipients.ts` and `src/lib/mobile-chat-push.ts`
  - Message API routes: `src/app/api/conversations/[id]/messages/route.ts`
  - Realtime events: `src/lib/api/conversation-realtime.ts`
  - Desktop Web UI: `src/components/chat/chat-workspace.tsx`
  - Unit/Integration Tests: `tests/`
- Mobile Companion: `D:/Gigxomi/gigxomi-mobile`
  - Chat screen: `app/chat/[id].tsx`
  - State hooks: `src/hooks/useChats.ts`
  - Types: `src/types/index.ts`
- FORBIDDEN DIRECTORIES (NEVER TOUCH):
  - `D:/Gigxomi/gigxomi-web/mobile-app`
  - `D:/Gigxomi/gigxomi-web/apps/mobile`
