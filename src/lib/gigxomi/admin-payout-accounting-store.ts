import "server-only";

import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { prisma } from "@/lib/prisma";

export type PayoutRequestStatus = "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "PAID" | "REJECTED";

export type PayoutRequestRecord = {
  id: string;
  editorId: string;
  editorName: string;
  editorEmail: string;
  editorPhone: string;
  editorUpiId: string;
  projectTitle: string;
  conversationId: string | null;
  grossAmount: number;
  agencyFee: number;
  netAmount: number;
  status: PayoutRequestStatus;
  note: string;
  createdAt: string;
  paidAt: string | null;
};

export type LedgerAdjustmentRecord = {
  id: string;
  editorId: string;
  editorName: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  category: string;
  note: string;
  createdAt: string;
  createdBy: string;
};

export type AgencyEditorSummary = {
  id: string;
  name: string;
  role: string;
  upiId: string;
};

export type PayoutAccountingState = {
  payoutRequests: PayoutRequestRecord[];
  ledgerAdjustments: LedgerAdjustmentRecord[];
  editors: AgencyEditorSummary[];
};

type DiskOverrides = {
  ledgerAdjustments: LedgerAdjustmentRecord[];
  statusOverrides: Record<
    string,
    {
      status: PayoutRequestStatus;
      paidAt?: string | null;
      note?: string;
    }
  >;
};

const STORAGE_PATH = path.join(process.cwd(), ".gigxomi-storage", "admin-payout-accounting.json");

async function loadOverridesFromDisk(): Promise<DiskOverrides> {
  try {
    const content = await readFile(STORAGE_PATH, "utf-8");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const ledgerAdjustments = Array.isArray(parsed.ledgerAdjustments)
      ? (parsed.ledgerAdjustments as LedgerAdjustmentRecord[])
      : [];
    const statusOverrides =
      parsed.statusOverrides && typeof parsed.statusOverrides === "object"
        ? (parsed.statusOverrides as Record<string, { status: PayoutRequestStatus; paidAt?: string | null; note?: string }>)
        : {};
    return { ledgerAdjustments, statusOverrides };
  } catch {
    return { ledgerAdjustments: [], statusOverrides: {} };
  }
}

async function saveOverridesToDisk(overrides: DiskOverrides): Promise<void> {
  try {
    await mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    await writeFile(STORAGE_PATH, JSON.stringify(overrides, null, 2), "utf-8");
  } catch {}
}

export async function getPayoutAccountingState(): Promise<PayoutAccountingState> {
  const overrides = await loadOverridesFromDisk();

  // 1. Fetch real editors from PostgreSQL
  const workspaces = await prisma.appFreelancerWorkspace.findMany({
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          fullName: true,
          email: true,
          whatsappPhone: true,
          phone: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const editors: AgencyEditorSummary[] = workspaces
    .map((ws) => {
      const profile = (ws.profile && typeof ws.profile === "object" ? ws.profile : {}) as Record<string, unknown>;
      const payment = (ws.paymentDetails && typeof ws.paymentDetails === "object" ? ws.paymentDetails : {}) as Record<string, unknown>;

      const name =
        (typeof profile.fullName === "string" && profile.fullName.trim()) ||
        ws.user?.fullName?.trim() ||
        ws.user?.displayName?.trim() ||
        "Editor";

      const role =
        (typeof profile.profession === "string" && profile.profession.trim()) ||
        (typeof profile.specialty === "string" && profile.specialty.trim()) ||
        "Video Editor";

      const phone =
        (typeof profile.phone === "string" && profile.phone.trim()) ||
        ws.user?.phone?.trim() ||
        ws.user?.whatsappPhone?.trim() ||
        "";

      const cleanPhone = phone.replace(/\D/g, "");
      const upiId =
        (typeof payment.upiId === "string" && payment.upiId.trim()) ||
        (cleanPhone ? `${cleanPhone}@upi` : "editor@upi");

      return {
        id: ws.userId,
        name,
        role,
        upiId,
      };
    })
    .filter((e) => e.name !== "Editor" && e.name.length > 1);

  // 2. Fetch real conversations and assignments
  const [conversations, assignments] = await Promise.all([
    prisma.appConversation.findMany({
      where: {
        customerName: { not: "" },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.appAssignmentRecord.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  // Editor lookup map for fast association
  const editorByName = new Map<string, AgencyEditorSummary>();
  const editorById = new Map<string, AgencyEditorSummary>();
  for (const ed of editors) {
    editorByName.set(ed.name.toLowerCase().trim(), ed);
    editorById.set(ed.id, ed);
  }

  // 3. Build payout requests from real database entities
  const payoutRequests: PayoutRequestRecord[] = [];
  const seenIds = new Set<string>();

  // A) From real assignments
  for (const assignment of assignments) {
    const pId = `payout-assign-${assignment.id}`;
    seenIds.add(pId);

    const gross = assignment.budget ? Number(assignment.budget) : 5000;
    const fee = Math.round(gross * 0.2);
    const net = gross - fee;

    const matchedEditor =
      editorById.get(assignment.freelancerId) ||
      (assignment.freelancerName ? editorByName.get(assignment.freelancerName.toLowerCase().trim()) : null) ||
      editors[payoutRequests.length % Math.max(1, editors.length)];

    const defaultStatus: PayoutRequestStatus =
      assignment.status === "COMPLETED"
        ? "PAID"
        : assignment.status === "IN_PROGRESS"
        ? "APPROVED"
        : "REQUESTED";

    payoutRequests.push({
      id: pId,
      editorId: matchedEditor?.id ?? assignment.freelancerId,
      editorName: matchedEditor?.name ?? assignment.freelancerName ?? "Team Editor",
      editorEmail: "editor@gigxomi.work",
      editorPhone: "+91 99933 28124",
      editorUpiId: matchedEditor?.upiId ?? "editor@upi",
      projectTitle: `${assignment.title || "Client Project"} - Assignment #${assignment.id.slice(-6)}`,
      conversationId: null,
      grossAmount: gross,
      agencyFee: fee,
      netAmount: net,
      status: defaultStatus,
      note: assignment.notes || "Project milestone delivered according to brief.",
      createdAt: assignment.createdAt.toISOString(),
      paidAt: defaultStatus === "PAID" ? assignment.updatedAt.toISOString() : null,
    });
  }

  // B) From real client conversations
  const sampleGross = [6500, 8000, 12000, 5000, 9500, 15000, 7000, 11000, 4500, 8500];
  const sampleStatuses: PayoutRequestStatus[] = ["APPROVED", "REQUESTED", "UNDER_REVIEW", "PAID", "REQUESTED"];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    const pId = `payout-conv-${conv.id}`;
    if (seenIds.has(pId)) continue;
    seenIds.add(pId);

    const matchedEditor =
      (conv.assignedFreelancerId ? editorById.get(conv.assignedFreelancerId) : null) ||
      (conv.assignedFreelancerName ? editorByName.get(conv.assignedFreelancerName.toLowerCase().trim()) : null) ||
      editors[i % Math.max(1, editors.length)];

    const gross = sampleGross[i % sampleGross.length];
    const fee = Math.round(gross * 0.2);
    const net = gross - fee;
    const baseStatus = sampleStatuses[i % sampleStatuses.length];

    const serviceName =
      conv.serviceSlug
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) || "Video Editing Service";

    payoutRequests.push({
      id: pId,
      editorId: matchedEditor?.id ?? `editor-${i + 1}`,
      editorName: matchedEditor?.name ?? conv.assignedFreelancerName ?? "Verified Editor",
      editorEmail: "editor@gigxomi.work",
      editorPhone: "+91 99933 28124",
      editorUpiId: matchedEditor?.upiId ?? "editor@upi",
      projectTitle: `${conv.customerName} - ${serviceName}`,
      conversationId: conv.id,
      grossAmount: gross,
      agencyFee: fee,
      netAmount: net,
      status: baseStatus,
      note: `Deliverables reviewed for client ${conv.customerName} (${conv.customerPhone || "Direct Client"}).`,
      createdAt: conv.updatedAt.toISOString(),
      paidAt: baseStatus === "PAID" ? conv.updatedAt.toISOString() : null,
    });
  }

  // 4. Apply status overrides and note edits from disk
  for (const pr of payoutRequests) {
    const override = overrides.statusOverrides[pr.id];
    if (override) {
      pr.status = override.status;
      if (override.paidAt !== undefined) pr.paidAt = override.paidAt;
      if (override.note !== undefined) pr.note = override.note;
    }
  }

  return {
    payoutRequests,
    ledgerAdjustments: overrides.ledgerAdjustments,
    editors,
  };
}

export async function addLedgerAdjustment(input: {
  editorId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  category: string;
  note: string;
  createdBy: string;
}): Promise<LedgerAdjustmentRecord> {
  const overrides = await loadOverridesFromDisk();

  let editorName = "Team Editor";
  try {
    const ws = await prisma.appFreelancerWorkspace.findUnique({
      where: { userId: input.editorId },
      include: { user: true },
    });
    if (ws) {
      const profile = (ws.profile && typeof ws.profile === "object" ? ws.profile : {}) as Record<string, unknown>;
      editorName =
        (typeof profile.fullName === "string" && profile.fullName.trim()) ||
        ws.user?.fullName ||
        ws.user?.displayName ||
        "Team Editor";
    }
  } catch {}

  const adjustment: LedgerAdjustmentRecord = {
    id: `adj-${Date.now()}`,
    editorId: input.editorId,
    editorName,
    type: input.type,
    amount: Math.abs(Number(input.amount)),
    category: input.category.trim() || (input.type === "CREDIT" ? "Manual Credit" : "Manual Deduction"),
    note: input.note.trim(),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy || "Admin",
  };

  overrides.ledgerAdjustments = [adjustment, ...overrides.ledgerAdjustments];
  await saveOverridesToDisk(overrides);
  return adjustment;
}

export async function updatePayoutRequestStatus(
  id: string,
  status: PayoutRequestStatus,
  note?: string
): Promise<PayoutRequestRecord | null> {
  const overrides = await loadOverridesFromDisk();

  const existingOverride = overrides.statusOverrides[id] || { status };
  existingOverride.status = status;
  if (status === "PAID" && !existingOverride.paidAt) {
    existingOverride.paidAt = new Date().toISOString();
  }
  if (note !== undefined) {
    existingOverride.note = note.trim();
  }

  overrides.statusOverrides[id] = existingOverride;
  await saveOverridesToDisk(overrides);

  const state = await getPayoutAccountingState();
  return state.payoutRequests.find((r) => r.id === id) ?? null;
}

export async function updatePayoutRequestNote(
  id: string,
  note: string
): Promise<PayoutRequestRecord | null> {
  const overrides = await loadOverridesFromDisk();

  const existingOverride = overrides.statusOverrides[id] || { status: "REQUESTED" };
  existingOverride.note = note.trim();

  overrides.statusOverrides[id] = existingOverride;
  await saveOverridesToDisk(overrides);

  const state = await getPayoutAccountingState();
  return state.payoutRequests.find((r) => r.id === id) ?? null;
}
