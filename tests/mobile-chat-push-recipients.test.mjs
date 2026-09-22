import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const resolverPath = new URL("../src/lib/mobile-chat-push-recipients.ts", import.meta.url);
const resolverSource = ts.transpileModule(await readFile(resolverPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const resolverModuleUrl = `data:text/javascript;base64,${Buffer.from(resolverSource).toString("base64")}`;
const { resolveChatPushMessage, resolveChatPushRecipients } = await import(resolverModuleUrl);

function candidate(overrides) {
  return {
    activeAgencyIds: [],
    assignedRole: "ADMIN",
    displayName: "Agency Owner",
    email: "owner@example.test",
    freelancerIdentityIds: [],
    freelancerIdentityNames: [],
    id: "agency-owner",
    packageAudience: "AGENCY",
    role: "ADMIN",
    tenantId: "agency-a",
    workspaceMode: "AGENCY",
    ...overrides,
  };
}

const baseConversation = {
  assignedFreelancerId: "editor-a",
  assignedFreelancerName: "Editor A",
  freelancerCustomerLaneAccess: true,
  ownerName: "Agency Owner",
  ownerRole: "admin",
  tenantId: "agency-a",
};

const customerMessage = { lane: "customer", senderRole: "customer" };

test("an explicit message ID wins over a newer message", () => {
  const messages = [
    { createdAt: "2026-08-15T10:00:00.000Z", id: "requested-message" },
    { createdAt: "2026-08-15T10:01:00.000Z", id: "newer-message" },
  ];

  assert.equal(resolveChatPushMessage(messages, "requested-message")?.id, "requested-message");
  assert.equal(resolveChatPushMessage(messages)?.id, "newer-message");
  assert.equal(resolveChatPushMessage(messages, "missing-message"), null);
});

test("customer message never crosses agency boundaries", () => {
  const result = resolveChatPushRecipients({
    candidates: [
      candidate({ id: "agency-a-owner" }),
      candidate({ id: "agency-b-owner", displayName: "Other Owner", tenantId: "agency-b" }),
    ],
    conversation: { ...baseConversation, freelancerCustomerLaneAccess: false },
    message: customerMessage,
    senderId: "external-whatsapp",
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["agency-a-owner"]);
});

test("only the explicit manager owner is selected inside an agency", () => {
  const result = resolveChatPushRecipients({
    candidates: [
      candidate({ id: "primary-admin" }),
      candidate({
        assignedRole: "MANAGER",
        displayName: "Assigned Manager",
        id: "assigned-manager",
        packageAudience: null,
        role: "MANAGER",
        workspaceMode: null,
      }),
      candidate({
        assignedRole: "MANAGER",
        displayName: "Other Manager",
        id: "other-manager",
        packageAudience: null,
        role: "MANAGER",
        workspaceMode: null,
      }),
    ],
    conversation: {
      ...baseConversation,
      freelancerCustomerLaneAccess: false,
      ownerName: "Assigned Manager",
      ownerRole: "manager",
    },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["assigned-manager"]);
});

test("an unassigned queue uses its single primary agency admin", () => {
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" })],
    conversation: {
      ...baseConversation,
      freelancerCustomerLaneAccess: false,
      ownerName: "Legacy Demo Manager",
      ownerRole: "manager",
    },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["primary-admin"]);
});

test("ambiguous owners fail closed", () => {
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "owner-1" }), candidate({ id: "owner-2" })],
    conversation: { ...baseConversation, freelancerCustomerLaneAccess: false },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("owner_ambiguous"));
});

test("only the uniquely assigned freelancer with active agency access is selected", () => {
  const assignedFreelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    displayName: "Editor A",
    freelancerIdentityIds: ["editor-a", "freelancer-user-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const unrelatedFreelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    displayName: "Editor B",
    freelancerIdentityIds: ["editor-b"],
    freelancerIdentityNames: ["Editor B"],
    id: "freelancer-user-b",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), assignedFreelancer, unrelatedFreelancer],
    conversation: baseConversation,
    message: customerMessage,
  });

  assert.deepEqual(
    result.recipients.map((recipient) => recipient.user.id).sort(),
    ["freelancer-user-a", "primary-admin"],
  );
});

test("private or disabled customer lanes never notify freelancers", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: baseConversation,
    message: { ...customerMessage, visibility: "client_private" },
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["primary-admin"]);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("internal agency messages go only to the assigned freelancer and exclude the sender", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "admin" },
    senderId: "primary-admin",
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["freelancer-user-a"]);
});

test("internal freelancer messages go only to the assigned agency owner", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "freelancer" },
    senderId: "freelancer-user-a",
    senderRole: "freelancer",
  });

  assert.deepEqual(result.recipients.map((recipient) => recipient.user.id), ["primary-admin"]);
});

test("a freelancer without active agency access is never selected", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-b"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [freelancer],
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "admin" },
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("freelancer_not_found"));
});

test("duplicate freelancer identity matches fail closed", () => {
  const freelancers = ["freelancer-a", "freelancer-b"].map((id) =>
    candidate({
      activeAgencyIds: ["agency-a"],
      assignedRole: "FREELANCER",
      displayName: "Editor A",
      freelancerIdentityIds: ["editor-a"],
      freelancerIdentityNames: ["Editor A"],
      id,
      packageAudience: "FREELANCER",
      role: "FREELANCER",
      tenantId: "freelancer-home",
      workspaceMode: "FREELANCER",
    }),
  );
  const result = resolveChatPushRecipients({
    candidates: freelancers,
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "admin" },
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("freelancer_ambiguous"));
});

test("internal lane message with visibility = 'client_private' never notifies freelancer", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "admin", visibility: "client_private" },
    senderId: "primary-admin",
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("internal lane message when editor is unassigned returns freelancer_not_assigned and zero recipients", () => {
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" })],
    conversation: { ...baseConversation, assignedFreelancerId: null, assignedFreelancerName: null },
    message: { lane: "internal", senderRole: "admin" },
    senderId: "primary-admin",
    senderRole: "admin",
  });

  assert.deepEqual(result.recipients, []);
  assert.ok(result.skipped.includes("freelancer_not_assigned"));
});

test("customer message when editor is unassigned (null/undefined/empty) never notifies freelancer", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: { ...baseConversation, assignedFreelancerId: undefined, assignedFreelancerName: undefined },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["primary-admin"]);
  assert.ok(result.skipped.includes("freelancer_not_assigned"));
});

test("case-insensitive visibility ('CLIENT_PRIVATE', 'Client_Private', whitespace) suppresses freelancer push", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });

  for (const vis of ["CLIENT_PRIVATE", "Client_Private", "  client_private  ", "\tclient_private\n"]) {
    const resultCustomer = resolveChatPushRecipients({
      candidates: [candidate({ id: "primary-admin" }), freelancer],
      conversation: baseConversation,
      message: { ...customerMessage, visibility: vis },
    });
    assert.deepEqual(resultCustomer.recipients.map((r) => r.user.id), ["primary-admin"], `Failed customer suppression for: ${vis}`);

    const resultInternal = resolveChatPushRecipients({
      candidates: [candidate({ id: "primary-admin" }), freelancer],
      conversation: baseConversation,
      message: { lane: "internal", senderRole: "admin", visibility: vis },
      senderId: "primary-admin",
      senderRole: "admin",
    });
    assert.deepEqual(resultInternal.recipients, [], `Failed internal suppression for: ${vis}`);
  }
});

test("whitespace assignedFreelancerId ('   ') fails closed with freelancer_not_assigned", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: { ...baseConversation, assignedFreelancerId: "   " },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["primary-admin"]);
  assert.ok(result.skipped.includes("freelancer_not_assigned"));
});

test("customer message when client-chat disabled (freelancerCustomerLaneAccess: false) skips freelancer with lane_not_allowed", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: { ...baseConversation, freelancerCustomerLaneAccess: false },
    message: customerMessage,
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["primary-admin"]);
  assert.ok(result.skipped.includes("lane_not_allowed"));
});

test("senderId matching candidate ID properly excludes candidate from recipients", () => {
  const freelancer = candidate({
    activeAgencyIds: ["agency-a"],
    assignedRole: "FREELANCER",
    freelancerIdentityIds: ["editor-a"],
    freelancerIdentityNames: ["Editor A"],
    id: "freelancer-user-a",
    packageAudience: "FREELANCER",
    role: "FREELANCER",
    tenantId: "freelancer-home",
    workspaceMode: "FREELANCER",
  });
  const result = resolveChatPushRecipients({
    candidates: [candidate({ id: "primary-admin" }), freelancer],
    conversation: baseConversation,
    message: { lane: "internal", senderRole: "freelancer" },
    senderId: "freelancer-user-a",
    senderRole: "freelancer",
  });

  assert.deepEqual(result.recipients.map((r) => r.user.id), ["primary-admin"]);
  assert.equal(result.recipients.some((r) => r.user.id === "freelancer-user-a"), false);
});
