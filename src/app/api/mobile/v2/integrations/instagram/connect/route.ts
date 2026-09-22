import { NextResponse } from "next/server";

import { requireSessionRole } from "@/lib/api/require-session-role";
import { createChannelSetupIntent, getRequestFingerprint } from "@/lib/connected-platform/channel-setup-intent";
import { companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

export async function POST(request: Request) {
  const authorization = await requireSessionRole(["ADMIN"]);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null) as { policyAccepted?: boolean } | null;
  if (body?.policyAccepted !== true) {
    return NextResponse.json({ ok: false, error: "Confirm the Meta platform and prohibited-use policy before continuing." }, { status: 422 });
  }
  if (authorization.session.packageAudience !== "AGENCY" || !authorization.session.tenantId) {
    return NextResponse.json({ ok: false, error: "A verified Agency workspace is required." }, { status: 403 });
  }
  const base = (process.env.APP_BASE_URL?.trim() || companyKnowledgeBase.siteUrl).replace(/\/+$/, "");
  const intent = await createChannelSetupIntent({
    userId: authorization.session.userId,
    tenantId: authorization.session.tenantId,
    channel: "INSTAGRAM",
    fingerprint: getRequestFingerprint(request),
  });
  return NextResponse.json({ ok: true, authorizeUrl: `${base}/api/mobile/channel-setup/continue?intent=${encodeURIComponent(intent)}` });
}
