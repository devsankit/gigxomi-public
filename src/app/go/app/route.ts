import { NextRequest, NextResponse } from "next/server";

import { trackSalesReferralEvent } from "@/lib/gigxomi/sales-store";

const GOOGLE_PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=com.gigxomi.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = (searchParams.get("ref") || "").trim().slice(0, 80);

  if (ref) {
    try {
      await trackSalesReferralEvent({
        code: ref,
        eventType: "PRICING_VIEW",
        path: "/go/app",
        metadata: {
          target: "android_app",
          referrer: request.headers.get("referer") || undefined,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch {
      // Non-blocking for redirection
    }
  }

  let targetUrl = GOOGLE_PLAY_STORE_APP_URL;
  if (ref) {
    const referrer = encodeURIComponent(`utm_source=referral&utm_medium=android_app&utm_campaign=${ref}`);
    targetUrl = `${GOOGLE_PLAY_STORE_APP_URL}&referrer=${referrer}`;
  }

  return NextResponse.redirect(targetUrl, 302);
}
