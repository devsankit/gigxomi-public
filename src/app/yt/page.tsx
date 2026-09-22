"use client";
import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "7WIt28SIjoY";
const CHANNEL_HANDLE = "@gigxomi";
const SUBSCRIBE_URL = `https://www.youtube.com/${CHANNEL_HANDLE}?sub_confirmation=1`;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export default function YoutubeVideoPage() {
  const firedRef = useRef(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // 1. GTM / GA4 — custom event for remarketing audiences
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "youtube_video_view",
      video_id: VIDEO_ID,
      video_title: "Gigxomi App Demo",
      page_location: window.location.href,
    });

    // 2. Meta Pixel — client-side ViewContent
    const eventId = `vc_${crypto.randomUUID()}`;
    try {
      window.fbq?.("track", "ViewContent", {
        content_name: "Gigxomi App Demo Video",
        content_category: "product_demo",
      }, { eventID: eventId });
    } catch {
      // pixel may not be initialised yet — server-side covers it
    }

    // 3. Meta Conversions API — server-side (fires regardless of consent)
    void fetch("/api/meta/conversions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "ViewContent",
        eventId,
        eventSourceUrl: window.location.href,
      }),
    }).catch(() => undefined);
  }, []);

  function handleSubscribe() {
    setSubscribed(true);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "youtube_subscribe_click",
      video_id: VIDEO_ID,
      channel: CHANNEL_HANDLE,
    });
    window.open(SUBSCRIBE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#05070A",
      color: "#fff",
      fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 16px 60px",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="9" fill="#1A1F2E" />
          <path d="M12 20L18 14L24 20L18 26L12 20Z" fill="#4F8EF7" />
          <path d="M20 20L26 14L32 20L26 26L20 20Z" fill="#6C63FF" opacity="0.8" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>Gigxomi</span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: "clamp(20px, 4vw, 28px)",
        fontWeight: 700,
        textAlign: "center",
        margin: "0 0 8px",
        letterSpacing: "-0.4px",
        maxWidth: 560,
      }}>
        See how Gigxomi works
      </h1>
      <p style={{
        fontSize: 15,
        color: "#8899AA",
        textAlign: "center",
        margin: "0 0 28px",
        maxWidth: 440,
        lineHeight: 1.6,
      }}>
        WhatsApp &amp; Instagram for agencies — zero apps installed by clients
      </p>

      {/* Embedded YouTube Video */}
      <div style={{
        width: "100%",
        maxWidth: 720,
        aspectRatio: "16/9",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #1E2535",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        background: "#0D111A",
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white`}
          title="Gigxomi App Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>

      {/* Subscribe CTA */}
      <div style={{
        marginTop: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: 720,
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "#55667A", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Liked it? Stay updated
        </p>

        <button
          type="button"
          onClick={handleSubscribe}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 32px",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            background: subscribed ? "#1A2A1A" : "#FF0000",
            color: subscribed ? "#4ADE80" : "#fff",
            transition: "all 0.2s ease",
            boxShadow: subscribed ? "none" : "0 4px 20px rgba(255,0,0,0.35)",
            fontFamily: "inherit",
          }}
        >
          {!subscribed && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          )}
          {subscribed ? "✓ Subscribed — thank you!" : "Subscribe to Gigxomi"}
        </button>

        <p style={{ margin: 0, fontSize: 12, color: "#445566" }}>
          Opens YouTube with subscribe prompt in a new tab
        </p>
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 40, display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="https://gigxomi.com" style={{ color: "#4F8EF7", fontSize: 13, textDecoration: "none" }}>
          gigxomi.com
        </a>
        <a href={`https://www.youtube.com/${CHANNEL_HANDLE}`} target="_blank" rel="noopener noreferrer"
          style={{ color: "#4F8EF7", fontSize: 13, textDecoration: "none" }}>
          YouTube Channel
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.gigxomi.app" target="_blank" rel="noopener noreferrer"
          style={{ color: "#4F8EF7", fontSize: 13, textDecoration: "none" }}>
          Download App
        </a>
      </div>
    </div>
  );
}
