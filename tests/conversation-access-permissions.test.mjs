import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// 1. Bundle and import conversation-access.ts with mocked server-only externals
const mockPlugin = {
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
  plugins: [mockPlugin],
  external: ["@prisma/client", "server-only"],
});
const { createForbiddenPermissions, resolveConversationPermissions } = await import(
  `data:text/javascript;base64,${Buffer.from(accessBundle.outputFiles[0].text).toString("base64")}`
);

// 2. Bundle and import dummy-platform-store.ts
const storeBundle = await esbuild.build({
  entryPoints: ["src/lib/gigxomi/dummy-platform-store.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  alias: { "@": "./src" },
  external: ["@prisma/client", "server-only"],
});
const store = await import(
  `data:text/javascript;base64,${Buffer.from(storeBundle.outputFiles[0].text).toString("base64")}`
);

const {
  projectConversation,
  appendConversationMessage,
  assignConversationDirectly,
  unassignConversationEditors,
  listConversationsForAudience,
  getConversationById,
  hydrateDummyPlatformSnapshot,
} = store;

// Helper to construct test conversations
function createTestConversation(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "conv-test-1",
    contactId: "contact-1",
    customerId: "cust-1",
    customerName: "Alice Client",
    customerPhone: "+15550001",
    maskedCustomerName: "A*** C***",
    serviceId: "svc-1",
    serviceSlug: "video-edit",
    serviceTitle: "YouTube Video Editing",
    tenantId: "tenant-alpha",
    status: "Active",
    leadStatusId: "assigned",
    summary: "Public project summary",
    internalNotes: "Confidential internal note",
    assignedFreelancerId: "editor-bob",
    assignedFreelancerName: "Bob Editor",
    freelancerCollaborators: [],
    assignmentOffers: [],
    readStateByAudience: {},
    lastCustomerActivityAt: now,
    isInAppCustomerThread: true,
    freelancerCustomerLaneAccess: false,
    paymentRequests: [],
    typing: [],
    messages: [
      {
        id: "msg-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Alice Client",
        body: "Hello, here is my raw footage.",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-2",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Agency Owner",
        body: "Editor Bob, please handle the color grading first.",
        createdAt: "2026-09-05T09:05:00.000Z",
      },
    ],
    createdAt: "2026-09-05T08:50:00.000Z",
    updatedAt: now,
    ...overrides,
  };
}

// ============================================================================
// SUITE 1: Canonical Capability Resolver (resolveConversationPermissions)
// ============================================================================

test("R4: SUPER_ADMIN receives all 7 capabilities across tenants", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-super", role: "SUPER_ADMIN", tenantId: "tenant-other" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.deepEqual(p, {
    canViewConversation: true,
    canViewCustomerLane: true,
    canViewInternalLane: true,
    canViewPrivateMessages: true,
    canSendCustomerMessage: true,
    canSendInternalMessage: true,
    canManageParticipants: true,
  });
});

test("R4: ADMIN within tenant receives all 7 capabilities", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-admin", role: "ADMIN", tenantId: "tenant-alpha" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewPrivateMessages, true);
  assert.equal(p.canManageParticipants, true);
});

test("R4: ADMIN across mismatched tenant is forbidden (all 7 false)", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-admin", role: "ADMIN", tenantId: "tenant-beta" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.deepEqual(p, createForbiddenPermissions());
});

test("R4: MANAGER within tenant with active membership receives full permissions", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "ACTIVE" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewPrivateMessages, true);
  assert.equal(p.canSendCustomerMessage, true);
  assert.equal(p.canManageParticipants, true);
});

test("R4: MANAGER with non-active status is forbidden", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "SUSPENDED" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.deepEqual(p, createForbiddenPermissions());
});

test("R4: MANAGER scope check (clientIds, projectIds, editorIds)", () => {
  // Matching client
  const p1 = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "ACTIVE", scope: { clientIds: ["cust-1", "cust-2"] } },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-1" },
  });
  assert.equal(p1.canViewConversation, true);

  // Mismatching client
  const p2 = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "ACTIVE", scope: { clientIds: ["cust-99"] } },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-1" },
  });
  assert.deepEqual(p2, createForbiddenPermissions());

  // Matching project
  const p3 = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "ACTIVE", scope: { projectIds: ["conv-1"] } },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.equal(p3.canViewConversation, true);

  // Mismatching editor
  const p4 = resolveConversationPermissions({
    user: { id: "u-mgr", role: "MANAGER", tenantId: "tenant-alpha" },
    membership: { status: "ACTIVE", scope: { editorIds: ["editor-other"] } },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", assignedFreelancerId: "editor-bob" },
  });
  assert.deepEqual(p4, createForbiddenPermissions());
});

test("R4: SALES_AGENT assigned lead can send customer/internal messages but cannot view private messages", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-sales", role: "SALES_AGENT", tenantId: "tenant-alpha" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
    isSalesAssigned: true,
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewCustomerLane, true);
  assert.equal(p.canViewInternalLane, true);
  assert.equal(p.canViewPrivateMessages, false, "Security: Sales must never view client_private");
  assert.equal(p.canSendCustomerMessage, true);
  assert.equal(p.canSendInternalMessage, true);
  assert.equal(p.canManageParticipants, false);
});

test("R4: SALES_AGENT unassigned lead is forbidden", () => {
  const p = resolveConversationPermissions({
    user: { id: "u-sales", role: "SALES_AGENT", tenantId: "tenant-alpha" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
    isSalesAssigned: false,
  });
  assert.deepEqual(p, createForbiddenPermissions());
});

test("R4: CUSTOMER can view/send customer lane, cannot view internal lane or private messages", () => {
  const p = resolveConversationPermissions({
    user: { id: "cust-1", role: "CUSTOMER" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-1" },
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewCustomerLane, true);
  assert.equal(p.canViewInternalLane, false);
  assert.equal(p.canViewPrivateMessages, false);
  assert.equal(p.canSendCustomerMessage, true);
  assert.equal(p.canSendInternalMessage, false);
  assert.equal(p.canManageParticipants, false);
});

test("R2: Primary FREELANCER with client-chat disabled can VIEW customer lane but CANNOT send", () => {
  const p = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-bob",
      freelancerCustomerLaneAccess: false,
    },
    transportState: "ready",
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewCustomerLane, true, "R2: Customer lane reading must be decoupled from send toggle");
  assert.equal(p.canViewInternalLane, true);
  assert.equal(p.canViewPrivateMessages, false, "Security Invariant: Freelancer must NEVER view private messages");
  assert.equal(p.canSendCustomerMessage, false, "R2: Direct customer send must be false when toggle is off");
  assert.equal(p.canSendInternalMessage, true, "Primary editor can still coordinate internally");
  assert.equal(p.canManageParticipants, false);
});

test("R2: Primary FREELANCER with client-chat enabled can send customer message when transport is ready", () => {
  const p = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-bob",
      freelancerCustomerLaneAccess: true,
    },
    transportState: "ready",
  });
  assert.equal(p.canViewCustomerLane, true);
  assert.equal(p.canSendCustomerMessage, true, "Customer send enabled when toggle ON and transport ready");
});

test("R2: Primary FREELANCER with transport blocked cannot send customer message", () => {
  const p = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-bob",
      freelancerCustomerLaneAccess: true,
    },
    transportState: "blocked",
  });
  assert.equal(p.canViewCustomerLane, true);
  assert.equal(p.canSendCustomerMessage, false, "Blocked transport must disable sending");
});

test("R4: FREELANCER Collaborator has read-only access to customer & internal lanes", () => {
  const p = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-bob",
      freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab Editor" }],
      freelancerCustomerLaneAccess: true,
    },
    transportState: "ready",
  });
  assert.equal(p.canViewConversation, true);
  assert.equal(p.canViewCustomerLane, true);
  assert.equal(p.canViewInternalLane, true);
  assert.equal(p.canViewPrivateMessages, false);
  assert.equal(p.canSendCustomerMessage, false, "Collaborators cannot send customer messages");
  assert.equal(p.canSendInternalMessage, false, "Collaborators are read-only in internal lane");
  assert.equal(p.canManageParticipants, false);
});

test("R3: Unassigned or removed FREELANCER has all 7 capabilities set to false", () => {
  const p = resolveConversationPermissions({
    user: { id: "editor-removed", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: undefined,
      freelancerCollaborators: [],
      assignmentOffers: [{ freelancerId: "editor-removed", status: "EXPIRED" }],
      freelancerCustomerLaneAccess: false,
    },
    transportState: "ready",
  });
  assert.deepEqual(p, createForbiddenPermissions(), "Removed editor must receive 0 permissions");
});

// ============================================================================
// SUITE 2: Backend Projection & Server-Side client_private Stripping (R1)
// ============================================================================

test("R1: projectConversation strictly strips client_private messages for freelancer audience across all lanes", () => {
  const conversation = createTestConversation({
    messages: [
      {
        id: "msg-cust",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Alice Client",
        body: "Public client question",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-pub-int",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Agency Owner",
        body: "Public internal instruction",
        createdAt: "2026-09-05T09:01:00.000Z",
      },
      {
        id: "msg-priv-int",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Agency Owner",
        body: "SECRET: Internal agency margin is 60%",
        visibility: "client_private",
        createdAt: "2026-09-05T09:02:00.000Z",
      },
      {
        id: "msg-priv-cust",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Agency Owner",
        body: "SECRET: Private manager note in customer lane",
        visibility: "client_private",
        createdAt: "2026-09-05T09:03:00.000Z",
      },
    ],
  });

  const freelancerView = projectConversation(conversation, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  // Strict assertion: 0 client_private messages in the output payload
  const privateMessages = freelancerView.messages.filter((m) => m.visibility === "client_private");
  assert.equal(privateMessages.length, 0, "Freelancer view must never contain client_private messages");
  assert.equal(freelancerView.messages.length, 2, "Only non-private customer and internal messages visible");

  // Admin view retains all messages including private
  const adminView = projectConversation(conversation, "admin");
  assert.equal(adminView.messages.length, 4, "Admin view retains all messages");
});

test("R1: projectConversation strictly strips client_private messages for sales audience", () => {
  const conversation = createTestConversation({
    messages: [
      {
        id: "msg-1",
        lane: "customer",
        senderRole: "customer",
        body: "Client inquiry",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-priv",
        lane: "internal",
        senderRole: "admin",
        body: "Confidential agency notes",
        visibility: "client_private",
        createdAt: "2026-09-05T09:01:00.000Z",
      },
    ],
  });

  const salesView = projectConversation(conversation, "sales");
  assert.equal(salesView.messages.filter((m) => m.visibility === "client_private").length, 0);
  assert.equal(salesView.messages.length, 1);
});

// ============================================================================
// SUITE 3: Customer Lane Read vs. Send Decoupling in Store Projection (R2)
// ============================================================================

test("R2: projectConversation exposes customer lane in read-only mode when freelancerCustomerLaneAccess is false", () => {
  const conversation = createTestConversation({
    freelancerCustomerLaneAccess: false,
    messages: [
      {
        id: "msg-cust-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Alice Client",
        body: "Can you make the intro shorter?",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
    ],
  });

  const view = projectConversation(conversation, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  // Verification of R2 contract:
  assert.ok(view.visibleLanes.includes("customer"), "visibleLanes must include 'customer'");
  assert.ok(view.visibleLanes.includes("internal"), "visibleLanes must include 'internal'");
  assert.equal(view.messages.length, 1, "Freelancer must be able to read the customer message");
  assert.equal(view.laneCapabilities.customer.visible, true, "customer lane visible must be true");
  assert.equal(view.laneCapabilities.customer.writable, false, "customer lane writable must be false");
  assert.equal(
    view.laneCapabilities.customer.reason,
    "Read-only: Client messaging disabled by agency",
    "Reason must clearly indicate read-only agency state",
  );
  assert.equal(view.capabilities?.canViewCustomerLane, true);
  assert.equal(view.capabilities?.canSendCustomerMessage, false);
});

// ============================================================================
// SUITE 4: Audience-Isolated Summaries & Previews (R1 & R2)
// ============================================================================

test("R1: client_private message never poisons conversation.summary for freelancer view", () => {
  const conversation = createTestConversation({
    summary: "Original public video briefing",
    serviceTitle: "YouTube Video Editing",
    messages: [],
  });

  // When only private messages are in the conversation
  const privateMsg = {
    id: "msg-p1",
    lane: "internal",
    senderRole: "admin",
    senderLabel: "Agency Admin",
    body: "PRIVATE: Margin is 75%, do not reveal rate.",
    visibility: "client_private",
    createdAt: "2026-09-05T09:10:00.000Z",
  };

  const convWithPrivate = {
    ...conversation,
    messages: [privateMsg],
    summary: "PRIVATE: Margin is 75%, do not reveal rate.", // Simulate legacy poisoned summary
  };

  const freelancerView = projectConversation(convWithPrivate, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  // Must fall back to service title, NEVER leaking the private summary
  assert.equal(freelancerView.summary, "YouTube Video Editing");
  assert.ok(!freelancerView.summary.includes("PRIVATE"));
  assert.ok(!freelancerView.summary.includes("Margin"));
});

// ============================================================================
// SUITE 5: Unread Badge Counter Math Isolation (R1)
// ============================================================================

test("R1: Unread counters strictly ignore client_private messages for freelancers", () => {
  const conversation = createTestConversation({
    readStateByAudience: {}, // No messages read yet
    messages: [
      {
        id: "msg-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Alice Client",
        body: "Public client message",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-priv-1",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Confidential manager note",
        visibility: "client_private",
        createdAt: "2026-09-05T09:01:00.000Z",
      },
      {
        id: "msg-priv-2",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Another confidential note",
        visibility: "client_private",
        createdAt: "2026-09-05T09:02:00.000Z",
      },
    ],
  });

  const freelancerView = projectConversation(conversation, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  // Freelancer should have unread count = 1 (only the 1 incoming customer message, 0 private messages counted)
  assert.equal(freelancerView.unreadCount, 1);
  assert.equal(freelancerView.unreadCountByLane.customer, 1);
  assert.equal(freelancerView.unreadCountByLane.internal, 0);
});

// ============================================================================
// SUITE 6: Non-Destructive Editor Removal & Complete Audit Preservation (R3)
// ============================================================================

test("R3: unassignConversationEditors preserves 100% of historical messages, payments, and populates assignmentHistory", () => {
  // 1. Create and seed a rich conversation
  const testConvId = `conv-audit-${Date.now()}`;
  const seeded = createTestConversation({
    id: testConvId,
    assignedFreelancerId: "editor-sarah",
    assignedFreelancerName: "Sarah Editor",
    freelancerCustomerLaneAccess: true,
    paymentRequests: [
      {
        id: "pay-1",
        amount: 250,
        currency: "USD",
        status: "paid",
        description: "Milestone 1 cut",
      },
    ],
    projectIntake: {
      projectName: "Docu Series Episode 1",
      googleDriveLink: "https://drive.google.com/test-audit",
    },
    internalNotes: "Important intake directives",
    messages: [
      {
        id: "m-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "Brief attached",
        createdAt: "2026-09-05T08:00:00.000Z",
      },
      {
        id: "m-2",
        lane: "internal",
        senderRole: "freelancer",
        senderLabel: "Sarah Editor",
        body: "Working on the timeline",
        createdAt: "2026-09-05T08:15:00.000Z",
      },
      {
        id: "m-3",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Agency Rahul",
        body: "Check sound mix before export",
        createdAt: "2026-09-05T08:30:00.000Z",
      },
    ],
    assignmentHistory: [
      {
        id: "asgh-1",
        freelancerId: "editor-sarah",
        freelancerName: "Sarah Editor",
        role: "primary",
        assignedAt: "2026-09-05T07:55:00.000Z",
      },
    ],
  });

  // Seed into in-memory store
  hydrateDummyPlatformSnapshot({ conversations: [seeded] });

  // 2. Unassign editor
  const unassigned = unassignConversationEditors(testConvId, "admin", {
    removedByName: "Admin Rahul",
    unassignedReason: "Client requested editorial direction change",
  });

  assert.ok(unassigned, "unassignConversationEditors returned updated conversation");

  // Verify non-destructive invariants:
  // All original messages preserved + 1 removal note appended
  assert.ok(unassigned.messages.length >= 4, "Messages must not be dropped");
  const originalBodies = unassigned.messages.map((m) => m.body);
  assert.ok(originalBodies.some((b) => b.includes("Brief attached")));
  assert.ok(originalBodies.some((b) => b.includes("Working on the timeline")));
  assert.ok(originalBodies.some((b) => b.includes("Check sound mix before export")));

  // Removal note present
  const removalNote = unassigned.messages.find(
    (m) => m.lane === "internal" && m.body.includes("was removed. This project is now unassigned."),
  );
  assert.ok(removalNote, "Removal note appended");

  // Payment requests & intake completely preserved
  assert.equal(unassigned.paymentRequests.length, 1);
  assert.equal(unassigned.paymentRequests[0].amount, 250);
  assert.equal(unassigned.internalNotes, "Important intake directives");
  assert.equal(unassigned.status, "Manager Review");
  assert.equal(unassigned.assignedFreelancerId, undefined);
  assert.equal(unassigned.freelancerCollaborators?.length ?? 0, 0);

  // Structured assignmentHistory must contain terminated entry with reason and actor
  assert.ok(unassigned.assignmentHistory?.length >= 1);
  const terminatedEntry = unassigned.assignmentHistory.find((h) => h.freelancerId === "editor-sarah");
  assert.ok(terminatedEntry, "History entry for Sarah exists");
  assert.ok(terminatedEntry.removedAt, "removedAt must be populated");
  assert.equal(terminatedEntry.removedByRole, "admin");
  assert.equal(terminatedEntry.removedByName, "Admin Rahul");
  assert.equal(terminatedEntry.unassignedReason, "Client requested editorial direction change");
});

test("R3: Removed editor cannot access conversation via listConversationsForAudience even with past accepted offer", () => {
  const testConvId = `conv-offer-leak-${Date.now()}`;
  const seeded = createTestConversation({
    id: testConvId,
    assignedFreelancerId: undefined, // Unassigned
    freelancerCollaborators: [],
    assignmentOffers: [
      {
        id: "off-1",
        freelancerId: "editor-ex",
        freelancerName: "Ex Editor",
        status: "ACCEPTED", // Stale historical acceptance from when they were active
      },
    ],
  });

  // Hydrate into store
  hydrateDummyPlatformSnapshot({ conversations: [seeded] });

  // Query conversation list for removed editor-ex
  const listResult = listConversationsForAudience("freelancer", {
    freelancerId: "editor-ex",
    freelancerIds: ["editor-ex"],
  });

  const hasAccess = listResult.conversations.some((c) => c.id === testConvId);
  assert.equal(hasAccess, false, "Security: Removed editor must NOT see conversation in list view via past accepted offer");
});
