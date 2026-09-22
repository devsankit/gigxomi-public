import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const resolverSource = ts.transpileModule(
  await source("src/lib/gigxomi/whatsapp-webhook-tenant-resolver.ts"),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const resolverModuleUrl = `data:text/javascript;base64,${Buffer.from(resolverSource).toString("base64")}`;
const { resolveWhatsAppWebhookConnection } = await import(resolverModuleUrl);

const connections = [
  { tenantId: "agency-a", phoneNumberId: "phone-a", phoneNumber: "+91 99818 07309", updatedAt: "2026-08-20T10:00:00.000Z" },
  { tenantId: "agency-b", phoneNumberId: "phone-b", phoneNumber: "+91 90000 00000", updatedAt: "2026-08-20T11:00:00.000Z" },
];

test("phone-number ID routes to its exact tenant even when display metadata conflicts", () => {
  const resolved = resolveWhatsAppWebhookConnection(connections, {
    phone_number_id: "phone-a",
    display_phone_number: "+91 90000 00000",
  });
  assert.equal(resolved?.tenantId, "agency-a");
});

test("an exact display number routes when phone-number ID is absent", () => {
  assert.equal(resolveWhatsAppWebhookConnection(connections, { display_phone_number: "919981807309" })?.tenantId, "agency-a");
});

test("ambiguous connection ownership is quarantined", () => {
  const resolved = resolveWhatsAppWebhookConnection(
    [...connections, { tenantId: "agency-c", phoneNumberId: "phone-a", phoneNumber: "+91 97777 77777" }],
    { phone_number_id: "phone-a" },
  );
  assert.equal(resolved, null);
});

test("unknown recipient metadata never falls back to a platform tenant", () => {
  assert.equal(resolveWhatsAppWebhookConnection(connections, { phone_number_id: "unknown" }), null);
  assert.equal(resolveWhatsAppWebhookConnection(connections, {}), null);
});

test("super-admin remains email/password only", async () => {
  const [config, authStore, loginPage] = await Promise.all([
    source("src/lib/auth/super-admin-config.ts"),
    source("src/lib/auth/store.ts"),
    source("src/app/super-admin/login/page.tsx"),
  ]);
  assert.match(config, /SUPER_ADMIN_ALLOWED_OTP_PHONES = \[\]/);
  assert.match(authStore, /Super-admin phone OTP is disabled/);
  assert.doesNotMatch(loginPage, /login\/whatsapp|WhatsApp OTP/);
});

test("failed WhatsApp delivery cannot create or invalidate an OTP challenge", async () => {
  const authStore = await source("src/lib/auth/store.ts");
  const deliveryGuard = authStore.indexOf("if (!deliveryAccepted)");
  const challengeTransaction = authStore.indexOf("const [, challenge] = await prisma.$transaction", deliveryGuard);
  assert.ok(deliveryGuard >= 0 && challengeTransaction > deliveryGuard);
  assert.match(authStore, /No login challenge was created/);
  assert.match(authStore, /appAuthChallenge\.updateMany/);
});

test("normal web and mobile auth wait for the inbound Get OTP command", async () => {
  const [webLogin, webSignup, mobileLogin, mobileSignup, authStore] = await Promise.all([
    source("src/app/api/auth/login/whatsapp/route.ts"),
    source("src/app/api/auth/signup/route.ts"),
    source("src/app/api/mobile/auth/request-otp/route.ts"),
    source("src/app/api/mobile/auth/signup/route.ts"),
    source("src/lib/auth/store.ts"),
  ]);
  for (const login of [webLogin, mobileLogin]) {
    assert.match(login, /getOtpChallengeMode/);
    assert.match(login, /requiresWhatsAppCommand|otpFallback: "whatsapp-command"/);
    assert.ok(login.indexOf("createPublicAuthIntent") < login.lastIndexOf("createOtpChallenge"));
  }
  for (const signup of [webSignup, mobileSignup]) {
    assert.match(signup, /deferOtpUntilWhatsAppCommand: true/);
    assert.match(signup, /requiresWhatsAppCommand/);
  }
  assert.match(authStore, /randomInt\(100000, 1000000\)/);
});

test("the released auth seed no longer reserves the former 5079 agency number", async () => {
  const authStore = await source("src/lib/auth/store.ts");
  assert.doesNotMatch(authStore, /6267605079/);
  assert.doesNotMatch(authStore, /admin@gigxomi\.local/);
});

test("protected mobile OTP fails as explicit JSON and deploys only with a valid runtime hash", async () => {
  const [mobileLogin, deploy] = await Promise.all([
    source("src/app/api/mobile/auth/request-otp/route.ts"),
    source(".github/workflows/deploy.yml"),
  ]);
  assert.match(mobileLogin, /getPostProductionFixedOtpHash/);
  assert.match(mobileLogin, /challengeMode === "preconfigured-code" && !getPostProductionFixedOtpHash\(\)/);
  assert.match(mobileLogin, /Protected agency sign-in is temporarily unavailable/);
  assert.match(mobileLogin, /\{ status: 503 \}/);
  assert.match(deploy, /FIXED_OTP_HASH_RUNTIME_VALUE/);
  assert.match(deploy, /\^\[a-f0-9\]\{64\}\$/);
  assert.match(deploy, /if \[ -n "\$\{GIGXOMI_POST_PRODUCTION_FIXED_OTP_HASH:-\}" \]/);
  assert.match(deploy, /export GIGXOMI_POST_PRODUCTION_FIXED_OTP_HASH/);
});

test("the public WhatsApp auth line resolves exactly and never defaults to a platform tenant", async () => {
  const [channel, publicWhatsApp, protectedAgency] = await Promise.all([
    source("src/lib/auth/public-whatsapp-channel.ts"),
    source("src/lib/auth/public-whatsapp.ts"),
    source("src/lib/auth/post-production-agency-config.ts"),
  ]);
  assert.match(channel, /exactMatches\.length === 1/);
  assert.doesNotMatch(channel, /tenant-gigxomi/);
  assert.match(publicWhatsApp, /connection\.phoneNumberId/);
  assert.match(publicWhatsApp, /connection\.accessToken/);
  assert.match(protectedAgency, /phoneMatches\s*\|\|\s*\(emailMatches\s*&&\s*hasPermission\)/);
  assert.match(protectedAgency, /\^\[a-f0-9\]\{64\}\$/);
});

test("Get OTP can reply inside the customer-opened window when Meta has no approved auth template", async () => {
  const [authStore, platformStore] = await Promise.all([
    source("src/lib/auth/store.ts"),
    source("src/lib/gigxomi/dummy-platform-store.ts"),
  ]);
  assert.match(authStore, /sendStandaloneWhatsAppOtpMessageFromFile/);
  assert.match(platformStore, /if \(templateName\)/);
  assert.match(platformStore, /return sendWhatsAppText\(\{/);
});

test("repair tooling stays dry-run by default and backs up before mutation", async () => {
  const repair = await source("scripts/repair-post-production-agency.js");
  assert.match(repair, /const apply = process\.argv\.includes\("--apply"\)/);
  assert.ok(repair.indexOf("backupFile(STATE_PATH)") < repair.indexOf('client.query("BEGIN")'));
});
