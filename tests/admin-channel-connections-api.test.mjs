import assert from "node:assert/strict";
import test from "node:test";
import esbuild from "esbuild";

// Bundle and import dummy-platform-store.ts
const storeBundle = await esbuild.build({
  entryPoints: ["src/lib/gigxomi/dummy-platform-store.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  alias: { "@": "./src" },
  external: ["@prisma/client", "server-only"],
});
const store = await import(
  `data:text/javascript;base64,${Buffer.from(storeBundle.outputFiles[0].text).toString("base64")}`
);

const {
  listChannelConnections,
  getChannelConnectionById,
  saveChannelConnection,
  deleteChannelConnection,
  updateChannelConnectionName,
  createWhatsAppIntakeConversation,
  createInstagramConversation,
  getConversationById,
  updateWhatsAppConnectionState,
} = store;

test("CHANNEL API 1: Multiple WhatsApp connections can be stored and listed per agency", () => {
  const tenantId = "tenant-agency-multi-wa";

  // Account 1: Sales Line
  const conn1 = saveChannelConnection({
    id: `conn-wa-${tenantId}-sales`,
    tenantId,
    provider: "WHATSAPP",
    displayName: "Sales Line",
    accountHandle: "+919981807309",
    phoneNumber: "+91 99818 07309",
    phoneNumberId: "phone-sales-001",
    wabaId: "waba-001",
    status: "ACTIVE",
    isDefault: true,
  });

  // Account 2: Customer Support
  const conn2 = saveChannelConnection({
    id: `conn-wa-${tenantId}-support`,
    tenantId,
    provider: "WHATSAPP",
    displayName: "Customer Support",
    accountHandle: "+919876543210",
    phoneNumber: "+91 98765 43210",
    phoneNumberId: "phone-support-002",
    wabaId: "waba-001",
    status: "ACTIVE",
    isDefault: false,
  });

  assert.ok(conn1 && conn2, "Both WhatsApp lines must be saved");

  const connections = listChannelConnections(tenantId).filter((c) => c.provider === "WHATSAPP");
  assert.equal(connections.length, 2, "Agency must have exactly 2 WhatsApp lines");

  const salesLine = connections.find((c) => c.displayName === "Sales Line");
  const supportLine = connections.find((c) => c.displayName === "Customer Support");

  assert.ok(salesLine, "Sales Line must exist");
  assert.equal(salesLine.isDefault, true, "Sales Line is primary");
  assert.ok(supportLine, "Customer Support must exist");
  assert.equal(supportLine.isDefault, false, "Support Line is secondary");
});

test("CHANNEL API 2: Editable label updates connection and propagates to conversations", () => {
  const tenantId = "tenant-label-edit";
  const connId = `conn-wa-${tenantId}-ops`;

  saveChannelConnection({
    id: connId,
    tenantId,
    provider: "WHATSAPP",
    displayName: "Operations Line",
    phoneNumber: "+919123456780",
    status: "ACTIVE",
    isDefault: true,
  });

  // Create conversation with this connection
  const conv = createWhatsAppIntakeConversation({
    tenantId,
    customerName: "Alice Project",
    customerPhone: "+919111122222",
    body: "Need video edit urgently",
    channelConnectionId: connId,
    channelConnectionName: "Operations Line",
  });

  assert.equal(conv.channelConnectionName, "Operations Line");

  // User edits the label in the setup UI to "VIP Client Desk"
  const updated = updateChannelConnectionName(connId, "VIP Client Desk");
  assert.ok(updated, "Connection should be updated");
  assert.equal(updated.displayName, "VIP Client Desk");

  // Verify conversation label updated automatically
  const updatedConv = getConversationById(conv.id);
  assert.equal(updatedConv.channelConnectionName, "VIP Client Desk", "Conversation in unified inbox must reflect the new custom label");
});

test("CHANNEL API 3: Multiple Instagram connections can be stored and managed", () => {
  const tenantId = "tenant-agency-multi-ig";

  // Account 1: Main Brand
  const ig1 = saveChannelConnection({
    id: `conn-ig-${tenantId}-main`,
    tenantId,
    provider: "INSTAGRAM",
    displayName: "@gigxomi_official",
    accountHandle: "@gigxomi_official",
    instagramBusinessAccountId: "ig-biz-101",
    status: "ACTIVE",
    isDefault: true,
  });

  // Account 2: Creator Studio
  const ig2 = saveChannelConnection({
    id: `conn-ig-${tenantId}-creator`,
    tenantId,
    provider: "INSTAGRAM",
    displayName: "@gigxomi_creators",
    accountHandle: "@gigxomi_creators",
    instagramBusinessAccountId: "ig-biz-102",
    status: "ACTIVE",
    isDefault: false,
  });

  assert.ok(ig1 && ig2);

  const igConnections = listChannelConnections(tenantId).filter((c) => c.provider === "INSTAGRAM");
  assert.equal(igConnections.length, 2, "Agency must have 2 Instagram accounts");

  // Test label edit on Instagram
  const renamed = updateChannelConnectionName(ig1.id, "Main Brand Hub");
  assert.equal(renamed.displayName, "Main Brand Hub");

  const reloaded = getChannelConnectionById(ig1.id);
  assert.equal(reloaded.displayName, "Main Brand Hub");
});

test("CHANNEL API 4: Disconnecting a channel line preserves past conversation history", () => {
  const tenantId = "tenant-disconnect-preserve";
  const connId = `conn-wa-${tenantId}-temp`;

  saveChannelConnection({
    id: connId,
    tenantId,
    provider: "WHATSAPP",
    displayName: "Temporary Line",
    phoneNumber: "+919999900000",
    status: "ACTIVE",
  });

  const conv = createWhatsAppIntakeConversation({
    tenantId,
    customerName: "History Preservation Client",
    customerPhone: "+919999911111",
    body: "Important transaction records",
    channelConnectionId: connId,
    channelConnectionName: "Temporary Line",
  });

  // Disconnect the line
  const deleted = deleteChannelConnection(connId);
  assert.equal(deleted, true, "Channel connection should be deleted");

  // Verify conversation is still 100% intact in memory and database
  const liveConv = getConversationById(conv.id);
  assert.ok(liveConv, "Conversation must remain intact");
  assert.equal(liveConv.messages.length, 1, "Messages must be preserved");
  assert.equal(liveConv.channelConnectionId, connId, "Original connection ID remains preserved for audit");
});
