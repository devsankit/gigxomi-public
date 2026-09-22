import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const lifecyclePath = new URL("../src/lib/gigxomi/instagram-token-lifecycle.ts", import.meta.url);
const lifecycleSource = ts.transpileModule(await readFile(lifecyclePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const lifecycleModuleUrl = `data:text/javascript;base64,${Buffer.from(lifecycleSource).toString("base64")}`;
const {
  getInstagramTokenExpiresAt,
  getInstagramTokenLifecycleStatus,
  shouldRefreshInstagramToken,
} = await import(lifecycleModuleUrl);

const NOW = Date.parse("2026-08-23T00:00:00.000Z");

test("long-lived Instagram token expiry uses Meta's 60-day lifetime", () => {
  assert.equal(
    getInstagramTokenExpiresAt(60 * 24 * 60 * 60, NOW),
    "2026-10-22T00:00:00.000Z",
  );
});

test("healthy tokens are not refreshed too early", () => {
  const expiresAt = "2026-10-22T00:00:00.000Z";
  assert.equal(getInstagramTokenLifecycleStatus(expiresAt, NOW), "healthy");
  assert.equal(shouldRefreshInstagramToken(expiresAt, NOW), false);
});

test("tokens are refreshable during the final 14 days", () => {
  const expiresAt = "2026-09-01T00:00:00.000Z";
  assert.equal(getInstagramTokenLifecycleStatus(expiresAt, NOW), "refresh-due");
  assert.equal(shouldRefreshInstagramToken(expiresAt, NOW), true);
});

test("expired and legacy tokens fail closed instead of pretending to be renewable", () => {
  assert.equal(getInstagramTokenLifecycleStatus("2026-08-22T23:59:59.000Z", NOW), "expired");
  assert.equal(getInstagramTokenLifecycleStatus(undefined, NOW), "unknown");
  assert.equal(shouldRefreshInstagramToken(undefined, NOW), false);
});
