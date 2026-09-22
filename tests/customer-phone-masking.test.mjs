import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Customer phone and ID masking is free of mojibake and properly formatted", () => {
  const storePath = path.join(process.cwd(), "src", "lib", "gigxomi", "dummy-platform-store.ts");
  const storeContent = fs.readFileSync(storePath, "utf8");

  // Ensure mojibake bullet string is completely eradicated from dummy-platform-store
  assert.ok(!storeContent.includes("â€¢"), "dummy-platform-store.ts must NOT contain 'â€¢' mojibake string");

  // Ensure mask uses \\u2022 bullet
  assert.ok(storeContent.includes("\\u2022"), "dummy-platform-store.ts must use unicode escape \\u2022 for bullet characters");
});

test("Chat workspace cleans mojibake and formats Instagram vs WhatsApp contacts properly", () => {
  const chatPath = path.join(process.cwd(), "src", "components", "chat", "chat-workspace.tsx");
  const chatContent = fs.readFileSync(chatPath, "utf8");

  // Verify chat header subtitle handles Instagram sourceChannel specifically
  assert.ok(chatContent.includes('activeConversation.sourceChannel === "instagram"'), "Chat workspace must distinguish instagram channel in header subtitle");
  assert.ok(chatContent.includes("Instagram ID:"), "Instagram threads must display 'Instagram ID:' instead of raw 'Customer'");
  assert.ok(chatContent.includes("normalizeDisplayText(activeConversation?.customerPhoneDisplay"), "activeCustomerPhone must run through normalizeDisplayText");
});

test("Kanban sheet and drawer normalize customerPhoneDisplay against mojibake", () => {
  const kanbanPath = path.join(process.cwd(), "src", "components", "manager", "manager-project-tracking-kanban.tsx");
  const kanbanContent = fs.readFileSync(kanbanPath, "utf8");

  assert.ok(kanbanContent.includes('.replaceAll("â€¢", "•")'), "Kanban component must sanitize customerPhoneDisplay from any mojibake");
});
