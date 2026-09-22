import { NextResponse } from "next/server";

import { requireSessionRole } from "@/lib/api/require-session-role";
import type { SessionUser } from "@/lib/auth/types";
import { buildAdminDashboardSnapshot } from "@/lib/gigxomi/dashboard-overview-data";
import {
  getInstagramConnectionStateFromFile,
  getWhatsAppConnectionStateFromFile,
} from "@/lib/gigxomi/dummy-platform-file-store";
import type {
  DummyInstagramConnectionState,
  DummyWhatsAppConnectionState,
} from "@/lib/gigxomi/dummy-platform-store";
import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT_ID = "tenant-agency-408de269";

type ConnectedChannelStatus = "connected" | "needs_attention" | "not_connected";

type ConnectedChannelView = {
  label: string;
  value: string;
  detail: string;
  status: ConnectedChannelStatus;
  statusLabel: string;
};

function resolveConnectionTenantId(session: Pick<SessionUser, "role" | "tenantId">) {
  const tenantId = session.tenantId?.trim();
  if (tenantId && tenantId !== "tenant-gigxomi") {
    return tenantId;
  }

  return DEFAULT_TENANT_ID;
}

function compactText(parts: string[]) {
  return parts.map((part) => part.trim()).filter(Boolean).join(" - ");
}

function buildWhatsAppChannel(connection: DummyWhatsAppConnectionState | null): ConnectedChannelView {
  const number = connection?.phoneNumber?.trim() ?? "";
  const phoneNumberId = connection?.phoneNumberId?.trim() ?? "";
  const displayName = connection?.displayName?.trim() ?? "";
  const connectedDetail = compactText([displayName, phoneNumberId ? `Phone ID ${phoneNumberId}` : ""]);
  const hasSavedLine = Boolean(number || phoneNumberId);
  const isConnected =
    Boolean(connection?.pluginEnabled) &&
    (connection?.status === "Number connected" || connection?.status === "Ready for webhook" || hasSavedLine);
  const needsAttention = Boolean(connection?.pluginEnabled) && !isConnected && Boolean(connection?.lastError?.trim() || connection?.status !== "Not started");

  return {
    label: "WhatsApp phone number",
    value: number || (phoneNumberId ? `ID ${phoneNumberId}` : "Not connected yet"),
    detail: isConnected
      ? connectedDetail || "WhatsApp Business line is connected."
      : connection?.lastError?.trim() || connection?.note?.trim() || "Connect the tenant WhatsApp Business number from Integrations.",
    status: isConnected ? "connected" : needsAttention ? "needs_attention" : "not_connected",
    statusLabel: connection?.pluginEnabled ? connection.status : "Not connected",
  };
}

function buildInstagramChannel(connection: DummyInstagramConnectionState | null): ConnectedChannelView {
  const username = connection?.username?.trim().replace(/^@/, "") ?? "";
  const accountId = connection?.accountId?.trim() ?? "";
  const accountType = connection?.accountType?.trim() ?? "";
  const connectedDetail = compactText([accountId ? `Account ID ${accountId}` : "", accountType]);
  const hasSavedAccount = Boolean(username || accountId);
  const isConnected = Boolean(connection?.pluginEnabled) && connection?.status === "Connected" && hasSavedAccount;
  const needsAttention = Boolean(connection?.lastError?.trim() || connection?.status === "Needs attention");

  return {
    label: "Instagram ID",
    value: username ? `@${username}` : accountId ? `ID ${accountId}` : "Not connected yet",
    detail: isConnected
      ? connectedDetail || "Instagram business account is connected."
      : connection?.lastError?.trim() || "Connect the Instagram business account from the Meta setup.",
    status: isConnected ? "connected" : needsAttention ? "needs_attention" : "not_connected",
    statusLabel: connection?.pluginEnabled ? connection.status : "Not connected",
  };
}

export async function GET() {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const tenantId = resolveConnectionTenantId(authorization.session);
  const now = new Date();

  const [
    snapshot,
    whatsappConnection,
    instagramConnection,
    dbTotalChats,
    dbUnassignedChats,
    dbAssignedChats,
    dbActiveMembers,
    dbAssignments,
    obState,
    authUser,
  ] = await Promise.all([
    buildAdminDashboardSnapshot(authorization.session),
    tenantId ? getWhatsAppConnectionStateFromFile(tenantId).catch(() => null) : Promise.resolve(null),
    tenantId ? getInstagramConnectionStateFromFile(tenantId).catch(() => null) : Promise.resolve(null),
    prisma.appConversation.count({
      where: tenantId ? { tenantId } : {},
    }).catch(() => 0),
    prisma.appConversation.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [{ assignedFreelancerId: null }, { assignedFreelancerId: "" }],
      },
    }).catch(() => 0),
    prisma.appConversation.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        assignedFreelancerId: { not: null },
      },
    }).catch(() => 0),
    prisma.appTeamMembership.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        status: "ACTIVE",
      },
      select: {
        id: true,
        freelancerId: true,
        freelancerName: true,
        roleType: true,
      },
    }).catch(() => []),
    prisma.appAssignmentRecord.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"] },
      },
      orderBy: { acceptedAt: "asc" },
    }).catch(() => []),
    authorization.session.userId
      ? prisma.connectedOnboardingState.findUnique({ where: { userId: authorization.session.userId } }).catch(() => null)
      : Promise.resolve(null),
    authorization.session.userId
      ? prisma.appAuthUser.findUnique({ where: { id: authorization.session.userId } }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const obPayload = obState?.payload && typeof obState.payload === "object" ? (obState.payload as Record<string, unknown>) : {};
  const agencyName =
    (typeof obPayload.organizationName === "string" && obPayload.organizationName.trim()) ||
    (typeof obPayload.agencyName === "string" && obPayload.agencyName.trim()) ||
    (typeof obState?.agencyName === "string" && obState.agencyName.trim()) ||
    (typeof obState?.brandName === "string" && obState.brandName.trim()) ||
    (authUser?.displayName && authUser.displayName !== "Ankit Rathore" ? authUser.displayName : "Post Production Work");

  const slowEditors = dbAssignments.map((a) => {
    const start = a.acceptedAt ? new Date(a.acceptedAt).getTime() : new Date(a.createdAt).getTime();
    const daysInProgress = Math.max(1, Math.round((now.getTime() - start) / (1000 * 60 * 60 * 24)));
    const isOverdue = Boolean(a.deadline && new Date(a.deadline).getTime() < now.getTime());
    return {
      freelancerId: a.freelancerId,
      freelancerName: a.freelancerName,
      projectTitle: a.title,
      status: a.status,
      daysInProgress,
      deadlineText: a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN") : "No deadline set",
      isOverdue: isOverdue || daysInProgress >= 3,
    };
  }).sort((a, b) => b.daysInProgress - a.daysInProgress);

  const realMetrics = {
    agencyName,
    totalChats: dbTotalChats,
    unassignedChats: dbUnassignedChats,
    assignedChats: dbAssignedChats,
    activeTeamEditors: dbActiveMembers.length,
    activeProjects: dbAssignments.length,
    urgentProjects: slowEditors.filter((e) => e.isOverdue).length,
    slowEditors,
  };

  return NextResponse.json({
    ok: true,
    snapshot,
    realMetrics,
    channels: {
      whatsapp: buildWhatsAppChannel(whatsappConnection),
      instagram: buildInstagramChannel(instagramConnection),
    },
  });
}
