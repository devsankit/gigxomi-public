import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET_DIGITS = "919981807309";
const storePath = path.join(process.cwd(), ".gigxomi", "local-platform-store.json");

function digits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function records(payload) {
  const values = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return values.filter((item) => item && typeof item === "object");
}

async function metaGet(accessToken, graphVersion, query) {
  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: Number.isFinite(Number(payload?.error?.code)) ? Number(payload.error.code) : null,
      };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, status: 0, code: null };
  }
}

async function getLatestPersistedPublicWebhookPhoneNumberId(tenantId) {
  if (!process.env.DATABASE_URL?.trim()) {
    return "";
  }

  let prisma = null;
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    const event = await prisma.whatsAppWebhookMessageEvent.findFirst({
      where: {
        provider: "whatsapp_cloud_api",
        tenantId,
        phoneNumberId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { phoneNumberId: true },
    });
    return text(event?.phoneNumberId);
  } catch {
    return "";
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
  }
}

async function reconcileApprovedAuthenticationTemplate(line, accessToken, graphVersion) {
  if (text(line.otpTemplateName)) {
    return { ready: true, source: "stored" };
  }

  const wabaId = text(line.wabaId);
  if (!wabaId) {
    return { ready: false, reason: "missing-waba-id" };
  }

  const response = await metaGet(
    accessToken,
    graphVersion,
    `${wabaId}/message_templates?fields=name,status,category,language&limit=100`,
  );
  if (!response.ok) {
    return { ready: false, reason: "template-discovery-failed", status: response.status, code: response.code };
  }

  const approved = records(response.payload).filter(
    (template) => text(template.category).toUpperCase() === "AUTHENTICATION" && text(template.status).toUpperCase() === "APPROVED",
  );
  if (approved.length !== 1) {
    return { ready: false, reason: approved.length ? "ambiguous-approved-templates" : "no-approved-template", candidates: approved.length };
  }

  line.otpTemplateName = text(approved[0].name);
  line.otpTemplateLanguage = text(approved[0].language) || "en_US";
  return { ready: Boolean(line.otpTemplateName), source: "meta-approved-authentication-template" };
}

function findTargetLine(wabas) {
  for (const item of wabas) {
    const phones = records(item.phone_numbers);
    const phone = phones.find((candidate) => digits(candidate.display_phone_number).endsWith(TARGET_DIGITS));
    if (phone) {
      return {
        wabaId: text(item.id),
        phoneNumberId: text(phone.id),
        phoneNumber: text(phone.display_phone_number),
        displayName: text(phone.verified_name),
      };
    }
  }
  return null;
}

function pickPublicLine(states) {
  return states
    .filter((state) => digits(state?.phoneNumber).endsWith(TARGET_DIGITS))
    .sort((left, right) => {
      const identityDifference = Number(Boolean(text(right?.phoneNumberId))) - Number(Boolean(text(left?.phoneNumberId)));
      if (identityDifference) return identityDifference;
      const enabledDifference = Number(Boolean(right?.pluginEnabled)) - Number(Boolean(left?.pluginEnabled));
      if (enabledDifference) return enabledDifference;
      return new Date(right?.updatedAt ?? 0).getTime() - new Date(left?.updatedAt ?? 0).getTime();
    })[0] ?? null;
}

async function main() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(storePath, "utf8"));
  } catch {
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: false, reason: "connection-store-missing" }));
    return;
  }

  const states = Array.isArray(snapshot.whatsappStates) ? snapshot.whatsappStates : [];
  const line = pickPublicLine(states);
  if (!line) {
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: false, reason: "public-connection-missing" }));
    return;
  }

  const now = new Date().toISOString();
  const existingPhoneNumberId = text(line.phoneNumberId);
  line.phoneNumber = "+91 99818 07309";
  line.manualOverrides = {
    ...(line.manualOverrides && typeof line.manualOverrides === "object" ? line.manualOverrides : {}),
    phoneNumber: false,
    phoneNumberId: false,
  };

  const accessToken = text(line.accessToken);
  if (!accessToken) {
    line.status = existingPhoneNumberId ? "Ready for webhook" : "Business submitted";
    line.lastError = "Public OTP line needs a Meta access-token refresh before it can send codes.";
    line.updatedAt = now;
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: false, reason: "missing-access-token" }));
    return;
  }

  const graphVersion = text(line.graphApiVersion).startsWith("v") ? text(line.graphApiVersion) : "v25.0";
  const templateResolution = await reconcileApprovedAuthenticationTemplate(line, accessToken, graphVersion);

  // A successfully ingested WhatsApp webhook comes from the exact Cloud API
  // sender Meta used. Prefer that persisted identity over business-account
  // discovery, which some messaging-only tokens are not allowed to perform.
  if (existingPhoneNumberId) {
    line.status = "Ready for webhook";
    line.lastError = "";
    line.note = "Public OTP line is using the connected agency Cloud API sender identity.";
    line.updatedAt = now;
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: true, matched: true, source: "connected-agency-line", hasPhoneNumberId: true, hasOtpTemplate: templateResolution.ready, templateResolution, status: line.status }));
    return;
  }

  const persistedWebhookPhoneNumberId = await getLatestPersistedPublicWebhookPhoneNumberId(text(line.tenantId));
  if (persistedWebhookPhoneNumberId) {
    line.phoneNumberId = persistedWebhookPhoneNumberId;
    line.status = "Ready for webhook";
    line.lastError = "";
    line.note = "Public OTP send identity recovered from a verified inbound WhatsApp webhook.";
    line.updatedAt = now;
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: true, matched: true, source: "persisted-webhook", hasPhoneNumberId: true, status: line.status }));
    return;
  }

  try {
    const discovered = [];
    const failedRequests = [];
    const businesses = await metaGet(
      accessToken,
      graphVersion,
      "me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}",
    );
    if (businesses.ok) {
      for (const business of records(businesses.payload)) {
        for (const waba of records(business.owned_whatsapp_business_accounts)) {
          discovered.push({ ...waba, businessId: text(business.id), businessName: text(business.name) });
        }
      }
    } else {
      failedRequests.push({ endpoint: "businesses", status: businesses.status, code: businesses.code });
    }

    for (const relation of ["owned_whatsapp_business_accounts", "client_whatsapp_business_accounts", "assigned_whatsapp_business_accounts"]) {
      const payload = await metaGet(
        accessToken,
        graphVersion,
        `me/${relation}?fields=id,name,phone_numbers{id,display_phone_number,verified_name}`,
      );
      if (payload.ok) {
        discovered.push(...records(payload.payload));
      } else {
        failedRequests.push({ endpoint: relation, status: payload.status, code: payload.code });
      }
    }

    const savedWabaId = text(line.wabaId);
    if (savedWabaId) {
      const payload = await metaGet(
        accessToken,
        graphVersion,
        `${savedWabaId}?fields=id,name,phone_numbers{id,display_phone_number,verified_name}`,
      );
      if (payload.ok && payload.payload && typeof payload.payload === "object") {
        discovered.push(payload.payload);
      } else if (!payload.ok) {
        failedRequests.push({ endpoint: "saved-waba", status: payload.status, code: payload.code });
      }
    }

    const matched = findTargetLine(discovered);
    if (!matched?.phoneNumberId) {
      line.status = existingPhoneNumberId ? "Ready for webhook" : "Business submitted";
      line.lastError = "Meta token did not return the configured public OTP phone line. Reconnect the public line in Meta to grant this token access.";
      line.updatedAt = now;
      await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
      console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: true, matched: false, discoveredWabas: discovered.length, failedRequests }));
      return;
    }

    const matchingWaba = discovered.find((item) => text(item.id) === matched.wabaId);
    line.phoneNumberId = matched.phoneNumberId;
    line.phoneNumber = matched.phoneNumber || "+91 99818 07309";
    line.wabaId = matched.wabaId || text(line.wabaId);
    line.businessId = text(matchingWaba?.businessId) || text(line.businessId);
    line.businessName = text(matchingWaba?.businessName) || text(matchingWaba?.name) || text(line.businessName);
    line.displayName = matched.displayName || text(line.displayName);
    line.status = "Ready for webhook";
    line.lastError = "";
    line.note = "Public OTP line was reconciled with the Meta Cloud API send identity.";
    line.updatedAt = now;
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: true, matched: true, hasPhoneNumberId: true, status: line.status }));
  } catch {
    line.status = existingPhoneNumberId ? "Ready for webhook" : "Business submitted";
    line.lastError = "Meta discovery could not validate the public OTP send identity. Reconnect the public line and refresh its token.";
    line.updatedAt = now;
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp Meta reconciliation:", JSON.stringify({ attempted: true, matched: false, reason: "meta-discovery-failed" }));
  }
}

await main();
