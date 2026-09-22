import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// ============================================================================
// BUNDLE PRODUCTION MODULES VIA ESBUILD (ZERO MOCK FALLBACK ORACLES)
// ============================================================================

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
        export const resolveFreelancerChatIdentity = (session) => ({
          editorId: session.userId,
          candidateEditorIds: [session.userId, ...(session.candidateIds ?? [])],
          candidateEditorNames: [session.displayName, ...(session.candidateNames ?? [])],
          activeAgencyIds: session.tenantId ? [session.tenantId] : [],
        });
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

export const {
  createForbiddenPermissions,
  resolveConversationPermissions,
  resolveConversationAudienceForSession,
} = accessModule;

export const {
  projectConversation,
  getVisibleMessages,
  unassignConversationEditors,
  assignConversationDirectly,
  respondToConversationAssignment,
  hydrateDummyPlatformSnapshot,
  listConversationsForAudience,
} = storeModule;

// ============================================================================
// FIXTURE FACTORY
// ============================================================================

function createBaseFixture(overrides = {}) {
  const now = "2026-09-05T12:00:00.000Z";
  return {
    id: "conv-gate2-test",
    contactId: "contact-lead-01",
    customerId: "cust-client-01",
    customerName: "Acme Corp",
    customerPhone: "+1234567890",
    maskedCustomerName: "A*** C***",
    serviceId: "srv-video-editing",
    serviceSlug: "video-edit-slug",
    serviceTitle: "Product Launch Video",
    tenantId: "tenant-agency-prime",
    status: "Active",
    leadStatusId: "assigned",
    summary: "Public summary of video project",
    internalNotes: "Internal agency notes: confidential",
    assignedFreelancerId: "editor-primary",
    assignedFreelancerName: "Primary Editor",
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
        senderLabel: "Acme Client",
        body: "Client request: We need draft by Friday.",
        createdAt: "2026-09-05T10:00:00.000Z",
      },
      {
        id: "msg-2",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Agency Admin",
        body: "Internal note: Priority client, expedite.",
        createdAt: "2026-09-05T10:05:00.000Z",
      },
      {
        id: "msg-3",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Agency Admin",
        body: "PRIVATE_FINANCIAL_NOTE: Margin is 65%",
        visibility: "client_private",
        createdAt: "2026-09-05T10:10:00.000Z",
      },
    ],
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: now,
    ...overrides,
  };
}

// ============================================================================
// AREA 1: FREELANCER STATUS TRANSITIONS & LANE VISIBILITY
// ============================================================================

test("GATE2_FOCAL_1.1: Primary Editor with client chat toggle OFF has decoupled read without send", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: "editor-primary",
    freelancerCustomerLaneAccess: false,
  });

  const perms = resolveConversationPermissions({
    user: { id: "editor-primary", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
    transportState: "ready",
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true, "Primary editor can read customer lane");
  assert.equal(perms.canSendCustomerMessage, false, "Primary editor cannot send when toggle is OFF");
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canSendInternalMessage, true, "Primary editor can send in internal lane");
  assert.equal(perms.canViewPrivateMessages, false, "Never view private messages");

  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-primary"],
  });

  assert.equal(projected.capabilities.canViewCustomerLane, true);
  assert.equal(projected.capabilities.canSendCustomerMessage, false);
  assert.equal(projected.laneCapabilities.customer.writable, false);
  assert.equal(projected.laneCapabilities.customer.reason, "Read-only: Client messaging disabled by agency");
  assert.equal(projected.laneCapabilities.internal.writable, true);
});

test("GATE2_FOCAL_1.2: Primary Editor with client chat toggle ON has send rights when transport ready", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: "editor-primary",
    freelancerCustomerLaneAccess: true,
  });

  const permsReady = resolveConversationPermissions({
    user: { id: "editor-primary", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
    transportState: "ready",
  });
  assert.equal(permsReady.canSendCustomerMessage, true);

  const permsBlocked = resolveConversationPermissions({
    user: { id: "editor-primary", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
    transportState: "blocked",
  });
  assert.equal(permsBlocked.canSendCustomerMessage, false, "Blocked transport overrides ON toggle");

  const projectedReady = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-primary"],
  });
  assert.equal(projectedReady.capabilities.canSendCustomerMessage, true);
  assert.equal(projectedReady.laneCapabilities.customer.writable, true);
});

test("GATE2_FOCAL_1.3: Collaborator Freelancer is strictly read-only on BOTH customer and internal lanes", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: "editor-other-primary",
    freelancerCollaborators: [
      { freelancerId: "editor-collab", freelancerName: "Collab Helper" },
    ],
    freelancerCustomerLaneAccess: true, // Even if toggle is ON for primary
  });

  const perms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
    transportState: "ready",
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true, "Collaborator can read customer lane");
  assert.equal(perms.canSendCustomerMessage, false, "Collaborator can NEVER send customer messages");
  assert.equal(perms.canViewInternalLane, true, "Collaborator can view internal lane");
  assert.equal(perms.canSendInternalMessage, false, "Collaborator CANNOT send internal messages");
  assert.equal(perms.canViewPrivateMessages, false);

  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-collab"],
  });

  assert.equal(projected.capabilities.canSendCustomerMessage, false);
  assert.equal(projected.capabilities.canSendInternalMessage, false);
  assert.ok(projected.laneCapabilities.customer.reason?.includes("Only the primary editor can message clients"));
  assert.ok(projected.laneCapabilities.internal.reason?.includes("Only the primary editor can reply"));
});

test("GATE2_FOCAL_1.4: Offered Freelancer (pending offer) can view internal lane but CANNOT view customer lane in resolver", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: undefined,
    freelancerCollaborators: [],
    assignmentOffers: [
      { freelancerId: "editor-candidate", status: "PENDING" },
    ],
  });

  const perms = resolveConversationPermissions({
    user: { id: "editor-candidate", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
  });

  assert.equal(perms.canViewConversation, true, "Offered editor can view conversation");
  assert.equal(perms.canViewCustomerLane, false, "Offered editor CANNOT view customer lane");
  assert.equal(perms.canViewInternalLane, true, "Offered editor CAN view internal briefing lane");
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, false);
  assert.equal(perms.canViewPrivateMessages, false);
});

test("GATE2_FOCAL_1.5 [EMPIRICAL INVESTIGATION]: Offered Freelancer behavior in projectConversation projection", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: undefined,
    freelancerCollaborators: [],
    assignmentOffers: [
      { freelancerId: "editor-candidate", status: "PENDING" },
    ],
  });

  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-candidate"],
  });

  // Verify projection properties for offered editor
  assert.equal(projected.assignmentSummary.myOffer?.freelancerId, "editor-candidate");
  assert.equal(projected.capabilities.canSendCustomerMessage, false);
  assert.equal(projected.capabilities.canSendInternalMessage, false);
  assert.equal(projected.capabilities.canViewPrivateMessages, false);
  // Note: projected.capabilities.canViewCustomerLane is true in store projection (store line 2504),
  // whereas resolver returns false (resolver line 272).
});

test("GATE2_FOCAL_1.6: Unassigned Freelancer has all permission flags false and 0 access", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: "editor-different",
    freelancerCollaborators: [],
    assignmentOffers: [],
  });

  const perms = resolveConversationPermissions({
    user: { id: "editor-stranger", role: "FREELANCER", tenantId: "tenant-agency-prime" },
    conversation: conv,
  });

  assert.deepEqual(perms, createForbiddenPermissions(), "Unassigned freelancer gets all false");
});

test("GATE2_FOCAL_1.7: Expired or Passed/Rejected Offer does not grant access", () => {
  const convExpired = createBaseFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-expired", status: "EXPIRED" }],
  });
  const permsExpired = resolveConversationPermissions({
    user: { id: "editor-expired", role: "FREELANCER" },
    conversation: convExpired,
  });
  assert.deepEqual(permsExpired, createForbiddenPermissions());

  const convPassed = createBaseFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-passed", status: "PASSED" }],
  });
  const permsPassed = resolveConversationPermissions({
    user: { id: "editor-passed", role: "FREELANCER" },
    conversation: convPassed,
  });
  assert.deepEqual(permsPassed, createForbiddenPermissions());
});

test("GATE2_FOCAL_1.8: Candidate names matching assignedFreelancerName provides primary editor rights", () => {
  const conv = createBaseFixture({
    assignedFreelancerId: undefined,
    assignedFreelancerName: "John Doe",
  });

  const perms = resolveConversationPermissions({
    user: {
      id: "editor-by-name",
      role: "FREELANCER",
      displayName: "John Doe",
      candidateNames: ["johndoe", "John Doe"],
    },
    conversation: conv,
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canSendInternalMessage, true, "Primary by name match has internal send rights");
});

// ============================================================================
// AREA 2: SALES_AGENT SCOPING RESTRICTIONS
// ============================================================================

test("GATE2_FOCAL_2.1: SALES_AGENT tenant boundary isolation", () => {
  const conv = createBaseFixture({ tenantId: "tenant-agency-prime" });

  // Matching tenant
  const permsMatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    conversation: conv,
  });
  assert.equal(permsMatch.canViewConversation, true);

  // Cross tenant
  const permsCross = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-other-agency" },
    conversation: conv,
  });
  assert.deepEqual(permsCross, createForbiddenPermissions(), "Cross-tenant SALES_AGENT must fail closed");

  // Missing user tenantId
  const permsNoTenant = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: null },
    conversation: conv,
  });
  assert.deepEqual(permsNoTenant, createForbiddenPermissions(), "Null tenantId SALES_AGENT must fail closed");
});

test("GATE2_FOCAL_2.2: SALES_AGENT isSalesAssigned explicit false check", () => {
  const conv = createBaseFixture({ tenantId: "tenant-agency-prime" });

  const permsUnassigned = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    conversation: conv,
    isSalesAssigned: false,
  });
  assert.deepEqual(permsUnassigned, createForbiddenPermissions(), "isSalesAssigned=false must forbid all access");

  const permsAssigned = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    conversation: conv,
    isSalesAssigned: true,
  });
  assert.equal(permsAssigned.canViewConversation, true, "isSalesAssigned=true allows access");
});

test("GATE2_FOCAL_2.3: SALES_AGENT membership clientIds scoping", () => {
  const conv = createBaseFixture({
    tenantId: "tenant-agency-prime",
    customerId: "client-target-123",
    contactId: "contact-target-456",
  });

  // Matching customerId
  const permsCustomerMatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { clientIds: ["client-target-123"] } },
    conversation: conv,
  });
  assert.equal(permsCustomerMatch.canViewConversation, true);

  // Matching contactId
  const permsContactMatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { clientIds: ["contact-target-456"] } },
    conversation: conv,
  });
  assert.equal(permsContactMatch.canViewConversation, true);

  // Non-matching clientIds
  const permsNoMatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { clientIds: ["client-different-999"] } },
    conversation: conv,
  });
  assert.deepEqual(permsNoMatch, createForbiddenPermissions(), "Mismatched clientIds must forbid access");

  // Empty clientIds array
  const permsEmptyScope = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { clientIds: [] } },
    conversation: conv,
  });
  assert.equal(permsEmptyScope.canViewConversation, true, "Empty clientIds array does not restrict");
});

test("GATE2_FOCAL_2.4: SALES_AGENT membership projectIds scoping", () => {
  const conv = createBaseFixture({
    id: "conv-specific-id",
    tenantId: "tenant-agency-prime",
  });

  // Matching projectIds
  const permsProjectMatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { projectIds: ["conv-specific-id", "conv-other"] } },
    conversation: conv,
  });
  assert.equal(permsProjectMatch.canViewConversation, true);

  // Mismatched projectIds
  const permsProjectMismatch = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    membership: { scope: { projectIds: ["conv-other-only"] } },
    conversation: conv,
  });
  assert.deepEqual(permsProjectMismatch, createForbiddenPermissions(), "Mismatched projectIds must forbid access");
});

test("GATE2_FOCAL_2.5: SALES_AGENT private message and management permissions are strictly false", () => {
  const conv = createBaseFixture({
    tenantId: "tenant-agency-prime",
    messages: [
      {
        id: "m-priv-1",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "CONFIDENTIAL_SALES_COMMISSION_DATA",
        visibility: "client_private",
        createdAt: "2026-09-05T10:00:00.000Z",
      },
      {
        id: "m-pub-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Customer",
        body: "Public inquiry",
        createdAt: "2026-09-05T10:01:00.000Z",
      },
    ],
  });

  const perms = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-prime" },
    conversation: conv,
  });

  assert.equal(perms.canViewPrivateMessages, false, "SALES_AGENT canViewPrivateMessages must be false");
  assert.equal(perms.canManageParticipants, false, "SALES_AGENT canManageParticipants must be false");
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canSendInternalMessage, true);

  // Visible messages stripping for sales
  const visible = getVisibleMessages(conv, "sales");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m-pub-1");
  assert.ok(!visible.some((m) => m.body.includes("CONFIDENTIAL_SALES_COMMISSION_DATA")));

  // Projected conversation for sales
  const projected = projectConversation(conv, "sales");
  assert.equal(projected.capabilities.canViewPrivateMessages, false);
  assert.equal(projected.capabilities.canManageParticipants, false);
  assert.equal(projected.messages.length, 1);
  assert.ok(!projected.summary.includes("CONFIDENTIAL"));
});

// ============================================================================
// AREA 3: IN-MEMORY DUMMY STORE BEHAVIOR UNDER EDGE-CASE INPUTS
// ============================================================================

test("GATE2_FOCAL_3.1: unassignConversationEditors handles polymorphic arguments (ID vs Object)", () => {
  const seededId = "conv-unassign-poly-1";
  const fixture = createBaseFixture({
    id: seededId,
    assignedFreelancerId: "editor-victim",
    assignedFreelancerName: "Victim Editor",
    freelancerCollaborators: [{ freelancerId: "collab-1", freelancerName: "Collab One" }],
    assignmentOffers: [{ freelancerId: "offered-1", status: "PENDING" }],
  });

  hydrateDummyPlatformSnapshot({ conversations: [fixture] });

  // 1. Pass primitive string ID
  const result1 = unassignConversationEditors(seededId, "admin", {
    removedByName: "Admin Sarah",
    unassignedReason: "Reassignment required",
  });
  assert.ok(result1);
  assert.equal(result1.assignedFreelancerId, undefined);
  assert.equal(result1.freelancerCollaborators.length, 0);
  assert.equal(result1.assignmentOffers[0].status, "EXPIRED");

  // 2. Pass full DummyConversation object directly
  const fixture2 = createBaseFixture({
    id: "conv-unassign-poly-2",
    assignedFreelancerId: "editor-victim-2",
    assignedFreelancerName: "Victim Two",
  });
  const result2 = unassignConversationEditors(fixture2, {
    removedByRole: "manager",
    removedByName: "Manager Mark",
    unassignedReason: "Manager reallocated",
  });
  assert.ok(result2);
  assert.equal(result2.assignedFreelancerId, undefined);
  const lastHistory = result2.assignmentHistory?.at(-1);
  assert.equal(lastHistory?.removedByRole, "manager");
  assert.equal(lastHistory?.removedByName, "Manager Mark");
  assert.equal(lastHistory?.unassignedReason, "Manager reallocated");
});

test("GATE2_FOCAL_3.2: unassignConversationEditors handles non-existent or empty conversation IDs", () => {
  // Non-existent string ID returns null gracefully
  const missing = unassignConversationEditors("non-existent-conversation-id-xyz");
  assert.equal(missing, null);

  // Empty string returns null gracefully
  const empty = unassignConversationEditors("");
  assert.equal(empty, null);
});

test("GATE2_FOCAL_3.3: projectConversation with nullish fixture fields does not crash", () => {
  const corruptConv = {
    id: "conv-corrupt-1",
    contactId: "c-1",
    customerId: "cust-1",
    customerName: "Corrupt Client",
    customerPhone: undefined,
    serviceId: "svc-1",
    serviceTitle: "Corrupt Service",
    tenantId: "tenant-1",
    status: "Active",
    summary: undefined,
    internalNotes: undefined,
    assignedFreelancerId: undefined,
    assignedFreelancerName: undefined,
    freelancerCollaborators: undefined, // undefined array
    assignmentOffers: undefined, // undefined array
    paymentRequests: undefined, // undefined array
    typing: undefined, // undefined array
    readStateByAudience: undefined, // undefined object
    freelancerClientAliases: undefined, // undefined object
    messages: [
      {
        id: "msg-no-body",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "", // empty body
        createdAt: "2026-09-05T10:00:00.000Z",
      },
    ],
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z",
  };

  assert.doesNotThrow(() => {
    const view = projectConversation(corruptConv, "admin");
    assert.ok(view);
    assert.equal(view.id, "conv-corrupt-1");
    assert.equal(typeof view.unreadCount, "number");
  });

  assert.doesNotThrow(() => {
    const view = projectConversation(corruptConv, "freelancer", {
      freelancerAliasKeys: ["editor-random"],
    });
    assert.ok(view);
  });
});

test("GATE2_FOCAL_3.4: projectConversation and getUnreadMessages with missing/malformed message timestamps", () => {
  const conv = createBaseFixture({
    messages: [
      {
        id: "m-no-time",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "Message without timestamp",
        createdAt: undefined, // Missing timestamp
      },
      {
        id: "m-invalid-time",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "Message with invalid timestamp",
        createdAt: "not-a-valid-date-iso", // Malformed timestamp
      },
      {
        id: "m-valid",
        lane: "internal",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Valid internal note",
        createdAt: "2026-09-05T10:30:00.000Z",
      },
    ],
  });

  assert.doesNotThrow(() => {
    const view = projectConversation(conv, "admin");
    assert.ok(view);
    assert.equal(typeof view.unreadCount, "number");
    assert.equal(typeof view.unreadCountByLane.customer, "number");
    assert.equal(typeof view.unreadCountByLane.internal, "number");
  });
});

test("GATE2_FOCAL_3.5: getVisibleMessages under polymorphic visibility values", () => {
  const conv = createBaseFixture({
    messages: [
      {
        id: "m1",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Normal message",
        visibility: undefined,
        createdAt: "2026-09-05T10:00:00.000Z",
      },
      {
        id: "m2",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Private message exact",
        visibility: "client_private",
        createdAt: "2026-09-05T10:01:00.000Z",
      },
      {
        id: "m3",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Private message uppercase",
        visibility: "CLIENT_PRIVATE",
        createdAt: "2026-09-05T10:02:00.000Z",
      },
      {
        id: "m4",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Private message with whitespace",
        visibility: " client_private ",
        createdAt: "2026-09-05T10:03:00.000Z",
      },
      {
        id: "m5",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "Unexpected visibility",
        visibility: "random_val",
        createdAt: "2026-09-05T10:04:00.000Z",
      },
    ],
  });

  const freelancerVisible = getVisibleMessages(conv, "freelancer");
  // All 3 variations of client_private must be stripped
  assert.equal(freelancerVisible.some((m) => m.id === "m2"), false);
  assert.equal(freelancerVisible.some((m) => m.id === "m3"), false);
  assert.equal(freelancerVisible.some((m) => m.id === "m4"), false);
  // Normal and non-private unexpected are kept
  assert.equal(freelancerVisible.some((m) => m.id === "m1"), true);
  assert.equal(freelancerVisible.some((m) => m.id === "m5"), true);
});

test("GATE2_FOCAL_3.6: respondToConversationAssignment with non-existent ID or expired offers", () => {
  const resultMissing = respondToConversationAssignment("missing-id-12345", {
    action: "ACCEPT",
    actorRole: "freelancer",
    actorName: "John Doe",
  });
  assert.equal(resultMissing, null, "Missing conversation returns null");

  const convId = "conv-resp-test-1";
  const conv = createBaseFixture({
    id: convId,
    assignedFreelancerId: undefined,
    assignmentOffers: [
      { id: "off-1", freelancerId: "editor-target", status: "EXPIRED" },
    ],
  });
  hydrateDummyPlatformSnapshot({ conversations: [conv] });

  // Responding to already EXPIRED offer returns unchanged or null
  const resultExpired = respondToConversationAssignment(convId, {
    action: "ACCEPT",
    actorRole: "freelancer",
    actorName: "John Doe",
    actorUserId: "editor-target",
  });
  assert.ok(resultExpired);
  assert.equal(resultExpired.assignedFreelancerId, undefined, "Expired offer cannot be accepted");
});

test("GATE2_FOCAL_3.7: assignConversationDirectly assigns primary editor and updates status", () => {
  const convId = "conv-direct-assign-1";
  const conv = createBaseFixture({
    id: convId,
    assignedFreelancerId: undefined,
    assignedFreelancerName: undefined,
    status: "Manager Review",
  });
  hydrateDummyPlatformSnapshot({ conversations: [conv] });

  const assigned = assignConversationDirectly(convId, "editor-new-hero", "admin", {
    freelancerName: "New Hero",
    assignedByName: "Admin Chief",
  });

  assert.ok(assigned);
  assert.equal(assigned.assignedFreelancerId, "editor-new-hero");
  assert.equal(assigned.assignedFreelancerName, "New Hero");
  assert.equal(assigned.status, "Assigned");
  assert.ok(assigned.messages.some((m) => m.body.includes("manually assigned New Hero as the primary editor")));
});
