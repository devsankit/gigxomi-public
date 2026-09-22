"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          prompt: (momentListener?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
        };
      };
    };
  }
}

export function GoogleOneTap() {
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(false);
  const initialized = useRef(false);

  // Strictly opt-in: do not run Google One Tap unless explicitly enabled and never on auth/onboarding routes
  const isExplicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === "true";
  const isAuthOrOnboarding =
    !pathname ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/channel-setup");

  useEffect(() => {
    if (!isExplicitlyEnabled || isAuthOrOnboarding) return;
    if (initialized.current) return;
    initialized.current = true;

    const timer = setTimeout(() => {
      // Check if user is already logged in
      fetch("/api/auth/session")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.authenticated) {
            return;
          }

          const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
          if (!clientId) return;

          const loadScript = () => {
            if (window.google?.accounts?.id) {
              initializeOneTap(clientId);
              return;
            }

            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => initializeOneTap(clientId);
            document.head.appendChild(script);
          };

          const initializeOneTap = (cid: string) => {
            try {
              window.google?.accounts.id.initialize({
                client_id: cid,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: "signin",
                use_fedcm_for_prompt: true,
              } as any);

              window.google?.accounts.id.prompt();
            } catch (err) {
              console.warn("[Google One Tap] Init error", err);
            }
          };

          loadScript();
        })
        .catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response.credential) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/google/one-tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        window.location.href = data.redirect || "/admin";
      } else {
        setIsVerifying(false);
      }
    } catch {
      setIsVerifying(false);
    }
  };

  if (!isExplicitlyEnabled || isAuthOrOnboarding || !isVerifying) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 99999,
        background: "#0d0f11",
        border: "1px solid rgba(204, 255, 0, 0.4)",
        borderRadius: "16px",
        padding: "16px 22px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(204, 255, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        color: "#ffffff",
        fontFamily: "var(--font-geist-sans), sans-serif",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #ccff00",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "gx-spin 0.8s linear infinite",
        }}
      />
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>Verifying Google Account...</p>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
          Signing in to your workspace
        </p>
      </div>
      <style>{`
        @keyframes gx-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
