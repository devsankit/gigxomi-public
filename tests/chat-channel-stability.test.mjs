import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

async function loadWhatsAppSignatureVerifier() {
  const signatureSource = (await source("src/lib/gigxomi/whatsapp-webhook-security.ts")).replace('import "server-only";', "");
  const transpiled = ts.transpileModule(signatureSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);
}

test("WhatsApp webhook uses durable dedupe and fail-closed tenant routing", async () => {
  const webhook = await source("src/app/api/meta/whatsapp/webhook/route.ts");
  assert.match(webhook, /routeAndRecordWhatsAppWebhook/);
  assert.match(webhook, /markWhatsAppWebhookMessagesProcessed/);
  assert.match(webhook, /quarantinedMessages/);
});

test("both channel webhooks publish realtime inbox updates", async () => {
  const [whatsapp, instagram, workspace] = await Promise.all([
    source("src/app/api/meta/whatsapp/webhook/route.ts"),
    source("src/app/api/meta/instagram/webhook/route.ts"),
    source("src/components/chat/chat-workspace.tsx"),
  ]);
  for (const webhook of [whatsapp, instagram]) {
    assert.match(webhook, /await Promise\.allSettled/);
    assert.match(webhook, /publishConversationRealtimeEvent/);
  }
  assert.match(workspace, /new EventSource\(`\/api\/conversations\/events/);
  assert.match(workspace, /CHAT_VISIBLE_SYNC_INTERVAL_MS/);
});

test("the public WhatsApp callback is canonical and never redirected", async () => {
  const [workflow, ingressWorkflow, configure, diagnose, nginx, ingress] = await Promise.all([
    source(".github/workflows/deploy.yml"),
    source(".github/workflows/deploy-whatsapp-ingress.yml"),
    source("scripts/configure-public-whatsapp-callback.mjs"),
    source("scripts/diagnose-public-whatsapp-webhook-config.mjs"),
    source("infra/nginx/www.gigxomi.com.conf"),
    source("apps/whatsapp-ingress/server.mjs"),
  ]);
  assert.match(workflow, /https:\/\/www\.gigxomi\.com/);
  assert.match(workflow, /pm2 describe gigxomi-whatsapp-ingress/);
  assert.match(workflow, /preserving its independent process/);
  assert.match(ingressWorkflow, /workflow_dispatch/);
  assert.match(ingressWorkflow, /pm2 restart gigxomi-whatsapp-ingress --update-env/);
  assert.match(configure, /GIGXOMI_PUBLIC_WHATSAPP_CALLBACK_URL/);
  assert.match(configure, /https:\/\/www\.gigxomi\.com/);
  assert.match(diagnose, /callbackMatchesExpected/);
  assert.match(diagnose, /callback === expectedCallback/);
  assert.match(configure, /https:\/\/www\.gigxomi\.com\/webhooks\/whatsapp/);
  assert.match(nginx, /location = \/webhooks\/whatsapp[\s\S]*?proxy_pass http:\/\/127\.0\.0\.1:3001;/);
  assert.match(nginx, /location = \/api\/meta\/whatsapp\/webhook[\s\S]*?proxy_pass http:\/\/localhost:3000;/);
  assert.match(ingress, /verifyMetaSignature/);
  assert.match(ingress, /QUEUE_DIRECTORY/);
  assert.match(ingress, /x-gigxomi-ingress/);
});

test("dedicated WhatsApp ingress accepts only a valid Meta signature", async () => {
  const { verifyMetaSignature } = await import("../apps/whatsapp-ingress/server.mjs");
  const rawBody = Buffer.from(JSON.stringify({ object: "whatsapp_business_account", entry: [] }));
  const secret = "isolated-ingress-test-secret";
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  assert.equal(verifyMetaSignature(rawBody, `sha256=${digest}`, [secret]), true);
  assert.equal(verifyMetaSignature(rawBody, `sha256=${digest}`, ["wrong-secret"]), false);
  assert.equal(verifyMetaSignature(rawBody, "", [secret]), false);
});

test("public webhook health does not expose tenant connection records", async () => {
  const whatsapp = await source("src/app/api/meta/whatsapp/webhook/route.ts");
  const healthBlock = whatsapp.match(/if \(!mode && !verifyToken && !challenge\) \{[\s\S]*?\n  \}/i)?.[0] ?? "";
  assert.match(healthBlock, /hasRoutableConnection/);
  assert.match(healthBlock, /hasOtpReadyConnection/);
  assert.doesNotMatch(healthBlock, /tenantId:|lastError:|accessToken:|connections:/);
});

test("production rejects unsigned WhatsApp webhooks", async () => {
  const signature = await source("src/lib/gigxomi/whatsapp-webhook-security.ts");
  assert.match(signature, /process\.env\.NODE_ENV === "production"/);
  assert.match(signature, /META_WHATSAPP_APP_SECRET/);
  assert.match(signature, /WHATSAPP_APP_SECRET/);
  assert.match(signature, /appSecrets\.some/);
  assert.match(signature, /timingSafeEqual/);
  assert.match(signature, /signature header is missing/);
});

test("WhatsApp verification cannot be displaced by the Instagram app secret", async () => {
  const signature = await source("src/lib/gigxomi/whatsapp-webhook-security.ts");
  const whatsappSecret = signature.indexOf("process.env.META_WHATSAPP_APP_SECRET");
  const sharedSecret = signature.indexOf("process.env.META_APP_SECRET");
  const instagramSecret = signature.indexOf("process.env.INSTAGRAM_CLIENT_SECRET");
  assert.ok(whatsappSecret >= 0 && sharedSecret > whatsappSecret && instagramSecret > sharedSecret);
});

test("a WhatsApp callback remains valid when a different Instagram secret is configured", async () => {
  const keys = [
    "NODE_ENV",
    "META_WHATSAPP_APP_SECRET",
    "WHATSAPP_APP_SECRET",
    "META_APP_SECRET",
    "FACEBOOK_APP_SECRET",
    "GIGXOMI_META_APP_SECRET",
    "INSTAGRAM_CLIENT_SECRET",
    "INSTAGRAM_APP_SECRET",
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.NODE_ENV = "production";
    process.env.META_APP_SECRET = "whatsapp-production-secret";
    process.env.INSTAGRAM_CLIENT_SECRET = "different-instagram-secret";

    const rawBody = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const digest = createHmac("sha256", process.env.META_APP_SECRET).update(rawBody, "utf8").digest("hex");
    const { verifyWhatsAppWebhookSignature } = await loadWhatsAppSignatureVerifier();
    const result = await verifyWhatsAppWebhookSignature(
      new Request("https://gigxomi.com/api/meta/whatsapp/webhook", {
        method: "POST",
        body: rawBody,
        headers: { "x-hub-signature-256": `sha256=${digest}` },
      }),
    );
    assert.equal(result.ok, true);
    assert.equal(result.bypassed, false);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("Instagram outbound delivery requires a customer-initiated thread", async () => {
  const store = await source("src/lib/gigxomi/dummy-platform-store.ts");
  assert.match(store, /hasCustomerInitiatedThread/);
  assert.match(store, /Instagram replies are allowed only after the customer starts the conversation/);
});
