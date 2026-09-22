import { readFile, writeFile } from "node:fs/promises";
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

function callbackUrl() {
  const configured = text(process.env.GIGXOMI_PUBLIC_WHATSAPP_CALLBACK_URL);
  if (configured) return configured;
  return "https://www.gigxomi.com/webhooks/whatsapp";
}

async function main() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(storePath, "utf8"));
  } catch {
    console.log("Public WhatsApp callback configuration:", JSON.stringify({ attempted: false, reason: "connection-store-missing" }));
    return;
  }

  const line = pickPublicLine(Array.isArray(snapshot?.whatsappStates) ? snapshot.whatsappStates : []);
  const appId = text(process.env.META_WHATSAPP_APP_ID) || text(line?.metaAppId);
  const appSecret = text(process.env.META_APP_SECRET) || text(process.env.FACEBOOK_APP_SECRET) || text(process.env.GIGXOMI_META_APP_SECRET);
  const verifyToken = text(line?.verifyToken) || text(process.env.WHATSAPP_VERIFY_TOKEN);
  if (!line || !appId || !appSecret || !verifyToken) {
    console.log("Public WhatsApp callback configuration:", JSON.stringify({
      attempted: false,
      hasPublicLine: Boolean(line),
      hasAppId: Boolean(appId),
      hasAppSecret: Boolean(appSecret),
      hasVerifyToken: Boolean(verifyToken),
    }));
    return;
  }

  const form = new URLSearchParams({
    object: "whatsapp",
    callback_url: callbackUrl(),
    verify_token: verifyToken,
    fields: "messages",
  });
  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion(line.graphApiVersion)}/${appId}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appId}|${appSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const success = response.ok && payload?.success === true;
    const now = new Date().toISOString();
    line.updatedAt = now;
    if (success) {
      line.lastError = "";
      line.note = "Gigxomi configured the Meta app callback for WhatsApp messages on the Agency-owned public line.";
    } else {
      line.lastError = `Meta app callback configuration was rejected${Number.isFinite(Number(payload?.error?.code)) ? ` (code ${Number(payload.error.code)})` : ""}.`;
    }
    await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log("Public WhatsApp callback configuration:", JSON.stringify({
      attempted: true,
      ok: success,
      status: response.status,
      callbackHost: new URL(callbackUrl()).host,
      errorCode: Number.isFinite(Number(payload?.error?.code)) ? Number(payload.error.code) : null,
    }));
  } catch {
    console.log("Public WhatsApp callback configuration:", JSON.stringify({ attempted: true, ok: false, status: 0, errorCode: null }));
  }
}

await main();
