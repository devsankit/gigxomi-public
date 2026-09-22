import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// ============================================================================
// BUNDLE MODULES VIA ESBUILD
// ============================================================================

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
        export const resolveFreelancerChatIdentity = (session) => ({
          editorId: session.userId,
          candidateEditorIds: [session.userId],
          candidateEditorNames: [session.displayName],
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
  plugins: [mockPlugin],
  external: ["@prisma/client", "server-only"],
});
const { createForbiddenPermissions, resolveConversationPermissions } = await import(
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
    id: "conv-challenger-1",
    contactId: "contact-c1",
    customerId: "cust-c1",
    customerName: "Alice Challenger",
    customerPhone: "+15550001",
    maskedCustomerName: "A*** C***",
    serviceId: "svc-c1",
    serviceSlug: "video-edit",
    serviceTitle: "YouTube Video Editing",
    tenantId: "tenant-alpha",
    status: "Active",
    leadStatusId: "assigned",
    summary: "Public project summary",
    internalNotes: "Internal directives",
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
        senderLabel: "Alice Challenger",
        body: "Initial footage delivered.",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
    ],
    createdAt: "2026-09-05T08:50:00.000Z",
    updatedAt: now,
    ...overrides,
  };
}

// ============================================================================
// SECTION 1: ORACLE COMPARISON (resolveConversationPermissions vs projectConversation)
// ============================================================================

test("CHALLENGE 1.1: Oracle Parity for ADMIN role", () => {
  const conv = createTestConversation();
  const resolverPerms = resolveConversationPermissions({
    user: { id: "u-admin", role: "ADMIN", tenantId: "tenant-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  const projected = projectConversation(conv, "admin");

  assert.deepEqual(projected.capabilities, resolverPerms, "Admin capabilities must match exactly");
});

test("CHALLENGE 1.2: Oracle Parity for Primary FREELANCER (toggle OFF)", () => {
  const conv = createTestConversation({
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: false,
  });
  const resolverPerms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  assert.deepEqual(projected.capabilities, resolverPerms, "Primary freelancer (toggle OFF) must match exactly");
  assert.equal(projected.capabilities.canViewCustomerLane, true);
  assert.equal(projected.capabilities.canSendCustomerMessage, false);
});

test("CHALLENGE 1.3: Oracle Parity for Primary FREELANCER (toggle ON)", () => {
  const conv = createTestConversation({
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: true,
  });
  const resolverPerms = resolveConversationPermissions({
    user: { id: "editor-bob", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-bob"],
  });

  assert.deepEqual(projected.capabilities, resolverPerms, "Primary freelancer (toggle ON) must match exactly");
  assert.equal(projected.capabilities.canViewCustomerLane, true);
  assert.equal(projected.capabilities.canSendCustomerMessage, true);
});

test("CHALLENGE 1.4: Oracle Parity for Collaborator FREELANCER", () => {
  const conv = createTestConversation({
    assignedFreelancerId: "editor-primary",
    freelancerCollaborators: [{ freelancerId: "editor-collab", freelancerName: "Collab Editor" }],
    freelancerCustomerLaneAccess: true,
  });
  const resolverPerms = resolveConversationPermissions({
    user: { id: "editor-collab", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
    transportState: "ready",
  });
  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-collab"],
  });

  assert.deepEqual(projected.capabilities, resolverPerms, "Collaborator freelancer must match exactly");
  assert.equal(projected.capabilities.canSendCustomerMessage, false);
  assert.equal(projected.capabilities.canSendInternalMessage, false);
});

test("CHALLENGE 1.5 [DIVERGENCE 1]: Oracle Divergence for CUSTOMER role sending", () => {
  const conv = createTestConversation({ customerId: "cust-c1" });
  const resolverPerms = resolveConversationPermissions({
    user: { id: "cust-c1", role: "CUSTOMER" },
    conversation: conv,
  });
  const projected = projectConversation(conv, "customer");

  // In resolver: CUSTOMER canSendCustomerMessage = true
  assert.equal(resolverPerms.canSendCustomerMessage, true, "Resolver grants CUSTOMER send rights in customer lane");

  // In projectConversation: line 2488 checks audience === 'admin' || 'manager' || 'sales' || 'freelancer', omitting 'customer'!
  // This causes projected.capabilities.canSendCustomerMessage to be false!
  const hasCustomerSendDivergence = resolverPerms.canSendCustomerMessage !== projected.capabilities.canSendCustomerMessage;
  assert.ok(hasCustomerSendDivergence, "Empirically detected divergence: projectConversation fails to mark customer lane writable for audience='customer'");
  assert.equal(projected.capabilities.canSendCustomerMessage, false, "projectConversation sets customer writable=false for customer audience");
});

test("CHALLENGE 1.6 [DIVERGENCE 2]: Oracle Divergence for UNASSIGNED Freelancer view", () => {
  const conv = createTestConversation({
    assignedFreelancerId: "editor-primary",
    freelancerCollaborators: [],
    assignmentOffers: [],
  });
  const resolverPerms = resolveConversationPermissions({
    user: { id: "editor-stranger", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
  });
  const projected = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-stranger"],
  });

  // Resolver: Unassigned freelancer has ALL false
  assert.deepEqual(resolverPerms, createForbiddenPermissions(), "Resolver correctly denies all capabilities to unassigned freelancer");

  // projectConversation: hardcodes canViewConversation = true!
  assert.equal(projected.capabilities.canViewConversation, true, "projectConversation hardcodes canViewConversation=true regardless of assignment");
  const hasUnassignedDivergence = resolverPerms.canViewConversation !== projected.capabilities.canViewConversation;
  assert.ok(hasUnassignedDivergence, "Empirically detected divergence: projectConversation does not reject unassigned freelancer");
});

// ============================================================================
// SECTION 2: RAPID EDITOR REASSIGNMENT LIFECYCLE (A -> Unassign -> B -> Unassign -> C -> Unassign)
// ============================================================================

test("CHALLENGE 2: Rapid editor reassignment lifecycle preserves 100% history and chronological audit consistency", () => {
  const convId = `conv-stress-${Date.now()}`;
  const baseConv = createTestConversation({
    id: convId,
    assignedFreelancerId: "editor-A",
    assignedFreelancerName: "Alice Editor",
    freelancerCustomerLaneAccess: true,
    paymentRequests: [
      { id: "pr-0", amount: 100, currency: "USD", status: "paid", description: "Initial deposit" },
    ],
    assignmentHistory: [
      {
        id: "asgh-0",
        freelancerId: "editor-A",
        freelancerName: "Alice Editor",
        role: "primary",
        assignedAt: new Date(Date.now() - 60000).toISOString(),
      },
    ],
  });

  hydrateDummyPlatformSnapshot({ conversations: [baseConv] });

  // 1. Editor A posts internal update
  appendConversationMessage(convId, {
    role: "freelancer",
    lane: "internal",
    body: "Editor A: Rough cut uploaded.",
  });

  // 2. Unassign Editor A
  const afterA = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Sarah",
    unassignedReason: "Editor A went on leave",
  });
  assert.ok(afterA);

  // 3. Assign Editor B
  const afterAssignB = assignConversationDirectly(convId, "editor-B", "admin", {
    freelancerName: "Bob Editor",
    assignedByName: "Admin Sarah",
  });
  assert.ok(afterAssignB);

  // Editor B posts internal update and customer message
  appendConversationMessage(convId, {
    role: "freelancer",
    lane: "internal",
    body: "Editor B: Picked up project from Editor A.",
  });
  appendConversationMessage(convId, {
    role: "customer",
    lane: "customer",
    body: "Customer: Looks great so far.",
  });

  // 4. Unassign Editor B
  const afterB = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Sarah",
    unassignedReason: "Editor B reallocated to urgent task",
  });
  assert.ok(afterB);

  // 5. Assign Editor C
  const afterAssignC = assignConversationDirectly(convId, "editor-C", "admin", {
    freelancerName: "Charlie Editor",
    assignedByName: "Admin Sarah",
  });
  assert.ok(afterAssignC);

  // Editor C posts internal update
  appendConversationMessage(convId, {
    role: "freelancer",
    lane: "internal",
    body: "Editor C: Final color grading done.",
  });

  // 6. Unassign Editor C
  const finalConv = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Sarah",
    unassignedReason: "Project complete, editor detached",
  });
  assert.ok(finalConv);

  // INVARIANT 1: 100% cumulative message count (0 messages lost)
  const messageBodies = finalConv.messages.map((m) => m.body);
  assert.ok(messageBodies.some((b) => b.includes("Initial footage delivered")));
  assert.ok(messageBodies.some((b) => b.includes("Editor A: Rough cut uploaded")));
  assert.ok(messageBodies.some((b) => b.includes("Editor B: Picked up project")));
  assert.ok(messageBodies.some((b) => b.includes("Customer: Looks great so far")));
  assert.ok(messageBodies.some((b) => b.includes("Editor C: Final color grading done")));

  // INVARIANT 2: System audit removal notes are all recorded in messages
  const removalNotes = finalConv.messages.filter(
    (m) => m.lane === "internal" && m.body.includes("was removed. This project is now unassigned."),
  );
  assert.equal(removalNotes.length, 3, "Exactly 3 removal notes appended for A, B, and C");

  // INVARIANT 3: Payment requests intact
  assert.equal(finalConv.paymentRequests.length, 1);
  assert.equal(finalConv.paymentRequests[0].id, "pr-0");

  // INVARIANT 4: Structured assignmentHistory contains all 3 transitions
  assert.ok(finalConv.assignmentHistory);
  assert.ok(finalConv.assignmentHistory.length >= 3);

  const entryA = finalConv.assignmentHistory.find((h) => h.freelancerId === "editor-A");
  const entryB = finalConv.assignmentHistory.find((h) => h.freelancerId === "editor-B");
  const entryC = finalConv.assignmentHistory.find((h) => h.freelancerId === "editor-C");

  assert.ok(entryA, "Entry for Editor A must exist");
  assert.ok(entryB, "Entry for Editor B must exist");
  assert.ok(entryC, "Entry for Editor C must exist");

  // INVARIANT 5: Chronological consistency & termination metadata
  for (const entry of [entryA, entryB, entryC]) {
    assert.ok(entry.assignedAt, `Entry for ${entry.freelancerId} must have assignedAt`);
    assert.ok(entry.removedAt, `Entry for ${entry.freelancerId} must have removedAt`);
    assert.equal(entry.removedByName, "Admin Sarah");
    assert.ok(entry.unassignedReason, "unassignedReason must be recorded");

    const assignedMs = new Date(entry.assignedAt).getTime();
    const removedMs = new Date(entry.removedAt).getTime();
    assert.ok(
      assignedMs <= removedMs,
      `assignedAt (${entry.assignedAt}) must be <= removedAt (${entry.removedAt}) for ${entry.freelancerId}`,
    );
  }

  // Cross-entry chronological order
  const removedAMs = new Date(entryA.removedAt).getTime();
  const assignedBMs = new Date(entryB.assignedAt).getTime();
  const removedBMs = new Date(entryB.removedAt).getTime();
  const assignedCMs = new Date(entryC.assignedAt).getTime();
  const removedCMs = new Date(entryC.removedAt).getTime();

  assert.ok(removedAMs <= assignedBMs, "Editor A removed before or at Editor B assigned");
  assert.ok(removedBMs <= assignedCMs, "Editor B removed before or at Editor C assigned");
  assert.ok(assignedCMs <= removedCMs, "Editor C assigned before or at Editor C removed");

  // INVARIANT 6: Final state is completely unassigned
  assert.equal(finalConv.assignedFreelancerId, undefined);
  assert.equal(finalConv.freelancerCollaborators?.length ?? 0, 0);
  assert.equal(finalConv.status, "Manager Review");
});

// ============================================================================
// SECTION 3: REMOVED EDITOR ZERO-ACCESS VERIFICATION (GET & POST)
// ============================================================================

test("CHALLENGE 3.1: Removed editors receive 0 capabilities from resolver", () => {
  const conv = createTestConversation({
    assignedFreelancerId: undefined,
    freelancerCollaborators: [],
    assignmentOffers: [],
  });

  for (const removedId of ["editor-A", "editor-B", "editor-C"]) {
    const perms = resolveConversationPermissions({
      user: { id: removedId, role: "FREELANCER", tenantId: "tenant-alpha" },
      conversation: conv,
    });
    assert.deepEqual(perms, createForbiddenPermissions(), `Removed ${removedId} must have all 7 flags false`);
  }
});

test("CHALLENGE 3.2: Removed editor cannot discover conversation in listConversationsForAudience", () => {
  const testConvId = `conv-list-leak-${Date.now()}`;
  const conv = createTestConversation({
    id: testConvId,
    assignedFreelancerId: undefined,
    freelancerCollaborators: [],
    assignmentOffers: [
      { id: "off-A", freelancerId: "editor-A", status: "EXPIRED" },
      { id: "off-B", freelancerId: "editor-B", status: "ACCEPTED" }, // Stale historical accepted offer
    ],
  });

  hydrateDummyPlatformSnapshot({ conversations: [conv] });

  for (const editorId of ["editor-A", "editor-B", "editor-C"]) {
    const listResult = listConversationsForAudience("freelancer", {
      freelancerId: editorId,
      freelancerIds: [editorId],
    });
    const found = listResult.conversations.some((c) => c.id === testConvId);
    assert.equal(found, false, `Removed ${editorId} must NOT see conversation in list (even with past ACCEPTED offer)`);
  }
});

test("CHALLENGE 3.3: Verification that POST message access logic denies unassigned/removed editor", () => {
  const conv = createTestConversation({
    assignedFreelancerId: undefined,
    freelancerCollaborators: [],
  });

  const removedPerms = resolveConversationPermissions({
    user: { id: "editor-A", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
  });

  // Emulating messages/route.ts lines 144-150:
  // if (!tenantAccess.ok) -> HTTP 403
  const isViewAllowed = removedPerms.canViewConversation;
  assert.equal(isViewAllowed, false, "GET/POST tenantAccess check returns false for removed editor");

  // Emulating messages/route.ts lines 161-166:
  // if (!access.canWriteInternalLane) -> HTTP 403
  const isWriteInternalAllowed = removedPerms.canSendInternalMessage;
  assert.equal(isWriteInternalAllowed, false, "Internal lane write returns false for removed editor");

  // Emulating messages/route.ts lines 168-174:
  // if (!access.conversation.freelancerCustomerLaneAccess || !access.canWriteCustomerLane) -> HTTP 403
  const isWriteCustomerAllowed = removedPerms.canSendCustomerMessage;
  assert.equal(isWriteCustomerAllowed, false, "Customer lane write returns false for removed editor");
});

// ============================================================================
// SECTION 4: INPUT FUZZING (150+ Generated Permutations)
// ============================================================================

test("CHALLENGE 4: Fuzzing resolveConversationPermissions with 150+ adversarial, boundary, and malformed inputs", () => {
  const roles = [
    "SUPER_ADMIN", "ADMIN", "MANAGER", "FREELANCER", "CUSTOMER", "SALES_AGENT",
    "HACKER", "admin", "super_admin", "freelancer", "customer", "sales_agent",
    "", "   ", null, undefined, 123, true, false, {}, [], "__proto__",
  ];

  const tenantCombinations = [
    { userTenant: "tenant-1", convTenant: "tenant-1" },
    { userTenant: "tenant-1", convTenant: "tenant-2" },
    { userTenant: null, convTenant: "tenant-1" },
    { userTenant: "tenant-1", convTenant: null },
    { userTenant: undefined, convTenant: undefined },
    { userTenant: "", convTenant: "" },
    { userTenant: "  tenant-1  ", convTenant: "tenant-1" },
    { userTenant: "TENANT-1", convTenant: "tenant-1" },
  ];

  const memberships = [
    null,
    undefined,
    {},
    { status: "ACTIVE" },
    { status: "SUSPENDED" },
    { status: "EXPIRED" },
    { status: null },
    { scope: null },
    { scope: { clientIds: ["cust-1"] } },
    { scope: { projectIds: ["conv-1"] } },
    { scope: { editorIds: ["editor-1"] } },
    { scope: { clientIds: [], projectIds: [], editorIds: [] } },
    { scope: { clientIds: null, projectIds: undefined } },
  ];

  const transportStates = ["ready", "demo", "blocked", "UNKNOWN", null, undefined, "", 0, true];

  let testCount = 0;

  // 1. Primitive and malformed root inputs
  const rootMalformedInputs = [
    null,
    undefined,
    {},
    { user: null },
    { conversation: null },
    { user: {}, conversation: {} },
    { user: { role: null }, conversation: { id: "c1", tenantId: "t1" } },
    { user: { role: "ADMIN" }, conversation: null },
    "invalid-input",
    12345,
    [],
  ];

  for (const malformed of rootMalformedInputs) {
    testCount++;
    assert.doesNotThrow(() => {
      const perms = resolveConversationPermissions(malformed);
      assert.deepEqual(perms, createForbiddenPermissions(), `Malformed input ${JSON.stringify(malformed)} must fail closed`);
    });
  }

  // 2. Permutation fuzzing across roles and tenants
  for (const role of roles) {
    for (const { userTenant, convTenant } of tenantCombinations) {
      testCount++;
      assert.doesNotThrow(() => {
        const input = {
          user: {
            id: `user-${testCount}`,
            role,
            tenantId: userTenant,
            displayName: "Test User",
            candidateIds: [`cand-${testCount}`],
            candidateNames: ["Test User"],
          },
          conversation: {
            id: `conv-${testCount}`,
            tenantId: convTenant,
            customerId: "cust-1",
            assignedFreelancerId: "cand-1",
            assignedFreelancerName: "Test User",
            freelancerCustomerLaneAccess: testCount % 2 === 0,
            isInAppCustomerThread: testCount % 3 === 0,
          },
          membership: memberships[testCount % memberships.length],
          transportState: transportStates[testCount % transportStates.length],
        };

        const perms = resolveConversationPermissions(input);

        // Security check: Must always return an object with all 7 boolean keys
        assert.equal(typeof perms, "object", "Output must be an object");
        assert.ok(perms !== null, "Output must not be null");
        assert.equal(typeof perms.canViewConversation, "boolean");
        assert.equal(typeof perms.canViewCustomerLane, "boolean");
        assert.equal(typeof perms.canViewInternalLane, "boolean");
        assert.equal(typeof perms.canViewPrivateMessages, "boolean");
        assert.equal(typeof perms.canSendCustomerMessage, "boolean");
        assert.equal(typeof perms.canSendInternalMessage, "boolean");
        assert.equal(typeof perms.canManageParticipants, "boolean");

        // Security invariant: Invalid/unknown roles must NEVER receive permissions
        const isValidRole = ["SUPER_ADMIN", "ADMIN", "MANAGER", "FREELANCER", "CUSTOMER", "SALES_AGENT"].includes(role);
        if (!isValidRole) {
          assert.deepEqual(perms, createForbiddenPermissions(), `Invalid role '${role}' must fail closed`);
        }

        // Security invariant: Freelancers must NEVER view private messages
        if (role === "FREELANCER") {
          assert.equal(perms.canViewPrivateMessages, false, "Freelancer must NEVER have canViewPrivateMessages=true");
          assert.equal(perms.canManageParticipants, false, "Freelancer must NEVER have canManageParticipants=true");
        }

        // Security invariant: Cross-tenant non-super-admins (except freelancer) must be forbidden
        if (role === "ADMIN" && userTenant && convTenant && userTenant !== convTenant) {
          assert.deepEqual(perms, createForbiddenPermissions(), "Cross-tenant ADMIN must fail closed");
        }
      });
    }
  }

  // 3. Prototype pollution and attack payloads
  const attackPayloads = [
    {
      user: { id: "admin", role: "ADMIN", tenantId: "t1", __proto__: { role: "SUPER_ADMIN" } },
      conversation: { id: "c1", tenantId: "t2" },
    },
    {
      user: { id: "freelancer", role: "FREELANCER", candidateIds: ["__proto__", "constructor"] },
      conversation: { id: "c1", tenantId: "t1", assignedFreelancerId: "toString" },
    },
    {
      user: { id: "cust", role: "CUSTOMER" },
      conversation: { id: "c1", tenantId: "t1", customerId: { $ne: null } },
    },
  ];

  for (const attack of attackPayloads) {
    testCount++;
    assert.doesNotThrow(() => {
      const perms = resolveConversationPermissions(attack);
      assert.equal(typeof perms.canViewConversation, "boolean");
    });
  }

  assert.ok(testCount >= 150, `Executed ${testCount} fuzzed combinations (requirement >= 100)`);
});

// ============================================================================
// SECTION 5: EMPIRICAL REPRODUCTION OF THE 2 E2E TEST FAILURES
// ============================================================================

test("CHALLENGE 5.1 [RESOLVED]: Verify T2_BVA_21 fix (Offered freelancer customer lane view is false)", () => {
  // Test case T2_BVA_21 from tests/chat-permissions-e2e.test.mjs:1108
  const conv = createTestConversation({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-offered", status: "PENDING" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-offered", role: "FREELANCER", tenantId: "tenant-alpha" },
    conversation: conv,
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, false);
  assert.equal(
    perms.canViewCustomerLane,
    false,
    "FIX VERIFIED: Offered freelancer cannot view customer lane",
  );
});

test("CHALLENGE 5.2 [RESOLVED]: Verify T2_BVA_38 fix (Sales agent clientIds scope check enforced)", () => {
  // Test case T2_BVA_38 from tests/chat-permissions-e2e.test.mjs:1287
  const conv = createTestConversation({ contactId: "client-target" });
  const perms = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-alpha" },
    membership: { scope: { clientIds: ["client-other"] } },
    conversation: conv,
  });

  assert.equal(
    perms.canViewConversation,
    false,
    "FIX VERIFIED: Sales agent with mismatched clientIds scope is forbidden",
  );
});
