import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// ---------------------------------------------------------------------------
// Bundle genuine conversation-access.ts to get resolveConversationPermissions
// ---------------------------------------------------------------------------
const accessMockPlugin = {
  name: "access-mock",
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
          candidateEditorIds: [session.userId],
          candidateEditorNames: [session.displayName || session.userId],
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
const { resolveConversationPermissions } = accessModule;

// ---------------------------------------------------------------------------
// Shared mutable test context for route testing
// ---------------------------------------------------------------------------
let currentSession = null;
let currentConversation = null;
let currentTransport = { state: "ready", note: "" };
let deliveredMessages = [];
let publishedRealtimeEvents = [];

const routeMockPlugin = {
  name: "route-mocks",
  setup(build) {
    build.onResolve({ filter: /^next\/server$/ }, () => ({ path: "next/server", namespace: "mock-route-ns" }));
    build.onResolve({ filter: /@\/lib\// }, (args) => ({ path: args.path, namespace: "mock-route-ns" }));
    build.onLoad({ filter: /.*/, namespace: "mock-route-ns" }, (args) => {
      if (args.path === "next/server") {
        return {
          contents: `
            export class NextResponse extends Response {
              static json(data, init) {
                return Response.json(data, init);
              }
            }
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/api/require-session-role") {
        return {
          contents: `
            export const requireSessionRole = async () => {
              if (!globalThis.__testContext?.currentSession) {
                return { ok: false, response: Response.json({ ok: false, error: "Authentication required." }, { status: 401 }) };
              }
              return { ok: true, session: globalThis.__testContext.currentSession };
            };
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/api/conversation-access") {
        return {
          contents: `
            export const getConversationAccessForSession = async (session, conversationId) => {
              const conv = globalThis.__testContext?.currentConversation;
              if (!conv || conv.id !== conversationId) {
                return { ok: false, reason: "missing", permissions: null };
              }
              const transport = globalThis.__testContext?.currentTransport || { state: "ready" };
              const permissions = globalThis.__testContext.resolvePermissions({
                user: {
                  id: session.userId,
                  role: session.role,
                  displayName: session.displayName || session.userId,
                  email: session.email,
                  tenantId: session.tenantId,
                  candidateIds: [session.userId],
                  candidateNames: [session.displayName || session.userId],
                },
                conversation: conv,
                transportState: transport.state,
              });
              if (!permissions.canViewConversation) {
                return { ok: false, reason: "forbidden", permissions };
              }
              return { ok: true, reason: "allowed", conversation: conv, permissions, transport };
            };
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/api/conversation-view-response") {
        return {
          contents: `
            export const getConversationViewForSession = async (session, conversationId, audience) => {
              const conv = globalThis.__testContext?.currentConversation;
              if (!conv || conv.id !== conversationId) return null;
              const transport = globalThis.__testContext?.currentTransport || { state: "ready" };
              const capabilities = globalThis.__testContext.resolvePermissions({
                user: {
                  id: session.userId,
                  role: session.role,
                  displayName: session.displayName || session.userId,
                  tenantId: session.tenantId,
                  candidateIds: [session.userId],
                },
                conversation: conv,
                transportState: transport.state,
              });
              return { ...conv, capabilities };
            };
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/gigxomi/dummy-platform-file-store") {
        return {
          contents: `
            export const deliverConversationMessageFromFile = async (id, messageData) => {
              const conv = globalThis.__testContext?.currentConversation;
              if (!conv || conv.id !== id) return null;
              const msg = { id: "msg-" + Date.now(), createdAt: new Date().toISOString(), ...messageData };
              conv.messages = [...(conv.messages || []), msg];
              globalThis.__testContext.deliveredMessages.push(msg);
              return { conversation: conv, delivery: { ok: true } };
            };
            export const deleteConversationMessageForEveryoneFromFile = async () => ({ ok: true });
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/gigxomi/dummy-platform-store") {
        return {
          contents: `
            export const getConversationById = (id) => globalThis.__testContext?.currentConversation;
            export const projectConversation = (c) => c;
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/mobile-chat-push") {
        return {
          contents: `
            export const sendMobileChatPushForConversation = async () => ({ sent: 1 });
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/gigxomi/conversation-realtime") {
        return {
          contents: `
            export const publishConversationRealtimeEvent = async (event) => {
              globalThis.__testContext.publishedRealtimeEvents.push(event);
            };
            export const resolveConversationRealtimeRecipients = (conv, message) => {
              const isPrivate = String(message?.visibility ?? "").trim().toLowerCase() === "client_private";
              if (isPrivate) return [];
              return conv?.assignedFreelancerId ? [conv.assignedFreelancerId] : [];
            };
          `,
          loader: "js",
        };
      }

      return { contents: "", loader: "js" };
    });
  },
};

const routeBundle = await esbuild.build({
  entryPoints: ["src/app/api/conversations/[id]/messages/route.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  alias: { "@": "./src" },
  plugins: [routeMockPlugin],
  external: ["server-only"],
});

const routeModule = await import(
  `data:text/javascript;base64,${Buffer.from(routeBundle.outputFiles[0].text).toString("base64")}`
);
const { GET, POST } = routeModule;

// Set test harness on globalThis for mocked route to access
globalThis.__testContext = {
  get currentSession() { return currentSession; },
  get currentConversation() { return currentConversation; },
  get currentTransport() { return currentTransport; },
  deliveredMessages,
  publishedRealtimeEvents,
  resolvePermissions: resolveConversationPermissions,
};

function setContext(session, conversation, transport = { state: "ready", note: "" }) {
  currentSession = session;
  currentConversation = JSON.parse(JSON.stringify(conversation));
  currentTransport = transport;
  deliveredMessages.length = 0;
  publishedRealtimeEvents.length = 0;
}

async function callPost(id, body) {
  const req = new Request(`https://gigxomi.test/api/conversations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req, { params: Promise.resolve({ id }) });
  const data = await res.json();
  return { status: res.status, data };
}

async function callGet(id, query = "") {
  const req = new Request(`https://gigxomi.test/api/conversations/${id}/messages${query ? "?" + query : ""}`, {
    method: "GET",
  });
  const res = await GET(req, { params: Promise.resolve({ id }) });
  const data = await res.json();
  return { status: res.status, data };
}

const baseConversation = {
  id: "conv-101",
  tenantId: "agency-alpha",
  assignedFreelancerId: "editor-bob",
  assignedFreelancerName: "Bob Editor",
  freelancerCustomerLaneAccess: false,
  freelancerCollaborators: [],
  assignmentOffers: [],
  messages: [],
};

const freelancerSession = {
  role: "FREELANCER",
  userId: "editor-bob",
  displayName: "Bob Editor",
  tenantId: "freelancer-home",
};

// ===========================================================================
// Feature 8: Message API Hardening & HTTP 403 Enforcement (11 Scenarios)
// ===========================================================================

test("TEST_M2_F8_01: Assigned editor with client-chat OFF cannot POST to customer lane (HTTP 403)", async () => {
  setContext(freelancerSession, { ...baseConversation, freelancerCustomerLaneAccess: false });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Hi client, I am working on your video.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /Direct client chat is still waiting for admin or manager access/i);
});

test("TEST_M2_F8_02: Assigned editor with client-chat OFF can GET customer lane messages (HTTP 200 read-only)", async () => {
  setContext(freelancerSession, { ...baseConversation, freelancerCustomerLaneAccess: false });
  const { status, data } = await callGet("conv-101", "audience=freelancer");

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.conversation.capabilities.canViewCustomerLane, true);
  assert.equal(data.conversation.capabilities.canSendCustomerMessage, false);
});

test("TEST_M2_F8_03: Assigned editor with client-chat OFF can POST to internal lane (HTTP 200)", async () => {
  setContext(freelancerSession, { ...baseConversation, freelancerCustomerLaneAccess: false });
  const { status, data } = await callPost("conv-101", {
    lane: "internal",
    body: "Uploaded cut to Google Drive for review.",
  });

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.delivery.ok, true);
});

test("TEST_M2_F8_04: Assigned editor with client-chat ON can POST to customer lane (HTTP 200)", async () => {
  setContext(freelancerSession, { ...baseConversation, freelancerCustomerLaneAccess: true });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Hello client! Preview draft is available.",
  });

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.delivery.ok, true);
});

test("TEST_M2_F8_05: Assigned editor with transport blocked cannot POST to customer lane (HTTP 403, not 409)", async () => {
  setContext(
    freelancerSession,
    { ...baseConversation, freelancerCustomerLaneAccess: true },
    { state: "blocked", note: "Customer delivery relay is paused." },
  );
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Attempting send on blocked transport.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /Customer delivery relay is paused/i);
});

test("TEST_M2_F8_06: Collaborator cannot POST to customer lane (HTTP 403 read-only)", async () => {
  const collabSession = {
    role: "FREELANCER",
    userId: "collab-charlie",
    displayName: "Charlie Collab",
    tenantId: "freelancer-home",
  };
  setContext(collabSession, {
    ...baseConversation,
    freelancerCustomerLaneAccess: true,
    freelancerCollaborators: [{ freelancerId: "collab-charlie", freelancerName: "Charlie Collab" }],
  });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Collaborator trying to message client.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /read-only project viewer\. Only the primary editor can reply/i);
});

test("TEST_M2_F8_07: Collaborator cannot POST to internal lane (HTTP 403 read-only)", async () => {
  const collabSession = {
    role: "FREELANCER",
    userId: "collab-charlie",
    displayName: "Charlie Collab",
    tenantId: "freelancer-home",
  };
  setContext(collabSession, {
    ...baseConversation,
    freelancerCollaborators: [{ freelancerId: "collab-charlie", freelancerName: "Charlie Collab" }],
  });
  const { status, data } = await callPost("conv-101", {
    lane: "internal",
    body: "Collaborator trying to post internal reply.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /read-only project viewer\. Only the primary editor can reply/i);
});

test("TEST_M2_F8_08: Offered editor with pending offer cannot POST to customer lane (HTTP 403)", async () => {
  const offeredSession = {
    role: "FREELANCER",
    userId: "offered-dave",
    displayName: "Dave Offered",
    tenantId: "freelancer-home",
  };
  setContext(offeredSession, {
    ...baseConversation,
    assignedFreelancerId: null,
    assignmentOffers: [{ freelancerId: "offered-dave", status: "PENDING" }],
    freelancerCustomerLaneAccess: true,
  });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Pending offered editor messaging client.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /read-only project viewer\. Only the primary editor can reply/i);
});

test("TEST_M2_F8_09: Offered editor with pending offer cannot POST to internal lane (HTTP 403)", async () => {
  const offeredSession = {
    role: "FREELANCER",
    userId: "offered-dave",
    displayName: "Dave Offered",
    tenantId: "freelancer-home",
  };
  setContext(offeredSession, {
    ...baseConversation,
    assignedFreelancerId: null,
    assignmentOffers: [{ freelancerId: "offered-dave", status: "PENDING" }],
  });
  const { status, data } = await callPost("conv-101", {
    lane: "internal",
    body: "Pending offered editor posting internal message.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /read-only project viewer\. Only the primary editor can reply/i);
});

test("TEST_M2_F8_10: Unassigned / removed editor receives HTTP 403 on message attempt", async () => {
  const outsiderSession = {
    role: "FREELANCER",
    userId: "unrelated-eve",
    displayName: "Eve Unrelated",
    tenantId: "freelancer-home",
  };
  setContext(outsiderSession, baseConversation);
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Unrelated freelancer attempting message.",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /You do not have access to this conversation/i);
});

test("TEST_M2_F8_11: Freelancer customer-lane attachments are rejected as text-only (HTTP 400)", async () => {
  setContext(freelancerSession, { ...baseConversation, freelancerCustomerLaneAccess: true });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Here is the project file.",
    attachments: [{ name: "export.mp4", sizeBytes: 1048576 }],
  });

  assert.equal(status, 400);
  assert.equal(data.ok, false);
  assert.match(data.error, /text-only right now/i);
});

// ===========================================================================
// Additional Coverage: Admin & Manager lanes, Realtime isolation check
// ===========================================================================

test("TEST_M2_F8_12: Agency admin can send in customer lane even when freelancer toggle is OFF", async () => {
  const adminSession = {
    role: "ADMIN",
    userId: "admin-alice",
    displayName: "Alice Admin",
    tenantId: "agency-alpha",
  };
  setContext(adminSession, { ...baseConversation, freelancerCustomerLaneAccess: false });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Official update from agency admin.",
  });

  assert.equal(status, 200);
  assert.equal(data.ok, true);
});

test("TEST_M2_F8_13: Realtime event for client_private message targets 0 userIds", async () => {
  const adminSession = {
    role: "ADMIN",
    userId: "admin-alice",
    displayName: "Alice Admin",
    tenantId: "agency-alpha",
  };
  setContext(adminSession, { ...baseConversation, assignedFreelancerId: "editor-bob" });
  const { status, data } = await callPost("conv-101", {
    lane: "customer",
    body: "Private internal billing note.",
    visibility: "client_private",
  });

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(publishedRealtimeEvents.length, 1);
  const event = publishedRealtimeEvents[0];
  assert.equal(event.visibility, "client_private");
  assert.deepEqual(event.userIds, []);
});
