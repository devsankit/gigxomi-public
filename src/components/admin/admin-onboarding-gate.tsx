"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";

const DISMISS_KEY = "gigxomi_dismiss_agency_draft_popup_v2";

type OnboardingState = {
  isDraft: boolean;
  activePlan: string;
  agencyName: string;
};

export function AdminOnboardingGate({
  children,
  bypass = false,
}: {
  children: ReactNode;
  bypass?: boolean;
}) {
  const pathname = usePathname();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    isDraft: false,
    activePlan: "Agency Freemium · 7-Day Free Trial",
    agencyName: "Post Production Work",
  });

  useEffect(() => {
    if (bypass) return;

    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
      if (dismissed) setIsDismissed(true);
    }

    let active = true;
    fetch("/api/admin/onboarding", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((payload) => {
        if (!active || !payload?.ok) return;
        setState({
          isDraft: !payload.completed,
          activePlan: payload.activePlan || "Agency Freemium · 7-Day Free Trial",
          agencyName: payload.agencyName || "Post Production Work",
        });
      })
      .catch(() => {
        // Non-blocking: failure to check onboarding should never break dashboard
      });

    return () => {
      active = false;
    };
  }, [bypass]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const showPopup =
    !bypass &&
    state.isDraft &&
    !isDismissed &&
    pathname !== "/admin/system-settings";

  return (
    <>
      {/* Workspace content rendered with 100% natural dimensions — zero document flow displacement */}
      {children}

      {/* Non-intrusive floating notification popup / drawer */}
      {showPopup && (
        <aside
          aria-label="Agency Profile Completion Notice"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 99999,
            maxWidth: isMinimized ? "auto" : "420px",
            width: isMinimized ? "auto" : "calc(100vw - 40px)",
            pointerEvents: "auto",
          }}
        >
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#111712",
                border: "1px solid rgba(204, 255, 0, 0.4)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                padding: "8px 14px",
                borderRadius: "999px",
                color: "#e5ede2",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Click to view plan and profile details"
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ccff00",
                  boxShadow: "0 0 8px #ccff00",
                }}
              />
              <span>Agency Profile in Draft</span>
              <ChevronUp size={14} style={{ color: "#ccff00" }} />
            </button>
          ) : (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(17, 23, 18, 0.96) 0%, rgba(10, 14, 11, 0.98) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(204, 255, 0, 0.3)",
                borderRadius: "14px",
                padding: "16px 18px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(204, 255, 0, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                color: "#f1f5ef",
              }}
            >
              {/* Top row: Active plan badge + minimize + close */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(204, 255, 0, 0.12)",
                    border: "1px solid rgba(204, 255, 0, 0.35)",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#ccff00",
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={11} strokeWidth={2.5} />
                  <span>{state.activePlan}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => setIsMinimized(true)}
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#8a9688",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Minimize"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    onClick={handleDismiss}
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#8a9688",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Dismiss for this session"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title and message */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <strong
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Complete your agency profile
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: "1.45",
                    color: "#a9b4a6",
                  }}
                >
                  Your public directory listing is currently in draft. Complete your brand identity and city office details to unlock direct client briefs and editor applications.
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginTop: "4px",
                }}
              >
                <Link
                  href="/admin/system-settings"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ccff00",
                    color: "#070806",
                    fontWeight: 700,
                    fontSize: "12px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(204, 255, 0, 0.25)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span>Complete Profile &amp; Go Live</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Link>

                <button
                  onClick={handleDismiss}
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#7e8b7b",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "4px",
                  }}
                >
                  Remind me later
                </button>
              </div>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
