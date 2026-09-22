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
      const enabledDifference = Number(Boolean(right?.pluginEnabled)) - Number(Boolean(left?.pluginEnabled));
      if (enabledDifference) return enabledDifference;
      return timestamp(right?.updatedAt) - timestamp(left?.updatedAt);
    })[0] ?? null;
}

function graphVersion(value) {
  return /^v\d+(?:\.\d+)?$/.test(text(value)) ? text(value) : "v25.0";
}

async function main() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(storePath, "utf8"));
  } catch {
    console.log("Public WhatsApp webhook subscription:", JSON.stringify({ attempted: false, reason: "connection-store-missing" }));
    return;
  }

  const line = pickPublicLine(Array.isArray(snapshot?.whatsappStates) ? snapshot.whatsappStates : []);
  const accessToken = text(line?.accessToken);
  const wabaId = text(line?.wabaId);
  if (!line || !accessToken || !wabaId) {
    console.log("Public WhatsApp webhook subscription:", JSON.stringify({
      attempted: false,
      hasPublicLine: Boolean(line),
      hasAccessToken: Boolean(accessToken),
      hasWabaId: Boolean(wabaId),
    }));
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${graphVersion(line.graphApiVersion)}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const success = response.ok && payload?.success === true;
    const now = new Date().toISOString();
    if (success) {
      line.status = "Ready for webhook";
      line.lastError = "";
      line.note = "Gigxomi confirmed the Agency-owned public line is subscribed to Meta webhook delivery.";
      line.updatedAt = now;
      await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    } else {
      line.lastError = `Meta webhook subscription was rejected${Number.isFinite(Number(payload?.error?.code)) ? ` (code ${Number(payload.error.code)})` : ""}.`;
      line.updatedAt = now;
      await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    }
    console.log("Public WhatsApp webhook subscription:", JSON.stringify({
      attempted: true,
      ok: success,
      status: response.status,
      errorCode: Number.isFinite(Number(payload?.error?.code)) ? Number(payload.error.code) : null,
    }));
  } catch {
    console.log("Public WhatsApp webhook subscription:", JSON.stringify({ attempted: true, ok: false, status: 0, errorCode: null }));
  }
}

await main();
