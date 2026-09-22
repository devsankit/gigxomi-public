const appId = String(process.env.META_WHATSAPP_APP_ID || process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || "").trim();
const appSecret = String(process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || process.env.GIGXOMI_META_APP_SECRET || "").trim();
const graphVersion = /^v\d+(?:\.\d+)?$/.test(String(process.env.META_GRAPH_API_VERSION || "").trim())
  ? String(process.env.META_GRAPH_API_VERSION).trim()
  : "v25.0";
const requiredDomains = ["gigxomi.com", "www.gigxomi.com"];

function domains(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return [];
}

async function main() {
  if (!appId || !appSecret) {
    console.log("Meta JavaScript SDK domain reconciliation:", JSON.stringify({ attempted: false, reason: "app-credentials-missing" }));
    return;
  }

  const accessToken = `${appId}|${appSecret}`;
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${appId}?fields=app_domains`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.log("Meta JavaScript SDK domain reconciliation:", JSON.stringify({
      attempted: true,
      ok: false,
      phase: "read",
      status: response.status,
      errorCode: Number.isFinite(Number(payload?.error?.code)) ? Number(payload.error.code) : null,
    }));
    return;
  }

  const currentDomains = domains(payload?.app_domains);
  const nextDomains = Array.from(new Set([...currentDomains, ...requiredDomains]));
  const alreadyConfigured = requiredDomains.every((domain) => currentDomains.includes(domain));
  if (alreadyConfigured) {
    console.log("Meta JavaScript SDK domain reconciliation:", JSON.stringify({
      attempted: true,
      ok: true,
      changed: false,
      requiredDomainsPresent: true,
      configuredDomainCount: currentDomains.length,
    }));
    return;
  }

  const update = await fetch(`https://graph.facebook.com/${graphVersion}/${appId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ app_domains: JSON.stringify(nextDomains) }).toString(),
    cache: "no-store",
  });
  const updatePayload = await update.json().catch(() => ({}));
  console.log("Meta JavaScript SDK domain reconciliation:", JSON.stringify({
    attempted: true,
    ok: update.ok && updatePayload?.success === true,
    changed: update.ok && updatePayload?.success === true,
    phase: "update",
    status: update.status,
    errorCode: Number.isFinite(Number(updatePayload?.error?.code)) ? Number(updatePayload.error.code) : null,
    configuredDomainCount: nextDomains.length,
  }));
}

await main().catch((error) => {
  console.log("Meta JavaScript SDK domain reconciliation:", JSON.stringify({
    attempted: true,
    ok: false,
    phase: "request",
    error: error instanceof Error ? error.name : "unknown",
  }));
});
