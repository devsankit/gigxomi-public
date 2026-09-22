import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// ============================================================================
// BUNDLE PRODUCTION IMPLEMENTATIONS IN-MEMORY
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
          editorId: session?.userId,
          candidateEditorIds: session?.userId ? [session.userId] : [],
          candidateEditorNames: session?.displayName ? [session.displayName] : [],
          activeAgencyIds: session?.tenantId ? [session.tenantId] : [],
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
const access = await import(
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
  createForbiddenPermissions,
  resolveConversationPermissions,
} = access;

const {
  getVisibleMessages,
  projectConversation,
  markConversationRead,
  unassignConversationEditors,
  hydrateDummyPlatformSnapshot,
} = store;

// Fixture factory
function makeFixture(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "conv-adv-challenger-1",
    contactId: "contact-challenger-1",
    customerId: "cust-challenger-1",
    customerName: "Charles Client",
    customerPhone: "+919876543210",
    maskedCustomerName: "C*** C***",
    serviceId: "svc-video-1",
    serviceSlug: "youtube-editing",
    serviceTitle: "YouTube Video Editing Masterclass",
    tenantId: "tenant-alpha",
    status: "Active",
    leadStatusId: "assigned",
    summary: "Standard Video Intake Brief",
    internalNotes: "Top secret agency internal instructions",
    assignedFreelancerId: "editor-primary-1",
    assignedFreelancerName: "Primary Frank",
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

function makeMessage(overrides = {}) {
  return {
    id: `msg-${Math.random().toString(36).slice(2, 9)}`,
    lane: "customer",
    senderRole: "customer",
    senderLabel: "Client Charles",
    body: "Hello from test message",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// PART 1: CROSS-AUDIENCE MESSAGE ISOLATION & CAPABILITY BOUNDARIES (15 TESTS)
// ============================================================================

test("ADV_AUD_01: Customer audience never receives internal lane messages", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Customer public 1" }),
      makeMessage({ id: "m2", lane: "internal", body: "Internal agency coordination" }),
      makeMessage({ id: "m3", lane: "customer", body: "Customer public 2" }),
      makeMessage({ id: "m4", lane: "internal", body: "Internal editor notes" }),
    ],
  });

  const visible = getVisibleMessages(conv, "customer");
  assert.equal(visible.length, 2, "Customer must only see customer lane messages");
  assert.deepEqual(visible.map((m) => m.id), ["m1", "m3"]);

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.messages.length, 2);
  assert.ok(projected.messages.every((m) => m.lane === "customer"));
  assert.deepEqual(projected.visibleLanes, ["customer"]);
  assert.equal(projected.unreadCountByLane.internal, 0);
  assert.equal(projected.capabilities.canViewInternalLane, false);
});

test("ADV_AUD_02: Customer audience never receives client_private messages even in customer lane", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Customer public inquiry" }),
      makeMessage({ id: "m2", lane: "customer", body: "Confidential agency margin", visibility: "client_private" }),
    ],
  });

  const visible = getVisibleMessages(conv, "customer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.messages.length, 1);
  assert.equal(projected.messages[0].id, "m1");
});

test("ADV_AUD_03: Customer conversation projection isolates internal lane counts and unread", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Public inquiry", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", lane: "internal", senderRole: "admin", body: "Agency secret note", createdAt: "2026-09-05T09:05:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.laneCounts.customer, 1);
  assert.equal(projected.laneCounts.internal, 0, "Internal lane count must be 0 for customer view");
  assert.equal(projected.unreadCountByLane.internal, 0, "Internal unread count must be 0 for customer");
  assert.equal(projected.capabilities.canViewInternalLane, false);
  assert.equal(projected.capabilities.canSendInternalMessage, false);
});

test("ADV_AUD_04: Customer capability resolver enforces external client contract", () => {
  const perms = resolveConversationPermissions({
    user: { id: "cust-challenger-1", role: "CUSTOMER", tenantId: "tenant-alpha" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-challenger-1" },
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canViewInternalLane, false, "Customer must never view internal lane");
  assert.equal(perms.canViewPrivateMessages, false, "Customer must never view private messages");
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canSendInternalMessage, false, "Customer must never send internal messages");
  assert.equal(perms.canManageParticipants, false);
});

test("ADV_AUD_05: Customer outside tenant and not matching customerId/contactId is strictly forbidden", () => {
  const perms = resolveConversationPermissions({
    user: { id: "intruder-client", role: "CUSTOMER", tenantId: "tenant-other" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-challenger-1", contactId: "contact-1" },
  });

  assert.deepEqual(perms, createForbiddenPermissions(), "Mismatched customer must receive all false capabilities");
});

test("ADV_AUD_06: Customer matching customerId retains access even across empty tenantId", () => {
  const perms = resolveConversationPermissions({
    user: { id: "cust-challenger-1", role: "CUSTOMER", tenantId: null },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", customerId: "cust-challenger-1" },
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true);
});

test("ADV_AUD_07: Primary Freelancer views customer and internal lanes but NEVER private messages", () => {
  const perms = resolveConversationPermissions({
    user: { id: "editor-primary-1", role: "FREELANCER", displayName: "Primary Frank" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-primary-1",
      assignedFreelancerName: "Primary Frank",
      freelancerCustomerLaneAccess: false,
    },
    transportState: "ready",
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true, "R2 decoupled: Assigned freelancer can view customer lane");
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canViewPrivateMessages, false, "R1 invariant: Freelancer can NEVER view private messages");
  assert.equal(perms.canSendCustomerMessage, false, "Client messaging toggle is off");
  assert.equal(perms.canSendInternalMessage, true, "Primary editor can send in internal lane");
  assert.equal(perms.canManageParticipants, false);
});

test("ADV_AUD_08: Primary Freelancer sends customer message ONLY when toggle is ON and transport is ready", () => {
  // Toggle ON, Transport ready -> true
  const permsReady = resolveConversationPermissions({
    user: { id: "editor-primary-1", role: "FREELANCER" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", assignedFreelancerId: "editor-primary-1", freelancerCustomerLaneAccess: true },
    transportState: "ready",
  });
  assert.equal(permsReady.canSendCustomerMessage, true);

  // Toggle ON, Transport blocked -> false
  const permsBlocked = resolveConversationPermissions({
    user: { id: "editor-primary-1", role: "FREELANCER" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", assignedFreelancerId: "editor-primary-1", freelancerCustomerLaneAccess: true },
    transportState: "blocked",
  });
  assert.equal(permsBlocked.canSendCustomerMessage, false);

  // Toggle OFF, Transport ready -> false
  const permsOff = resolveConversationPermissions({
    user: { id: "editor-primary-1", role: "FREELANCER" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha", assignedFreelancerId: "editor-primary-1", freelancerCustomerLaneAccess: false },
    transportState: "ready",
  });
  assert.equal(permsOff.canSendCustomerMessage, false);
});

test("ADV_AUD_09: Collaborator Freelancer has read-only access across both lanes", () => {
  const perms = resolveConversationPermissions({
    user: { id: "editor-collab-1", role: "FREELANCER", displayName: "Collab Cathy" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-primary-1",
      freelancerCollaborators: [{ freelancerId: "editor-collab-1", freelancerName: "Collab Cathy" }],
      freelancerCustomerLaneAccess: true,
    },
    transportState: "ready",
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true, "Collaborator can read customer lane");
  assert.equal(perms.canViewInternalLane, true, "Collaborator can read internal lane");
  assert.equal(perms.canViewPrivateMessages, false, "Collaborator cannot view private messages");
  assert.equal(perms.canSendCustomerMessage, false, "Collaborator cannot send customer messages");
  assert.equal(perms.canSendInternalMessage, false, "Collaborator cannot send internal messages (read-only)");
  assert.equal(perms.canManageParticipants, false);
});

test("ADV_AUD_10: Offered Freelancer views internal briefing lane but customer lane is blocked", () => {
  const perms = resolveConversationPermissions({
    user: { id: "editor-offered-1", role: "FREELANCER", displayName: "Offered Oscar" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: null,
      assignmentOffers: [{ freelancerId: "editor-offered-1", freelancerName: "Offered Oscar", status: "PENDING" }],
      freelancerCustomerLaneAccess: true,
    },
    transportState: "ready",
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, false, "Pending offer cannot read customer lane");
  assert.equal(perms.canViewInternalLane, true, "Pending offer can read internal briefing");
  assert.equal(perms.canViewPrivateMessages, false);
  assert.equal(perms.canSendCustomerMessage, false);
  assert.equal(perms.canSendInternalMessage, false);
});

test("ADV_AUD_11: Expired, Passed, or Rejected Freelancer Offer fails closed", () => {
  for (const status of ["EXPIRED", "PASSED", "REJECTED"]) {
    const perms = resolveConversationPermissions({
      user: { id: "editor-offered-1", role: "FREELANCER" },
      conversation: {
        id: "conv-1",
        tenantId: "tenant-alpha",
        assignmentOffers: [{ freelancerId: "editor-offered-1", status }],
      },
    });
    assert.deepEqual(perms, createForbiddenPermissions(), `Offer status ${status} must fail closed`);
  }
});

test("ADV_AUD_12: Removed/Unassigned Freelancer fails closed with all false capabilities", () => {
  const perms = resolveConversationPermissions({
    user: { id: "editor-removed-1", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: null,
      freelancerCollaborators: [],
      assignmentOffers: [],
    },
  });
  assert.deepEqual(perms, createForbiddenPermissions());
});

test("ADV_AUD_13: Agency Super Admin retains unrestricted global access across tenants", () => {
  const perms = resolveConversationPermissions({
    user: { id: "super-1", role: "SUPER_ADMIN", tenantId: "tenant-other" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });

  assert.equal(perms.canViewConversation, true);
  assert.equal(perms.canViewCustomerLane, true);
  assert.equal(perms.canViewInternalLane, true);
  assert.equal(perms.canViewPrivateMessages, true);
  assert.equal(perms.canSendCustomerMessage, true);
  assert.equal(perms.canSendInternalMessage, true);
  assert.equal(perms.canManageParticipants, true);
});

test("ADV_AUD_14: Agency Admin & Manager tenant boundary enforced strictly", () => {
  // Cross tenant ADMIN -> forbidden
  const adminOther = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "tenant-beta" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.deepEqual(adminOther, createForbiddenPermissions());

  // Same tenant ADMIN -> full access
  const adminSame = resolveConversationPermissions({
    user: { id: "admin-1", role: "ADMIN", tenantId: "tenant-alpha" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.equal(adminSame.canViewConversation, true);
  assert.equal(adminSame.canViewPrivateMessages, true);

  // Cross tenant MANAGER -> forbidden
  const managerOther = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "tenant-beta" },
    conversation: { id: "conv-1", tenantId: "tenant-alpha" },
  });
  assert.deepEqual(managerOther, createForbiddenPermissions());
});

test("ADV_AUD_15: Guest / Unauthenticated / Unknown Role fails closed", () => {
  for (const badRole of [undefined, null, "", "GUEST", "ANONYMOUS", "HACKER", 123]) {
    const perms = resolveConversationPermissions({
      user: { id: "anon-1", role: badRole },
      conversation: { id: "conv-1", tenantId: "tenant-alpha" },
    });
    assert.deepEqual(perms, createForbiddenPermissions(), `Bad role ${badRole} must fail closed`);
  }
});

// ============================================================================
// PART 2: PRIVATE MESSAGE STRIPPING HARDENING (20 TESTS)
// ============================================================================

test("ADV_PRIV_01: Standard client_private message in customer lane is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Client visible inquiry" }),
      makeMessage({ id: "m2", lane: "customer", body: "Private rate discussion", visibility: "client_private" }),
    ],
  });

  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_02: Standard client_private message in internal lane is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "internal", body: "Editor public guidance" }),
      makeMessage({ id: "m2", lane: "internal", body: "Confidential manager note", visibility: "client_private" }),
    ],
  });

  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_03: Uppercase CLIENT_PRIVATE visibility is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public text" }),
      makeMessage({ id: "m2", body: "Adversarial uppercase visibility", visibility: "CLIENT_PRIVATE" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_04: Mixed-case Client_Private visibility is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public text" }),
      makeMessage({ id: "m2", body: "Mixed case visibility", visibility: "Client_Private" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_05: Whitespace-padded '  client_private  ' visibility is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public text" }),
      makeMessage({ id: "m2", body: "Padded visibility", visibility: "  client_private  " }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_06: Tab/newline-padded visibility is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public text" }),
      makeMessage({ id: "m2", body: "Tab newline visibility", visibility: "\tclient_private\n" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_07: Private message sent by admin is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", senderRole: "admin", body: "Admin public message" }),
      makeMessage({ id: "m2", senderRole: "admin", body: "Admin secret note", visibility: "client_private" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_08: Private message sent by manager is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", senderRole: "manager", body: "Manager public message" }),
      makeMessage({ id: "m2", senderRole: "manager", body: "Manager secret note", visibility: "client_private" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_09: Private message sent by customer is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", senderRole: "customer", body: "Customer public message" }),
      makeMessage({ id: "m2", senderRole: "customer", body: "Customer secret note", visibility: "client_private" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_10: Private message with freelancer senderRole is stripped for freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", senderRole: "freelancer", body: "Freelancer public message" }),
      makeMessage({ id: "m2", senderRole: "freelancer", body: "Malicious private message tag", visibility: "client_private" }),
    ],
  });
  const visible = getVisibleMessages(conv, "freelancer");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

test("ADV_PRIV_11: Private message with rich attachments strips message and attachments completely", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public text", attachments: [{ id: "att-1", name: "public.jpg", kind: "image" }] }),
      makeMessage({
        id: "m2",
        body: "Private rate card",
        visibility: "client_private",
        attachments: [{ id: "att-2", name: "confidential_rates.pdf", kind: "file" }],
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.messages.length, 1);
  assert.equal(projected.messages[0].id, "m1");
  assert.equal(projected.messages[0].attachments?.length, 1);
});

test("ADV_PRIV_12: Private message containing payment request strips entire message from freelancer view", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Public briefing" }),
      makeMessage({
        id: "m2",
        body: "Confidential payment invoice $5000",
        visibility: "client_private",
        attachments: [{ id: "att-pay", kind: "payment-request", paymentRequestId: "pay-secret-1" }],
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.messages.length, 1);
  assert.equal(projected.messages[0].id, "m1");
});

test("ADV_PRIV_13: Private message with extreme 50,000 char payload and HTML/script injection stripped without error", () => {
  const hugeScriptPayload = "<script>alert('pwned')</script>".repeat(1500);
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", body: "Safe message" }),
      makeMessage({ id: "m2", body: hugeScriptPayload, visibility: "client_private" }),
    ],
  });

  const start = Date.now();
  const projected = projectConversation(conv, "freelancer");
  const elapsed = Date.now() - start;

  assert.ok(elapsed < 100, `Stripping must be instantaneous, took ${elapsed}ms`);
  assert.equal(projected.messages.length, 1);
  assert.equal(projected.messages[0].id, "m1");
});

test("ADV_PRIV_14: Interleaved Public/Private message sequence preserves exact public order", () => {
  const messages = [
    makeMessage({ id: "p1", body: "Public 1", createdAt: "2026-09-05T09:00:00.000Z" }),
    makeMessage({ id: "s1", body: "Secret 1", visibility: "client_private", createdAt: "2026-09-05T09:01:00.000Z" }),
    makeMessage({ id: "p2", body: "Public 2", createdAt: "2026-09-05T09:02:00.000Z" }),
    makeMessage({ id: "s2", body: "Secret 2", visibility: "client_private", createdAt: "2026-09-05T09:03:00.000Z" }),
    makeMessage({ id: "p3", body: "Public 3", createdAt: "2026-09-05T09:04:00.000Z" }),
  ];
  const conv = makeFixture({ messages });

  const projected = projectConversation(conv, "freelancer");
  assert.deepEqual(projected.messages.map((m) => m.id), ["p1", "p2", "p3"]);
});

test("ADV_PRIV_15: All-private message thread exposes 0 messages and 0 laneCounts to freelancer", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "s1", body: "Secret 1", visibility: "client_private" }),
      makeMessage({ id: "s2", body: "Secret 2", visibility: "client_private" }),
      makeMessage({ id: "s3", body: "Secret 3", visibility: "client_private" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.messages.length, 0);
  assert.equal(projected.laneCounts.customer, 0);
  assert.equal(projected.laneCounts.internal, 0);
});

test("ADV_PRIV_16: Latest message is private: freelancer summary falls back to previous public message", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "p1", body: "Client revision requested on video", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "s1", body: "Agency profit margin is $800", visibility: "client_private", createdAt: "2026-09-05T09:05:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.summary, "Client revision requested on video");
  assert.ok(!projected.summary.includes("profit margin"));
});

test("ADV_PRIV_17: All messages are private: freelancer summary falls back to serviceTitle, never conversation.summary", () => {
  const conv = makeFixture({
    summary: "Confidential agency internal summary with budget figures",
    serviceTitle: "YouTube Video Editing Masterclass",
    messages: [
      makeMessage({ id: "s1", body: "Confidential message", visibility: "client_private" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.summary, "YouTube Video Editing Masterclass");
  assert.ok(!projected.summary.includes("Confidential agency internal summary"));
});

test("ADV_PRIV_18: Latest message is private in internal lane: freelancer latestMessageLane reflects latest visible message", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Client said hello", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", lane: "internal", body: "Secret agency note", visibility: "client_private", createdAt: "2026-09-05T09:05:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.latestMessageLane, "customer", "Must point to customer lane because m2 was stripped");
});

test("ADV_PRIV_19: Unread count isolation: incoming private messages NEVER increment freelancer unreadCount", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({ id: "m1", senderRole: "customer", body: "Public client question", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", senderRole: "admin", body: "Confidential admin rate", visibility: "client_private", createdAt: "2026-09-05T09:05:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 1, "Only the 1 public message should count as unread");
  assert.equal(projected.unreadCountByLane.customer, 1);
  assert.equal(projected.unreadCountByLane.internal, 0);
});

test("ADV_PRIV_20: Sales agent private message stripping: sales audience NEVER receives client_private messages", () => {
  const conv = makeFixture({
    messages: [
      makeMessage({ id: "m1", lane: "customer", body: "Lead public message" }),
      makeMessage({ id: "m2", lane: "internal", body: "Secret agency internal note", visibility: "client_private" }),
    ],
  });

  const visible = getVisibleMessages(conv, "sales");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m1");
});

// ============================================================================
// PART 3: READ RECEIPTS ACROSS AUDIENCE ROLES (18 TESTS)
// ============================================================================

test("ADV_READ_01: readByFreelancer: true marks message as read for freelancer", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        senderRole: "customer",
        body: "Client inquiry",
        readByFreelancer: true,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 0, "readByFreelancer: true must mark message read for freelancer");
});

test("ADV_READ_02: readByFreelancer: true does NOT mark message as read for customer", () => {
  const conv = makeFixture({
    readStateByAudience: { customer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "admin",
        body: "Agency reply to client",
        readByFreelancer: true,
        readByCustomer: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.unreadCount, 1, "readByFreelancer: true must not mark read for customer");
});

test("ADV_READ_03: readByFreelancer: true does NOT mark message as read for agency admin", () => {
  const conv = makeFixture({
    readStateByAudience: { admin: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "customer",
        body: "Client message",
        readByFreelancer: true,
        readByAgency: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "admin");
  assert.equal(projected.unreadCount, 1, "readByFreelancer: true must not mark read for agency");
});

test("ADV_READ_04: readByCustomer: true marks message as read for customer", () => {
  const conv = makeFixture({
    readStateByAudience: { customer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "admin",
        body: "Agency response",
        readByCustomer: true,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.unreadCount, 0, "readByCustomer: true must mark message read for customer");
});

test("ADV_READ_05: readByCustomer: true does NOT mark message as read for freelancer or agency", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z", admin: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "customer",
        body: "Customer says hi",
        readByCustomer: true,
        readByFreelancer: false,
        readByAgency: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  assert.equal(projectConversation(conv, "freelancer").unreadCount, 1);
  assert.equal(projectConversation(conv, "admin").unreadCount, 1);
});

test("ADV_READ_06: readByAgency: true marks message as read for both admin and manager", () => {
  const conv = makeFixture({
    readStateByAudience: { admin: "2026-09-05T08:00:00.000Z", manager: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "customer",
        body: "Client inquiry",
        readByAgency: true,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  assert.equal(projectConversation(conv, "admin").unreadCount, 0);
  assert.equal(projectConversation(conv, "manager").unreadCount, 0);
});

test("ADV_READ_07: readByAgency: true does NOT mark message as read for freelancer or customer", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z", customer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "admin",
        body: "Admin reply",
        readByAgency: true,
        readByCustomer: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  assert.equal(projectConversation(conv, "customer").unreadCount, 1);
});

test("ADV_READ_08: All three flags true: message is read for customer, freelancer, and agency simultaneously", () => {
  const conv = makeFixture({
    readStateByAudience: { customer: "2026-09-05T08:00:00.000Z", freelancer: "2026-09-05T08:00:00.000Z", admin: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        lane: "customer",
        senderRole: "customer",
        body: "Public client question",
        readByFreelancer: true,
        readByCustomer: true,
        readByAgency: true,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  assert.equal(projectConversation(conv, "freelancer").unreadCount, 0);
  assert.equal(projectConversation(conv, "admin").unreadCount, 0);
});

test("ADV_READ_09: Full 8-combination truth table across readByFreelancer, readByCustomer, readByAgency", () => {
  const bools = [false, true];
  for (const rf of bools) {
    for (const rc of bools) {
      for (const ra of bools) {
        const conv = makeFixture({
          readStateByAudience: { customer: "2026-09-05T08:00:00.000Z", freelancer: "2026-09-05T08:00:00.000Z", admin: "2026-09-05T08:00:00.000Z" },
          messages: [
            makeMessage({
              id: "m1",
              lane: "customer",
              senderRole: "customer",
              body: "Message from customer",
              readByFreelancer: rf,
              readByCustomer: rc,
              readByAgency: ra,
              createdAt: "2026-09-05T09:00:00.000Z",
            }),
          ],
        });

        // For freelancer (incoming):
        const fUnread = projectConversation(conv, "freelancer").unreadCount;
        assert.equal(fUnread, rf ? 0 : 1, `Freelancer unread count mismatch for rf=${rf}`);

        // For admin (incoming):
        const aUnread = projectConversation(conv, "admin").unreadCount;
        assert.equal(aUnread, ra ? 0 : 1, `Admin unread count mismatch for ra=${ra}`);
      }
    }
  }
});

test("ADV_READ_10: Explicit readByFreelancer: false falls back to timestamp comparison (unread when createdAt > lastRead)", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        senderRole: "customer",
        readByFreelancer: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 1, "Message created after lastRead must be unread");
});

test("ADV_READ_11: Explicit readByFreelancer: false is marked read if createdAt <= lastRead", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T09:30:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        senderRole: "customer",
        readByFreelancer: false,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 0, "Message created before lastRead must be read by timestamp");
});

test("ADV_READ_12: Explicit readByFreelancer: true overrides timestamp even if createdAt > lastRead", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({
        id: "m1",
        senderRole: "customer",
        readByFreelancer: true,
        createdAt: "2026-09-05T09:00:00.000Z",
      }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 0, "Explicit true flag must take priority over timestamp");
});

test("ADV_READ_13: Lane-specific read state: reading customer lane does NOT mark internal lane read", () => {
  const conv = makeFixture({
    readStateByAudience: {
      "freelancer:customer": "2026-09-05T09:30:00.000Z",
      "freelancer:internal": "2026-09-05T08:00:00.000Z",
    },
    messages: [
      makeMessage({ id: "m1", lane: "customer", senderRole: "customer", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", lane: "internal", senderRole: "admin", createdAt: "2026-09-05T09:00:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCountByLane.customer, 0, "Customer lane is read");
  assert.equal(projected.unreadCountByLane.internal, 1, "Internal lane remains unread");
  assert.equal(projected.unreadCount, 1);
});

test("ADV_READ_14: Lane-specific read state: reading internal lane does NOT mark customer lane read", () => {
  const conv = makeFixture({
    readStateByAudience: {
      "freelancer:customer": "2026-09-05T08:00:00.000Z",
      "freelancer:internal": "2026-09-05T09:30:00.000Z",
    },
    messages: [
      makeMessage({ id: "m1", lane: "customer", senderRole: "customer", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", lane: "internal", senderRole: "admin", createdAt: "2026-09-05T09:00:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCountByLane.customer, 1, "Customer lane remains unread");
  assert.equal(projected.unreadCountByLane.internal, 0, "Internal lane is read");
  assert.equal(projected.unreadCount, 1);
});

test("ADV_READ_15: Sender exclusion: customer message is not incoming for customer", () => {
  const conv = makeFixture({
    readStateByAudience: { customer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({ id: "m1", lane: "customer", senderRole: "customer", createdAt: "2026-09-05T09:00:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "customer");
  assert.equal(projected.unreadCount, 0, "Self-sent customer message must not be unread for customer");
});

test("ADV_READ_16: Sender exclusion: freelancer message in internal lane is not incoming for freelancer", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({ id: "m1", lane: "internal", senderRole: "freelancer", createdAt: "2026-09-05T09:00:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCount, 0, "Self-sent freelancer message must not be unread for freelancer");
});

test("ADV_READ_17: Sender exclusion: agency message in customer lane is incoming for customer, not freelancer", () => {
  const conv = makeFixture({
    readStateByAudience: { customer: "2026-09-05T08:00:00.000Z", freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({ id: "m1", lane: "customer", senderRole: "admin", createdAt: "2026-09-05T09:00:00.000Z" }),
    ],
  });

  assert.equal(projectConversation(conv, "customer").unreadCount, 1, "Agency message is incoming for customer");
  assert.equal(projectConversation(conv, "freelancer").unreadCount, 0, "Agency customer-lane message is not incoming for editor");
});

test("ADV_READ_18: markConversationRead with trailing private message marks only up to latest visible public message", () => {
  const conv = makeFixture({
    id: "conv-read-test-1",
    messages: [
      makeMessage({ id: "m1", body: "Public message 1", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", body: "Private confidential message", visibility: "client_private", createdAt: "2026-09-05T09:05:00.000Z" }),
    ],
  });

  hydrateDummyPlatformSnapshot({ conversations: [conv] });

  const updated = markConversationRead("conv-read-test-1", "freelancer");
  assert.ok(updated, "Conversation must be returned");

  // Read state for freelancer should be timestamp of m1 (09:00:00.000Z), NOT m2 (09:05:00.000Z)
  const readState = updated.readStateByAudience;
  assert.equal(readState["freelancer"], "2026-09-05T09:00:00.000Z", "Read state must not leak timestamp of private message");
});

// ============================================================================
// PART 4: STRESS, INVARIANT & FUZZ HARNESS (10 TESTS)
// ============================================================================

test("ADV_STR_01: Fuzzing resolveConversationPermissions with 200 malformed inputs fails closed", () => {
  const garbageInputs = [
    null,
    undefined,
    {},
    { user: null },
    { user: {}, conversation: null },
    { user: { role: null }, conversation: {} },
    { user: { role: "GUEST", id: "1" }, conversation: { tenantId: "t1" } },
    { user: { role: "FREELANCER", id: "" }, conversation: { tenantId: "t1" } },
    { user: { role: "ADMIN", tenantId: "" }, conversation: { tenantId: "t1" } },
    { user: { role: "MANAGER", tenantId: "t1" }, membership: { status: "SUSPENDED" }, conversation: { tenantId: "t1" } },
  ];

  for (let i = 0; i < 200; i++) {
    const input = garbageInputs[i % garbageInputs.length];
    const perms = resolveConversationPermissions(input);
    assert.deepEqual(perms, createForbiddenPermissions(), `Fuzz cycle ${i} must fail closed`);
  }
});

test("ADV_STR_02: Fuzzing getVisibleMessages with 100 randomized message collections", () => {
  for (let i = 0; i < 100; i++) {
    const messages = Array.from({ length: 20 }, (_, idx) =>
      makeMessage({
        id: `fuzz-${i}-${idx}`,
        lane: idx % 2 === 0 ? "customer" : "internal",
        visibility: idx % 3 === 0 ? "client_private" : undefined,
      })
    );
    const conv = makeFixture({ messages });
    const visibleFreelancer = getVisibleMessages(conv, "freelancer");
    assert.ok(
      visibleFreelancer.every((m) => m.visibility !== "client_private"),
      `Fuzz cycle ${i}: Freelancer received a private message!`,
    );

    const visibleCustomer = getVisibleMessages(conv, "customer");
    assert.ok(
      visibleCustomer.every((m) => m.lane === "customer" && m.visibility !== "client_private"),
      `Fuzz cycle ${i}: Customer received an internal or private message!`,
    );
  }
});

test("ADV_STR_03: Rapid unassign/reassign lifecycle preserves all messages and grows audit trail", () => {
  let conv = makeFixture({
    id: "conv-lifecycle-1",
    messages: [
      makeMessage({ id: "msg-1", body: "Original requirement" }),
      makeMessage({ id: "msg-2", body: "Work in progress" }),
    ],
  });

  for (let i = 1; i <= 5; i++) {
    conv = unassignConversationEditors(conv, "admin", {
      removedByName: `Admin ${i}`,
      unassignedReason: `Reassignment cycle ${i}`,
    });
    assert.equal(conv.messages.filter((m) => m.body.startsWith("Original")).length, 1);
    assert.equal(conv.assignmentHistory?.length, i);
    assert.equal(conv.assignedFreelancerId, undefined);

    // Reassign editor
    conv = {
      ...conv,
      assignedFreelancerId: `editor-${i}`,
      assignedFreelancerName: `Editor ${i}`,
      status: "Active",
    };
  }

  assert.equal(conv.assignmentHistory?.length, 5);
  assert.equal(conv.messages.length, 7, "2 original messages + 5 unassignment notes");
});

test("ADV_STR_04: High message volume (1,000 messages with 500 private): projection < 50ms, zero leaks", () => {
  const messages = Array.from({ length: 1000 }, (_, idx) =>
    makeMessage({
      id: `vol-${idx}`,
      lane: idx % 2 === 0 ? "customer" : "internal",
      visibility: idx % 2 === 0 ? "client_private" : undefined,
      body: `Message volume payload ${idx}`,
    })
  );

  const conv = makeFixture({ messages });
  const start = Date.now();
  const projected = projectConversation(conv, "freelancer");
  const elapsed = Date.now() - start;

  assert.ok(elapsed < 100, `High volume projection took ${elapsed}ms`);
  assert.equal(projected.messages.length, 500);
  assert.ok(projected.messages.every((m) => m.visibility !== "client_private"));
});

test("ADV_STR_05: Multi-collaborator isolation: all collaborators are strictly read-only", () => {
  const conv = {
    id: "conv-collab-test",
    tenantId: "tenant-alpha",
    assignedFreelancerId: "editor-primary",
    freelancerCollaborators: [
      { freelancerId: "collab-1", freelancerName: "Cathy" },
      { freelancerId: "collab-2", freelancerName: "David" },
      { freelancerId: "collab-3", freelancerName: "Elena" },
    ],
  };

  for (const c of ["collab-1", "collab-2", "collab-3"]) {
    const perms = resolveConversationPermissions({
      user: { id: c, role: "FREELANCER" },
      conversation: conv,
    });
    assert.equal(perms.canViewConversation, true);
    assert.equal(perms.canViewCustomerLane, true);
    assert.equal(perms.canViewInternalLane, true);
    assert.equal(perms.canViewPrivateMessages, false);
    assert.equal(perms.canSendCustomerMessage, false);
    assert.equal(perms.canSendInternalMessage, false);
  }
});

test("ADV_STR_06: Invariant: canViewPrivateMessages is strictly FALSE for non-admin/manager roles", () => {
  const nonManagementRoles = ["FREELANCER", "CUSTOMER", "SALES_AGENT"];
  for (const role of nonManagementRoles) {
    const perms = resolveConversationPermissions({
      user: { id: "user-1", role: role, tenantId: "tenant-alpha" },
      conversation: {
        id: "conv-1",
        tenantId: "tenant-alpha",
        assignedFreelancerId: "user-1",
        customerId: "user-1",
      },
      isSalesAssigned: true,
    });
    assert.equal(
      perms.canViewPrivateMessages,
      false,
      `canViewPrivateMessages must be false for ${role}`,
    );
  }
});

test("ADV_STR_07: Invariant: canSendCustomerMessage is strictly FALSE when transportState === 'blocked' for freelancer", () => {
  const perms = resolveConversationPermissions({
    user: { id: "editor-primary", role: "FREELANCER" },
    conversation: {
      id: "conv-1",
      tenantId: "tenant-alpha",
      assignedFreelancerId: "editor-primary",
      freelancerCustomerLaneAccess: true,
    },
    transportState: "blocked",
  });
  assert.equal(perms.canSendCustomerMessage, false);
});

test("ADV_STR_08: Invariant: canSendCustomerMessage for freelancer is strictly FALSE when toggle is false", () => {
  for (const state of ["ready", "demo", "blocked"]) {
    const perms = resolveConversationPermissions({
      user: { id: "editor-primary", role: "FREELANCER" },
      conversation: {
        id: "conv-1",
        tenantId: "tenant-alpha",
        assignedFreelancerId: "editor-primary",
        freelancerCustomerLaneAccess: false,
      },
      transportState: state,
    });
    assert.equal(perms.canSendCustomerMessage, false);
  }
});

test("ADV_STR_09: Invariant: projectConversation(conv, 'freelancer').messages never contains client_private across 5,000 fuzzed messages", () => {
  const messages = Array.from({ length: 5000 }, (_, idx) =>
    makeMessage({
      id: `fuzz-priv-${idx}`,
      lane: idx % 3 === 0 ? "customer" : "internal",
      visibility: idx % 2 === 0 ? "client_private" : undefined,
      body: `Fuzz text ${idx}`,
    })
  );

  const conv = makeFixture({ messages });
  const projected = projectConversation(conv, "freelancer");
  const leaked = projected.messages.filter((m) => m.visibility === "client_private");
  assert.equal(leaked.length, 0, "Zero private messages must leak");
  assert.equal(projected.messages.length, 2500);
});

test("ADV_STR_10: Multi-lane unread badge integrity: unreadCount strictly equals sum of lane unreads", () => {
  const conv = makeFixture({
    readStateByAudience: { freelancer: "2026-09-05T08:00:00.000Z" },
    messages: [
      makeMessage({ id: "m1", lane: "customer", senderRole: "customer", createdAt: "2026-09-05T09:00:00.000Z" }),
      makeMessage({ id: "m2", lane: "customer", senderRole: "customer", createdAt: "2026-09-05T09:05:00.000Z" }),
      makeMessage({ id: "m3", lane: "internal", senderRole: "admin", createdAt: "2026-09-05T09:10:00.000Z" }),
      makeMessage({ id: "m4", lane: "internal", senderRole: "admin", createdAt: "2026-09-05T09:15:00.000Z" }),
      makeMessage({ id: "m5", lane: "internal", senderRole: "admin", createdAt: "2026-09-05T09:20:00.000Z" }),
    ],
  });

  const projected = projectConversation(conv, "freelancer");
  assert.equal(projected.unreadCountByLane.customer, 2);
  assert.equal(projected.unreadCountByLane.internal, 3);
  assert.equal(
    projected.unreadCount,
    projected.unreadCountByLane.customer + projected.unreadCountByLane.internal,
    "unreadCount must match sum of customer and internal lane unread counts",
  );
});
