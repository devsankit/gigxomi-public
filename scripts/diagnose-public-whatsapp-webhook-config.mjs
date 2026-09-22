import { readFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_LINE_DIGITS = "919981807309";
const storePath = path.join(process.cwd(), ".gigxomi", "local-platform-store.json");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function digits(value) {
  return text(value).replace(/\D/g, "");
}

function timestamp(value) {
  const parsed = new Date(value ?? "").getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickPublicLine(states) {
  return states
    .filter((state) => digits(state?.phoneNumber).endsWith(PUBLIC_LINE_DIGITS))
    .sort((left, right) => {
      const identityDifference = Number(Boolean(text(right?.phoneNumberId))) - Number(Boolean(text(left?.phoneNumberId)));
      if (identityDifference) return identityDifference;
      return timestamp(right?.updatedAt) - timestamp(left?.updatedAt);
    })[0] ?? null;
}

function graphVersion(value) {
  return /^v\d+(?:\.\d+)?$/.test(text(value)) ? text(value) : "v25.0";
}

function subscriptionFieldName(value) {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (value && typeof value === "object") {
    return text(value.name ?? value.field ?? value.id).toLowerCase();
  }
  return "";
}

function expectedCallbackUrl() {
  const configured = text(process.env.GIGXOMI_PUBLIC_WHATSAPP_CALLBACK_URL);
  if (configured) return configured;
  return "https://www.gigxomi.com/webhooks/whatsapp";
}

async function main() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(storePath, "utf8"));
  } catch {
    console.log("Public WhatsApp callback diagnostic:", JSON.stringify({ attempted: false, reason: "connection-store-missing" }));
    return;
  }

  const line = pickPublicLine(Array.isArray(snapshot?.whatsappStates) ? snapshot.whatsappStates : []);
  const appId = text(process.env.META_WHATSAPP_APP_ID) || text(line?.metaAppId);
  const appSecret = text(process.env.META_APP_SECRET) || text(process.env.FACEBOOK_APP_SECRET) || text(process.env.GIGXOMI_META_APP_SECRET);
  if (!appId || !appSecret) {
    console.log("Public WhatsApp callback diagnostic:", JSON.stringify({ attempted: false, hasAppId: Boolean(appId), hasAppSecret: Boolean(appSecret) }));
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion(line?.graphApiVersion)}/${appId}/subscriptions?fields=object,callback_url,fields`, {
      headers: { Authorization: `Bearer ${appId}|${appSecret}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const subscriptions = Array.isArray(payload?.data) ? payload.data : [];
    const whatsapp = subscriptions.find((subscription) => text(subscription?.object).toLowerCase() === "whatsapp");
    const fields = Array.isArray(whatsapp?.fields) ? whatsapp.fields.map(subscriptionFieldName).filter(Boolean) : [];
    const callback = text(whatsapp?.callback_url);
    const expectedCallback = expectedCallbackUrl();
    const diagnostic = {
      attempted: true,
      ok: response.ok && Boolean(whatsapp) && callback === expectedCallback && fields.includes("messages"),
      status: response.status,
      hasWhatsAppSubscription: Boolean(whatsapp),
      hasCallbackUrl: Boolean(callback),
      callbackMatchesExpected: callback === expectedCallback,
      expectedCallbackHost: new URL(expectedCallback).host,
      receivesMessages: fields.includes("messages"),
      errorCode: Number.isFinite(Number(payload?.error?.code)) ? Number(payload.error.code) : null,
    };
    console.log("Public WhatsApp callback diagnostic:", JSON.stringify(diagnostic));
    if (!diagnostic.ok) process.exitCode = 1;
  } catch {
    console.log("Public WhatsApp callback diagnostic:", JSON.stringify({ attempted: true, ok: false, status: 0, errorCode: null }));
    process.exitCode = 1;
  }
}

await main();
