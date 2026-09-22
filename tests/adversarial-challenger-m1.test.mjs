import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// ============================================================================
// BUNDLE MODULES UNDER TEST
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
  unassignConversationEditors,
  assignConversationDirectly,
  hydrateDummyPlatformSnapshot,
} = store;

function createFixture(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "conv-adv-1",
    contactId: "contact-adv-1",
    customerId: "cust-adv-1",
    customerName: "Alice Client",
    customerPhone: "+15550199",
    maskedCustomerName: "A*** C***",
    serviceId: "svc-adv-1",
    serviceSlug: "video-edit-adv",
    serviceTitle: "Adversarial Test Service",
    tenantId: "tenant-agency-alpha",
    status: "Active",
    leadStatusId: "assigned",
    summary: "Public Briefing",
    internalNotes: "Confidential Agency Note",
    assignedFreelancerId: "editor-primary-1",
    assignedFreelancerName: "Primary Bob",
    freelancerCollaborators: [],
    assignmentOffers: [],
    readStateByAudience: {},
    lastCustomerActivityAt: now,
    isInAppCustomerThread: true,
    freelancerCustomerLaneAccess: false,
    paymentRequests: [],
    typing: [],
    messages: [],
    createdAt: "2026-09-05T08:00:00.000Z",
    updatedAt: now,
    ...overrides,
  };
}

// ============================================================================
// SECTION 1: MALFORMED, ADVERSARIAL & BOUNDARY INPUTS TO RESOLVER
// ============================================================================

test("ADV_01: resolveConversationPermissions fails closed on null, undefined, primitives, or empty objects", () => {
  assert.deepEqual(resolveConversationPermissions(null), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions(undefined), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions({}), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions(123), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions("malicious-string"), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions({ user: null, conversation: null }), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions({ user: { id: "u1" }, conversation: null }), createForbiddenPermissions());
  assert.deepEqual(resolveConversationPermissions({ user: { id: "u1", role: null }, conversation: { id: "c1" } }), createForbiddenPermissions());
});

test("ADV_02: Prototype pollution or non-standard roles in user.role fail closed", () => {
  const dangerousRoles = ["__proto__", "constructor", "toString", "valueOf", "ADMIN; DROP TABLE", "admin ", " ADMIN", "administrator"];
  for (const role of dangerousRoles) {
    const p = resolveConversationPermissions({
      user: { id: "attacker", role, tenantId: "tenant-agency-alpha" },
      conversation: createFixture(),
    });
    assert.deepEqual(p, createForbiddenPermissions(), `Role '${role}' must fail closed`);
  }
});

test("ADV_03: Null or non-array elements in freelancerCollaborators and assignmentOffers do not throw Uncaught TypeError", () => {
  const convWithCorruptCollaborators = createFixture({
    assignedFreelancerId: "other-editor",
    freelancerCollaborators: [null, undefined, { freelancerId: "editor-target", freelancerName: "Target Editor" }],
    assignmentOffers: [null, undefined, { freelancerId: "editor-target", status: "PENDING" }],
  });

  // Must not throw Uncaught TypeError: Cannot read properties of null
  assert.doesNotThrow(() => {
    resolveConversationPermissions({
      user: { id: "editor-target", role: "FREELANCER" },
      conversation: convWithCorruptCollaborators,
    });
  });
});

test("ADV_04: Candidate names with whitespace or special characters do not grant unauthorized primary access", () => {
  // Conversation is UNASSIGNED but has placeholder/punctuation assignedFreelancerName
  const convUnassigned = createFixture({
    assignedFreelancerId: undefined,
    assignedFreelancerName: " - ",
  });

  // Freelancer has artifact candidate name
  const perms = resolveConversationPermissions({
    user: {
      id: "editor-attacker",
      role: "FREELANCER",
      displayName: "Attacker",
      candidateNames: [" - "],
    },
    conversation: convUnassigned,
  });

  // CHALLENGE: Attacker must NOT be granted primary editor access!
  assert.equal(
    perms.canViewConversation,
    false,
    "VULNERABILITY DETECTED: Placeholder punctuation in assignedFreelancerName collapsed with candidateNames to grant unauthorized access!"
  );
});

// ============================================================================
// SECTION 2: TENANT & CUSTOMER BOUNDARY ENFORCEMENT VULNERABILITY CHALLENGES
// ============================================================================

test("ADV_05: ADMIN with null/undefined tenantId must NOT gain cross-tenant access to another agency", () => {
  const targetConv = createFixture({ tenantId: "victim-agency-confidential" });

  // Attacker is an ADMIN whose JWT or session omitted tenantId (e.g. malformed or forged token)
  const perms = resolveConversationPermissions({
    user: { id: "admin-untenanted", role: "ADMIN", tenantId: null },
    conversation: targetConv,
  });

  // SECURITY CHALLENGE: An ADMIN without a tenantId MUST NOT be granted full access across all agencies!
  assert.equal(
    perms.canViewConversation,
    false,
    "CRITICAL VULNERABILITY: ADMIN with null tenantId bypassed tenant boundary and gained full access to agency conversation!"
  );
});

test("ADV_06: MANAGER with null/undefined tenantId must NOT gain cross-tenant access to another agency", () => {
  const targetConv = createFixture({ tenantId: "victim-agency-confidential" });

  const perms = resolveConversationPermissions({
    user: { id: "mgr-untenanted", role: "MANAGER", tenantId: undefined },
    conversation: targetConv,
  });

  assert.equal(
    perms.canViewConversation,
    false,
    "CRITICAL VULNERABILITY: MANAGER with undefined tenantId bypassed tenant boundary and gained full access to agency conversation!"
  );
});

test("ADV_07: CUSTOMER role must NOT access conversations where customerId is null/unlinked", () => {
  // Unlinked conversation (e.g. fresh inbound lead from WhatsApp before CRM contact binding)
  const unlinkedConv = createFixture({
    customerId: null,
    contactId: "contact-anonymous-lead",
  });

  // Unrelated random customer user
  const perms = resolveConversationPermissions({
    user: { id: "customer-unrelated-random", role: "CUSTOMER" },
    conversation: unlinkedConv,
  });

  // SECURITY CHALLENGE: An unlinked conversation must NOT be exposed to every customer on the platform!
  assert.equal(
    perms.canViewConversation,
    false,
    "CRITICAL VULNERABILITY: Conversation with null customerId allowed open access to random customer user!"
  );
});

test("ADV_08: SALES_AGENT scope enforcement on clientIds (Reproduction of T2_BVA_38)", () => {
  const conv = createFixture({ contactId: "client-target" });
  const perms = resolveConversationPermissions({
    user: { id: "sales-1", role: "SALES_AGENT", tenantId: "tenant-agency-alpha" },
    membership: { scope: { clientIds: ["client-other"] } },
    conversation: conv,
  });

  assert.equal(
    perms.canViewConversation,
    false,
    "SALES_AGENT must be forbidden when membership scope clientIds does not match conversation contactId"
  );
});

test("ADV_09: Unassigned editor with pending offer must NOT have canViewCustomerLane = true (Reproduction of T2_BVA_21)", () => {
  const conv = createFixture({
    assignedFreelancerId: undefined,
    assignmentOffers: [{ freelancerId: "editor-offered", status: "PENDING" }],
  });
  const perms = resolveConversationPermissions({
    user: { id: "editor-offered", role: "FREELANCER", tenantId: "tenant-agency-alpha" },
    conversation: conv,
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(
    perms.canViewCustomerLane,
    false,
    "An unassigned editor with only a pending offer must NOT view customer messages"
  );
});

// ============================================================================
// SECTION 3: HIGH MESSAGE VOLUME STRESS & MIXED VISIBILITY LEAKAGE
// ============================================================================

test("ADV_10: High volume stress test (2,500 mixed messages) verifies zero private leaks and linear performance", () => {
  const TOTAL_MESSAGES = 2500;
  const messages = [];
  const baseTime = new Date("2026-09-05T00:00:00.000Z").getTime();

  for (let i = 0; i < TOTAL_MESSAGES; i++) {
    const isPrivate = i % 3 === 0; // 1/3 of messages are client_private
    const isCustomerLane = i % 2 === 0;
    messages.push({
      id: `msg-stress-${i}`,
      lane: isCustomerLane ? "customer" : "internal",
      senderRole: isPrivate ? "admin" : isCustomerLane ? "customer" : "admin",
      senderLabel: isPrivate ? "Confidential Admin" : "Sender",
      body: isPrivate
        ? `TOP_SECRET_RATE_PROFIT_LEAK_${i}: Agency margin is $${i * 10}`
        : `Public regular communication body index ${i}`,
      visibility: isPrivate ? "client_private" : undefined,
      createdAt: new Date(baseTime + i * 1000).toISOString(),
    });
  }

  // Ensure latest message is PRIVATE
  messages.push({
    id: `msg-stress-final-private`,
    lane: "customer",
    senderRole: "admin",
    senderLabel: "Confidential Admin",
    body: "FINAL_PRIVATE_RATE_LEAK_CONFIDENTIAL_BUDGET",
    visibility: "client_private",
    createdAt: new Date(baseTime + TOTAL_MESSAGES * 1000).toISOString(),
  });

  const conv = createFixture({
    messages,
    summary: "Service Default Summary",
    serviceTitle: "Stress Video Service",
  });

  const startTime = performance.now();
  const freelancerview = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-primary-1"],
  });
  const elapsed = performance.now() - startTime;

  // 1. Performance check: 2,500 messages must be projected in < 150ms
  assert.ok(elapsed < 150, `High-volume projection took ${elapsed.toFixed(2)}ms (expected < 150ms)`);

  // 2. Strict leakage check: Zero client_private messages in the output array
  const privateCount = freelancerview.messages.filter((m) => m.visibility === "client_private").length;
  assert.equal(privateCount, 0, "Zero client_private messages must be returned to freelancer");

  // 3. String content search: None of the private tokens should appear in any message body
  const bodyConcatenation = freelancerview.messages.map((m) => m.body).join(" ");
  assert.ok(!bodyConcatenation.includes("TOP_SECRET_RATE_PROFIT_LEAK"), "Private body text leaked into freelancer messages");
  assert.ok(!bodyConcatenation.includes("FINAL_PRIVATE_RATE_LEAK"), "Final private message leaked into freelancer messages");

  // 4. Summary leakage: Summary must NOT reflect the latest private message
  assert.ok(!freelancerview.summary.includes("FINAL_PRIVATE_RATE_LEAK"), "Summary leaked final private message text");
  assert.ok(!freelancerview.summary.includes("TOP_SECRET"), "Summary leaked private message text");

  // 5. Total message count check: Total = 2501; private = 834 + 1 = 835; visible = 1666
  assert.equal(freelancerview.messages.length, messages.length - 834 - 1);
});

// ============================================================================
// SECTION 4: VISIBILITY CASING & SANITIZATION ADVERSARIAL CHALLENGES
// ============================================================================

test("ADV_11: Non-canonical visibility strings (e.g. 'CLIENT_PRIVATE', 'client_private ') security stripping", () => {
  const conv = createFixture({
    messages: [
      {
        id: "msg-case-1",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "UPPERCASE_PRIVATE_SECRET: Margin 80%",
        visibility: "CLIENT_PRIVATE",
        createdAt: "2026-09-05T09:00:00.000Z",
      },
      {
        id: "msg-case-2",
        lane: "customer",
        senderRole: "admin",
        senderLabel: "Admin",
        body: "TRAILING_SPACE_PRIVATE_SECRET: Margin 90%",
        visibility: "client_private ",
        createdAt: "2026-09-05T09:01:00.000Z",
      },
    ],
  });

  const view = projectConversation(conv, "freelancer", {
    freelancerAliasKeys: ["editor-primary-1"],
  });

  // CHALLENGE: If visibility is not normalized to lowercase trimmed string,
  // malformed visibility tags will bypass the stripper!
  const hasLeak1 = view.messages.some((m) => m.body.includes("UPPERCASE_PRIVATE_SECRET"));
  const hasLeak2 = view.messages.some((m) => m.body.includes("TRAILING_SPACE_PRIVATE_SECRET"));

  assert.equal(
    hasLeak1 || hasLeak2,
    false,
    "VULNERABILITY DETECTED: Non-canonical visibility casing/whitespace bypassed server-side stripping and exposed private messages to freelancer!"
  );
});

// ============================================================================
// SECTION 5: UNASSIGNMENT / REASSIGNMENT CONCURRENCY & AUDIT INTEGRITY
// ============================================================================

test("ADV_12: Idempotent double-unassignment does not duplicate removal messages or corrupt audit history", () => {
  const convId = `conv-idem-${Date.now()}`;
  const seeded = createFixture({
    id: convId,
    assignedFreelancerId: "editor-initial",
    assignedFreelancerName: "Initial Editor",
    messages: [
      {
        id: "msg-orig-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "Original project briefing message",
        createdAt: "2026-09-05T08:00:00.000Z",
      },
    ],
  });

  hydrateDummyPlatformSnapshot({ conversations: [seeded] });

  // First unassign
  const firstUnassign = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Alex",
    unassignedReason: "First removal",
  });
  assert.ok(firstUnassign);
  const msgCountAfterFirst = firstUnassign.messages.length;
  const historyCountAfterFirst = firstUnassign.assignmentHistory?.length ?? 0;

  // Second unassign immediately following
  const secondUnassign = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Alex",
    unassignedReason: "Duplicate second removal attempt",
  });
  assert.ok(secondUnassign);

  // Idempotency check: No duplicate messages appended, no extra history entries
  assert.equal(
    secondUnassign.messages.length,
    msgCountAfterFirst,
    "Idempotency violation: Second unassign appended duplicate removal notes"
  );
  assert.equal(
    secondUnassign.assignmentHistory?.length ?? 0,
    historyCountAfterFirst,
    "Idempotency violation: Second unassign duplicated assignmentHistory"
  );
});

test("ADV_13: Reassignment lifecycle preserves audit history and isolates access across editors", () => {
  const convId = `conv-reassign-${Date.now()}`;
  const seeded = createFixture({
    id: convId,
    assignedFreelancerId: "editor-first",
    assignedFreelancerName: "First Editor",
    messages: [
      {
        id: "m-1",
        lane: "customer",
        senderRole: "customer",
        senderLabel: "Client",
        body: "Project requirements",
        createdAt: "2026-09-05T08:00:00.000Z",
      },
    ],
  });

  hydrateDummyPlatformSnapshot({ conversations: [seeded] });

  // 1. Unassign First Editor
  const afterUnassign = unassignConversationEditors(convId, "admin", {
    removedByName: "Admin Boss",
    unassignedReason: "Skillset mismatch",
  });
  assert.equal(afterUnassign.assignedFreelancerId, undefined);

  // First Editor tries to resolve permissions
  const permsFirst = resolveConversationPermissions({
    user: { id: "editor-first", role: "FREELANCER" },
    conversation: afterUnassign,
  });
  assert.equal(permsFirst.canViewConversation, false, "Unassigned First Editor must not have access");

  // 2. Assign Second Editor directly
  const afterReassign = assignConversationDirectly(convId, "editor-second", "admin", {
    assignedByName: "Admin Boss",
  });
  assert.ok(afterReassign);
  assert.equal(afterReassign.assignedFreelancerId, "editor-second");

  // Verify Second Editor has access
  const permsSecond = resolveConversationPermissions({
    user: { id: "editor-second", role: "FREELANCER" },
    conversation: afterReassign,
  });
  assert.equal(permsSecond.canViewConversation, true, "Second Editor must have access");

  // Verify First Editor STILL has NO access
  const permsFirstAgain = resolveConversationPermissions({
    user: { id: "editor-first", role: "FREELANCER" },
    conversation: afterReassign,
  });
  assert.equal(permsFirstAgain.canViewConversation, false, "First Editor must STILL have zero access");

  // Verify all original messages intact
  assert.ok(afterReassign.messages.some((m) => m.body === "Project requirements"));
});
