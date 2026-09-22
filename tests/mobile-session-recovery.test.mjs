import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("mobile session and billing routes reject tokens for deleted accounts", async () => {
  const [helper, sessionRoute, subscribeRoute, activateRoute] = await Promise.all([
    source("src/lib/api/mobile-session-user.ts"),
    source("src/app/api/mobile/session/route.ts"),
    source("src/app/api/mobile/billing/subscribe/route.ts"),
    source("src/app/api/mobile/v2/onboarding/activate/route.ts"),
  ]);

  assert.match(helper, /SESSION_STALE/);
  assert.match(helper, /status: 401/);
  assert.match(helper, /appAuthUser\.findUnique/);
  assert.match(sessionRoute, /rejectMissingMobileSessionUser/);
  assert.match(subscribeRoute, /createStaleMobileSessionResponse/);
  assert.match(activateRoute, /createStaleMobileSessionResponse/);
});

test("Android verified links publish the Gigxomi release certificate", async () => {
  const statements = JSON.parse(await source("public/.well-known/assetlinks.json"));
  const target = statements[0]?.target;

  assert.equal(target?.namespace, "android_app");
  assert.equal(target?.package_name, "com.gigxomi.app");
  assert.ok(target?.sha256_cert_fingerprints?.includes("2D:FD:06:DC:FD:A9:D3:30:63:75:62:15:E0:74:B4:E7:8C:0E:21:14:1B:E8:75:ED:E3:B1:DA:A5:C8:23:62:AB"));
});
