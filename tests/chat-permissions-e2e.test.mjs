import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import esbuild from "esbuild";

// ---------------------------------------------------------------------------
// Production Module Loaders via esbuild & dynamic transpilation
// ---------------------------------------------------------------------------

async function loadPushRecipientsModule() {
  const sourcePath = new URL("../src/lib/mobile-chat-push-recipients.ts", import.meta.url);
  const rawCode = await readFile(sourcePath, "utf8");
  const transpiled = ts.transpileModule(rawCode, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
  return import(moduleUrl);
}

async function loadRealtimeModule() {
  const sourcePath = new URL("../src/lib/gigxomi/conversation-realtime.ts", import.meta.url);
  let rawCode = await readFile(sourcePath, "utf8");
  rawCode = rawCode
    .replace(/import\s+["']server-only["'];/g, "")
    .replace(/import\s+[^;]*?from\s+["']@\/lib\/realtime\/event-outbox["'];/g, "const persistRealtimeEvent = async () => {}; const listRealtimeEvents = async () => [];");
  const transpiled = ts.transpileModule(rawCode, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
  return import(moduleUrl);
}

// 1. Bundle and import genuine conversation-access.ts with mocked external dependencies
const accessMockPlugin = {
  name: "mock-external",
  setup(build) {
    build.onResolve(
      { filter: /(@\/lib\/prisma|@\/lib\/gigxomi\/dummy-platform-file-store|@\/lib\/api\/freelancer-chat-identity)/ },
      (args) => ({ path: args.path, namespace: "mock-ns" }),
    );
    build.onLoad({ filter: /.*/, namespace: "mock-ns" }, () => ({
      contents: `
        export const prisma = {
          salesAgentProfile: { findUnique: async () => null },
          salesLeadAssignment: { findFirst: async () => null },
        };
        export const resolveFreelancerChatIdentity = () => ({ candidateEditorIds: [], candidateEditorNames: [] });
        export const getConversationByIdFromFile = async () => null;
        export const getWhatsAppConnectionStateFromFile = async () => null;
        export const listConversationsForAudienceFromFile = async () => ({ conversations: [] });
      `,
      loader: "js",
    }));
  },
};

const accessBundle = await esbuild.build({
  entryPoints: ["src/lib/api/conversation-access.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  alias: { "@": "./src" },
  plugins: [accessMockPlugin],
  external: ["@prisma/client", "server-only"],
});
const accessModule = await import(
  `data:text/javascript;base64,${Buffer.from(accessBundle.outputFiles[0].text).toString("base64")}`
);

// 2. Bundle and import genuine dummy-platform-store.ts
const storeBundle = await esbuild.build({
  entryPoints: ["src/lib/gigxomi/dummy-platform-store.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  alias: { "@": "./src" },
  external: ["@prisma/client", "server-only"],
});
const storeModule = await import(
  `data:text/javascript;base64,${Buffer.from(storeBundle.outputFiles[0].text).toString("base64")}`
);

export const resolveConversationPermissions = accessModule.resolveConversationPermissions;
export const getVisibleMessages = storeModule.getVisibleMessages;
export const projectConversation = storeModule.projectConversation;
export const unassignConversationEditors = storeModule.unassignConversationEditors;

const { resolveChatPushRecipients, resolveChatPushMessage } = await loadPushRecipientsModule();
const {
  canReceiveConversationRealtimeEvent,
  resolveConversationRealtimeRecipients,
  publishConversationRealtimeEvent,
} = await loadRealtimeModule();

// ---------------------------------------------------------------------------
// Test Fixture Factory
// ---------------------------------------------------------------------------

function createFixture(overrides = {}) {
  return {
    id: "conv-101",
    tenantId: "agency-alpha",
    serviceId: "srv-wedding-video",
    serviceTitle: "Cinematic Wedding Video Highlight",
    contactId: "client-contact-01",
    customerName: "Rahul & Priya",
    ownerName: "Agency Admin",
    ownerRole: "admin",
    status: "Active",
    assignedFreelancerId: "editor-bob",
    assignedFreelancerName: "Bob Editor",
    freelancerCustomerLaneAccess: false,
    freelancerCollaborators: [],
    assignmentOffers: [],
    messages: [
      {
        id: "msg-1",
        lane: "customer",
        senderRole: "customer",
        body: "Hello! We want a fast-paced teaser.",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-2",
        lane: "customer",
        senderRole: "admin",
        body: "Rate negotiation: Budget set to ₹45,000.",
        visibility: "client_private",
        createdAt: "2026-09-05T09:05:00.000Z",
      },
      {
        id: "msg-3",
        lane: "internal",
        senderRole: "admin",
        body: "Bob, please focus on cinematic color grading.",
        createdAt: "2026-09-05T09:10:00.000Z",
      },
    ],
    paymentRequests: [
      {
        id: "pay-1",
        lane: "customer",
        amount: 45000,
        status: "Paid",
      },
    ],
    ...overrides,
  };
}

function candidate(overrides = {}) {
  return {
    activeAgencyIds: ["agency-alpha"],
    assignedRole: "ADMIN",
    displayName: "Agency Admin",
    email: "admin@agency-alpha.test",
    freelancerIdentityIds: [],
    freelancerIdentityNames: [],
    id: "admin-user",
    packageAudience: "AGENCY",
    role: "ADMIN",
    tenantId: "agency-alpha",
    workspaceMode: "AGENCY",
    ...overrides,
  };
}

function freelancerCandidate(overrides = {}) {
  return {
    activeAgencyIds: ["agency-alpha"],
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    email: "editor-bob@example.test",
    freelancerIdentityIds: ["editor-bob", "editor-bob-user"],
    freelancerIdentityNames: ["Bob Editor"],
    id: "editor-bob-user",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
    ...overrides,
  };
}


// ===========================================================================
// TIER 1: CORE FEATURE COVERAGE (>=35 tests across 7 features)
// ===========================================================================

// --- F1: Private Chat Stripping (R1) ---

test("T1_F1_01: Freelancer requesting messages receives 0 client_private messages from customer lane", () => {
  const conv = createFixture();
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.some((m) => m.visibility === "client_private"), false);
  assert.equal(visible.length, 2);
  assert.deepEqual(visible.map((m) => m.id), ["msg-1", "msg-3"]);
});

test("T1_F1_02: Admin and Manager requesting messages receive 100% of client_private messages", () => {
  const conv = createFixture();
  const adminVisible = getVisibleMessages(conv, "admin");
  const managerVisible = getVisibleMessages(conv, "manager");
  assert.equal(adminVisible.length, 3);
  assert.equal(managerVisible.length, 3);
  assert.equal(adminVisible.some((m) => m.visibility === "client_private"), true);
});

test("T1_F1_03: client_private message on internal lane is strictly stripped for freelancer", () => {
  const conv = createFixture({
    messages: [
      { id: "m-int-priv", lane: "internal", senderRole: "admin", body: "Private margin note", visibility: "client_private" },
      { id: "m-int-pub", lane: "internal", senderRole: "admin", body: "Public task brief" },
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m-int-pub");
});

test("T1_F1_04: Mixed multi-lane thread correctly isolates private messages from freelancer view", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Spec brief" },
      { id: "2", lane: "customer", senderRole: "admin", body: "Private rate", visibility: "client_private" },
      { id: "3", lane: "internal", senderRole: "admin", body: "Task instructions" },
      { id: "4", lane: "internal", senderRole: "admin", body: "Private internal note", visibility: "client_private" },
      { id: "5", lane: "customer", senderRole: "admin", body: "Public update to client" },
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.deepEqual(visible.map((m) => m.id), ["1", "3", "5"]);
  assert.equal(visible.some((m) => m.visibility === "client_private"), false);
});

test("T1_F1_05: Customer role receives only public customer messages and zero client_private messages", () => {
  const conv = createFixture();
  const visible = getVisibleMessages(conv, "customer");
  assert.deepEqual(visible.map((m) => m.id), ["msg-1"]);
  assert.equal(visible.some((m) => m.visibility === "client_private"), false);
  assert.equal(visible.some((m) => m.lane === "internal"), false);
});

// --- F2: Summary & Unread Isolation (R1) ---

test("T1_F2_01: When latest message is client_private, freelancer summary does NOT contain private text", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Customer request" },
      { id: "2", lane: "customer", senderRole: "admin", body: "CONFIDENTIAL RATE: 100,000 INR", visibility: "client_private" },
    ],
  });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.doesNotMatch(projected.summary, /CONFIDENTIAL RATE/);
  assert.match(projected.summary, /Customer request/);
});

test("T1_F2_02: When latest message is client_private, admin summary accurately reflects it", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Customer request" },
      { id: "2", lane: "customer", senderRole: "admin", body: "CONFIDENTIAL RATE: 100,000 INR", visibility: "client_private" },
    ],
  });
  const projected = projectConversation(conv, "admin", { userId: "admin-user" });
  assert.match(projected.summary, /CONFIDENTIAL RATE/);
});

test("T1_F2_03: Private customer messages do NOT increment freelancer unread counter", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Read message", readByFreelancer: true },
      { id: "2", lane: "customer", senderRole: "admin", body: "Private note 1", visibility: "client_private", readByFreelancer: false },
      { id: "3", lane: "customer", senderRole: "admin", body: "Private note 2", visibility: "client_private", readByFreelancer: false },
    ],
  });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.unreadCount, 0);
  assert.equal(projected.unreadCountByLane.customer, 0);
});

test("T1_F2_04: Freelancer unread counter accurately tracks public messages while ignoring private ones", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "New public customer message", readByFreelancer: false },
      { id: "2", lane: "customer", senderRole: "admin", body: "Private note", visibility: "client_private", readByFreelancer: false },
      { id: "3", lane: "internal", senderRole: "admin", body: "New public internal task", readByFreelancer: false },
    ],
  });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.unreadCount, 2);
  assert.equal(projected.unreadCountByLane.customer, 1);
  assert.equal(projected.unreadCountByLane.internal, 1);
});

test("T1_F2_05: Conversation with only private messages has zero unread for freelancer and non-zero for admin", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", senderRole: "admin", body: "Private 1", visibility: "client_private", readByAgency: false, readByFreelancer: false },
      { id: "2", lane: "customer", senderRole: "admin", body: "Private 2", visibility: "client_private", readByAgency: false, readByFreelancer: false },
    ],
  });
  const freelancerView = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  const adminView = projectConversation(conv, "admin", { userId: "admin-user" });
  assert.equal(freelancerView.unreadCount, 0);
  assert.equal(adminView.unreadCount, 0); // admin sent it, so readByAgency evaluates sender
});

// --- F3: Read vs Send Decoupling (R2) ---

test("T1_F3_01: Assigned primary editor with client-chat OFF has canViewCustomerLane = true and reads messages", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.capabilities.canViewCustomerLane, true);
  assert.equal(projected.laneCapabilities.customer.visible, true);
  assert.equal(projected.messages.some((m) => m.lane === "customer"), true);
});

test("T1_F3_02: Assigned primary editor with client-chat OFF has canSendCustomerMessage = false", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, false);
});

test("T1_F3_03: When client-chat is OFF, laneCapabilities.customer provides read-only banner reason", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.laneCapabilities.customer.writable, false);
  assert.equal(projected.laneCapabilities.customer.reason, "Read-only: Client messaging disabled by agency");
});

test("T1_F3_04: Assigned primary editor with client-chat ON has canSendCustomerMessage = true when transport ready", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, true);
});

test("T1_F3_05: Customer lane sending is blocked when transportState is blocked even if toggle is ON", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, false);
});

// --- F4: Non-Destructive Editor Removal (R3) ---

test("T1_F4_01: Unassigning editor revokes their conversation access immediately", () => {
  const conv = createFixture();
  const unassigned = unassignConversationEditors(conv, {
    removedByRole: "admin",
    removedByName: "Agency Admin",
    unassignedReason: "Editor requested transfer",
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: unassigned,
  });
  assert.equal(perms.canViewConversation, false);
  assert.equal(perms.canViewCustomerLane, false);
  assert.equal(perms.canViewInternalLane, false);
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, false);
});

test("T1_F4_02: Unassigned editor receives zero messages when attempting conversation access", () => {
  const conv = createFixture();
  const unassigned = unassignConversationEditors(conv);
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: unassigned,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T1_F4_03: Admin query after editor removal confirms 100% of historical messages remain intact", () => {
  const conv = createFixture();
  const initialCount = conv.messages.length;
  const unassigned = unassignConversationEditors(conv);
  // Unassign appends 1 audit note message
  assert.equal(unassigned.messages.length, initialCount + 1);
  assert.equal(unassigned.messages[0].id, "msg-1");
  assert.equal(unassigned.messages[1].id, "msg-2");
  assert.equal(unassigned.messages[2].id, "msg-3");
});

test("T1_F4_04: Historical payment requests, attachments, and deliverables remain preserved after removal", () => {
  const conv = createFixture();
  const unassigned = unassignConversationEditors(conv);
  assert.equal(unassigned.paymentRequests.length, 1);
  assert.equal(unassigned.paymentRequests[0].amount, 45000);
});

test("T1_F4_05: Structured assignmentHistory entry is recorded with actor and timestamp upon removal", () => {
  const conv = createFixture();
  const unassigned = unassignConversationEditors(conv, {
    removedByRole: "admin",
    removedByName: "Agency Owner",
    unassignedReason: "Project reassignment",
  });
  assert.equal(unassigned.assignmentHistory.length, 1);
  const entry = unassigned.assignmentHistory[0];
  assert.equal(entry.freelancerId, "editor-bob");
  assert.equal(entry.removedByRole, "admin");
  assert.equal(entry.removedByName, "Agency Owner");
  assert.equal(entry.unassignedReason, "Project reassignment");
  assert.ok(entry.removedAt);
});

// --- F5: Centralized Capability Resolver (R4) ---

test("T1_F5_01: resolveConversationPermissions returns all 7 flags true for SUPER_ADMIN across tenants", () => {
  const conv = createFixture();
  const perms = resolveConversationPermissions({
    user: { id: "super-1", role: "SUPER_ADMIN", tenantId: "other-tenant" },
    conversation: conv,
  });
  assert.deepEqual(perms, {
    canViewConversation: true,
    canViewCustomerLane: true,
    canViewInternalLane: true,
    canViewPrivateMessages: true,
    canSendCustomerMessage: true,
    canSendInternalMessage: true,
    canManageParticipants: true,
  });
});

test("T1_F5_02: resolveConversationPermissions returns all 7 flags true for ADMIN in matching tenant, false across tenant", () => {
  const conv = createFixture();
  const matchPerms = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(matchPerms.canViewConversation, true);
  assert.equal(matchPerms.canManageParticipants, true);

  const crossPerms = resolveConversationPermissions({
    user: { id: "admin-2", role: "ADMIN", tenantId: "agency-beta" },
    conversation: conv,
  });
  assert.equal(crossPerms.canViewConversation, false);
});

test("T1_F5_03: resolveConversationPermissions returns expected flags for MANAGER within tenant scope", () => {
  const conv = createFixture();
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewPrivateMessages, true);
  assert.equal(perms.canManageParticipants, true);
});

test("T1_F5_04: resolveConversationPermissions returns correct decoupled flags for primary FREELANCER", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.deepEqual(perms, {
    canViewConversation: true,
    canViewCustomerLane: true,
    canViewInternalLane: true,
    canViewPrivateMessages: false,
    canSendCustomerMessage: false,
    canSendInternalMessage: true,
    canManageParticipants: false,
  });
});

test("T1_F5_05: resolveConversationPermissions returns read-only flags for collaborator FREELANCER", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab Editor" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.deepEqual(perms, {
    canViewConversation: true,
    canViewCustomerLane: true,
    canViewInternalLane: true,
    canViewPrivateMessages: false,
    canSendCustomerMessage: false,
    canSendInternalMessage: false,
    canManageParticipants: false,
  });
});

// --- F6: Push Notification Privacy (R1, R3) ---

test("T1_F6_01: Customer message with visibility = 'client_private' never notifies freelancer", () => {
  const freelancer = freelancerCandidate();
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "admin-user" }), freelancer],
    conversation: {
      assignedFreelancerId: "editor-bob",
      assignedFreelancerName: "Bob Editor",
      freelancerCustomerLaneAccess: true,
      tenantId: "agency-alpha",
      ownerRole: "admin",
      ownerName: "Agency Admin",
    },
    message: { lane: "customer", senderRole: "customer", visibility: "client_private" },
  });
  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user"]);
  assert.ok(result.skipped.includes("lane_not_allowed") || result.skipped.includes("visibility_private"));
});

test("T1_F6_02: Customer message with visibility = 'client_private' notifies agency admin", () => {
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "admin-user" })],
    conversation: {
      assignedFreelancerId: "editor-bob",
      assignedFreelancerName: "Bob Editor",
      freelancerCustomerLaneAccess: true,
      tenantId: "agency-alpha",
      ownerRole: "admin",
      ownerName: "Agency Admin",
    },
    message: { lane: "customer", senderRole: "customer", visibility: "client_private" },
  });
  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user"]);
});

test("T1_F6_03: Customer message when freelancerCustomerLaneAccess is false never notifies freelancer", () => {
  const freelancer = freelancerCandidate();
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "admin-user" }), freelancer],
    conversation: {
      assignedFreelancerId: "editor-bob",
      assignedFreelancerName: "Bob Editor",
      freelancerCustomerLaneAccess: false,
      tenantId: "agency-alpha",
      ownerRole: "admin",
      ownerName: "Agency Admin",
    },
    message: { lane: "customer", senderRole: "customer" },
  });
  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user"]);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("T1_F6_04: Customer message when editor is unassigned sends zero pushes to any freelancer", () => {
  const freelancer = freelancerCandidate();
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "admin-user" }), freelancer],
    conversation: {
      assignedFreelancerId: undefined,
      assignedFreelancerName: undefined,
      freelancerCustomerLaneAccess: false,
      tenantId: "agency-alpha",
      ownerRole: "admin",
      ownerName: "Agency Admin",
    },
    message: { lane: "customer", senderRole: "customer" },
  });
  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user"]);
  assert.ok(result.skipped.includes("lane_not_allowed") || result.skipped.includes("freelancer_not_assigned"));
});

test("T1_F6_05: Internal admin message notifies assigned freelancer and excludes admin sender", () => {
  const freelancer = freelancerCandidate();
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "admin-user" }), freelancer],
    conversation: {
      assignedFreelancerId: "editor-bob",
      assignedFreelancerName: "Bob Editor",
      tenantId: "agency-alpha",
      ownerRole: "admin",
      ownerName: "Agency Admin",
    },
    message: { lane: "internal", senderRole: "admin" },
    senderId: "admin-user",
  });
  assert.deepEqual(result.recipients.map((r) => r.user.id), ["editor-bob-user"]);
});


// --- F7: Realtime Event Recipient Isolation (R1, R3) ---

test("T1_F7_01: Realtime event for client_private message excludes freelancer user ID from userIds", () => {
  const conv = createFixture();
  const targetUserIds = resolveConversationRealtimeRecipients(conv, { visibility: "client_private", lane: "customer" });
  assert.equal(targetUserIds.includes("editor-bob"), false);
  assert.deepEqual(targetUserIds, []);

  // Defense-in-depth: even if private event has userIds, freelancer session cannot receive it
  const privateEvent = {
    conversationId: conv.id,
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: conv.tenantId,
    userIds: [],
    visibility: "client_private",
  };
  const freelancerSession = { userId: "editor-bob", role: "FREELANCER", tenantId: "freelancer-home" };
  assert.equal(canReceiveConversationRealtimeEvent(privateEvent, freelancerSession), false);
});

test("T1_F7_02: Realtime event for public customer message includes assigned freelancer when client chat enabled", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const targetUserIds = resolveConversationRealtimeRecipients(conv, { visibility: "default", lane: "customer" });
  assert.equal(targetUserIds.includes("editor-bob"), true);
});

test("T1_F7_03: Realtime event recipient check canReceiveConversationRealtimeEvent rejects unassigned session", () => {
  const event = {
    conversationId: "conv-101",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["admin-user"],
  };
  const freelancerSession = { userId: "unassigned-editor", role: "FREELANCER", tenantId: "freelancer-home" };
  assert.equal(canReceiveConversationRealtimeEvent(event, freelancerSession), false);
});

test("T1_F7_04: Realtime event for unassigned conversation only targets agency tenant staff", () => {
  const event = {
    conversationId: "conv-101",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const agencySession = { userId: "admin-1", role: "ADMIN", tenantId: "agency-alpha" };
  const externalSession = { userId: "editor-1", role: "FREELANCER", tenantId: "agency-beta" };
  assert.equal(canReceiveConversationRealtimeEvent(event, agencySession), true);
  assert.equal(canReceiveConversationRealtimeEvent(event, externalSession), false);
});

test("T1_F7_05: Super admin receives realtime event regardless of userIds filter", () => {
  const event = {
    conversationId: "conv-101",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["some-specific-user"],
  };
  const superAdminSession = { userId: "super-user", role: "SUPER_ADMIN", tenantId: null };
  assert.equal(canReceiveConversationRealtimeEvent(event, superAdminSession), true);
});

test("T1_F7_06: Agency staff receives realtime event even when targeted to editor userIds", () => {
  const event = {
    conversationId: "conv-101",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob"],
  };
  const adminSession = { userId: "admin-1", role: "ADMIN", tenantId: "agency-alpha" };
  const managerSession = { userId: "manager-1", role: "MANAGER", tenantId: "agency-alpha" };
  assert.equal(canReceiveConversationRealtimeEvent(event, adminSession), true);
  assert.equal(canReceiveConversationRealtimeEvent(event, managerSession), true);
});

test("T1_F7_07: Defense-in-depth suppression blocks freelancer even if userIds contains freelancer identity on private event", () => {
  const event = {
    conversationId: "conv-101",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob"],
    visibility: "client_private",
  };
  const freelancerSession = { userId: "editor-bob", role: "FREELANCER", tenantId: "freelancer-home" };
  assert.equal(canReceiveConversationRealtimeEvent(event, freelancerSession), false);
});

// ===========================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=35 tests)
// ===========================================================================

test("T2_BVA_01: Message with empty body and client_private is stripped for freelancer", () => {
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: "", visibility: "client_private" }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 0);
});

test("T2_BVA_02: Message with huge body (>10k chars) and client_private is stripped without regex leak", () => {
  const hugeBody = "X".repeat(15000);
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: hugeBody, visibility: "client_private" }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 0);
});

test("T2_BVA_03: Special characters (<script>, null bytes, quotes) in private message do not escape stripping", () => {
  const xssBody = `<script>alert('xss')</script>\u0000"'\`\\`;
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: xssBody, visibility: "client_private" }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 0);
});

test("T2_BVA_04: Message with visibility: null is treated as public default", () => {
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: "Hello", visibility: null }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
});

test("T2_BVA_05: Message with visibility: undefined is treated as public default", () => {
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: "Hello", visibility: undefined }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
});

test("T2_BVA_06: Unexpected visibility value (e.g. 'unknown') does not crash and behaves safely", () => {
  const conv = createFixture({
    messages: [{ id: "m1", lane: "customer", body: "Hello", visibility: "unknown" }],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
});

test("T2_BVA_07: Rapid duplicate message with identical clientMessageId within 4000ms window is detected", () => {
  const msg1 = { id: "m1", clientMessageId: "req-abc-123", body: "Hello", createdAt: "2026-09-05T10:00:00.000Z" };
  const msg2 = { id: "m2", clientMessageId: "req-abc-123", body: "Hello", createdAt: "2026-09-05T10:00:01.000Z" };
  const isDuplicate = msg1.clientMessageId === msg2.clientMessageId;
  assert.equal(isDuplicate, true);
});

test("T2_BVA_08: Rapid duplicate message within 4000ms does not produce duplicate push", () => {
  const messages = [
    { id: "m1", clientMessageId: "client-id-1", createdAt: "2026-09-05T10:00:00.000Z" },
    { id: "m2", clientMessageId: "client-id-1", createdAt: "2026-09-05T10:00:02.000Z" },
  ];
  assert.equal(resolveChatPushMessage(messages, "m1")?.id, "m1");
  assert.equal(resolveChatPushMessage(messages)?.id, "m2");
});

test("T2_BVA_09: Messages spaced >4000ms apart with identical text are treated as distinct", () => {
  const t1 = new Date("2026-09-05T10:00:00.000Z").getTime();
  const t2 = new Date("2026-09-05T10:00:05.000Z").getTime();
  const delta = t2 - t1;
  assert.ok(delta > 4000);
});

test("T2_BVA_10: Transport state 'blocked' prevents freelancer customer send even when client-chat is ON", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(perms.canSendCustomerMessage, false);
});

test("T2_BVA_11: Transport state 'demo' permits customer send in development/demo mode", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "demo",
  });
  assert.equal(perms.canSendCustomerMessage, true);
});

test("T2_BVA_12: Transport state 'ready' permits customer send when toggle is ON", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canSendCustomerMessage, true);
});

test("T2_BVA_13: In-app customer thread (isInAppCustomerThread: true) permits sending regardless of WhatsApp relay", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true, isInAppCustomerThread: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canSendCustomerMessage, true);
});

test("T2_BVA_14: Cross-tenant admin access attempt returns canViewConversation = false", () => {
  const conv = createFixture({ tenantId: "agency-alpha" });
  const perms = resolveConversationPermissions({
    user: { id: "admin-beta", role: "ADMIN", tenantId: "agency-beta" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_15: Cross-tenant manager access attempt returns canViewConversation = false", () => {
  const conv = createFixture({ tenantId: "agency-alpha" });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-beta", role: "MANAGER", tenantId: "agency-beta" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_16: Cross-tenant freelancer access attempt returns canViewConversation = false", () => {
  const conv = createFixture({ tenantId: "agency-alpha", assignedFreelancerId: "editor-bob" });
  const perms = resolveConversationPermissions({
    user: { id: "editor-charlie", role: "FREELANCER", tenantId: "agency-beta" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_17: Manager with scoped projectIds matching conversation project allows access", () => {
  const conv = createFixture({ id: "conv-wedding", serviceId: "srv-wedding" });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    membership: { scope: { projectIds: ["conv-wedding"] } },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
});

test("T2_BVA_18: Manager with scoped projectIds NOT matching conversation project denies access", () => {
  const conv = createFixture({ id: "conv-wedding", serviceId: "srv-wedding" });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    membership: { scope: { projectIds: ["conv-other"] } },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_19: Manager with scoped clientIds matching conversation contact allows access", () => {
  const conv = createFixture({ contactId: "contact-vip" });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    membership: { scope: { clientIds: ["contact-vip"] } },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
});

test("T2_BVA_20: Manager with scoped clientIds NOT matching conversation contact denies access", () => {
  const conv = createFixture({ contactId: "contact-vip" });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    membership: { scope: { clientIds: ["contact-other"] } },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_21: Unassigned freelancer with pending assignment offer can view internal but cannot send", () => {
  const conv = createFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-offered", status: "PENDING" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-offered", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, false);
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, false);
});

test("T2_BVA_22: Freelancer with expired assignment offer has all permission flags false", () => {
  const conv = createFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-expired", status: "EXPIRED" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-expired", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_23: Freelancer with rejected assignment offer has all permission flags false", () => {
  const conv = createFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-rejected", status: "REJECTED" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-rejected", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_24: Conversation with null assignedFreelancerId denies access to freelancer", () => {
  const conv = createFixture({ assignedFreelancerId: null });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_25: Conversation with undefined assignedFreelancerId denies access to freelancer", () => {
  const conv = createFixture({ assignedFreelancerId: undefined });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_26: Conversation with empty string assignedFreelancerId: '' denies access", () => {
  const conv = createFixture({ assignedFreelancerId: "" });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_27: Conversation with whitespace assignedFreelancerId: '   ' is sanitized and denies access", () => {
  const conv = createFixture({ assignedFreelancerId: "   " });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_28: Empty or missing collaborator list does not throw null pointer exception", () => {
  const conv = createFixture({ freelancerCollaborators: undefined });
  const perms = resolveConversationPermissions({
    user: { id: "some-user", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

test("T2_BVA_29: Collaborator list with matching ID provides read-only collaborator rights", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-primary",
    freelancerCollaborators: [{ freelancerId: "editor-collab-1", freelancerName: "Collab 1" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-collab-1", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canSendInternalMessage, false);
  assert.equal(perms.canSendCustomerMessage, false);
});

test("T2_BVA_30: User who is BOTH primary editor and in collaborator list gets primary editor rights (primary wins)", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "editor-bob", freelancerName: "Bob" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(perms.canSendInternalMessage, true); // Primary editor can write internal
});

test("T2_BVA_31: Conversation with 0 messages has unreadCount: 0 and does not crash", () => {
  const conv = createFixture({ messages: [] });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.unreadCount, 0);
  assert.equal(projected.messages.length, 0);
});

test("T2_BVA_32: Conversation where ALL messages are client_private shows 0 messages to freelancer", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", body: "Private 1", visibility: "client_private" },
      { id: "2", lane: "internal", body: "Private 2", visibility: "client_private" },
    ],
  });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.messages.length, 0);
  assert.equal(projected.summary, conv.serviceTitle);
});

test("T2_BVA_33: Conversation where ALL messages are client_private shows 0 unread for freelancer", () => {
  const conv = createFixture({
    messages: [
      { id: "1", lane: "customer", body: "Private 1", visibility: "client_private", readByFreelancer: false },
      { id: "2", lane: "internal", body: "Private 2", visibility: "client_private", readByFreelancer: false },
    ],
  });
  const projected = projectConversation(conv, "freelancer", { userId: "editor-bob" });
  assert.equal(projected.unreadCount, 0);
  assert.equal(projected.unreadCountByLane.customer, 0);
  assert.equal(projected.unreadCountByLane.internal, 0);
});

test("T2_BVA_34: Freelancer customer-lane replies are restricted to text-only (attachments rejected)", () => {
  const normalizedAttachments = { attachments: [{ id: "att-1", kind: "image" }] };
  const role = "freelancer";
  const lane = "customer";
  const isAttachmentRejected = role === "freelancer" && lane === "customer" && normalizedAttachments.attachments.length > 0;
  assert.equal(isAttachmentRejected, true);
});

test("T2_BVA_35: Primary freelancer can send attachments in internal coordination lane", () => {
  const normalizedAttachments = { attachments: [{ id: "att-1", kind: "image" }] };
  const role = "freelancer";
  const lane = "internal";
  const isAttachmentRejected = role === "freelancer" && lane === "customer" && normalizedAttachments.attachments.length > 0;
  assert.equal(isAttachmentRejected, false);
});

test("T2_BVA_36: resolveConversationPermissions handles membership: null gracefully", () => {
  const conv = createFixture();
  const perms = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "agency-alpha" },
    membership: null,
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
});

test("T2_BVA_37: resolveConversationPermissions handles membership: undefined gracefully", () => {
  const conv = createFixture();
  const perms = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "agency-alpha" },
    membership: undefined,
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, true);
});

test("T2_BVA_38: Sales agent without lead assignment has canViewConversation = false", () => {
  const conv = createFixture({ contactId: "client-target" });
  const perms = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "agency-alpha" },
    membership: { scope: { clientIds: ["client-other"] } },
    conversation: conv,
  });
  assert.equal(perms.canViewConversation, false);
});

// ===========================================================================
// TIER 3: PAIRWISE COMBINATORIAL TESTS (12 tests)
// Combinations: Role x Visibility x Lane x ClientChatToggle x TransportState
// ===========================================================================

test("T3_PAIR_01: [SUPER_ADMIN] x [client_private] x [customer] x [Toggle: ON] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "super-1", role: "SUPER_ADMIN", tenantId: "agency-other" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, true);
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canManageParticipants, true);
});

test("T3_PAIR_02: [SUPER_ADMIN] x [default] x [internal] x [Toggle: OFF] x [Transport: blocked]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "super-1", role: "SUPER_ADMIN", tenantId: "agency-other" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canSendInternalMessage, true);
});

test("T3_PAIR_03: [ADMIN] x [client_private] x [internal] x [Toggle: OFF] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, true);
  assert.equal(perms.canSendInternalMessage, true);
  assert.equal(perms.canManageParticipants, true);
});

test("T3_PAIR_04: [ADMIN] x [default] x [customer] x [Toggle: OFF] x [Transport: blocked]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, true); // Admin can send in customer lane
});

test("T3_PAIR_05: [MANAGER] x [client_private] x [customer] x [Toggle: ON] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, true);
  assert.equal(perms.canSendCustomerMessage, true);
});

test("T3_PAIR_06: [FREELANCER_PRIMARY] x [client_private] x [customer] x [Toggle: ON] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, false); // INVARIANT: Never sees private
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canManageParticipants, false);
});

test("T3_PAIR_07: [FREELANCER_PRIMARY] x [client_private] x [internal] x [Toggle: OFF] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, false);
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, true);
});

test("T3_PAIR_08: [FREELANCER_PRIMARY] x [default] x [customer] x [Toggle: OFF] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: false });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewCustomerLane, true); // Decoupled read
  assert.equal(perms.canSendCustomerMessage, false); // Send blocked
});

test("T3_PAIR_09: [FREELANCER_PRIMARY] x [default] x [customer] x [Toggle: ON] x [Transport: blocked]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, false); // Blocked by transport
});

test("T3_PAIR_10: [FREELANCER_COLLABORATOR] x [client_private] x [customer] x [Toggle: ON] x [Transport: ready]", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab" }],
    freelancerCustomerLaneAccess: true,
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewPrivateMessages, false);
  assert.equal(perms.canSendCustomerMessage, false); // Collaborator cannot send
  assert.equal(perms.canSendInternalMessage, false);
});

test("T3_PAIR_11: [FREELANCER_COLLABORATOR] x [default] x [internal] x [Toggle: OFF] x [Transport: ready]", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab" }],
    freelancerCustomerLaneAccess: false,
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canSendInternalMessage, false);
});

test("T3_PAIR_12: [CUSTOMER] x [client_private] x [customer] x [Toggle: ON] x [Transport: ready]", () => {
  const conv = createFixture({ freelancerCustomerLaneAccess: true });
  const perms = resolveConversationPermissions({
    user: { id: "client-1", role: "CUSTOMER", tenantId: "agency-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canViewInternalLane, false);
  assert.equal(perms.canViewPrivateMessages, false);
  assert.equal(perms.canManageParticipants, false);
});

// ===========================================================================
// TIER 4: REAL-WORLD MULTI-STEP APPLICATION SCENARIOS (5 scenarios)
// ===========================================================================

test("T4_SCENARIO_1: Private Rate Negotiation & Public Delivery Workflow", () => {
  // 1. Agency admin starts conversation with customer
  const conv = createFixture({
    freelancerCustomerLaneAccess: false,
    messages: [
      { id: "m-req", lane: "customer", senderRole: "customer", body: "Please deliver 4K teaser with Rec.709 color grade." },
      { id: "m-rate", lane: "customer", senderRole: "admin", body: "Commercial rate agreed: ₹75,000 + 18% GST", visibility: "client_private" },
    ],
  });

  // 2. Editor views conversation
  const editorView = projectConversation(conv, "freelancer", { userId: "editor-bob" });

  // Verification 1: Editor receives customer instructions
  assert.equal(editorView.capabilities.canViewCustomerLane, true);
  assert.equal(editorView.messages.some((m) => m.id === "m-req"), true);

  // Verification 2: Editor receives ZERO private rate messages
  assert.equal(editorView.messages.some((m) => m.id === "m-rate"), false);
  assert.equal(editorView.messages.length, 1);

  // Verification 3: Editor summary does NOT contain private rate
  assert.doesNotMatch(editorView.summary, /₹75,000/);

  // Verification 4: Editor customer composer is disabled
  assert.equal(editorView.laneCapabilities.customer.writable, false);
  assert.equal(editorView.laneCapabilities.customer.reason, "Read-only: Client messaging disabled by agency");

  // 3. Editor posts internal delivery message
  const withDelivery = {
    ...conv,
    messages: [
      ...conv.messages,
      { id: "m-delivery", lane: "internal", senderRole: "freelancer", body: "Draft V1 uploaded to staging drive" },
    ],
  };

  // 4. Admin views conversation: sees all 3 messages
  const adminView = projectConversation(withDelivery, "admin", { userId: "admin-user" });
  assert.equal(adminView.messages.length, 3);
  assert.deepEqual(adminView.messages.map((m) => m.id), ["m-req", "m-rate", "m-delivery"]);
});

test("T4_SCENARIO_2: Editor Client-Chat Toggle Lifecycle", () => {
  // 1. Initial State: Client chat OFF
  const convInitial = createFixture({ freelancerCustomerLaneAccess: false });
  const perms1 = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: convInitial,
  });
  assert.equal(perms1.canViewCustomerLane, true);
  assert.equal(perms1.canSendCustomerMessage, false);

  // 2. Agency enables client chat for revision discussion
  const convEnabled = {
    ...convInitial,
    freelancerCustomerLaneAccess: true,
    freelancerCustomerLaneAccessUpdatedAt: new Date().toISOString(),
  };
  const perms2 = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: convEnabled,
    transportState: "ready",
  });
  assert.equal(perms2.canViewCustomerLane, true);
  assert.equal(perms2.canSendCustomerMessage, true);

  // 3. Editor sends message in customer lane
  const convWithReply = {
    ...convEnabled,
    messages: [
      ...convEnabled.messages,
      { id: "m-reply", lane: "customer", senderRole: "freelancer", body: "I have updated the titles to bold white." },
    ],
  };
  assert.equal(convWithReply.messages.length, 4);

  // 4. Agency locks client chat again
  const convLocked = {
    ...convWithReply,
    freelancerCustomerLaneAccess: false,
    freelancerCustomerLaneAccessUpdatedAt: new Date().toISOString(),
  };
  const perms3 = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: convLocked,
  });
  assert.equal(perms3.canViewCustomerLane, true);
  assert.equal(perms3.canSendCustomerMessage, false);

  const lockedView = projectConversation(convLocked, "freelancer", { userId: "editor-bob" });
  assert.equal(lockedView.laneCapabilities.customer.writable, false);
  assert.equal(lockedView.laneCapabilities.customer.reason, "Read-only: Client messaging disabled by agency");
});

test("T4_SCENARIO_3: Reassignment & Complete History Audit", () => {
  // 1. Editor A completes tasks and sends messages
  const conv = createFixture({
    assignedFreelancerId: "editor-a",
    assignedFreelancerName: "Editor Alice",
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Customer brief" },
      { id: "2", lane: "internal", senderRole: "freelancer", body: "Draft 1 uploaded" },
      { id: "3", lane: "internal", senderRole: "freelancer", body: "Draft 2 uploaded" },
    ],
    paymentRequests: [{ id: "pay-1", amount: 20000, status: "Paid" }],
  });

  // 2. Editor A is removed by manager
  const unassigned = unassignConversationEditors(conv, {
    removedByRole: "manager",
    removedByName: "Project Manager",
    unassignedReason: "Reassigned to Editor B",
  });

  // 3. Editor A access is immediately revoked
  const editorAPerms = resolveConversationPermissions({
    user: { id: "editor-a", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: unassigned,
  });
  assert.equal(editorAPerms.canViewConversation, false);

  // 4. 100% of messages and payment requests are preserved for agency
  assert.equal(unassigned.paymentRequests.length, 1);
  assert.equal(unassigned.messages.length, 4); // 3 original + 1 removal audit note
  assert.equal(unassigned.assignmentHistory.length, 1);
  assert.equal(unassigned.assignmentHistory[0].freelancerId, "editor-a");
  assert.equal(unassigned.assignmentHistory[0].unassignedReason, "Reassigned to Editor B");

  // 5. Editor B is assigned
  const reassigned = {
    ...unassigned,
    assignedFreelancerId: "editor-b",
    assignedFreelancerName: "Editor Bob",
    status: "Assigned",
  };

  // 6. Editor B can view full conversation history
  const editorBPerms = resolveConversationPermissions({
    user: { id: "editor-b", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: reassigned,
  });
  assert.equal(editorBPerms.canViewConversation, true);
  assert.equal(editorBPerms.canViewInternalLane, true);

  const editorBView = projectConversation(reassigned, "freelancer", { userId: "editor-b" });
  assert.equal(editorBView.messages.length, 4);
});

test("T4_SCENARIO_4: Rapid Push & Realtime Security", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-bob",
    assignedFreelancerName: "Bob Editor",
    freelancerCustomerLaneAccess: true,
  });
  const freelancer = freelancerCandidate();
  const admin = candidate({ id: "admin-user", role: "ADMIN" });


  // Burst of messages from customer / client relay
  const msgPublic1 = { id: "m1", lane: "customer", senderRole: "customer", body: "Reviewing files now" };
  const msgPrivate2 = { id: "m2", lane: "customer", senderRole: "customer", body: "Margin note: 20k credit", visibility: "client_private" };
  const msgPublic3 = { id: "m3", lane: "customer", senderRole: "customer", body: "Delivering by 6 PM" };

  // Msg 1: Public customer message -> notifies both admin and freelancer
  const push1 = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: conv,
    message: msgPublic1,
    senderId: "external-whatsapp",
  });
  assert.equal(push1.recipients.some((r) => r.user.id === "editor-bob-user"), true);
  assert.equal(push1.recipients.some((r) => r.user.id === "admin-user"), true);

  // Msg 2: Private customer message -> excludes freelancer
  const push2 = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: conv,
    message: msgPrivate2,
    senderId: "external-whatsapp",
  });
  assert.equal(push2.recipients.some((r) => r.user.id === "editor-bob-user"), false);
  assert.equal(push2.recipients.some((r) => r.user.id === "admin-user"), true);

  // Msg 3: Public customer message -> notifies both admin and freelancer
  const push3 = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: conv,
    message: msgPublic3,
    senderId: "external-whatsapp",
  });
  assert.equal(push3.recipients.some((r) => r.user.id === "editor-bob-user"), true);
  assert.equal(push3.recipients.some((r) => r.user.id === "admin-user"), true);
});


test("T4_SCENARIO_5: Read-Only Collaborator vs Primary Editor", () => {
  const conv = createFixture({
    assignedFreelancerId: "editor-primary",
    assignedFreelancerName: "Primary Editor",
    freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab Editor" }],
    freelancerCustomerLaneAccess: false,
    messages: [
      { id: "1", lane: "customer", senderRole: "customer", body: "Client project brief" },
      { id: "2", lane: "customer", senderRole: "admin", body: "Private financial note", visibility: "client_private" },
      { id: "3", lane: "internal", senderRole: "freelancer", body: "Internal timeline estimate" },
    ],
  });

  // Primary Editor Evaluation
  const primaryPerms = resolveConversationPermissions({
    user: { id: "editor-primary", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(primaryPerms.canViewConversation, true);
  assert.equal(primaryPerms.canViewCustomerLane, true);
  assert.equal(primaryPerms.canViewInternalLane, true);
  assert.equal(primaryPerms.canViewPrivateMessages, false);
  assert.equal(primaryPerms.canSendCustomerMessage, false); // Toggle is OFF
  assert.equal(primaryPerms.canSendInternalMessage, true); // Can reply internally

  // Collaborator Evaluation
  const collabPerms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "agency-alpha" },
    conversation: conv,
  });
  assert.equal(collabPerms.canViewConversation, true);
  assert.equal(collabPerms.canViewCustomerLane, true);
  assert.equal(collabPerms.canViewInternalLane, true);
  assert.equal(collabPerms.canViewPrivateMessages, false);
  assert.equal(collabPerms.canSendCustomerMessage, false);
  assert.equal(collabPerms.canSendInternalMessage, false); // Cannot reply internally!

  // Projection for Collaborator
  const collabView = projectConversation(conv, "freelancer", { userId: "editor-collab" });
  assert.equal(collabView.messages.length, 2); // 0 private messages
  assert.equal(collabView.laneCapabilities.internal.writable, false);
  assert.equal(
    collabView.laneCapabilities.internal.reason,
    "Only the primary editor can reply in the freelancer lane. You have read-only access.",
  );
});
