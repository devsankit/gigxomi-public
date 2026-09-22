import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import esbuild from "esbuild";

// ===========================================================================
// Dynamic Production Module Loaders
// ===========================================================================

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
    .replace(
      /import\s+[^;]*?from\s+["']@\/lib\/realtime\/event-outbox["'];/g,
      "const persistRealtimeEvent = async () => {}; const listRealtimeEvents = async () => [];",
    );
  const transpiled = ts.transpileModule(rawCode, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
  return import(moduleUrl);
}

const {
  canReceiveConversationRealtimeEvent,
  resolveConversationRealtimeRecipients,
  publishConversationRealtimeEvent,
} = await loadRealtimeModule();

const {
  resolveChatPushMessage,
  resolveChatPushRecipients,
} = await loadPushRecipientsModule();

// Import message normalization for push token predicate testing
const normPath = new URL("../src/lib/gigxomi/chat-message-normalization.ts", import.meta.url);
const normSource = ts.transpileModule(await readFile(normPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { isConversationMessageIncomingForAudience } = await import(
  `data:text/javascript;base64,${Buffer.from(normSource).toString("base64")}`
);

// Bundle conversation-access.ts for resolver capability testing
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

// Mock context for route testing
let currentSession = null;
let currentConversation = null;
let currentTransport = { state: "ready", note: "" };
let deliveredMessages = [];
let publishedEvents = [];

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
              if (!globalThis.__m2ChallengerContext?.currentSession) {
                return { ok: false, response: Response.json({ ok: false, error: "Authentication required." }, { status: 401 }) };
              }
              return { ok: true, session: globalThis.__m2ChallengerContext.currentSession };
            };
          `,
          loader: "js",
        };
      }

      if (args.path === "@/lib/api/conversation-access") {
        return {
          contents: `
            export const getConversationAccessForSession = async (session, conversationId) => {
              const conv = globalThis.__m2ChallengerContext?.currentConversation;
              if (!conv || conv.id !== conversationId) {
                return { ok: false, reason: "missing", permissions: null };
              }
              const transport = globalThis.__m2ChallengerContext?.currentTransport || { state: "ready" };
              const permissions = globalThis.__m2ChallengerContext.resolvePermissions({
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
              const conv = globalThis.__m2ChallengerContext?.currentConversation;
              if (!conv || conv.id !== conversationId) return null;
              const transport = globalThis.__m2ChallengerContext?.currentTransport || { state: "ready" };
              const capabilities = globalThis.__m2ChallengerContext.resolvePermissions({
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
              const conv = globalThis.__m2ChallengerContext?.currentConversation;
              if (!conv || conv.id !== id) return null;
              const msg = { id: "msg-" + Date.now(), createdAt: new Date().toISOString(), ...messageData };
              conv.messages = [...(conv.messages || []), msg];
              globalThis.__m2ChallengerContext.deliveredMessages.push(msg);
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
            export const getConversationById = (id) => globalThis.__m2ChallengerContext?.currentConversation;
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
              globalThis.__m2ChallengerContext.publishedEvents.push(event);
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
const { POST } = routeModule;

globalThis.__m2ChallengerContext = {
  get currentSession() { return currentSession; },
  get currentConversation() { return currentConversation; },
  get currentTransport() { return currentTransport; },
  deliveredMessages,
  publishedEvents,
  resolvePermissions: resolveConversationPermissions,
};

function setTestContext(session, conversation, transport = { state: "ready", note: "" }) {
  currentSession = session;
  currentConversation = JSON.parse(JSON.stringify(conversation));
  currentTransport = transport;
  deliveredMessages.length = 0;
  publishedEvents.length = 0;
}

async function callPostRoute(id, body) {
  const req = new Request(`https://gigxomi.test/api/conversations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req, { params: Promise.resolve({ id }) });
  const data = await res.json();
  return { status: res.status, data };
}

// ===========================================================================
// SECTION 1: Priority Tier 1 (SUPER_ADMIN) Stress Testing
// ===========================================================================

test("M2_CHALLENGE_T1_01: SUPER_ADMIN receives event across different tenantId", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
  };
  const session = {
    role: "SUPER_ADMIN",
    userId: "super-1",
    tenantId: "agency-beta",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T1_02: SUPER_ADMIN receives event with client_private visibility", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    visibility: "client_private",
  };
  const session = {
    role: "SUPER_ADMIN",
    userId: "super-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T1_03: SUPER_ADMIN receives event when userIds is empty array", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "SUPER_ADMIN",
    userId: "super-1",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T1_04: SUPER_ADMIN receives event when userIds explicitly targets other users", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob", "editor-charlie"],
  };
  const session = {
    role: "SUPER_ADMIN",
    userId: "super-1",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T1_05: SUPER_ADMIN receives event when event tenantId is null, undefined, or empty", () => {
  for (const tenantId of [null, undefined, "", "   "]) {
    const event = {
      conversationId: "conv-1",
      createdAt: new Date().toISOString(),
      eventType: "message-created",
      tenantId,
    };
    const session = {
      role: "SUPER_ADMIN",
      userId: "super-1",
    };
    assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
  }
});

test("M2_CHALLENGE_T1_06: SUPER_ADMIN receives event across all eventTypes", () => {
  const types = ["conversation-updated", "message-created", "conversation-read"];
  for (const eventType of types) {
    const event = {
      conversationId: "conv-1",
      createdAt: new Date().toISOString(),
      eventType,
      tenantId: "agency-alpha",
      visibility: "client_private",
    };
    const session = {
      role: "SUPER_ADMIN",
      userId: "super-1",
    };
    assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
  }
});

// ===========================================================================
// SECTION 2: Priority Tier 2 (Freelancer Private Suppression)
// ===========================================================================

test("M2_CHALLENGE_T2_01: FREELANCER with matching userId in userIds strictly rejected on client_private event", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    visibility: "client_private",
    userIds: ["freelancer-123"],
  };
  const session = {
    role: "FREELANCER",
    userId: "freelancer-123",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T2_02: FREELANCER with matching editorId strictly rejected on client_private event", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    visibility: "client_private",
    userIds: ["editor-legacy-456"],
  };
  const session = {
    role: "FREELANCER",
    userId: "user-999",
    editorId: "editor-legacy-456",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T2_03: FREELANCER with matching candidateEditorIds strictly rejected on client_private event", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    visibility: "client_private",
    userIds: ["candidate-777"],
  };
  const session = {
    role: "FREELANCER",
    userId: "user-999",
    candidateEditorIds: ["candidate-111", "candidate-777"],
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T2_04: Case-insensitivity & whitespace fuzzing for client_private rejects FREELANCER", () => {
  const fuzzedVisibilities = [
    "CLIENT_PRIVATE",
    "Client_Private",
    "client_Private",
    "  client_private  ",
    "\tclient_private\n",
    "\r\nclient_private\r\n",
    "   CLIENT_PRIVATE   ",
  ];

  for (const vis of fuzzedVisibilities) {
    const event = {
      conversationId: "conv-1",
      createdAt: new Date().toISOString(),
      eventType: "message-created",
      tenantId: "agency-alpha",
      visibility: vis,
      userIds: ["freelancer-123"],
    };
    const session = {
      role: "FREELANCER",
      userId: "freelancer-123",
      tenantId: "agency-alpha",
    };
    assert.equal(
      canReceiveConversationRealtimeEvent(event, session),
      false,
      `Expected rejection for visibility format: '${vis}'`,
    );
  }
});

test("M2_CHALLENGE_T2_05: Non-private visibility values do NOT trigger Tier 2 rejection", () => {
  const nonPrivateVisibilities = ["default", "", null, undefined, "public", "internal_only"];
  for (const vis of nonPrivateVisibilities) {
    const event = {
      conversationId: "conv-1",
      createdAt: new Date().toISOString(),
      eventType: "message-created",
      tenantId: "agency-alpha",
      visibility: vis,
      userIds: ["freelancer-123"],
    };
    const session = {
      role: "FREELANCER",
      userId: "freelancer-123",
      tenantId: "agency-alpha",
    };
    // Reaches Priority 4: matches session.userId -> returns true
    assert.equal(
      canReceiveConversationRealtimeEvent(event, session),
      true,
      `Expected acceptance for non-private visibility: '${vis}'`,
    );
  }
});

// ===========================================================================
// SECTION 3: Priority Tier 3 (Agency Staff: ADMIN & MANAGER)
// ===========================================================================

test("M2_CHALLENGE_T3_01: ADMIN in matching tenant receives event with empty userIds", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "ADMIN",
    userId: "admin-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T3_02: MANAGER in matching tenant receives event with empty userIds", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "MANAGER",
    userId: "manager-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T3_03: ADMIN in matching tenant receives event even when userIds targets ONLY freelancer", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob"],
  };
  const session = {
    role: "ADMIN",
    userId: "admin-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T3_04: MANAGER in matching tenant receives event even when userIds targets ONLY freelancer", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob"],
  };
  const session = {
    role: "MANAGER",
    userId: "manager-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T3_05: ADMIN and MANAGER in matching tenant receive client_private event", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    visibility: "client_private",
    userIds: [],
  };
  const adminSession = { role: "ADMIN", userId: "admin-1", tenantId: "agency-alpha" };
  const managerSession = { role: "MANAGER", userId: "manager-1", tenantId: "agency-alpha" };

  assert.equal(canReceiveConversationRealtimeEvent(event, adminSession), true);
  assert.equal(canReceiveConversationRealtimeEvent(event, managerSession), true);
});

test("M2_CHALLENGE_T3_06: ADMIN in DIFFERENT tenant does NOT receive event under Tier 3 or 5", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "ADMIN",
    userId: "admin-other",
    tenantId: "agency-beta",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T3_07: MANAGER in DIFFERENT tenant does NOT receive event", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "MANAGER",
    userId: "manager-other",
    tenantId: "agency-beta",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T3_08: Null/undefined tenantId fails Tier 3 staff match", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: null,
    userIds: [],
  };
  const session = {
    role: "ADMIN",
    userId: "admin-1",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

// ===========================================================================
// SECTION 4: Priority Tier 4 (Targeted Recipients) Identity Matching
// ===========================================================================

test("M2_CHALLENGE_T4_01: Targeted match on session.userId", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    userIds: ["user-target-1"],
  };
  const session = {
    role: "FREELANCER",
    userId: "user-target-1",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T4_02: Targeted match on session.editorId", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    userIds: ["editor-target-1"],
  };
  const session = {
    role: "FREELANCER",
    userId: "user-1",
    editorId: "editor-target-1",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T4_03: Targeted match on any entry in session.candidateEditorIds", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    userIds: ["cand-3"],
  };
  const session = {
    role: "FREELANCER",
    userId: "user-1",
    candidateEditorIds: ["cand-1", "cand-2", "cand-3", "cand-4"],
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T4_04: Normalization strips whitespace from target userIds and identities", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    userIds: ["   target-id-spaced   ", null, undefined, ""],
  };
  const session = {
    role: "FREELANCER",
    userId: "target-id-spaced",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), true);
});

test("M2_CHALLENGE_T4_05: When userIds is populated, non-matching session identities return false", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    userIds: ["target-alice", "target-bob"],
  };
  const session = {
    role: "FREELANCER",
    userId: "charlie",
    editorId: "charlie-editor",
    candidateEditorIds: ["charlie-cand"],
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

// ===========================================================================
// SECTION 5: Priority Tier 5 (Fallback Broadcast) Boundaries
// ===========================================================================

test("M2_CHALLENGE_T5_01: Un-targeted broadcast fallback strictly excludes FREELANCER role", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "FREELANCER",
    userId: "freelancer-random",
    tenantId: "agency-alpha",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

test("M2_CHALLENGE_T5_02: Un-targeted broadcast fallback allows non-freelancer in matching tenant", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };

  for (const role of ["SALES_AGENT", "OPERATIONS", "CUSTOMER"]) {
    const session = {
      role,
      userId: `user-${role}`,
      tenantId: "agency-alpha",
    };
    assert.equal(
      canReceiveConversationRealtimeEvent(event, session),
      true,
      `Expected Tier 5 broadcast to accept role: ${role}`,
    );
  }
});

test("M2_CHALLENGE_T5_03: Broadcast fallback fails if tenantId does not match", () => {
  const event = {
    conversationId: "conv-1",
    createdAt: new Date().toISOString(),
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: [],
  };
  const session = {
    role: "SALES_AGENT",
    userId: "sales-1",
    tenantId: "agency-beta",
  };
  assert.equal(canReceiveConversationRealtimeEvent(event, session), false);
});

// ===========================================================================
// SECTION 6: Push Notification Token Filtering Permutations
// ===========================================================================

function makeCandidate(overrides = {}) {
  return {
    activeAgencyIds: ["agency-alpha"],
    assignedRole: "ADMIN",
    displayName: "Agency Admin",
    email: "admin@agency.test",
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

const defaultChatPushConversation = {
  assignedFreelancerId: "editor-bob",
  assignedFreelancerName: "Bob Editor",
  freelancerCustomerLaneAccess: true,
  ownerName: "Agency Admin",
  ownerRole: "admin",
  tenantId: "agency-alpha",
};

test("M2_CHALLENGE_PUSH_01: Customer message with client_private suppresses freelancer push", () => {
  const freelancer = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    freelancerIdentityNames: ["Bob Editor"],
    id: "bob-user-id",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const admin = makeCandidate({ id: "admin-user-id" });

  const result = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: defaultChatPushConversation,
    message: { lane: "customer", senderRole: "customer", visibility: "client_private" },
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user-id"]);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("M2_CHALLENGE_PUSH_02: Admin internal message with client_private suppresses freelancer push", () => {
  const freelancer = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    freelancerIdentityNames: ["Bob Editor"],
    id: "bob-user-id",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const admin = makeCandidate({ id: "admin-user-id" });

  const result = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: defaultChatPushConversation,
    message: { lane: "internal", senderRole: "admin", visibility: "client_private" },
    senderId: "admin-user-id",
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("M2_CHALLENGE_PUSH_03: Unassigned editor permutations return freelancer_not_assigned and zero freelancer push", () => {
  const freelancer = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    id: "bob-user-id",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const admin = makeCandidate({ id: "admin-user-id" });

  for (const unassignedId of [null, undefined, "", "   ", "\t\n"]) {
    const result = resolveChatPushRecipients({
      candidates: [admin, freelancer],
      conversation: {
        ...defaultChatPushConversation,
        assignedFreelancerId: unassignedId,
        assignedFreelancerName: null,
      },
      message: { lane: "customer", senderRole: "customer" },
    });

    assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user-id"]);
    assert.ok(
      result.skipped.includes("freelancer_not_assigned"),
      `Expected freelancer_not_assigned for value: '${unassignedId}'`,
    );
  }
});

test("M2_CHALLENGE_PUSH_04: Client-chat disabled (freelancerCustomerLaneAccess: false) skips freelancer with lane_not_allowed", () => {
  const freelancer = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    id: "bob-user-id",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const admin = makeCandidate({ id: "admin-user-id" });

  const result = resolveChatPushRecipients({
    candidates: [admin, freelancer],
    conversation: { ...defaultChatPushConversation, freelancerCustomerLaneAccess: false },
    message: { lane: "customer", senderRole: "customer" },
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["admin-user-id"]);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("M2_CHALLENGE_PUSH_05: Ambiguous freelancer identities fail closed with zero freelancer recipients", () => {
  const freelancer1 = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    id: "bob-1",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const freelancer2 = makeCandidate({
    assignedRole: "FREELANCER",
    displayName: "Bob Editor",
    freelancerIdentityIds: ["editor-bob"],
    id: "bob-2",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });

  const result = resolveChatPushRecipients({
    candidates: [freelancer1, freelancer2],
    conversation: defaultChatPushConversation,
    message: { lane: "internal", senderRole: "admin" },
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("freelancer_ambiguous"));
});

test("M2_CHALLENGE_PUSH_06: Ambiguous agency owners fail closed with zero agency recipients", () => {
  const admin1 = makeCandidate({ id: "admin-1", displayName: "Same Name" });
  const admin2 = makeCandidate({ id: "admin-2", displayName: "Same Name" });

  const result = resolveChatPushRecipients({
    candidates: [admin1, admin2],
    conversation: {
      ...defaultChatPushConversation,
      freelancerCustomerLaneAccess: false,
      ownerName: "Same Name",
    },
    message: { lane: "customer", senderRole: "customer" },
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("owner_ambiguous"));
});

test("M2_CHALLENGE_PUSH_07: Freelancer inactive in agency tenant fails closed with freelancer_not_found", () => {
  const freelancer = makeCandidate({
    activeAgencyIds: ["other-agency"], // NOT agency-alpha
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-bob"],
    id: "bob-user-id",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });

  const result = resolveChatPushRecipients({
    candidates: [freelancer],
    conversation: defaultChatPushConversation,
    message: { lane: "internal", senderRole: "admin" },
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("freelancer_not_found"));
});

// ===========================================================================
// SECTION 7: Mobile Token Predicate Stress Testing (sendMobileChatPushForConversation logic)
// ===========================================================================

function evaluateMobilePushTokenPredicate(record, input, conversation, notificationMessage, salesLeadIds = new Set()) {
  if (input.senderId && record.userId === input.senderId) {
    return false;
  }

  function getAudienceForTokenRole(role) {
    const normalizedRole = String(role ?? "").trim().toUpperCase();
    if (normalizedRole === "CUSTOMER") return "customer";
    if (normalizedRole === "FREELANCER" || normalizedRole === "EDITOR") return "freelancer";
    if (normalizedRole === "MANAGER" || normalizedRole === "OPERATIONS") return "manager";
    if (normalizedRole === "SALES_AGENT") return "sales";
    return "admin";
  }

  const receiverAudience = getAudienceForTokenRole(record.role);
  if (!isConversationMessageIncomingForAudience(notificationMessage, receiverAudience)) {
    return false;
  }

  if (receiverAudience === "sales") {
    return salesLeadIds.has(record.userId);
  }

  if (record.tenantId && conversation.tenantId && record.tenantId !== conversation.tenantId) {
    return false;
  }

  const isPrivate = String(notificationMessage.visibility ?? "").trim().toLowerCase() === "client_private";

  if (receiverAudience === "customer") {
    if (isPrivate) {
      return false;
    }
    return Boolean(conversation.isInAppCustomerThread && conversation.customerId && record.userId === conversation.customerId);
  }

  if (receiverAudience === "freelancer") {
    const assignedFreelancerId = conversation.assignedFreelancerId?.trim();
    if (!assignedFreelancerId || record.userId !== assignedFreelancerId) {
      return false;
    }

    if (isPrivate) {
      return false;
    }

    if (
      notificationMessage.lane === "customer" &&
      notificationMessage.senderRole !== "freelancer" &&
      !conversation.freelancerCustomerLaneAccess
    ) {
      return false;
    }
  }

  return true;
}

test("M2_CHALLENGE_PRED_01: Self-sending user token is excluded", () => {
  const token = { role: "ADMIN", userId: "user-admin", tenantId: "agency-alpha" };
  const input = { senderId: "user-admin" };
  const conv = { tenantId: "agency-alpha" };
  const msg = { lane: "internal", senderRole: "admin" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_02: Customer token is strictly rejected for client_private message", () => {
  const token = { role: "CUSTOMER", userId: "cust-1", tenantId: "agency-alpha" };
  const input = { senderId: "admin-1" };
  const conv = {
    tenantId: "agency-alpha",
    isInAppCustomerThread: true,
    customerId: "cust-1",
  };
  const msg = { lane: "customer", senderRole: "admin", visibility: "client_private" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_03: Customer token rejected if isInAppCustomerThread is false", () => {
  const token = { role: "CUSTOMER", userId: "cust-1", tenantId: "agency-alpha" };
  const input = { senderId: "admin-1" };
  const conv = {
    tenantId: "agency-alpha",
    isInAppCustomerThread: false,
    customerId: "cust-1",
  };
  const msg = { lane: "customer", senderRole: "admin", visibility: "default" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_04: Freelancer token strictly rejected if not matching assignedFreelancerId", () => {
  const token = { role: "FREELANCER", userId: "collab-charlie", tenantId: "agency-alpha" };
  const input = { senderId: "admin-1" };
  const conv = {
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: true,
  };
  const msg = { lane: "internal", senderRole: "admin", visibility: "default" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_05: Freelancer token strictly rejected for client_private internal message", () => {
  const token = { role: "FREELANCER", userId: "editor-bob", tenantId: "agency-alpha" };
  const input = { senderId: "admin-1" };
  const conv = {
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: true,
  };
  const msg = { lane: "internal", senderRole: "admin", visibility: "client_private" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_06: Freelancer token rejected for customer message when toggle is false", () => {
  const token = { role: "FREELANCER", userId: "editor-bob", tenantId: "agency-alpha" };
  const input = { senderId: "customer-1" };
  const conv = {
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: false,
  };
  const msg = { lane: "customer", senderRole: "customer", visibility: "default" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), false);
});

test("M2_CHALLENGE_PRED_07: Freelancer token accepted for customer message when toggle is true", () => {
  const token = { role: "FREELANCER", userId: "editor-bob", tenantId: "agency-alpha" };
  const input = { senderId: "customer-1" };
  const conv = {
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: true,
  };
  const msg = { lane: "customer", senderRole: "customer", visibility: "default" };

  assert.equal(evaluateMobilePushTokenPredicate(token, input, conv, msg), true);
});

// ===========================================================================
// SECTION 8: Realtime Emission Isolation & Route Hardening
// ===========================================================================

test("M2_CHALLENGE_REALTIME_EMIT_01: resolveConversationRealtimeRecipients returns empty array on private message", () => {
  const conversation = {
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "collab-charlie" }],
    tenantId: "agency-alpha",
  };

  const recipientsPrivate = resolveConversationRealtimeRecipients(conversation, {
    visibility: "client_private",
    lane: "customer",
  });
  assert.deepEqual(recipientsPrivate, []);

  const recipientsUppercase = resolveConversationRealtimeRecipients(conversation, {
    visibility: "CLIENT_PRIVATE",
    lane: "internal",
  });
  assert.deepEqual(recipientsUppercase, []);
});

test("M2_CHALLENGE_REALTIME_EMIT_02: resolveConversationRealtimeRecipients includes primary and collaborators on public message", () => {
  const conversation = {
    assignedFreelancerId: "editor-bob",
    freelancerCollaborators: [{ freelancerId: "collab-charlie" }, { freelancerId: "collab-dave" }],
    tenantId: "agency-alpha",
  };

  const recipients = resolveConversationRealtimeRecipients(conversation, {
    visibility: "default",
    lane: "customer",
  });
  assert.deepEqual(recipients.sort(), ["collab-charlie", "collab-dave", "editor-bob"].sort());
});

test("M2_CHALLENGE_REALTIME_EMIT_03: publishConversationRealtimeEvent normalizes userIds to empty array on client_private", async () => {
  const event = await publishConversationRealtimeEvent({
    conversationId: "conv-101",
    eventType: "message-created",
    tenantId: "agency-alpha",
    userIds: ["editor-bob", "collab-charlie"],
    visibility: "client_private",
  });

  assert.deepEqual(event.userIds, []);
});

test("M2_CHALLENGE_ROUTE_01: POST customer message when canSendCustomerMessage is false returns HTTP 403", async () => {
  const baseConv = {
    id: "conv-route-1",
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: false,
    messages: [],
  };
  const session = {
    role: "FREELANCER",
    userId: "editor-bob",
    displayName: "Bob Editor",
    tenantId: "freelancer-home",
  };

  setTestContext(session, baseConv);
  const { status, data } = await callPostRoute("conv-route-1", {
    lane: "customer",
    body: "Attempted customer message by editor with toggle OFF",
  });

  assert.equal(status, 403);
  assert.equal(data.ok, false);
  assert.match(data.error, /Direct client chat is still waiting for admin or manager access/i);
});

test("M2_CHALLENGE_ROUTE_02: POST customer message with attachments by freelancer returns HTTP 400", async () => {
  const baseConv = {
    id: "conv-route-2",
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    freelancerCustomerLaneAccess: true,
    messages: [],
  };
  const session = {
    role: "FREELANCER",
    userId: "editor-bob",
    displayName: "Bob Editor",
    tenantId: "freelancer-home",
  };

  setTestContext(session, baseConv);
  const { status, data } = await callPostRoute("conv-route-2", {
    lane: "customer",
    body: "Customer message with forbidden file",
    attachments: [{ name: "preview.mp4", sizeBytes: 1024 }],
  });

  assert.equal(status, 400);
  assert.equal(data.ok, false);
  assert.match(data.error, /text-only right now/i);
});

test("M2_CHALLENGE_ROUTE_03: POST client_private message publishes realtime event with userIds: []", async () => {
  const baseConv = {
    id: "conv-route-3",
    tenantId: "agency-alpha",
    assignedFreelancerId: "editor-bob",
    messages: [],
  };
  const adminSession = {
    role: "ADMIN",
    userId: "admin-alice",
    displayName: "Alice Admin",
    tenantId: "agency-alpha",
  };

  setTestContext(adminSession, baseConv);
  const { status, data } = await callPostRoute("conv-route-3", {
    lane: "internal",
    body: "Confidential billing memo",
    visibility: "client_private",
  });

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(publishedEvents.length, 1);
  const pubEvent = publishedEvents[0];
  assert.equal(pubEvent.visibility, "client_private");
  assert.deepEqual(pubEvent.userIds, []);
});
