import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  SuperAdminWhatsAppFlow,
  SuperAdminWhatsAppFlowEdge,
  SuperAdminWhatsAppFlowNode,
  SuperAdminWhatsAppFlowRun,
} from "@/lib/gigxomi/super-admin-whatsapp-flow-store";

type AgencyFlowInput = Partial<SuperAdminWhatsAppFlow> &
  Pick<SuperAdminWhatsAppFlow, "name" | "summary" | "status" | "triggerMode" | "triggerKeyword" | "nodes" | "edges">;

type DbFlow = {
  id: string;
  tenantId: string | null;
  name: string;
  description: string;
  status: string;
  nodesJson: unknown;
  edgesJson: unknown;
  settingsJson: unknown;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

const inMemoryFallback = new Map<string, SuperAdminWhatsAppFlow[]>();

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function nowIso() {
  return new Date().toISOString();
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `agency-flow-${randomUUID().slice(0, 8)}`;
}

function dbStatus(status: SuperAdminWhatsAppFlow["status"]) {
  return status === "ACTIVE" ? "active" : status === "PAUSED" ? "paused" : status === "ERROR" ? "error" : "draft";
}

function flowStatus(status: string): SuperAdminWhatsAppFlow["status"] {
  const normalized = status.toLowerCase();
  return normalized === "active" ? "ACTIVE" : normalized === "paused" ? "PAUSED" : normalized === "error" ? "ERROR" : "DRAFT";
}

function starterNodes(): SuperAdminWhatsAppFlowNode[] {
  const triggerId = `node-${randomUUID()}`;
  const replyId = `node-${randomUUID()}`;
  const handoffId = `node-${randomUUID()}`;
  const stopId = `node-${randomUUID()}`;
  return [
    { id: triggerId, kind: "trigger-on-message", title: "Welcome new messages", body: "Start for every inbound WhatsApp message." },
    {
      id: replyId,
      kind: "message-button",
      title: "Acknowledge and route",
      body: "Thanks for contacting us. Your message is in the team inbox and a specialist will reply shortly.",
      buttons: [{ id: "human_support", label: "Talk to the team", actionType: "QUICK_REPLY", value: "human_support" }],
    },
    { id: handoffId, kind: "handoff", title: "Keep the inbox active", body: "Keep this customer conversation visible for the agency team.", outputVariable: "human_support" },
    { id: stopId, kind: "stop", title: "Stop chatbot run", body: "Finish after acknowledgement and handoff." },
  ];
}

function starterFlow(tenantId: string, agencyName: string): SuperAdminWhatsAppFlow {
  const createdAt = nowIso();
  const nodes = starterNodes();
  return {
    id: `agency-chatbot-${tenantId}`,
    name: "Agency inbox chatbot",
    summary: "Replies to new WhatsApp messages, keeps the conversation in this agency inbox, and hands it to the team.",
    status: "ACTIVE",
    triggerMode: "ANY_INCOMING",
    triggerKeyword: "",
    channel: "OFFICIAL_GIGXOMI",
    pluginKey: "agency-inbox-chatbot",
    pluginVersion: 1,
    pluginStatus: "DEPLOYED",
    testedAt: createdAt,
    deployments: [{ tenantId, agencyName, status: "DEPLOYED", deployedAt: createdAt }],
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({
      id: `edge-${node.id}-${nodes[index + 1].id}`,
      source: node.id,
      target: nodes[index + 1].id,
      branchKey: node.kind === "message-button" ? "button:human_support" : "default",
    })),
    createdAt,
    updatedAt: createdAt,
  };
}

function repairDefaultAgencyChatbot(flow: SuperAdminWhatsAppFlow) {
  if (flow.pluginKey !== "agency-inbox-chatbot") return flow;
  const nodes = flow.nodes.map((node) =>
    node.kind === "handoff" && !node.outputVariable?.trim() ? { ...node, outputVariable: "human_support" } : node,
  );
  const buttonNode = nodes.find((node) => node.kind === "message-button" && node.buttons?.some((button) => button.id === "human_support"));
  if (!buttonNode) return { ...flow, nodes };
  const edges = flow.edges.map((edge) =>
    edge.source === buttonNode.id && (edge.branchKey === "default" || !edge.branchKey)
      ? { ...edge, branchKey: "button:human_support" }
      : edge,
  );
  return { ...flow, nodes, edges };
}

function fromDb(record: DbFlow, agencyName: string): SuperAdminWhatsAppFlow {
  const settings = asRecord(record.settingsJson);
  const status = flowStatus(record.status);
  const nodes = Array.isArray(record.nodesJson) ? (record.nodesJson as SuperAdminWhatsAppFlowNode[]) : [];
  const edges = Array.isArray(record.edgesJson) ? (record.edgesJson as SuperAdminWhatsAppFlowEdge[]) : [];
  const tenantId = record.tenantId ?? "";
  return {
    id: record.id,
    name: record.name,
    summary: record.description,
    status,
    triggerMode: settings.triggerMode === "KEYWORD" ? "KEYWORD" : "ANY_INCOMING",
    triggerKeyword: asString(settings.triggerKeyword),
    channel: "OFFICIAL_GIGXOMI",
    pluginKey: asString(settings.pluginKey, slugify(record.name)),
    pluginVersion: record.version,
    pluginStatus: settings.pluginStatus === "INTERNAL_ONLY" || settings.pluginStatus === "READY_TO_DEPLOY" ? settings.pluginStatus : "DEPLOYED",
    testedAt: record.publishedAt?.toISOString() ?? null,
    deployments: [{ tenantId, agencyName, status: "DEPLOYED", deployedAt: record.publishedAt?.toISOString() ?? record.updatedAt.toISOString() }],
    nodes,
    edges,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function ensureDefault(tenantId: string, agencyName: string) {
  if (!tenantId) return;
  if (!hasDatabaseUrl()) {
    const current = inMemoryFallback.get(tenantId) ?? [];
    if (!current.some((flow) => flow.pluginKey === "agency-inbox-chatbot")) inMemoryFallback.set(tenantId, [starterFlow(tenantId, agencyName), ...current]);
    return;
  }
  const existing = await prisma.whatsAppFlow.findFirst({ where: { platformScope: "agency", tenantId, channel: "whatsapp", settingsJson: { path: ["pluginKey"], equals: "agency-inbox-chatbot" } } });
  if (existing) {
    const repaired = repairDefaultAgencyChatbot(fromDb(existing as DbFlow, agencyName));
    if (JSON.stringify(repaired.nodes) !== JSON.stringify(existing.nodesJson) || JSON.stringify(repaired.edges) !== JSON.stringify(existing.edgesJson)) {
      await prisma.whatsAppFlow.update({ where: { id: existing.id }, data: { nodesJson: toJson(repaired.nodes), edgesJson: toJson(repaired.edges) } });
    }
    return;
  }
  const flow = starterFlow(tenantId, agencyName);
  await prisma.whatsAppFlow.create({
    data: {
      id: flow.id,
      platformScope: "agency",
      tenantId,
      name: flow.name,
      description: flow.summary,
      channel: "whatsapp",
      status: "active",
      nodesJson: toJson(flow.nodes),
      edgesJson: toJson(flow.edges),
      settingsJson: toJson({ triggerMode: flow.triggerMode, triggerKeyword: flow.triggerKeyword, pluginKey: flow.pluginKey, pluginStatus: flow.pluginStatus }),
      version: flow.pluginVersion,
      publishedAt: new Date(flow.testedAt ?? Date.now()),
    },
  }).catch(async (error: unknown) => {
    // Concurrent inbound messages can attempt the same seed; an existing ID is safe.
    if (!(error instanceof Error) || !/unique|duplicate/i.test(error.message)) throw error;
  });
}

export async function listAgencyWhatsAppFlows(tenantId: string, agencyName = "This agency") {
  await ensureDefault(tenantId, agencyName);
  if (!hasDatabaseUrl()) return (inMemoryFallback.get(tenantId) ?? []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const records = await prisma.whatsAppFlow.findMany({ where: { platformScope: "agency", tenantId, channel: "whatsapp" }, orderBy: { updatedAt: "desc" } });
  return (records as DbFlow[]).map((record) => fromDb(record, agencyName));
}

export async function listAgencyWhatsAppFlowRuns(tenantId: string, limit = 25): Promise<SuperAdminWhatsAppFlowRun[]> {
  if (!hasDatabaseUrl()) return [] as SuperAdminWhatsAppFlowRun[];
  const runs = await prisma.whatsAppFlowRun.findMany({
    where: { tenantId },
    include: { flow: { select: { name: true, platformScope: true } } },
    orderBy: { updatedAt: "desc" },
    take: Math.max(limit, 0),
  });
  return runs
    .filter((run) => run.flow?.platformScope === "agency")
    .map((run) => ({
      id: run.id,
      flowId: run.flowId,
      flowName: run.flow?.name ?? "Agency WhatsApp flow",
      status: (run.status === "failed" ? "FAILED" : run.status === "waiting" || run.status === "running" ? "WAITING" : "SUCCESS") as SuperAdminWhatsAppFlowRun["status"],
      summary: run.errorMessage || (run.status === "failed" ? "Flow execution failed." : "Flow executed for an agency conversation."),
      createdAt: run.startedAt.toISOString(),
    }));
}

function normalizedInput(input: AgencyFlowInput, existing: SuperAdminWhatsAppFlow | null, tenantId: string, agencyName: string): SuperAdminWhatsAppFlow {
  const timestamp = nowIso();
  const nodes = Array.isArray(input.nodes) ? input.nodes : existing?.nodes ?? [];
  const edges = Array.isArray(input.edges) ? input.edges : existing?.edges ?? [];
  const name = input.name.trim();
  return {
    // Never accept a client-chosen ID for a new flow. Otherwise an agency
    // could submit another tenant's ID and make the database upsert overwrite
    // a flow outside its workspace.
    id: existing?.id ?? `agency-flow-${randomUUID()}`,
    name,
    summary: input.summary.trim(),
    status: input.status,
    triggerMode: input.triggerMode === "KEYWORD" ? "KEYWORD" : "ANY_INCOMING",
    triggerKeyword: input.triggerKeyword.trim(),
    channel: "OFFICIAL_GIGXOMI",
    pluginKey: input.pluginKey?.trim() || existing?.pluginKey || slugify(name),
    pluginVersion: existing ? existing.pluginVersion + 1 : 1,
    pluginStatus: input.status === "ACTIVE" ? "DEPLOYED" : input.pluginStatus || existing?.pluginStatus || "INTERNAL_ONLY",
    testedAt: input.status === "ACTIVE" ? timestamp : existing?.testedAt ?? null,
    deployments: [{ tenantId, agencyName, status: "DEPLOYED", deployedAt: timestamp }],
    nodes,
    edges,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function saveAgencyWhatsAppFlow(tenantId: string, agencyName: string, input: AgencyFlowInput) {
  const current = await listAgencyWhatsAppFlows(tenantId, agencyName);
  const existing = input.id ? current.find((flow) => flow.id === input.id) ?? null : null;
  const flow = normalizedInput(input, existing, tenantId, agencyName);
  if (!hasDatabaseUrl()) {
    inMemoryFallback.set(tenantId, existing ? current.map((item) => (item.id === flow.id ? flow : item)) : [flow, ...current]);
    return flow;
  }
  await prisma.whatsAppFlow.upsert({
    where: { id: flow.id },
    create: { id: flow.id, platformScope: "agency", tenantId, name: flow.name, description: flow.summary, channel: "whatsapp", status: dbStatus(flow.status), nodesJson: toJson(flow.nodes), edgesJson: toJson(flow.edges), settingsJson: toJson({ triggerMode: flow.triggerMode, triggerKeyword: flow.triggerKeyword, pluginKey: flow.pluginKey, pluginStatus: flow.pluginStatus }), version: flow.pluginVersion, publishedAt: flow.testedAt ? new Date(flow.testedAt) : null },
    update: { name: flow.name, description: flow.summary, status: dbStatus(flow.status), nodesJson: toJson(flow.nodes), edgesJson: toJson(flow.edges), settingsJson: toJson({ triggerMode: flow.triggerMode, triggerKeyword: flow.triggerKeyword, pluginKey: flow.pluginKey, pluginStatus: flow.pluginStatus }), version: flow.pluginVersion, publishedAt: flow.testedAt ? new Date(flow.testedAt) : null },
  });
  return flow;
}

export async function updateAgencyWhatsAppFlowMeta(tenantId: string, agencyName: string, input: { flowId: string; name?: string; summary?: string }) {
  const flows = await listAgencyWhatsAppFlows(tenantId, agencyName);
  const existing = flows.find((flow) => flow.id === input.flowId);
  if (!existing) throw new Error("The selected agency chatbot flow no longer exists.");
  return saveAgencyWhatsAppFlow(tenantId, agencyName, { ...existing, name: input.name?.trim() || existing.name, summary: input.summary?.trim() || existing.summary });
}

export async function deleteAgencyWhatsAppFlow(tenantId: string, agencyName: string, flowId: string) {
  const flows = await listAgencyWhatsAppFlows(tenantId, agencyName);
  const existing = flows.find((flow) => flow.id === flowId);
  if (!existing) throw new Error("The selected agency chatbot flow no longer exists.");
  if (existing.pluginKey === "agency-inbox-chatbot") throw new Error("The default agency inbox chatbot is protected. Pause it instead of deleting it.");
  if (!hasDatabaseUrl()) {
    inMemoryFallback.set(tenantId, flows.filter((flow) => flow.id !== flowId));
    return existing;
  }
  await prisma.whatsAppFlow.deleteMany({ where: { id: flowId, platformScope: "agency", tenantId } });
  return existing;
}
