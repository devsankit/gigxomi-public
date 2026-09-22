import "server-only";

import path from "node:path";
import { readFile } from "node:fs/promises";

import type { Prisma } from "@prisma/client";

import { buildSalesWhatsAppTenantId } from "@/lib/api/resolve-session-tenant";
import { decryptConnectedSecret, encryptConnectedSecret } from "@/lib/connected-platform/secret-box";
import { prisma } from "@/lib/prisma";
import {
  buildDefaultInstagramVerifyToken,
  getDummyPlatformSnapshot,
  type ChannelConnection,
  type DummyConversation,
  type DummyInstagramConnectionState,
  type DummyPlatformSnapshot,
  type DummyService,
  type DummyWhatsAppConnectionState,
} from "@/lib/gigxomi/dummy-platform-store";

const LEGACY_STORE_PATH = path.join(process.cwd(), ".gigxomi", "local-platform-store.json");
let bootstrapPromise: Promise<void> | null = null;
let legacySnapshotCache: DummyPlatformSnapshot | null = null;
type StoredServiceRow = { payload: unknown };
type StoredConversationRow = { payload: unknown };
type StoredServiceMetaRow = { id: string; updatedAt: Date; payload: unknown };
type StoredConversationMetaRow = { id: string; updatedAt: Date; payload: unknown };
type StoredWhatsAppSocialConnection = {
  userId: string;
  status: string;
  externalAccountId: string | null;
  displayName: string | null;
  accessTokenCiphertext: string | null;
  lastError: string | null;
  metadata: unknown;
  updatedAt: Date;
  user: { tenantId: string | null };
};

const PUBLIC_AUTH_WHATSAPP_PHONE = "+91 99818 07309";
const PUBLIC_AUTH_WHATSAPP_TENANT_FALLBACK = "tenant-agency-408de269";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function decryptStoredToken(ciphertext: string | null) {
  if (!ciphertext?.trim()) return "";
  try {
    return decryptConnectedSecret(ciphertext);
  } catch {
    return "";
  }
}

function recoverPublicWhatsAppStateFromEnvironment(
  fallback: DummyWhatsAppConnectionState,
): DummyWhatsAppConnectionState | null {
  const phoneNumberId = text(process.env.WHATSAPP_PHONE_NUMBER_ID) || text(process.env.META_WHATSAPP_PHONE_NUMBER_ID);
  if (!phoneNumberId) return null;

  const accessToken = text(process.env.WHATSAPP_ACCESS_TOKEN) || text(process.env.META_WHATSAPP_ACCESS_TOKEN);
  const tenantId = text(process.env.GIGXOMI_PUBLIC_AUTH_TENANT_ID) || PUBLIC_AUTH_WHATSAPP_TENANT_FALLBACK;
  const wabaId = text(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) || text(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID);
  const metaAppId = text(process.env.META_WHATSAPP_APP_ID) || text(process.env.META_APP_ID) || fallback.metaAppId;

  // Deployment environment values are server-only and are the durable
  // emergency source for the public 99818 line.  Never copy them to the
  // client or log them; this simply restores the runtime connection after an
  // ephemeral .gigxomi directory is replaced during deploy.
  return {
    ...fallback,
    tenantId,
    phoneNumber: PUBLIC_AUTH_WHATSAPP_PHONE,
    pluginEnabled: true,
    status: accessToken ? "Ready for webhook" : "Number connected",
    note: accessToken
      ? "Recovered the Agency public WhatsApp line from protected deployment configuration."
      : "Recovered the Agency inbound WhatsApp identity from protected deployment configuration; add the server access token to enable outgoing messages.",
    metaAppId,
    wabaId: wabaId || fallback.wabaId,
    phoneNumberId,
    accessToken,
    lastError: accessToken ? "" : "The Agency WhatsApp access token is not configured on the server.",
    updatedAt: new Date().toISOString(),
  };
}

function recoverWhatsAppStateFromSocialConnection(
  connection: StoredWhatsAppSocialConnection,
  fallback: DummyWhatsAppConnectionState,
): DummyWhatsAppConnectionState | null {
  const tenantId = text(connection.user.tenantId);
  const metadata = jsonRecord(connection.metadata);
  const phoneNumberId = text(metadata.phoneNumberId) || text(connection.externalAccountId);
  if (!tenantId || !phoneNumberId) return null;

  const accessToken = decryptStoredToken(connection.accessTokenCiphertext);
  return {
    ...fallback,
    tenantId,
    businessName: text(connection.displayName) || fallback.businessName,
    displayName: text(connection.displayName) || fallback.displayName,
    // The only shared public authentication line is the Agency-owned 99818
    // line. Its number is fixed by product policy; Meta's phone ID is still
    // the authoritative routing identity for inbound webhooks.
    phoneNumber: PUBLIC_AUTH_WHATSAPP_PHONE,
    // An incomplete Meta setup must not make the phone identity disappear.
    // Inbound routing depends on phoneNumberId and must keep reaching this
    // tenant so the Agency can see and repair the connection. Sending still
    // checks the encrypted token and reports any Meta error separately.
    pluginEnabled: true,
    status: connection.status === "CONNECTED" ? "Ready for webhook" : "Number connected",
    note: connection.status === "CONNECTED"
      ? "Recovered the Agency WhatsApp connection from the encrypted server-side integration record."
      : "Recovered the Agency WhatsApp identity from the server-side integration record; complete any remaining Meta setup to enable outgoing messages.",
    businessId: text(metadata.businessId) || fallback.businessId,
    wabaId: text(metadata.wabaId) || fallback.wabaId,
    phoneNumberId,
    accessToken: accessToken || fallback.accessToken,
    lastError: text(connection.lastError),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

function recoverInstagramStateFromSocialConnection(
  connection: StoredWhatsAppSocialConnection,
  fallback?: DummyInstagramConnectionState | null,
): DummyInstagramConnectionState | null {
  const metadata = jsonRecord(connection.metadata);
  const tenantId = text(connection.user?.tenantId) || text(metadata.tenantId) || "tenant-agency-408de269";
  const accountId = text(connection.externalAccountId) || text(metadata.instagramBusinessAccountId);
  if (!tenantId) return null;

  const accessToken =
    decryptStoredToken(connection.accessTokenCiphertext) ||
    text(fallback?.accessToken) ||
    text(process.env.INSTAGRAM_ACCESS_TOKEN) ||
    text(process.env.INSTAGRAM_PAGE_ACCESS_TOKEN);
  const rawDisplayName = text(connection.displayName) || fallback?.displayName || "gigxomi";
  const username = rawDisplayName.replace(/^@/, "");
  const displayName = rawDisplayName.startsWith("@") ? rawDisplayName : `@${rawDisplayName}`;

  return {
    tenantId,
    pluginEnabled: connection.status === "CONNECTED" || Boolean(fallback?.pluginEnabled) || true,
    status: connection.status === "CONNECTED" ? "Connected" : (fallback?.status ?? "Plugin enabled"),
    displayName,
    username,
    accountId: accountId || fallback?.accountId || "",
    accountType: fallback?.accountType || "Instagram professional account",
    instagramBusinessAccountId: accountId || fallback?.instagramBusinessAccountId || "",
    accessToken,
    verifyToken: fallback?.verifyToken || buildDefaultInstagramVerifyToken(tenantId),
    graphApiVersion: fallback?.graphApiVersion || "v25.0",
    note: connection.status === "CONNECTED"
      ? "Recovered the Agency Instagram connection from the server integration record."
      : (fallback?.note ?? "Instagram connected."),
    lastError: text(connection.lastError) || fallback?.lastError || "",
    connectedAt: fallback?.connectedAt || connection.updatedAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

function hasChangedPayload(existingPayload: unknown, nextPayload: unknown) {
  return JSON.stringify(existingPayload) !== JSON.stringify(nextPayload);
}

function stripDbBackedCollections(snapshot: DummyPlatformSnapshot) {
  return {
    ...snapshot,
    services: [],
    conversations: [],
  } satisfies DummyPlatformSnapshot;
}

async function readLegacySnapshotFile() {
  try {
    const contents = await readFile(LEGACY_STORE_PATH, "utf8");
    return JSON.parse(contents) as DummyPlatformSnapshot;
  } catch {
    return getDummyPlatformSnapshot();
  }
}

async function readLegacySnapshot() {
  if (legacySnapshotCache) {
    return legacySnapshotCache;
  }

  legacySnapshotCache = {
    ...stripDbBackedCollections(getDummyPlatformSnapshot()),
    ...(await readLegacySnapshotFile()),
    services: [],
    conversations: [],
  } satisfies DummyPlatformSnapshot;
  return legacySnapshotCache;
}

async function ensureBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const [serviceCount, conversationCount] = await Promise.all([
        prisma.appFreelancerService.count(),
        prisma.appConversation.count(),
      ]);

      const importLegacyConversations = process.env.ENABLE_LEGACY_CONVERSATION_IMPORT === "true";
      if (serviceCount > 0 && (conversationCount > 0 || !importLegacyConversations)) {
        return;
      }

      const legacy = await readLegacySnapshotFile();

      if (serviceCount === 0) {
        for (const service of legacy.services ?? []) {
          await prisma.appFreelancerService.upsert({
            where: { id: service.id },
            create: {
              id: service.id,
              slug: service.slug,
              ownerId: service.ownerId,
              ownerName: service.ownerName,
              ownerAlias: service.ownerAlias,
              status: service.status,
              payload: service as Prisma.InputJsonValue,
              createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
              updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
            },
            update: {},
          });
        }
      }

      for (const conversation of importLegacyConversations && conversationCount === 0 ? legacy.conversations ?? [] : []) {
        await prisma.appConversation.upsert({
          where: { id: conversation.id },
          create: {
            id: conversation.id,
            tenantId: conversation.tenantId,
            serviceId: conversation.serviceId,
            serviceSlug: conversation.serviceSlug,
            assignedFreelancerId: conversation.assignedFreelancerId ?? null,
            assignedFreelancerName: conversation.assignedFreelancerName ?? null,
            customerName: conversation.customerName,
            customerPhone: conversation.customerPhone,
            status: conversation.status,
            leadStatusId: conversation.leadStatusId,
            payload: conversation as Prisma.InputJsonValue,
            createdAt: conversation.createdAt ? new Date(conversation.createdAt) : new Date(),
            updatedAt: conversation.updatedAt ? new Date(conversation.updatedAt) : new Date(),
          },
          update: {},
        });
      }
    })();
  }

  return bootstrapPromise;
}

export async function readPlatformSnapshotFromDb() {
  await ensureBootstrapped();
  const legacy = await readLegacySnapshot();
  const [services, conversations, agencyUsers, whatsappSocialConnections, instagramSocialConnections] = await Promise.all([
    prisma.appFreelancerService.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.appConversation.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.appAuthUser.findMany({
      where: {
        id: { not: "super-admin-owner" },
        AND: [
          { OR: [{ packageAudience: null }, { packageAudience: { not: "FREELANCER" } }] },
          {
            OR: [
              { packageAudience: "AGENCY" },
              { workspaceMode: "AGENCY" },
              { role: { in: ["ADMIN", "MANAGER", "SALES_AGENT"] } },
              { assignedRole: { in: ["ADMIN", "MANAGER", "SALES_AGENT"] } },
            ],
          },
        ],
      },
      select: { assignedRole: true, id: true, role: true, tenantId: true },
    }),
    prisma.appSocialConnection.findMany({
      where: {
        provider: "WHATSAPP",
        user: { tenantId: { not: null } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        userId: true,
        status: true,
        externalAccountId: true,
        displayName: true,
        accessTokenCiphertext: true,
        lastError: true,
        metadata: true,
        updatedAt: true,
        user: { select: { tenantId: true } },
      },
    }),
    prisma.appSocialConnection.findMany({
      where: {
        provider: "INSTAGRAM",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        userId: true,
        status: true,
        externalAccountId: true,
        displayName: true,
        accessTokenCiphertext: true,
        lastError: true,
        metadata: true,
        updatedAt: true,
        user: { select: { tenantId: true } },
      },
    }),
  ]);

  const activeTenantIds = new Set([
    "tenant-gigxomi",
    ...agencyUsers.map((user) => user.tenantId?.trim()).filter((tenantId): tenantId is string => Boolean(tenantId)),
    ...agencyUsers
      .filter((user) => user.role === "SALES_AGENT" || user.assignedRole === "SALES_AGENT")
      .map((user) => buildSalesWhatsAppTenantId(user.id)),
  ]);
  const legacyWhatsAppStates = (legacy.whatsappStates ?? [])
    .filter((state) => activeTenantIds.has(state.tenantId))
    .map((state): DummyWhatsAppConnectionState => {
      const oldMainNumber = state.tenantId === "tenant-gigxomi" && state.phoneNumber.replace(/\D/g, "").endsWith("6267605079");
      if (!oldMainNumber) return state;

      return {
        ...state,
        phoneNumber: "+91 99818 07309",
        pluginEnabled: false,
        status: "Business submitted",
        note: "Previous agency line cleared. Complete embedded signup for +91 99818 07309.",
        businessId: "",
        businessPortfolioId: "",
        wabaId: "",
        phoneNumberId: "",
        systemUserId: "",
        authorizationCode: "",
        accessToken: "",
        lastInboundAt: "",
        lastOutboundAt: "",
        lastError: "",
        lastSignupEvent: "",
        lastSignupEventAt: "",
        updatedAt: new Date().toISOString(),
      };
    });
  const socialRecoveredStates = (whatsappSocialConnections as StoredWhatsAppSocialConnection[])
    .map((connection) =>
      recoverWhatsAppStateFromSocialConnection(
        connection,
        legacyWhatsAppStates.find((state) => state.tenantId === connection.user.tenantId) ?? getDummyPlatformSnapshot().whatsappStates[0],
      ),
    )
    .filter((state): state is DummyWhatsAppConnectionState => Boolean(state))
    .filter((state) => activeTenantIds.has(state.tenantId));
  const environmentRecoveredState = recoverPublicWhatsAppStateFromEnvironment(
    legacyWhatsAppStates.find((state) => state.tenantId === (text(process.env.GIGXOMI_PUBLIC_AUTH_TENANT_ID) || PUBLIC_AUTH_WHATSAPP_TENANT_FALLBACK))
      ?? getDummyPlatformSnapshot().whatsappStates[0],
  );
  const recoveredStates = [
    ...(environmentRecoveredState && activeTenantIds.has(environmentRecoveredState.tenantId) ? [environmentRecoveredState] : []),
    ...socialRecoveredStates.filter((state) => state.tenantId !== environmentRecoveredState?.tenantId),
  ];
  const recoveredTenantIds = new Set(recoveredStates.map((state) => state.tenantId));
  const whatsappStates = [
    ...recoveredStates,
    ...legacyWhatsAppStates.filter((state) => !recoveredTenantIds.has(state.tenantId)),
  ];

  const legacyInstagramStates = (legacy.instagramStates ?? []).filter((state) => activeTenantIds.has(state.tenantId));
  const socialRecoveredInstagramStates = (instagramSocialConnections as StoredWhatsAppSocialConnection[])
    .map((connection) =>
      recoverInstagramStateFromSocialConnection(
        connection,
        legacyInstagramStates.find((state) => state.tenantId === (connection.user?.tenantId || jsonRecord(connection.metadata).tenantId)),
      ),
    )
    .filter((state): state is DummyInstagramConnectionState => Boolean(state));

  const recoveredInstagramTenantIds = new Set(socialRecoveredInstagramStates.map((state) => state.tenantId));
  const instagramStates = [
    ...socialRecoveredInstagramStates,
    ...legacyInstagramStates.filter((state) => !recoveredInstagramTenantIds.has(state.tenantId)),
  ];

  const existingChannelConnections = legacy.channelConnections ?? [];
  const syntheticInstagramChannels: ChannelConnection[] = instagramStates
    .filter(
      (ig) =>
        ig.instagramBusinessAccountId &&
        !existingChannelConnections.some(
          (c) => c.provider === "INSTAGRAM" && (c.instagramBusinessAccountId === ig.instagramBusinessAccountId || c.tenantId === ig.tenantId),
        ),
    )
    .map((ig) => ({
      id: `conn-ig-${ig.instagramBusinessAccountId}`,
      tenantId: ig.tenantId,
      provider: "INSTAGRAM" as const,
      displayName: ig.displayName || `@${ig.username}`,
      accountHandle: `@${ig.username}`,
      username: ig.username,
      instagramBusinessAccountId: ig.instagramBusinessAccountId,
      status: "ACTIVE" as const,
      isDefault: true,
      createdAt: ig.connectedAt || new Date().toISOString(),
      updatedAt: ig.updatedAt || new Date().toISOString(),
    }));

  const channelConnections = [
    ...existingChannelConnections,
    ...syntheticInstagramChannels,
  ];

  return {
    ...legacy,
    whatsappStates,
    instagramStates,
    channelConnections,
    services: (services as StoredServiceRow[]).map((record: StoredServiceRow) => record.payload as DummyService),
    conversations: (conversations as StoredConversationRow[]).map((record: StoredConversationRow) => record.payload as DummyConversation),
  } satisfies DummyPlatformSnapshot;
}

export async function writePlatformSnapshotToDb(snapshot: DummyPlatformSnapshot) {
  await ensureBootstrapped();
  legacySnapshotCache = stripDbBackedCollections(snapshot);

  const [existingServices, existingConversations] = await Promise.all([
    prisma.appFreelancerService.findMany({
      select: { id: true, updatedAt: true, payload: true },
    }),
    prisma.appConversation.findMany({
      select: { id: true, updatedAt: true, payload: true },
    }),
  ]);

  const existingServiceMap = new Map(
    (existingServices as StoredServiceMetaRow[]).map((record) => [record.id, record]),
  );
  const existingConversationMap = new Map(
    (existingConversations as StoredConversationMetaRow[]).map((record) => [record.id, record]),
  );

  const operations: Prisma.PrismaPromise<unknown>[] = [];
  // The webhook and dashboard workers each assemble their own snapshot. A
  // missing item means "not loaded", not "delete it"; deleting here lets a
  // stale worker erase a just-arrived WhatsApp conversation before the inbox
  // can render it. Explicit delete operations remain responsible for removal.

  for (const service of snapshot.services ?? []) {
    const nextUpdatedAt = service.updatedAt ? new Date(service.updatedAt) : new Date();
    const existing = existingServiceMap.get(service.id);
    if (
      !existing ||
      existing.updatedAt.getTime() !== nextUpdatedAt.getTime() ||
      hasChangedPayload(existing.payload, service)
    ) {
      operations.push(
        prisma.appFreelancerService.upsert({
          where: { id: service.id },
          create: {
            id: service.id,
            slug: service.slug,
            ownerId: service.ownerId,
            ownerName: service.ownerName,
            ownerAlias: service.ownerAlias,
            status: service.status,
            payload: service as Prisma.InputJsonValue,
            createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
            updatedAt: nextUpdatedAt,
          },
          update: {
            slug: service.slug,
            ownerId: service.ownerId,
            ownerName: service.ownerName,
            ownerAlias: service.ownerAlias,
            status: service.status,
            payload: service as Prisma.InputJsonValue,
            createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
            updatedAt: nextUpdatedAt,
          },
        }),
      );
    }
  }

  for (const conversation of snapshot.conversations ?? []) {
    const nextUpdatedAt = conversation.updatedAt ? new Date(conversation.updatedAt) : new Date();
    const existing = existingConversationMap.get(conversation.id);
    if (
      !existing ||
      existing.updatedAt.getTime() !== nextUpdatedAt.getTime() ||
      hasChangedPayload(existing.payload, conversation)
    ) {
      operations.push(
        prisma.appConversation.upsert({
          where: { id: conversation.id },
          create: {
            id: conversation.id,
            tenantId: conversation.tenantId,
            serviceId: conversation.serviceId,
            serviceSlug: conversation.serviceSlug,
            assignedFreelancerId: conversation.assignedFreelancerId ?? null,
            assignedFreelancerName: conversation.assignedFreelancerName ?? null,
            customerName: conversation.customerName,
            customerPhone: conversation.customerPhone,
            status: conversation.status,
            leadStatusId: conversation.leadStatusId,
            payload: conversation as Prisma.InputJsonValue,
            createdAt: conversation.createdAt ? new Date(conversation.createdAt) : new Date(),
            updatedAt: nextUpdatedAt,
          },
          update: {
            tenantId: conversation.tenantId,
            serviceId: conversation.serviceId,
            serviceSlug: conversation.serviceSlug,
            assignedFreelancerId: conversation.assignedFreelancerId ?? null,
            assignedFreelancerName: conversation.assignedFreelancerName ?? null,
            customerName: conversation.customerName,
            customerPhone: conversation.customerPhone,
            status: conversation.status,
            leadStatusId: conversation.leadStatusId,
            payload: conversation as Prisma.InputJsonValue,
            createdAt: conversation.createdAt ? new Date(conversation.createdAt) : new Date(),
            updatedAt: nextUpdatedAt,
          },
        }),
      );
    }
  }

  if (Array.isArray(snapshot.instagramStates) && snapshot.instagramStates.length > 0) {
    const adminUsers = await prisma.appAuthUser.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        tenantId: { not: null },
      },
      select: { id: true, tenantId: true },
    });

    for (const ig of snapshot.instagramStates) {
      const user = adminUsers.find((u) => u.tenantId === ig.tenantId);
      if (user && (ig.instagramBusinessAccountId || ig.pluginEnabled)) {
        operations.push(
          prisma.appSocialConnection.upsert({
            where: { userId_provider: { userId: user.id, provider: "INSTAGRAM" } },
            create: {
              userId: user.id,
              provider: "INSTAGRAM",
              status: ig.status === "Connected" ? "CONNECTED" : ig.pluginEnabled ? "PENDING" : "NOT_STARTED",
              externalAccountId: ig.instagramBusinessAccountId || ig.accountId || null,
              displayName: ig.username || ig.displayName || null,
              accessTokenCiphertext: ig.accessToken ? encryptConnectedSecret(ig.accessToken) : null,
              metadata: { source: "agency-integration", tenantId: ig.tenantId, instagramBusinessAccountId: ig.instagramBusinessAccountId },
            },
            update: {
              status: ig.status === "Connected" ? "CONNECTED" : ig.pluginEnabled ? "PENDING" : "NOT_STARTED",
              externalAccountId: ig.instagramBusinessAccountId || ig.accountId || null,
              displayName: ig.username || ig.displayName || null,
              accessTokenCiphertext: ig.accessToken ? encryptConnectedSecret(ig.accessToken) : undefined,
              metadata: { source: "agency-integration", tenantId: ig.tenantId, instagramBusinessAccountId: ig.instagramBusinessAccountId },
            },
          }),
        );
      }
    }
  }

  if (Array.isArray(snapshot.whatsappStates) && snapshot.whatsappStates.length > 0) {
    const adminUsers = await prisma.appAuthUser.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        tenantId: { not: null },
      },
      select: { id: true, tenantId: true },
    });

    for (const wa of snapshot.whatsappStates) {
      const user = adminUsers.find((u) => u.tenantId === wa.tenantId);
      if (user && (wa.phoneNumberId || wa.pluginEnabled)) {
        const isConnected = ["Number connected", "Ready for webhook"].includes(wa.status) && Boolean(wa.phoneNumberId);
        operations.push(
          prisma.appSocialConnection.upsert({
            where: { userId_provider: { userId: user.id, provider: "WHATSAPP" } },
            create: {
              userId: user.id,
              provider: "WHATSAPP",
              status: isConnected ? "CONNECTED" : wa.pluginEnabled ? "PENDING" : "NOT_STARTED",
              externalAccountId: wa.phoneNumberId || null,
              displayName: wa.displayName || wa.phoneNumber || null,
              accessTokenCiphertext: wa.accessToken ? encryptConnectedSecret(wa.accessToken) : null,
              metadata: { source: "agency-integration", tenantId: wa.tenantId, wabaId: wa.wabaId, phoneNumberId: wa.phoneNumberId },
            },
            update: {
              status: isConnected ? "CONNECTED" : wa.pluginEnabled ? "PENDING" : "NOT_STARTED",
              externalAccountId: wa.phoneNumberId || null,
              displayName: wa.displayName || wa.phoneNumber || null,
              accessTokenCiphertext: wa.accessToken ? encryptConnectedSecret(wa.accessToken) : undefined,
              metadata: { source: "agency-integration", tenantId: wa.tenantId, wabaId: wa.wabaId, phoneNumberId: wa.phoneNumberId },
            },
          }),
        );
      }
    }
  }

  if (operations.length) {
    await prisma.$transaction(operations);
  }
}
