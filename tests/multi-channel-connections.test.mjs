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
const { resolveConversationPermissions } = await import(
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
  listChannelConnections,
  getChannelConnectionById,
  findChannelConnectionForWhatsApp,
  findChannelConnectionForInstagram,
  saveChannelConnection,
  updateWhatsAppConnectionState,
  updateInstagramConnectionState,
  getConversationById,
  listConversationsForAudience,
  unassignConversationEditors,
  appendConversationMessage,
  createWhatsAppIntakeConversation,
  assignConversationDirectly,
} = store;

test("MULTI-CHANNEL 1: Auto-synthesis of default WhatsApp and Instagram connections for legacy tenants", () => {
  const tenantId = "tenant-test-synthesis";
  updateWhatsAppConnectionState(tenantId, {
    phoneNumber: "+919876543210",
    displayName: "Support Line",
    phoneNumberId: "phone-id-123",
    status: "Number connected",
  });
  updateInstagramConnectionState(tenantId, {
    username: "gigxomi_main",
    instagramBusinessAccountId: "ig-acc-123",
    status: "Connected",
  });

  const connections = listChannelConnections(tenantId);
  assert.ok(connections.length >= 2, "Expected at least 2 synthesized connections");

  const waConn = connections.find((c) => c.provider === "WHATSAPP");
  assert.ok(waConn, "Expected synthesized WhatsApp connection");
  assert.equal(waConn.id, `conn-wa-${tenantId}`);
  assert.equal(waConn.displayName, "Support Line");
  assert.equal(waConn.isDefault, true);

  const igConn = connections.find((c) => c.provider === "INSTAGRAM");
  assert.ok(igConn, "Expected synthesized Instagram connection");
  assert.equal(igConn.id, `conn-ig-${tenantId}`);
  assert.equal(igConn.displayName, "@gigxomi_main");
  assert.equal(igConn.isDefault, true);
});

test("MULTI-CHANNEL 2: Explicit multi-account channel connections per agency", () => {
  const tenantId = "tenant-multi-acc";

  // Create a secondary WhatsApp line
  const salesWa = saveChannelConnection({
    id: "conn-wa-sales",
    tenantId,
    provider: "WHATSAPP",
    displayName: "Sales WhatsApp",
    phoneNumber: "+919111122222",
    phoneNumberId: "phone-id-sales",
    wabaId: "waba-sales",
    status: "ACTIVE",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create a secondary Instagram account
  const studioIg = saveChannelConnection({
    id: "conn-ig-studio",
    tenantId,
    provider: "INSTAGRAM",
    displayName: "@gigxomi_studio",
    instagramBusinessAccountId: "ig-acc-studio",
    username: "gigxomi_studio",
    status: "ACTIVE",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const tenantConnections = listChannelConnections(tenantId);
  const foundSales = tenantConnections.find((c) => c.id === "conn-wa-sales");
  const foundStudio = tenantConnections.find((c) => c.id === "conn-ig-studio");

  assert.ok(foundSales, "Sales WhatsApp line should be listed");
  assert.equal(foundSales.phoneNumberId, "phone-id-sales");

  assert.ok(foundStudio, "Studio Instagram handle should be listed");
  assert.equal(foundStudio.instagramBusinessAccountId, "ig-acc-studio");

  // Lookup by WhatsApp criteria
  const matchedWa = findChannelConnectionForWhatsApp({
    phoneNumberId: "phone-id-sales",
    tenantId,
  });
  assert.equal(matchedWa?.id, "conn-wa-sales");

  // Lookup by Instagram criteria
  const matchedIg = findChannelConnectionForInstagram({
    instagramBusinessAccountId: "ig-acc-studio",
    tenantId,
  });
  assert.equal(matchedIg?.id, "conn-ig-studio");
});

test("MULTI-CHANNEL 3: Conversations preserve channelConnectionId and tag unified inbox correctly", () => {
  const tenantId = "tenant-inbox-tags";

  // Create two conversations on different numbers under the same agency
  const conv1 = createWhatsAppIntakeConversation({
    tenantId,
    customerName: "Buyer Alpha",
    customerPhone: "+919999900001",
    body: "Interested in service",
    channelConnectionId: "conn-wa-sales",
    channelConnectionName: "Sales",
  });
  assert.ok(conv1, "Conv1 must be created");

  const conv2 = createWhatsAppIntakeConversation({
    tenantId,
    customerName: "Buyer Beta",
    customerPhone: "+919999900002",
    body: "Support request",
    channelConnectionId: "conn-wa-support",
    channelConnectionName: "Support",
  });
  assert.ok(conv2, "Conv2 must be created");

  assert.equal(conv1.channelConnectionId, "conn-wa-sales");
  assert.equal(conv1.channelConnectionName, "Sales");

  assert.equal(conv2.channelConnectionId, "conn-wa-support");
  assert.equal(conv2.channelConnectionName, "Support");

  // Verify projection for agency admin
  const { conversations: projectedList } = listConversationsForAudience("admin", { tenantId });
  const p1 = projectedList.find((c) => c.id === conv1.id);
  const p2 = projectedList.find((c) => c.id === conv2.id);

  assert.ok(p1, "Conv1 should be projected");
  assert.equal(p1.channelConnectionName, "Sales");
  assert.ok(p2, "Conv2 should be projected");
  assert.equal(p2.channelConnectionName, "Support");
});

test("PHASE 5: Agency membership permission restrictions for referred manager", () => {
  const conversation = {
    id: "conv-mgr-perm",
    tenantId: "tenant-agency-1",
    freelancerCustomerLaneAccess: true,
  };

  // 1. Standard Manager: Full permissions
  const standardManager = resolveConversationPermissions({
    user: { id: "mgr-1", role: "MANAGER", tenantId: "tenant-agency-1" },
    membership: { role: "MANAGER", status: "ACTIVE" },
    conversation,
  });
  assert.equal(standardManager.canSendCustomerMessage, true);
  assert.equal(standardManager.canViewPrivateMessages, true);
  assert.equal(standardManager.canManageParticipants, true);

  // 2. Restricted Manager: Blocked from client messages
  const restrictedSendManager = resolveConversationPermissions({
    user: { id: "mgr-2", role: "MANAGER", tenantId: "tenant-agency-1" },
    membership: { role: "MANAGER", status: "ACTIVE", permissions: ["BLOCK_CLIENT_MESSAGE"] },
    conversation,
  });
  assert.equal(restrictedSendManager.canSendCustomerMessage, false);
  assert.equal(restrictedSendManager.canViewPrivateMessages, true);

  // 3. Restricted Manager: Blocked from private messages
  const restrictedPrivateManager = resolveConversationPermissions({
    user: { id: "mgr-3", role: "MANAGER", tenantId: "tenant-agency-1" },
    membership: { role: "MANAGER", status: "ACTIVE", permissions: ["NO_PRIVATE_MESSAGES"] },
    conversation,
  });
  assert.equal(restrictedPrivateManager.canSendCustomerMessage, true);
  assert.equal(restrictedPrivateManager.canViewPrivateMessages, false);
});

test("PHASE 5: Agency membership permission restrictions for referred freelancer", () => {
  const conversation = {
    id: "conv-fl-perm",
    tenantId: "tenant-agency-1",
    assignedFreelancerId: "fl-editor-1",
    freelancerCustomerLaneAccess: true,
  };

  // 1. Standard Freelancer: Toggle ON allows client sending
  const standardFreelancer = resolveConversationPermissions({
    user: { id: "fl-editor-1", role: "FREELANCER", tenantId: "tenant-agency-1" },
    membership: { role: "FREELANCER", status: "ACTIVE" },
    conversation,
  });
  assert.equal(standardFreelancer.canSendCustomerMessage, true);
  assert.equal(standardFreelancer.canViewPrivateMessages, false);

  // 2. Restricted Freelancer: Membership restriction overrides conversation toggle
  const restrictedFreelancer = resolveConversationPermissions({
    user: { id: "fl-editor-1", role: "FREELANCER", tenantId: "tenant-agency-1" },
    membership: { role: "FREELANCER", status: "ACTIVE", permissions: ["CANNOT_REPLY_CLIENT"] },
    conversation,
  });
  assert.equal(restrictedFreelancer.canSendCustomerMessage, false);
  assert.equal(restrictedFreelancer.canViewCustomerLane, true);
});

test("R3 AUDIT INVARIANT: Non-destructive editor unassignment preserves complete chat history and records audit", () => {
  const tenantId = "tenant-audit-preservation";
  const conv = createWhatsAppIntakeConversation({
    tenantId,
    customerName: "Audit Customer",
    customerPhone: "+919876599999",
    body: "Initial intake query",
  });
  assert.ok(conv, "Conversation must be created");

  appendConversationMessage(conv.id, {
    role: "customer",
    lane: "customer",
    body: "Here are project raw files",
  });
  appendConversationMessage(conv.id, {
    role: "admin",
    lane: "internal",
    body: "Assigned to Editor Bob",
  });

  assignConversationDirectly(conv.id, "editor-bob", "admin", {
    freelancerName: "Bob",
    assignedByName: "Agency Admin",
  });

  appendConversationMessage(conv.id, {
    role: "freelancer",
    lane: "customer",
    body: "First draft delivered",
  });

  const liveBefore = getConversationById(conv.id);
  assert.equal(liveBefore.messages.length, 5, "Should have 5 messages before unassigning (including direct assignment note)");

  const updated = unassignConversationEditors(conv.id, {
    removedByRole: "admin",
    removedByName: "Agency Admin",
    unassignedReason: "Project completed",
  });

  assert.ok(updated, "Conversation should be updated");
  assert.equal(updated.assignedFreelancerId, undefined);
  assert.equal(updated.messages.length, 6, "100% of original messages preserved + 1 unassignment audit message appended");
  assert.equal(updated.messages[0].body, "Initial intake query");
  assert.equal(updated.messages[1].body, "Here are project raw files");
  assert.equal(updated.messages[2].body, "Assigned to Editor Bob");
  assert.equal(updated.messages[4].body, "First draft delivered");
  assert.equal(updated.messages[5].lane, "internal");

  const liveAfter = getConversationById(conv.id);
  assert.equal(liveAfter.messages.length, 6, "100% of messages MUST remain in live store");

  assert.ok(updated.assignmentHistory && updated.assignmentHistory.length > 0, "Audit record must be populated");
  const latestAudit = updated.assignmentHistory[updated.assignmentHistory.length - 1];
  assert.equal(latestAudit.freelancerId, "editor-bob");
  assert.ok(latestAudit.removedAt, "removedAt must be populated on unassignment");
  assert.equal(latestAudit.removedByName, "Agency Admin");
  assert.equal(latestAudit.unassignedReason, "Project completed");
});
