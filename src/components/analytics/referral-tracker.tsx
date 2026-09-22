"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ReferralTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const refParam =
        searchParams.get("ref") ||
        searchParams.get("salesReferralCode") ||
        searchParams.get("referralCode");

      if (refParam && refParam.trim()) {
        const code = refParam.trim();

        // 1. Store in localStorage for cross-page persistence
        try {
          localStorage.setItem("gx_ref", code);
        } catch {}

        // 2. Store in client-side cookie so SSR and API routes get it
        try {
          const cookieDomain = window.location.hostname.includes("gigxomi.com")
            ? "; domain=.gigxomi.com"
            : "";
          document.cookie = `gx_ref=${encodeURIComponent(code)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${cookieDomain}`;
        } catch {}

        // 3. Track event once per session/path to avoid duplicate counts on page refresh
        const sessionKey = `gx_tracked_${code}_${pathname}`;
        const alreadyTracked = sessionStorage.getItem(sessionKey);
        if (!alreadyTracked) {
          sessionStorage.setItem(sessionKey, "1");
          fetch("/api/sales/referrals/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              path: pathname + (window.location.search || ""),
              channel: "website",
            }),
          }).catch(() => {});
        }
      } else {
        // Fallback: restore cookie from localStorage if present
        try {
          const storedRef = localStorage.getItem("gx_ref");
          if (storedRef && !document.cookie.includes("gx_ref=")) {
            const cookieDomain = window.location.hostname.includes("gigxomi.com")
              ? "; domain=.gigxomi.com"
              : "";
            document.cookie = `gx_ref=${encodeURIComponent(storedRef)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${cookieDomain}`;
          }
        } catch {}
      }
    } catch {}
  }, [pathname, searchParams]);

  return null;
}

export function ReferralAttributionTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
