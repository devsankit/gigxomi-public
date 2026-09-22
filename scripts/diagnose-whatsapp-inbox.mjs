import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const PUBLIC_LINE_DIGITS = "9981807309";
const storePath = path.join(process.cwd(), ".gigxomi", "local-platform-store.json");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function digits(value) {
  return text(value).replace(/\D/g, "");
}

function maskPhone(value) {
  const normalized = digits(value);
  return normalized.length >= 4 ? `…${normalized.slice(-4)}` : "masked";
}

function environmentConnectionReadiness() {
  const phoneNumberId = text(process.env.WHATSAPP_PHONE_NUMBER_ID) || text(process.env.META_WHATSAPP_PHONE_NUMBER_ID);
  const accessToken = text(process.env.WHATSAPP_ACCESS_TOKEN) || text(process.env.META_WHATSAPP_ACCESS_TOKEN);
  const wabaId = text(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) || text(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID);
  return {
    hasPhoneNumberId: Boolean(phoneNumberId),
    hasAccessToken: Boolean(accessToken),
    hasBusinessAccountId: Boolean(wabaId),
    hasTenantOverride: Boolean(text(process.env.GIGXOMI_PUBLIC_AUTH_TENANT_ID)),
  };
}

function messageCount(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return 0;
  return Array.isArray(payload.messages) ? payload.messages.length : 0;
}

async function webhookLogSignals() {
  const pm2Home = text(process.env.PM2_HOME) || "/root/.pm2";
  const logFiles = [
    path.join(pm2Home, "logs", "gigxomi-out.log"),
    path.join(pm2Home, "logs", "gigxomi-error.log"),
  ];
  const content = await Promise.all(logFiles.map((logFile) => readFile(logFile, "utf8").catch(() => "")));
  const tail = content.join("\n").slice(-500_000);
  const count = (marker) => (tail.match(new RegExp(marker, "g")) ?? []).length;
  return {
    accepted: count("WHATSAPP_WEBHOOK_RECEIVED"),
    rejected: count("WHATSAPP_WEBHOOK_REJECTED"),
  };
}

function runtimeDatabaseUrl() {
  const value = text(process.env.DATABASE_URL);
  if (!value) throw new Error("DatabaseUrlMissing");
  if (!value.startsWith("prisma+postgres://")) return value;
  const apiKey = new URL(value).searchParams.get("api_key")?.trim();
  const payload = apiKey?.includes(".") ? apiKey.split(".")[1] : apiKey;
  const decoded = payload ? JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) : null;
  if (!text(decoded?.databaseUrl)) throw new Error("DatabaseUrlInvalid");
  return decoded.databaseUrl.trim();
}

function createPrismaClient() {
  const databaseUrl = runtimeDatabaseUrl();
  const parsed = new URL(databaseUrl);
  const pool = new Pool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: parsed.hostname.includes("pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
  });
  return { prisma: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
}

async function readConnectionSummary() {
  try {
    const snapshot = JSON.parse(await readFile(storePath, "utf8"));
    const states = Array.isArray(snapshot?.whatsappStates) ? snapshot.whatsappStates : [];
    return states
      .filter((state) => digits(state?.phoneNumber).endsWith(PUBLIC_LINE_DIGITS))
      .map((state) => ({
        tenantId: text(state?.tenantId) || "unassigned",
        pluginEnabled: Boolean(state?.pluginEnabled),
        hasPhoneNumberId: Boolean(text(state?.phoneNumberId)),
        lastInboundAt: text(state?.lastInboundAt) || null,
        hasError: Boolean(text(state?.lastError)),
        status: text(state?.status) || "not-configured",
      }));
  } catch {
    return [];
  }
}

async function main() {
  const connectionStates = await readConnectionSummary();
  const logSignals = await webhookLogSignals();
  let prisma = null;
  let pool = null;

  try {
    const client = createPrismaClient();
    prisma = client.prisma;
    pool = client.pool;
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [webhookEvents, conversations, socialConnections] = await Promise.all([
      prisma.whatsAppWebhookMessageEvent.findMany({
        where: { provider: "whatsapp_cloud_api", createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { tenantId: true, phoneNumberId: true, processedAt: true, createdAt: true },
      }),
      prisma.appConversation.findMany({
        where: { serviceSlug: "whatsapp-intake", updatedAt: { gte: since } },
        orderBy: { updatedAt: "desc" },
        take: 25,
        select: { tenantId: true, customerPhone: true, createdAt: true, updatedAt: true, payload: true },
      }),
      // The server rebuilds the live WhatsApp state from this encrypted
      // connection record after a deploy.  Do not print identifiers or
      // credentials here; this is deliberately a safe readiness summary.
      prisma.appSocialConnection.findMany({
        where: { provider: "WHATSAPP" },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          status: true,
          externalAccountId: true,
          accessTokenCiphertext: true,
          metadata: true,
          updatedAt: true,
          user: { select: { tenantId: true } },
        },
      }),
    ]);

    console.log("WhatsApp inbox diagnostic:", JSON.stringify({
      observationWindowMinutes: 60,
      publicLineConnections: connectionStates,
      environmentConnection: environmentConnectionReadiness(),
      databaseConnections: socialConnections.map((connection) => {
        const metadata = connection.metadata && typeof connection.metadata === "object" && !Array.isArray(connection.metadata)
          ? connection.metadata
          : {};
        return {
          tenantId: text(connection.user?.tenantId) || "unassigned",
          status: text(connection.status) || "unknown",
          hasPhoneNumberId: Boolean(text(metadata.phoneNumberId) || text(connection.externalAccountId)),
          hasEncryptedToken: Boolean(text(connection.accessTokenCiphertext)),
          updatedAt: connection.updatedAt.toISOString(),
        };
      }),
      webhookLogSignals: logSignals,
      webhookEvents: webhookEvents.map((event) => ({
        tenantId: text(event.tenantId) || "unmapped",
        hasPhoneNumberId: Boolean(text(event.phoneNumberId)),
        processed: Boolean(event.processedAt),
        receivedAt: event.createdAt.toISOString(),
      })),
      storedConversations: conversations.map((conversation) => ({
        tenantId: text(conversation.tenantId) || "unassigned",
        contact: maskPhone(conversation.customerPhone),
        messageCount: messageCount(conversation.payload),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.log("WhatsApp inbox diagnostic:", JSON.stringify({
      observationWindowMinutes: 60,
      publicLineConnections: connectionStates,
      webhookLogSignals: logSignals,
      databaseReadable: false,
      error: error instanceof Error ? error.name : "unknown",
    }));
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
    await pool?.end().catch(() => undefined);
  }
}

await main();
