/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomBytes, scryptSync } = require("node:crypto");

const PHONE = "+919981807309";
const EMAIL = "postproductionworkdewas@gmail.com";
const DISPLAY_NAME = "Post Production Work Dewas";
const PACKAGE_ID = "pkg-agency-scale";
const PACKAGE_NAME = "Agency Scale";
const DEFAULT_TENANT_ID = "tenant-agency-post-production-work-dewas";
const USER_ID = "user-agency-post-production-work-dewas";
const FIXED_OTP_PERMISSION = "post_production_fixed_otp";
const SUPER_ADMIN_ID = "user-super-admin";
const SUPER_ADMIN_SENTINEL_PHONE = "+910000000000";
const STATE_PATH = path.join(process.cwd(), ".gigxomi", "local-platform-store.json");
const LISTING_PATH = path.join(process.cwd(), ".gigxomi", "agency-listing-store.json");

function decodePrismaPostgresUrl(databaseUrl) {
  if (!databaseUrl.startsWith("prisma+postgres://")) return databaseUrl;
  const parsed = new URL(databaseUrl);
  const apiKey = parsed.searchParams.get("api_key")?.trim();
  if (!apiKey) throw new Error("DATABASE_URL is missing its Prisma Postgres api_key.");
  const encodedPayload = apiKey.includes(".") ? apiKey.split(".")[1] : apiKey;
  const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (!decoded.databaseUrl?.trim()) throw new Error("DATABASE_URL api_key did not contain a direct database URL.");
  return decoded.databaseUrl.trim();
}

function parseDbConfig(rawUrl) {
  const parsed = new URL(decodePrismaPostgresUrl(rawUrl));
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: parsed.hostname.includes("pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
  };
}

function digits(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function samePhone(left, right) {
  const leftDigits = digits(left);
  const rightDigits = digits(right);
  return Boolean(
    leftDigits &&
      rightDigits &&
      (leftDigits === rightDigits ||
        (leftDigits.length >= 10 && rightDigits.length >= 10 && leftDigits.slice(-10) === rightDigits.slice(-10))),
  );
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return fallback;
    }
    throw new Error(`Could not safely read ${filePath}; repair aborted without overwriting it.`);
  }
}

async function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.repair-${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);
}

function makeAgencyDraftProfile(tenantId) {
  const now = new Date().toISOString();
  return {
    id: tenantId,
    tenantId,
    slug: "post-production-work-dewas",
    publicName: DISPLAY_NAME,
    ownerName: DISPLAY_NAME,
    whatsappNumber: PHONE,
    contactEmail: EMAIL,
    logoUrl: null,
    coverUrl: null,
    tagline: "",
    description: "",
    niche: "",
    categories: [],
    specialties: [],
    ctaLabel: "Talk to agency",
    status: "Active",
    hiringStatus: "Actively hiring",
    office: { city: "Dewas", state: "Madhya Pradesh", country: "India", hasOffice: false, officeVerified: false, isAddressPublic: false, publicOfficeAddress: "", officeHours: "" },
    signals: { responseSlaMinutes: 60, completionRate: 76, reviewRating: 4.2, repeatClientPercent: 28, disputePenalty: 10, inactivityPenalty: 8, nonResponsivePenalty: 9 },
    stats: { completedOrders: 0, averageRating: 0, reviewCount: 0, repeatClientPercent: 28, responseSlaMinutes: 60, activeEditors: 0, openOpportunities: 0 },
    reputation: { score: 65, band: "At Risk", reasons: [], lastCalculatedAt: now },
    reviews: [],
    showcaseEditors: [],
    serviceOffers: [],
    createdAt: now,
    updatedAt: now,
    isPublished: false,
    completionPercent: 44,
    isSetupComplete: false,
    publishStage: "DRAFT",
  };
}

async function main() {
  await import("dotenv/config");
  const { Pool } = await import("pg");
  const apply = process.argv.includes("--apply");
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) throw new Error("DATABASE_URL is not configured.");
  const fixedOtpHash = process.env.GIGXOMI_POST_PRODUCTION_FIXED_OTP_HASH?.trim().toLowerCase() || "";
  if (!/^[a-f0-9]{64}$/.test(fixedOtpHash)) {
    throw new Error("GIGXOMI_POST_PRODUCTION_FIXED_OTP_HASH must be the 64-character SHA-256 hash of the permanent agency code.");
  }
  const suppliedPassword = process.env.GIGXOMI_POST_PRODUCTION_AGENCY_PASSWORD || "";
  if (apply && suppliedPassword.length < 8) {
    throw new Error("Set GIGXOMI_POST_PRODUCTION_AGENCY_PASSWORD to the supplied agency password before using --apply.");
  }

  const state = await readJson(STATE_PATH, { services: [], conversations: [], whatsappStates: [], contacts: [] });
  const states = Array.isArray(state.whatsappStates) ? state.whatsappStates : [];
  const exactLineStates = states
    .filter((entry) => samePhone(entry.phoneNumber, PHONE))
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
  const nonPlatformOwner = exactLineStates.find((entry) => entry.tenantId && entry.tenantId !== "tenant-gigxomi") || null;

  const pool = new Pool(parseDbConfig(rawUrl));
  const client = await pool.connect();
  try {
    const usersResult = await client.query(
      `SELECT id, "tenantId", "displayName", email, phone, "loginPhoneAliases", role, "packageAudience", "workspaceMode", permissions FROM "AppAuthUser" WHERE id = $1 OR regexp_replace(phone, '[^0-9]', '', 'g') = $2 OR right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $5 OR regexp_replace(phone, '[^0-9]', '', 'g') = $4 OR lower(email) = $3 OR EXISTS (SELECT 1 FROM unnest("loginPhoneAliases") AS alias WHERE right(regexp_replace(alias, '[^0-9]', '', 'g'), 10) = $5)`,
      [SUPER_ADMIN_ID, digits(PHONE), EMAIL, digits(SUPER_ADMIN_SENTINEL_PHONE), digits(PHONE).slice(-10)],
    );
    const sentinelOwner = usersResult.rows.find((row) => row.id !== SUPER_ADMIN_ID && digits(row.phone) === digits(SUPER_ADMIN_SENTINEL_PHONE));
    if (sentinelOwner) {
      throw new Error(`The non-login super-admin sentinel phone is already owned by ${sentinelOwner.id}; repair aborted.`);
    }
    const nonOwnerMatches = usersResult.rows.filter((row) => row.id !== SUPER_ADMIN_ID);
    const phoneOwner = nonOwnerMatches.find((row) => samePhone(row.phone, PHONE) || (row.loginPhoneAliases || []).some((alias) => samePhone(alias, PHONE))) || null;
    const emailOwner = nonOwnerMatches.find((row) => String(row.email || "").toLowerCase() === EMAIL) || null;
    if (phoneOwner && emailOwner && phoneOwner.id !== emailOwner.id) {
      throw new Error(`Phone and email belong to different non-super-admin users (${phoneOwner.id} and ${emailOwner.id}); repair aborted.`);
    }
    const existingAgency = phoneOwner || emailOwner;
    const canonicalTenantId = nonPlatformOwner?.tenantId || existingAgency?.tenantId || DEFAULT_TENANT_ID;
    const existingLooksLikeAgency = Boolean(
      existingAgency &&
        ((samePhone(existingAgency.phone, PHONE) && String(existingAgency.email || "").toLowerCase() === EMAIL) ||
          String(existingAgency.displayName || "").trim().toLowerCase() === DISPLAY_NAME.toLowerCase() ||
          (existingAgency.role === "ADMIN" && (existingAgency.packageAudience === "AGENCY" || existingAgency.workspaceMode === "AGENCY")) ||
          (nonPlatformOwner?.tenantId && existingAgency.tenantId === nonPlatformOwner.tenantId)),
    );
    if (existingAgency && !existingLooksLikeAgency) {
      throw new Error(`Existing owner ${existingAgency.id} does not have agency identity signals; repair aborted instead of overwriting it.`);
    }
    const canonicalUserId = existingAgency?.id || USER_ID;
    const sourceTenantIds = new Set(exactLineStates.map((entry) => entry.tenantId).filter((tenantId) => tenantId && tenantId !== canonicalTenantId));
    const provenFormerLineOwnerTenants = new Set(
      Array.from(sourceTenantIds).filter((tenantId) => {
        const tenantLineStates = states.filter((entry) => entry.tenantId === tenantId && digits(entry.phoneNumber));
        return tenantLineStates.length === 1 && samePhone(tenantLineStates[0].phoneNumber, PHONE);
      }),
    );
    const targetPhoneNumberId = String(nonPlatformOwner?.phoneNumberId || exactLineStates[0]?.phoneNumberId || "").trim();

    const eventIds = targetPhoneNumberId
      ? (await client.query(`SELECT "messageId" FROM "whatsapp_webhook_message_events" WHERE "phoneNumberId" = $1`, [targetPhoneNumberId])).rows.map((row) => row.messageId)
      : [];
    const eventIdSet = new Set(eventIds);
    const conversationsResult = await client.query(`SELECT id, "tenantId", payload FROM "AppConversation"`);
    const candidates = conversationsResult.rows.filter((row) => {
      const payload = asObject(row.payload);
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      const matchedRecordedMessage = messages.some((message) => eventIdSet.has(String(asObject(message).externalMessageId || "")));
      const sourceChannel = String(payload.sourceChannel || "").toLowerCase();
      const isWhatsApp = sourceChannel === "whatsapp" || String(payload.serviceSlug || "").includes("whatsapp");
      return row.tenantId !== canonicalTenantId && (matchedRecordedMessage || (provenFormerLineOwnerTenants.has(row.tenantId) && isWhatsApp));
    });

    const report = {
      mode: apply ? "apply" : "dry-run",
      canonicalTenantId,
      canonicalUserId,
      existingAgencyUserId: existingAgency?.id || null,
      exactLineStateTenants: exactLineStates.map((entry) => entry.tenantId),
      sourceTenantIds: Array.from(sourceTenantIds),
      provenFormerLineOwnerTenants: Array.from(provenFormerLineOwnerTenants),
      phoneNumberIdConfigured: Boolean(targetPhoneNumberId),
      historicalConversationIds: candidates.map((row) => row.id),
      historicalConversationCount: candidates.length,
    };
    console.log(JSON.stringify(report, null, 2));
    if (!apply) return;

    const stateExisted = await fileExists(STATE_PATH);
    const stateBackup = await backupFile(STATE_PATH);
    if (stateExisted && !stateBackup) {
      throw new Error("The WhatsApp state file could not be backed up; repair aborted before database changes.");
    }
    const listingBackup = await backupFile(LISTING_PATH);
    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(suppliedPassword, passwordSalt, 64).toString("hex");
    await client.query("BEGIN");
    await client.query(
      `UPDATE "AppAuthUser" SET phone = $2, "loginPhoneAliases" = ARRAY[]::text[] WHERE id = $1`,
      [SUPER_ADMIN_ID, SUPER_ADMIN_SENTINEL_PHONE],
    );
    const permissions = Array.from(new Set([...(existingAgency?.permissions || []), "admin", FIXED_OTP_PERMISSION]));
    if (existingAgency) {
      await client.query(
        `UPDATE "AppAuthUser" SET role = 'ADMIN', "assignedRole" = 'ADMIN', "tenantId" = $2, "displayName" = $3, email = $4, phone = $5, "loginPhoneAliases" = ARRAY[$5]::text[], "packageId" = $6, "packageName" = $7, "packageAudience" = 'AGENCY', "packageStatus" = 'ACTIVE', "packageExpiresAt" = NULL, "workspaceMode" = 'AGENCY', "passwordSalt" = $8, "passwordHash" = $9, permissions = $10 WHERE id = $1`,
        [canonicalUserId, canonicalTenantId, DISPLAY_NAME, EMAIL, PHONE, PACKAGE_ID, PACKAGE_NAME, passwordSalt, passwordHash, permissions],
      );
    } else {
      await client.query(
        `INSERT INTO "AppAuthUser" (id, role, "assignedRole", "tenantId", "displayName", email, phone, "loginPhoneAliases", "packageId", "packageName", "packageAudience", "packageStatus", "packageExpiresAt", "workspaceMode", "passwordSalt", "passwordHash", "otpCode", permissions, "isSeeded", "createdAt") VALUES ($1, 'ADMIN', 'ADMIN', $2, $3, $4, $5, ARRAY[$5]::text[], $6, $7, 'AGENCY', 'ACTIVE', NULL, 'AGENCY', $8, $9, '', $10, false, NOW())`,
        [canonicalUserId, canonicalTenantId, DISPLAY_NAME, EMAIL, PHONE, PACKAGE_ID, PACKAGE_NAME, passwordSalt, passwordHash, permissions],
      );
    }
    for (const conversation of candidates) {
      const payload = { ...asObject(conversation.payload), tenantId: canonicalTenantId };
      await client.query(`UPDATE "AppConversation" SET "tenantId" = $2, payload = $3::jsonb WHERE id = $1`, [conversation.id, canonicalTenantId, JSON.stringify(payload)]);
    }
    await client.query("COMMIT");

    const sourceLineState = nonPlatformOwner || exactLineStates[0] || null;
    const nextLineState = {
      ...(sourceLineState || {}),
      tenantId: canonicalTenantId,
      businessName: sourceLineState?.businessName || DISPLAY_NAME,
      displayName: sourceLineState?.displayName || DISPLAY_NAME,
      phoneNumber: PHONE,
      status: sourceLineState?.status || "Not started",
      note: sourceLineState?.note || "Agency WhatsApp setup created by the Post Production Work Dewas ownership repair.",
      updatedAt: new Date().toISOString(),
    };
    state.whatsappStates = [nextLineState, ...states.filter((entry) => !exactLineStates.includes(entry) && entry.tenantId !== canonicalTenantId)];
    const candidateIds = new Set(candidates.map((row) => row.id));
    state.conversations = (Array.isArray(state.conversations) ? state.conversations : []).map((conversation) => candidateIds.has(conversation.id) ? { ...conversation, tenantId: canonicalTenantId } : conversation);
    state.contacts = (Array.isArray(state.contacts) ? state.contacts : []).map((contact) => candidateIds.has(contact.conversationId) || candidates.some((conversation) => asObject(conversation.payload).contactId === contact.id) ? { ...contact, tenantId: canonicalTenantId } : contact);
    await writeJsonAtomic(STATE_PATH, state);

    const listing = await readJson(LISTING_PATH, { profiles: [], updatedAt: new Date().toISOString() });
    const profiles = Array.isArray(listing.profiles) ? listing.profiles : [];
    const existingProfile = profiles.find((profile) => profile.tenantId === canonicalTenantId);
    const profile = existingProfile
      ? { ...existingProfile, publicName: DISPLAY_NAME, ownerName: DISPLAY_NAME, whatsappNumber: PHONE, contactEmail: EMAIL, updatedAt: new Date().toISOString() }
      : makeAgencyDraftProfile(canonicalTenantId);
    listing.profiles = [profile, ...profiles.filter((entry) => entry.tenantId !== canonicalTenantId)];
    listing.updatedAt = new Date().toISOString();
    await writeJsonAtomic(LISTING_PATH, listing);
    console.log(JSON.stringify({ ok: true, stateBackup, listingBackup, canonicalTenantId, migratedConversations: candidates.length }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
