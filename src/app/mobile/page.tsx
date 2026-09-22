import type { Metadata } from "next";
import Link from "next/link";
import {
  Smartphone,
  MessageSquare,
  Zap,
  ShieldCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";
import { publicSupportWhatsApp } from "@/lib/seo/public-support-contact";

const title = "Gigxomi Mobile App | WhatsApp-Integrated Video Operations for iOS & Android";
const description =
  "Access client leads, project timelines, editor assignments, and 1-click approvals on the go. Log in instantly with your WhatsApp number — zero extra passwords required.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/mobile" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/mobile"),
    type: "website",
  },
};

export default function MobileAppPromoPage() {
  return (
    <MarketingSiteShell>
      <main className="gx-mobile-promo-page" style={{ minHeight: "80vh", padding: "80px 20px 100px", maxWidth: 1160, margin: "0 auto", color: "#f5f7f0" }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", maxWidth: 820, margin: "0 auto 60px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(215, 255, 47, 0.1)",
              border: "1px solid rgba(215, 255, 47, 0.25)",
              color: "#d7ff2f",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            <Smartphone size={15} strokeWidth={2.2} />
            <span>Gigxomi Mobile • iOS &amp; Android</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              margin: "0 0 20px",
            }}
          >
            Your Agency In Your Pocket. Log in with{" "}
            <span style={{ color: "#d7ff2f" }}>WhatsApp</span>.
          </h1>

          <p
            style={{
              fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)",
              color: "#aab2a9",
              lineHeight: 1.65,
              maxWidth: 680,
              margin: "0 auto 36px",
            }}
          >
            Never miss a high-ticket client brief or delivery deadline. View active video projects, assign editors, and review cuts anywhere with 1-click WhatsApp authentication.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                minHeight: 48,
                padding: "0 24px",
                borderRadius: 12,
                background: "#d7ff2f",
                color: "#0a0d09",
                fontWeight: 750,
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              <span>Open Web Companion</span>
              <ArrowRight size={17} strokeWidth={2.2} />
            </Link>

            <a
              href={publicSupportWhatsApp.href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                minHeight: 48,
                padding: "0 24px",
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#f5f7f0",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              <MessageSquare size={16} strokeWidth={2} />
              <span>Get Mobile Access Link via WhatsApp</span>
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 70,
          }}
        >
          <div
            style={{
              padding: "28px",
              borderRadius: 18,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(215, 255, 47, 0.12)",
                color: "#d7ff2f",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <Zap size={20} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 10px" }}>
              Instant WhatsApp Login
            </h3>
            <p style={{ color: "#aab2a9", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              No complicated passwords to remember. Enter your verified WhatsApp number, enter the instant code, and you are immediately inside your studio.
            </p>
          </div>

          <div
            style={{
              padding: "28px",
              borderRadius: 18,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(215, 255, 47, 0.12)",
                color: "#d7ff2f",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <Bell size={20} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 10px" }}>
              Push Alerts on New Leads
            </h3>
            <p style={{ color: "#aab2a9", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              When a creator or brand contacts your agency via WhatsApp or Instagram, your mobile app notifies you immediately with full project metadata.
            </p>
          </div>

          <div
            style={{
              padding: "28px",
              borderRadius: 18,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(215, 255, 47, 0.12)",
                color: "#d7ff2f",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 10px" }}>
              One Unified Account
            </h3>
            <p style={{ color: "#aab2a9", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Your desktop workspace and mobile app stay automatically synced in real time. Changes in pipeline status or chat messages reflect everywhere.
            </p>
          </div>
        </section>

        {/* WhatsApp Linking Guide Callout */}
        <section
          style={{
            padding: "36px",
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(215, 255, 47, 0.08), rgba(255, 255, 255, 0.02))",
            border: "1px solid rgba(215, 255, 47, 0.2)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 30,
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                color: "#d7ff2f",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              ACCOUNT UNIFICATION
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800, margin: "10px 0 14px" }}>
              Already registered on the Web?
            </h2>
            <p style={{ color: "#aab2a9", fontSize: "0.95rem", lineHeight: 1.65, margin: 0 }}>
              Ensure your agency WhatsApp number is submitted in your profile. Because the mobile app authenticates via WhatsApp OTP, submitting your WhatsApp number merges your web dashboard and mobile workspace into one account.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#d7ff2f", fontSize: "0.9rem" }}>
              <CheckCircle2 size={18} />
              <span style={{ color: "#f5f7f0" }}>Same projects, payments, and team</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#d7ff2f", fontSize: "0.9rem" }}>
              <CheckCircle2 size={18} />
              <span style={{ color: "#f5f7f0" }}>Direct client WhatsApp chat relay</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#d7ff2f", fontSize: "0.9rem" }}>
              <CheckCircle2 size={18} />
              <span style={{ color: "#f5f7f0" }}>Works on iOS TestFlight &amp; Android APK</span>
            </div>
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
