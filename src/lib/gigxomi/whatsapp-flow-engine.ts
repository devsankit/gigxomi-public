import "server-only";

import {
  ALL_AGENCY_TENANTS_DEPLOYMENT_ID,
  listSuperAdminWhatsAppFlows,
  type SuperAdminWhatsAppFlow,
  type SuperAdminWhatsAppFlowEdge,
  type SuperAdminWhatsAppFlowNode,
} from "@/lib/gigxomi/super-admin-whatsapp-flow-store";
import { listAgencyWhatsAppFlows } from "@/lib/gigxomi/agency-whatsapp-flow-store";
import {
  appendBotFlowReplyByCustomerPhoneFromFile,
  findConversationByCustomerPhoneFromFile,
  listWhatsAppConnectionStatesFromFile,
  sendStandaloneWhatsAppButtonsMessageFromFile,
  sendStandaloneWhatsAppCallToActionTemplateFromFile,
  sendStandaloneWhatsAppCtaUrlMessageFromFile,
  sendStandaloneWhatsAppListMessageFromFile,
  sendStandaloneWhatsAppMessageFromFile,
} from "@/lib/gigxomi/dummy-platform-file-store";
import {
  appendWhatsAppRuntimeEvent,
  attachInboundMessageToWhatsAppRun,
  claimWhatsAppWebhookMessage,
  createWhatsAppRuntimeRun,
  findWaitingWhatsAppRun,
  markWhatsAppWebhookMessageProcessed,
  updateWhatsAppRuntimeRun,
  type WhatsAppRuntimeFlowRun,
  type WhatsAppRuntimeRunStatus,
} from "@/lib/gigxomi/whatsapp-runtime-store";

const MAX_EXECUTION_STEPS = 25;

type NormalizedWhatsAppInboundMessage = {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string;
  from: string;
  waId: string;
  contactName: string;
  timestamp: string;
  type: string;
  body: string;
  buttonReplyId?: string;
  buttonReplyTitle?: string;
  listReplyId?: string;
  listReplyTitle?: string;
};

type UnmappedWhatsAppInboundMessage = Omit<NormalizedWhatsAppInboundMessage, "tenantId"> & {
  reason: string;
};

type RuntimeContext = {
  runId: string;
  tenantId: string;
  contactId: string;
  conversationId?: string;
  phone: string;
  incomingMessage: string;
  incomingButtonReplyId?: string;
  incomingButtonReplyTitle?: string;
  incomingListReplyId?: string;
  incomingListReplyTitle?: string;
  variables: Record<string, string>;
};

type NodeExecutionResult = {
  next: SuperAdminWhatsAppFlowNode | null;
  status?: WhatsAppRuntimeRunStatus;
  waitingNodeId?: string;
  waitingFor?: "button_reply" | "list_reply" | "delay";
  error?: string;
};

function renderTemplate(input: string, variables: Record<string, string>) {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeForMatch(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneKey(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getMessageBody(message: Record<string, unknown>) {
  const type = normalizeText(message.type).toLowerCase();

  if (type === "text") {
    return normalizeText((message.text as { body?: unknown } | undefined)?.body);
  }

  if (type === "button") {
    return normalizeText((message.button as { text?: unknown } | undefined)?.text);
  }

  if (type === "interactive") {
    const interactive = (message.interactive as
      | {
          button_reply?: { id?: unknown; title?: unknown };
          list_reply?: { id?: unknown; title?: unknown; description?: unknown };
        }
      | undefined) ?? {};
    return (
      normalizeText(interactive.button_reply?.title) ||
      normalizeText(interactive.button_reply?.id) ||
      normalizeText(interactive.list_reply?.title) ||
      normalizeText(interactive.list_reply?.id) ||
      normalizeText(interactive.list_reply?.description)
    );
  }

  if (type === "image") {
    return normalizeText((message.image as { caption?: unknown } | undefined)?.caption) || "[image]";
  }

  if (type === "document") {
    const document = (message.document as { caption?: unknown; filename?: unknown } | undefined) ?? {};
    return normalizeText(document.caption) || (normalizeText(document.filename) ? `Document: ${normalizeText(document.filename)}` : "[document]");
  }

  if (type === "video") {
    return normalizeText((message.video as { caption?: unknown } | undefined)?.caption) || "[video]";
  }

  if (type === "audio") return "[audio]";
  if (type === "location") return "[location]";
  if (type === "contacts") return "[contact]";
  if (type === "reaction") return normalizeText((message.reaction as { emoji?: unknown } | undefined)?.emoji) || "[reaction]";

  return type ? `[${type}]` : "[incoming]";
}

async function resolveTenantId(input: { displayPhoneNumber: string; phoneNumberId: string; wabaId: string }) {
  const states = await listWhatsAppConnectionStatesFromFile();
  const phoneNumberId = input.phoneNumberId.trim();
  if (phoneNumberId) {
    const matched = states.find((state) => state.phoneNumberId.trim() === phoneNumberId);
    if (matched) return matched.tenantId;
  }

  const wabaId = input.wabaId.trim();
  if (wabaId) {
    const matched = states.find((state) => state.wabaId.trim() === wabaId);
    if (matched) return matched.tenantId;
  }

  const displayDigits = normalizePhoneKey(input.displayPhoneNumber);
  if (displayDigits) {
    const matched = states.find((state) => normalizePhoneKey(state.phoneNumber) === displayDigits);
    if (matched) return matched.tenantId;
  }

  return null;
}

async function parseIncomingMessages(payload: unknown) {
  const safe = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const entries = Array.isArray(safe.entry) ? safe.entry : [];
  const messages: NormalizedWhatsAppInboundMessage[] = [];
  const unmappedMessages: UnmappedWhatsAppInboundMessage[] = [];
  let statusEvents = 0;

  for (const entry of entries) {
    const entryRecord = entry as { id?: unknown; changes?: unknown[] };
    const wabaId = normalizeText(entryRecord.id);
    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];

    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> }).value ?? {};
      const metadata = (value.metadata as { display_phone_number?: unknown; phone_number_id?: unknown } | undefined) ?? {};
      const displayPhoneNumber = normalizeText(metadata.display_phone_number);
      const phoneNumberId = normalizeText(metadata.phone_number_id);
      const tenantId = await resolveTenantId({ displayPhoneNumber, phoneNumberId, wabaId });
      const contacts = new Map<string, string>();

      for (const contact of Array.isArray(value.contacts) ? value.contacts : []) {
        const contactRecord = contact as { wa_id?: unknown; profile?: { name?: unknown } };
        const waId = normalizeText(contactRecord.wa_id);
        const name = normalizeText(contactRecord.profile?.name) || "WhatsApp Customer";
        if (waId) {
          contacts.set(waId, name);
          contacts.set(normalizePhoneKey(waId), name);
        }
      }

      for (const item of Array.isArray(value.messages) ? value.messages : []) {
        const message = item as Record<string, unknown>;
        const type = normalizeText(message.type).toLowerCase() || "unknown";
        const interactive = (message.interactive as
          | {
              button_reply?: { id?: unknown; title?: unknown };
              list_reply?: { id?: unknown; title?: unknown };
            }
          | undefined) ?? {};
        const from = normalizeText(message.from);
        const body = getMessageBody(message);
        const id = normalizeText(message.id);
        if (!from || !body) continue;

        const waId = normalizeText(message.from);
        const normalizedWaId = normalizePhoneKey(waId);
        const normalizedMessage = {
          id,
          phoneNumberId,
          wabaId,
          displayPhoneNumber,
          from,
          waId,
          contactName: contacts.get(waId) ?? contacts.get(normalizedWaId) ?? "WhatsApp Customer",
          timestamp: normalizeText(message.timestamp),
          type,
          body,
          buttonReplyId: normalizeText(interactive.button_reply?.id) || undefined,
          buttonReplyTitle: normalizeText(interactive.button_reply?.title) || undefined,
          listReplyId: normalizeText(interactive.list_reply?.id) || undefined,
          listReplyTitle: normalizeText(interactive.list_reply?.title) || undefined,
        };

        if (!tenantId) {
          unmappedMessages.push({
            ...normalizedMessage,
            reason: "No connected WhatsApp tenant matched this webhook phone_number_id, WABA ID, or display number.",
          });
          continue;
        }

        messages.push({
          ...normalizedMessage,
          tenantId,
        });
      }

      statusEvents += Array.isArray(value.statuses) ? value.statuses.length : 0;
    }
  }

  return { messages, unmappedMessages, statusEvents };
}

function getTriggerNodes(flow: SuperAdminWhatsAppFlow) {
  return flow.nodes.filter((node) =>
    node.kind === "trigger-on-message" ||
    node.kind === "trigger-keyword" ||
    node.kind === "keyword-trigger" ||
    node.kind === "trigger-button-reply" ||
    node.kind === "trigger-list-reply"
  );
}

function getFlowKeyword(flow: SuperAdminWhatsAppFlow) {
  const direct = flow.triggerKeyword.trim();
  if (direct) return direct;
  const trigger = flow.nodes.find((node) => node.kind === "trigger-keyword" || node.kind === "keyword-trigger");
  return trigger?.body.trim() || "";
}

function flowCanRunForTenant(flow: SuperAdminWhatsAppFlow, tenantId: string) {
  if (flow.status !== "ACTIVE") return false;
  if (tenantId === "tenant-gigxomi") {
    return flow.id === "flow-public-auth-otp" || flow.deployments.some((deployment) => deployment.tenantId === tenantId && deployment.status === "DEPLOYED");
  }
  if (!flow.deployments.length) return false;
  return flow.deployments.some(
    (deployment) =>
      deployment.status === "DEPLOYED" &&
      (deployment.tenantId === tenantId || deployment.tenantId === ALL_AGENCY_TENANTS_DEPLOYMENT_ID),
  );
}

function scoreFlowForMessage(flow: SuperAdminWhatsAppFlow, message: NormalizedWhatsAppInboundMessage) {
  if (!flowCanRunForTenant(flow, message.tenantId)) return 0;
  const body = normalizeForMatch(message.body);
  const keyword = normalizeForMatch(getFlowKeyword(flow));

  if (message.buttonReplyId || message.listReplyId) {
    return getTriggerNodes(flow).length ? 70 : 0;
  }

  if (keyword && body === keyword) return 100;
  if (keyword && body.includes(keyword)) return 80;
  if (flow.triggerMode === "ANY_INCOMING" || flow.nodes.some((node) => node.kind === "trigger-on-message")) return 20;
  return 0;
}

function pickFlow(flows: SuperAdminWhatsAppFlow[], message: NormalizedWhatsAppInboundMessage) {
  return (
    flows
      .map((flow) => ({ flow, score: scoreFlowForMessage(flow, message) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || right.flow.updatedAt.localeCompare(left.flow.updatedAt))[0]?.flow ?? null
  );
}

function findStartNode(flow: SuperAdminWhatsAppFlow, message: NormalizedWhatsAppInboundMessage) {
  if (message.buttonReplyId || message.listReplyId) {
    return getTriggerNodes(flow)[0] ?? flow.nodes[0] ?? null;
  }
  if (flow.triggerMode === "KEYWORD") {
    return flow.nodes.find((node) => node.kind === "trigger-keyword" || node.kind === "keyword-trigger") ?? getTriggerNodes(flow)[0] ?? flow.nodes[0] ?? null;
  }
  return flow.nodes.find((node) => node.kind === "trigger-on-message") ?? getTriggerNodes(flow)[0] ?? flow.nodes[0] ?? null;
}

function findNode(flow: SuperAdminWhatsAppFlow, nodeId?: string) {
  return nodeId ? flow.nodes.find((node) => node.id === nodeId) ?? null : null;
}

function outgoingEdges(flow: SuperAdminWhatsAppFlow, nodeId: string) {
  return flow.edges.filter((edge) => edge.source === nodeId);
}

function edgeTarget(flow: SuperAdminWhatsAppFlow, edge?: SuperAdminWhatsAppFlowEdge | null) {
  return edge ? findNode(flow, edge.target) : null;
}

function nextNodeFor(flow: SuperAdminWhatsAppFlow, nodeId: string, branch?: string) {
  const edges = outgoingEdges(flow, nodeId);
  if (!edges.length) return null;
  const normalizedBranch = normalizeForMatch(branch ?? "");
  if (normalizedBranch) {
    const matched = edges.find((edge) => normalizeForMatch(edge.branchKey || edge.label || "") === normalizedBranch);
    if (matched) return edgeTarget(flow, matched);
  }
  return edgeTarget(flow, edges.find((edge) => normalizeForMatch(edge.branchKey || "") === "default") ?? edges[0]);
}

function findEdgeForReply(flow: SuperAdminWhatsAppFlow, sourceNode: SuperAdminWhatsAppFlowNode, message: NormalizedWhatsAppInboundMessage) {
  const replyId = message.buttonReplyId || message.listReplyId || "";
  const replyTitle = message.buttonReplyTitle || message.listReplyTitle || message.body;
  const candidates = new Set(
    [
      replyId,
      replyTitle,
      message.body,
      message.buttonReplyId ? `button:${replyId}` : "",
      message.listReplyId ? `list:${replyId}` : "",
      message.listReplyId ? `row:${replyId}` : "",
    ]
      .map(normalizeForMatch)
      .filter(Boolean),
  );

  for (const button of sourceNode.buttons ?? []) {
    if (replyId && [button.id, button.value, button.label].map(normalizeForMatch).includes(normalizeForMatch(replyId))) {
      candidates.add(`button:${normalizeForMatch(button.id)}`);
      candidates.add(normalizeForMatch(button.value));
      candidates.add(normalizeForMatch(button.label));
    }
  }

  for (const section of sourceNode.listSections ?? []) {
    for (const row of section.rows) {
      if (replyId && [row.id, row.title].map(normalizeForMatch).includes(normalizeForMatch(replyId))) {
        candidates.add(`list:${normalizeForMatch(row.id)}`);
        candidates.add(`row:${normalizeForMatch(row.id)}`);
        candidates.add(normalizeForMatch(row.title));
      }
    }
  }

  return (
    outgoingEdges(flow, sourceNode.id).find((edge) => candidates.has(normalizeForMatch(edge.branchKey || edge.label || ""))) ??
    outgoingEdges(flow, sourceNode.id).find((edge) => normalizeForMatch(edge.branchKey || "") === "default") ??
    outgoingEdges(flow, sourceNode.id)[0] ??
    null
  );
}

function evaluateCondition(expression: string, context: RuntimeContext) {
  const rendered = renderTemplate(expression, {
    incomingMessage: context.incomingMessage,
    phone: context.phone,
    ...context.variables,
  }).trim();

  if (!rendered) return false;
  const contains = rendered.match(/^(.+)\s+contains\s+(.+)$/i);
  if (contains) {
    return contains[1]!.trim().toLowerCase().includes(contains[2]!.trim().toLowerCase());
  }
  const eq = rendered.match(/^(.+)\s*(==|=|equals)\s*(.+)$/i);
  if (eq) {
    return eq[1]!.trim().toLowerCase() === eq[3]!.trim().toLowerCase();
  }
  return rendered.toLowerCase() === "true";
}

function getAllowedApiOrigins() {
  return (process.env.WHATSAPP_FLOW_API_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function apiUrlIsAllowed(rawUrl: string) {
  const allowlist = getAllowedApiOrigins();
  if (!allowlist.length) return false;
  try {
    const parsed = new URL(rawUrl);
    return allowlist.some((allowed) => parsed.origin === allowed || parsed.hostname === allowed);
  } catch {
    return false;
  }
}

async function recordMessageSent(flow: SuperAdminWhatsAppFlow, node: SuperAdminWhatsAppFlowNode, context: RuntimeContext, delivery: { ok: boolean; mode?: string; messageId?: string; error?: string }) {
  await appendWhatsAppRuntimeEvent({
    flowRunId: context.runId,
    flowId: flow.id,
    tenantId: context.tenantId,
    nodeId: node.id,
    eventType: "message_sent",
    outputJson: {
      ok: delivery.ok,
      mode: delivery.mode,
      messageId: delivery.messageId,
    },
    status: delivery.ok ? "success" : delivery.mode === "local-only" ? "warning" : "failed",
    errorMessage: delivery.error,
  });
}

async function executeNode(flow: SuperAdminWhatsAppFlow, node: SuperAdminWhatsAppFlowNode, context: RuntimeContext): Promise<NodeExecutionResult> {
  await appendWhatsAppRuntimeEvent({
    flowRunId: context.runId,
    flowId: flow.id,
    tenantId: context.tenantId,
    nodeId: node.id,
    eventType: "node_executed",
    inputJson: { kind: node.kind, title: node.title },
  });

  switch (node.kind) {
    case "trigger-on-message":
    case "trigger-keyword":
    case "keyword-trigger":
    case "trigger-button-reply":
    case "trigger-list-reply":
      return { next: nextNodeFor(flow, node.id) };

    case "send-message":
    case "message-text": {
      const body = renderTemplate(node.body || "", {
        incomingMessage: context.incomingMessage,
        ...context.variables,
      }).trim();
      if (!body) return { next: null, status: "failed", error: `Message node "${node.title}" is missing body text.` };
      const delivery = await sendStandaloneWhatsAppMessageFromFile({ tenantId: context.tenantId, to: context.phone, body });
      await recordMessageSent(flow, node, context, delivery);
      if (!delivery.ok && delivery.mode !== "local-only") return { next: null, status: "failed", error: delivery.error || "WhatsApp send failed." };
      if (delivery.ok) {
        await appendBotFlowReplyByCustomerPhoneFromFile({
          tenantId: context.tenantId,
          customerPhone: context.phone,
          body,
          externalMessageId: delivery.messageId || `${flow.id}:${node.id}:${context.runId}`,
        });
      }
      return { next: nextNodeFor(flow, node.id) };
    }

    case "button-message":
    case "message-button": {
      const body = renderTemplate(node.body || "", {
        incomingMessage: context.incomingMessage,
        ...context.variables,
      }).trim() || "Please choose an option.";
      const buttons = (node.buttons ?? [])
        .map((button, index) => ({
          id: (button.id || `button_${index + 1}`).trim(),
          title: renderTemplate(button.label || `Option ${index + 1}`, context.variables).trim(),
          value: button.value?.trim() || button.id,
          actionType: button.actionType,
        }))
        .filter((button) => button.id && button.title)
        .slice(0, 3);

      if (!buttons.length) return { next: null, status: "failed", error: `Button node "${node.title}" has no valid buttons.` };

      const urlButton = buttons.find((button) => button.actionType === "URL" && /^https?:\/\//i.test(button.value));
      const delivery = urlButton
        ? await sendStandaloneWhatsAppCtaUrlMessageFromFile({
            tenantId: context.tenantId,
            to: context.phone,
            body,
            displayText: urlButton.title,
            url: urlButton.value,
            headerText: node.headerText,
            footerText: node.footerText,
          })
        : await sendStandaloneWhatsAppButtonsMessageFromFile({
            tenantId: context.tenantId,
            to: context.phone,
            body,
            headerText: node.headerText,
            footerText: node.footerText,
            buttons: buttons.map((button) => ({ id: button.id, title: button.title })),
          });
      await recordMessageSent(flow, node, context, delivery);
      if (!delivery.ok && delivery.mode !== "local-only") return { next: null, status: "failed", error: delivery.error || "WhatsApp button send failed." };
      if (delivery.ok) {
        await appendBotFlowReplyByCustomerPhoneFromFile({
          tenantId: context.tenantId,
          customerPhone: context.phone,
          body,
          externalMessageId: delivery.messageId || `${flow.id}:${node.id}:${context.runId}`,
        });
      }
      return urlButton ? { next: nextNodeFor(flow, node.id) } : { next: null, status: "waiting", waitingNodeId: node.id, waitingFor: "button_reply" };
    }

    case "message-list": {
      const sections = (node.listSections ?? []).map((section) => ({
        id: section.id,
        title: section.title,
        rows: section.rows.map((row) => ({ id: row.id, title: row.title, description: row.description })),
      }));
      const delivery = await sendStandaloneWhatsAppListMessageFromFile({
        tenantId: context.tenantId,
        to: context.phone,
        body: renderTemplate(node.body || "Please choose an option.", context.variables),
        buttonText: node.listButtonText || "Choose",
        headerText: node.headerText,
        footerText: node.footerText,
        sections,
      });
      await recordMessageSent(flow, node, context, delivery);
      if (!delivery.ok && delivery.mode !== "local-only") return { next: null, status: "failed", error: delivery.error || "WhatsApp list send failed." };
      return { next: null, status: "waiting", waitingNodeId: node.id, waitingFor: "list_reply" };
    }

    case "message-template": {
      if (!node.templateName?.trim()) return { next: null, status: "failed", error: `Template node "${node.title}" is missing template name.` };
      const delivery = await sendStandaloneWhatsAppCallToActionTemplateFromFile({
        tenantId: context.tenantId,
        to: context.phone,
        templateName: node.templateName,
        languageCode: node.templateLanguage || "en_US",
      });
      await recordMessageSent(flow, node, context, delivery);
      if (!delivery.ok && delivery.mode !== "local-only") return { next: null, status: "failed", error: delivery.error || "WhatsApp template send failed." };
      return { next: nextNodeFor(flow, node.id) };
    }

    case "condition": {
      const result = evaluateCondition(node.conditionExpression || node.body || "", context);
      context.variables[`condition_${node.id}`] = result ? "true" : "false";
      return { next: nextNodeFor(flow, node.id, result ? "true" : "false") };
    }

    case "api-request": {
      const url = renderTemplate(node.apiUrl || "", context.variables);
      if (!url || !apiUrlIsAllowed(url)) {
        await appendWhatsAppRuntimeEvent({
          flowRunId: context.runId,
          flowId: flow.id,
          tenantId: context.tenantId,
          nodeId: node.id,
          eventType: "unsupported_node",
          status: "skipped",
          errorMessage: "API request blocked because WHATSAPP_FLOW_API_ALLOWLIST does not allow this URL.",
        });
        return { next: null, status: "failed", error: "API node blocked without an allowlisted URL." };
      }
      return { next: null, status: "failed", error: "API node execution requires a reviewed server-side action adapter before production use." };
    }

    case "wait":
      return { next: null, status: "waiting", waitingNodeId: node.id, waitingFor: "delay" };

    case "handoff":
      if (node.body.trim()) {
        const body = renderTemplate(node.body, context.variables);
        const delivery = await sendStandaloneWhatsAppMessageFromFile({ tenantId: context.tenantId, to: context.phone, body });
        await recordMessageSent(flow, node, context, delivery);
      }
      await appendWhatsAppRuntimeEvent({
        flowRunId: context.runId,
        flowId: flow.id,
        tenantId: context.tenantId,
        nodeId: node.id,
        eventType: "human_handoff",
        outputJson: { conversationId: context.conversationId },
      });
      return { next: null, status: "handed_off" };

    case "stop":
      return { next: null, status: "stopped" };

    case "ai-text-generation":
    case "meta-ai":
    case "intent-lookup":
    case "assign-manager":
    case "create-lead":
      await appendWhatsAppRuntimeEvent({
        flowRunId: context.runId,
        flowId: flow.id,
        tenantId: context.tenantId,
        nodeId: node.id,
        eventType: "unsupported_node",
        status: "skipped",
        errorMessage: `${node.kind} is not executable until a safe backend adapter is connected.`,
      });
      return { next: null, status: "failed", error: `${node.kind} runtime is not connected yet.` };

    default:
      await appendWhatsAppRuntimeEvent({
        flowRunId: context.runId,
        flowId: flow.id,
        tenantId: context.tenantId,
        nodeId: node.id,
        eventType: "unsupported_node",
        status: "failed",
        errorMessage: `Unsupported node type: ${node.kind}`,
      });
      return { next: null, status: "failed", error: `Unsupported node type: ${node.kind}` };
  }
}

async function completeRun(flow: SuperAdminWhatsAppFlow, runId: string, status: WhatsAppRuntimeRunStatus, context: RuntimeContext, error?: string) {
  await updateWhatsAppRuntimeRun(runId, {
    status,
    currentNodeId: undefined,
    waitingNodeId: undefined,
    waitingFor: undefined,
    contextJson: { variables: context.variables },
    errorMessage: error,
  });

  await appendWhatsAppRuntimeEvent({
    flowRunId: runId,
    flowId: flow.id,
    tenantId: context.tenantId,
    eventType: status === "failed" ? "flow_failed" : "flow_completed",
    status: status === "failed" ? "failed" : "success",
    errorMessage: error,
    outputJson: { status },
  });
}

async function executeFromNode(flow: SuperAdminWhatsAppFlow, run: WhatsAppRuntimeFlowRun, startNode: SuperAdminWhatsAppFlowNode, context: RuntimeContext) {
  let current: SuperAdminWhatsAppFlowNode | null = startNode;
  const seen = new Set<string>();
  let steps = 0;

  while (current) {
    steps += 1;
    if (steps > MAX_EXECUTION_STEPS) {
      await completeRun(flow, run.id, "failed", context, "Flow stopped after max execution steps to prevent an infinite loop.");
      return "failed" as const;
    }

    if (seen.has(current.id)) {
      await completeRun(flow, run.id, "failed", context, `Potential loop detected at node "${current.title}".`);
      return "failed" as const;
    }
    seen.add(current.id);

    await updateWhatsAppRuntimeRun(run.id, {
      status: "running",
      currentNodeId: current.id,
      contextJson: { variables: context.variables },
    });

    const result = await executeNode(flow, current, context);
    if (result.status === "waiting") {
      await updateWhatsAppRuntimeRun(run.id, {
        status: "waiting",
        currentNodeId: current.id,
        waitingNodeId: result.waitingNodeId ?? current.id,
        waitingFor: result.waitingFor,
        contextJson: { variables: context.variables },
      });
      return "waiting" as const;
    }

    if (result.status === "handed_off" || result.status === "stopped" || result.status === "failed") {
      await completeRun(flow, run.id, result.status, context, result.error);
      return result.status;
    }

    current = result.next;
  }

  await completeRun(flow, run.id, "completed", context);
  return "completed" as const;
}

async function startNewRun(flow: SuperAdminWhatsAppFlow, message: NormalizedWhatsAppInboundMessage, conversationId?: string) {
  const startNode = findStartNode(flow, message);
  if (!startNode) return null;

  const contactId = `wa-${normalizePhoneKey(message.waId || message.from) || message.from}`;
  const run = await createWhatsAppRuntimeRun({
    flowId: flow.id,
    flowName: flow.name,
    tenantId: message.tenantId,
    contactId,
    conversationId,
    inboundMessageId: message.id,
    currentNodeId: startNode.id,
    contextJson: { incomingMessage: message.body, variables: {} },
  });

  await appendWhatsAppRuntimeEvent({
    flowRunId: run.id,
    flowId: flow.id,
    tenantId: message.tenantId,
    eventType: "flow_started",
    inputJson: {
      messageId: message.id,
      type: message.type,
      phoneNumberId: message.phoneNumberId,
    },
  });

  const context: RuntimeContext = {
    runId: run.id,
    tenantId: message.tenantId,
    contactId,
    conversationId,
    phone: message.from,
    incomingMessage: message.body,
    incomingButtonReplyId: message.buttonReplyId,
    incomingButtonReplyTitle: message.buttonReplyTitle,
    incomingListReplyId: message.listReplyId,
    incomingListReplyTitle: message.listReplyTitle,
    variables: {},
  };

  const status = await executeFromNode(flow, run, startNode, context);
  return { runId: run.id, flowId: flow.id, flowName: flow.name, status };
}

async function continueWaitingRun(flow: SuperAdminWhatsAppFlow, run: WhatsAppRuntimeFlowRun, message: NormalizedWhatsAppInboundMessage) {
  await attachInboundMessageToWhatsAppRun(run.id, message.id);
  const sourceNode = findNode(flow, run.waitingNodeId ?? run.currentNodeId);
  if (!sourceNode) {
    await updateWhatsAppRuntimeRun(run.id, { status: "failed", errorMessage: "Waiting node no longer exists." });
    return { runId: run.id, flowId: flow.id, flowName: flow.name, status: "failed" as const };
  }

  const selectedEvent = message.buttonReplyId ? "button_clicked" : message.listReplyId ? "list_item_selected" : null;
  if (selectedEvent) {
    await appendWhatsAppRuntimeEvent({
      flowRunId: run.id,
      flowId: flow.id,
      tenantId: message.tenantId,
      nodeId: sourceNode.id,
      eventType: selectedEvent,
      inputJson: {
        id: message.buttonReplyId || message.listReplyId,
        title: message.buttonReplyTitle || message.listReplyTitle,
      },
    });
  }

  const next = edgeTarget(flow, findEdgeForReply(flow, sourceNode, message));
  if (!next) {
    await completeRun(
      flow,
      run.id,
      "failed",
      {
        runId: run.id,
        tenantId: message.tenantId,
        contactId: run.contactId,
        conversationId: run.conversationId,
        phone: message.from,
        incomingMessage: message.body,
        variables: (run.contextJson.variables as Record<string, string> | undefined) ?? {},
      },
      "No edge matched the interactive reply payload.",
    );
    return { runId: run.id, flowId: flow.id, flowName: flow.name, status: "failed" as const };
  }

  const context: RuntimeContext = {
    runId: run.id,
    tenantId: message.tenantId,
    contactId: run.contactId,
    conversationId: run.conversationId,
    phone: message.from,
    incomingMessage: message.body,
    incomingButtonReplyId: message.buttonReplyId,
    incomingButtonReplyTitle: message.buttonReplyTitle,
    incomingListReplyId: message.listReplyId,
    incomingListReplyTitle: message.listReplyTitle,
    variables: (run.contextJson.variables as Record<string, string> | undefined) ?? {},
  };

  const status = await executeFromNode(flow, run, next, context);
  return { runId: run.id, flowId: flow.id, flowName: flow.name, status };
}

export async function executeWhatsAppFlowsFromWebhook(payload: unknown) {
  const { messages, unmappedMessages, statusEvents } = await parseIncomingMessages(payload);
  let duplicateMessages = 0;
  let unmappedTenantMessages = 0;

  for (const message of unmappedMessages) {
    const claimed = await claimWhatsAppWebhookMessage({
      messageId: message.id,
      phoneNumberId: message.phoneNumberId,
      payloadJson: {
        reason: message.reason,
        from: message.from,
        type: message.type,
        body: message.body,
        wabaId: message.wabaId,
        displayPhoneNumber: message.displayPhoneNumber,
      },
    });

    if (!claimed) {
      duplicateMessages += 1;
      continue;
    }

    unmappedTenantMessages += 1;
    await appendWhatsAppRuntimeEvent({
      eventType: "tenant_resolution_failed",
      inputJson: {
        messageId: message.id,
        phoneNumberId: message.phoneNumberId,
        wabaId: message.wabaId,
        displayPhoneNumber: message.displayPhoneNumber,
      },
      status: "failed",
      errorMessage: message.reason,
    });
    await markWhatsAppWebhookMessageProcessed(message.id);
  }

  if (!messages.length) {
    return {
      handledMessages: 0,
      duplicateMessages,
      unmappedTenantMessages,
      statusEvents,
      runs: [] as Array<{ runId: string; flowId: string; flowName: string; status: string }>,
    };
  }

  const platformFlows = await listSuperAdminWhatsAppFlows();
  const agencyFlowsByTenant = new Map<string, SuperAdminWhatsAppFlow[]>();
  const flowsForTenant = async (tenantId: string) => {
    const cached = agencyFlowsByTenant.get(tenantId);
    if (cached) return [...platformFlows, ...cached];
    const agencyFlows = await listAgencyWhatsAppFlows(tenantId).catch(() => [] as SuperAdminWhatsAppFlow[]);
    agencyFlowsByTenant.set(tenantId, agencyFlows);
    return [...platformFlows, ...agencyFlows];
  };
  const runs: Array<{ runId: string; flowId: string; flowName: string; status: string }> = [];

  for (const message of messages) {
    const flows = await flowsForTenant(message.tenantId);
    const claimed = await claimWhatsAppWebhookMessage({
      messageId: message.id,
      phoneNumberId: message.phoneNumberId,
      tenantId: message.tenantId,
      payloadJson: {
        from: message.from,
        type: message.type,
        body: message.body,
        buttonReplyId: message.buttonReplyId,
        listReplyId: message.listReplyId,
      },
    });
    if (!claimed) {
      duplicateMessages += 1;
      continue;
    }

    const contactId = `wa-${normalizePhoneKey(message.waId || message.from) || message.from}`;
    const conversation = await findConversationByCustomerPhoneFromFile(message.tenantId, message.from).catch(() => null);
    const waitingRun = await findWaitingWhatsAppRun({ tenantId: message.tenantId, contactId });

    try {
      if (waitingRun && (message.buttonReplyId || message.listReplyId)) {
        const flow = flows.find((item) => item.id === waitingRun.flowId && flowCanRunForTenant(item, message.tenantId)) ?? null;
        if (flow) {
          const result = await continueWaitingRun(flow, waitingRun, message);
          runs.push(result);
          continue;
        }
      }

      const flow = pickFlow(flows, message);
      if (!flow) {
        continue;
      }

      const result = await startNewRun(flow, message, conversation?.id);
      if (result) {
        runs.push(result);
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Flow runtime failed.";
      await appendWhatsAppRuntimeEvent({
        tenantId: message.tenantId,
        eventType: "flow_failed",
        inputJson: {
          messageId: message.id,
          phoneNumberId: message.phoneNumberId,
        },
        status: "failed",
        errorMessage: messageText,
      });
      console.error("WhatsApp flow runtime failed", {
        tenantId: message.tenantId,
        messageId: message.id,
        error: messageText,
      });
    } finally {
      await markWhatsAppWebhookMessageProcessed(message.id);
    }
  }

  return {
    handledMessages: runs.length,
    duplicateMessages,
    unmappedTenantMessages,
    statusEvents,
    runs,
  };
}
