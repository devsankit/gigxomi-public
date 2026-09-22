import Link from "next/link";
import { ArrowRight, FileQuestion, Home, Layers3, Sparkles } from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";

export default function NotFound() {
  return (
    <MarketingSiteShell>
      <main
        className="gx-not-found-page"
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 20px",
          background: "var(--gx-page-background, #070908)",
          color: "var(--gx-page-ink, #ffffff)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            padding: "48px 32px",
            borderRadius: "24px",
            border: "1px solid var(--gx-page-line, rgba(255, 255, 255, 0.1))",
            background: "var(--gx-page-surface, rgba(18, 20, 18, 0.8))",
            boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(215, 255, 47, 0.12)",
              color: "var(--accent, #D7FF2F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileQuestion size={32} />
          </div>

          <div>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--accent, #D7FF2F)",
              }}
            >
              Error 404 · Page Not Found
            </span>
            <h1
              style={{
                margin: "12px 0 8px",
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              This timeline clip doesn&apos;t exist.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "var(--gx-page-muted, rgba(255, 255, 255, 0.7))",
                lineHeight: 1.5,
              }}
            >
              The link you followed may be outdated, moved, or misspelled. Use the shortcuts below to continue your
              journey.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "999px",
                background: "var(--accent, #D7FF2F)",
                color: "#051A0B",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              <Home size={16} /> Return to Homepage
            </Link>

            <Link
              href="/pricing"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              <Layers3 size={16} /> Video Agency Pricing & Plans <ArrowRight size={14} />
            </Link>

            <Link
              href="/discover"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px 20px",
                borderRadius: "999px",
                background: "transparent",
                color: "var(--gx-page-muted, rgba(255, 255, 255, 0.7))",
                fontWeight: 600,
                fontSize: "0.88rem",
                textDecoration: "none",
              }}
            >
              <Sparkles size={16} /> Browse Editors & Marketplace Services
            </Link>
          </div>
        </div>
      </main>
    </MarketingSiteShell>
  );
}
