"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { MarketingSiteHeader } from "@/components/public/marketing-site-header";
import { usesUnifiedPublicHeader } from "@/lib/gigxomi/public-route-chrome";

const themeBootstrap = `
  (() => {
    try {
      const saved = localStorage.getItem("gigxomi-marketing-theme");
      const theme = saved === "light" || saved === "dark" ? saved : "dark";
      document.documentElement.dataset.gxTheme = theme;
    } catch (_) {}
  })();
`;

export function UnifiedPublicSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!usesUnifiedPublicHeader(pathname)) return children;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      <div className="gx-marketing-site gx-unified-public-chrome public-page">
        <div className="public-header-wrap">
          <MarketingSiteHeader />
        </div>
        <main className="gx-unified-public-content">{children}</main>
      </div>
    </>
  );
}
