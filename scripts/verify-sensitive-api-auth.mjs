import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const protectedRoutes = new Map([
  ["src/app/staging-health/page.tsx", ["session.role !== \"SUPER_ADMIN\""]],
  ["src/app/api/system/db-health/route.ts", ["requireSessionRole"]],
  ["src/app/api/super-admin/freelancers/export/route.ts", ["requireSessionRole", "SUPER_ADMIN"]],
  ["src/app/api/super-admin/users/[id]/impersonate/route.ts", ["requireSessionRole", "SUPER_ADMIN"]],
  ["src/app/api/sales/webinars/route.ts", ["requireSessionRole"]],
  ["src/app/api/meta/whatsapp/media/[mediaId]/route.ts", ["requireSessionRole"]],
  ["src/app/api/payments/phonepe/test-checkout/route.ts", ["requireSessionRole"]],
  ["src/app/api/payments/phonepe/test-return/route.ts", ["requireSessionRole"]],
  ["src/app/api/payments/phonepe/status/[merchantTransactionId]/route.ts", ["requirePaymentReferenceOwner"]],
  ["src/app/api/payments/phonepe/return/route.ts", ["requirePaymentReferenceOwner"]],
  ["src/app/api/payments/phonepe/editor-payment-return/route.ts", ["requireSessionRole"]],
  ["src/app/api/payments/phonepe/chat-return/route.ts", ["requireSessionRole"]],
  ["src/app/api/subscriptions/phonepe/setup-status/[merchantOrderId]/route.ts", ["requirePaymentReferenceOwner"]],
  ["src/app/api/subscriptions/phonepe/status/[merchantSubscriptionId]/route.ts", ["requireSubscriptionReferenceOwner"]],
  ["src/app/api/subscriptions/phonepe/redemption-status/[merchantOrderId]/route.ts", ["requirePaymentReferenceOwner"]],
  ["src/app/api/subscriptions/phonepe/return/route.ts", ["requirePaymentReferenceOwner"]],
]);

const failures = [];
for (const [route, requiredSignals] of protectedRoutes) {
  const source = await readFile(resolve(route), "utf8").catch(() => "");
  if (!source || requiredSignals.some((signal) => !source.includes(signal))) {
    failures.push(`${route}: missing ${requiredSignals.join(", ")}`);
  }
}

if (failures.length) {
  console.error("Sensitive API authentication audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Sensitive API authentication audit passed for ${protectedRoutes.size} routes.`);
