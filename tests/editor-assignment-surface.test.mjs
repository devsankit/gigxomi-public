import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("web assignment support data is committed before unchanged chat payloads return", async () => {
  const workspace = await source("src/components/chat/chat-workspace.tsx");
  const supportWrite = workspace.indexOf("setAssignableEditors(payload.assignableEditors ?? [])");
  const signatureReturn = workspace.indexOf("if (signature === lastPayloadSignatureRef.current)", supportWrite);
  assert.ok(supportWrite >= 0 && signatureReturn > supportWrite);
});

test("editor directory exposes Team and General scopes with assignment proof", async () => {
  const listing = await source("src/app/api/team/editor-directory/route.ts") + await source("src/lib/api/editor-directory.ts");
  assert.match(listing, /scope === "team"/);
  assert.match(listing, /membership\?\.status !== "ACTIVE"/);
  assert.match(listing, /marketplaceEligible = hasMarketplaceAccess && publicServices\.length > 0/);
  assert.match(listing, /scope === "general" && !editor\.marketplaceEligible/);
  assert.match(listing, /offerEligible:\s*marketplaceEligible \|\| membership\?\.status === "ACTIVE"/);
  assert.match(listing, /directAssignmentEligible/);
  assert.match(listing, /portfolioLinks/);
  assert.match(listing, /startingPrice/);
});

test("assignment allows General offers but restricts direct assignment to active Team editors", async () => {
  const [route, assignmentsRoute] = await Promise.all([
    source("src/app/api/conversations/[id]/assignment/route.ts"),
    source("src/app/api/assignments/route.ts"),
  ]);
  assert.match(route, /conversationTenantId/);
  assert.match(route, /teamMembership\.findMany/);
  assert.match(route, /appTeamMembership\.findMany/);
  assert.match(route, /generalManagedUsers/);
  assert.match(route, /offerManagedUsers/);
  assert.match(route, /requiresTeamMembership = requestedMode === "direct"/);
  assert.match(route, /Direct assignment is available only for active editors in this agency Team/);
  assert.match(route, /assertActiveAssignmentEditorLimit/);
  assert.match(assignmentsRoute, /source:\s*"CHAT"/);
});
