"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Film, ArrowRight, X, ShieldCheck } from "lucide-react";
import {
  MarketingPageType,
  trackConversionPanelShown,
  trackConversionPanelDismissed,
  trackConversionPathSelected,
} from "@/lib/analytics/funnel";
import styles from "./conversion-panel.module.css";

const DISMISS_KEY = "gx_conv_panel_dismissed_at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function resolvePageType(pathname: string): MarketingPageType {
  if (pathname === "/") return "homepage";
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/for-video-editing-agencies")) return "agency";
  if (pathname.startsWith("/for-freelance-editors-building-teams")) return "freelancer";
  if (pathname.startsWith("/product")) return "product";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/knowledge-base")) return "knowledge_base";
  return "homepage";
}

function isRestrictedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/freelancer") ||
    pathname.startsWith("/dashboard")
  );
}

export function IntentConversionPanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [triggerSource, setTriggerSource] = useState<"timer" | "scroll" | "exit_intent" | "cta_click">("timer");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerFiredRef = useRef(false);

  const pageType = resolvePageType(pathname);
  const restricted = isRestrictedPath(pathname);

  const openPanel = useCallback(
    (trigger: "timer" | "scroll" | "exit_intent" | "cta_click") => {
      if (restricted || triggerFiredRef.current) return;

      // Check 7-day cooldown
      try {
        const lastDismissed = localStorage.getItem(DISMISS_KEY);
        if (lastDismissed) {
          const elapsed = Date.now() - Number(lastDismissed);
          if (elapsed < SEVEN_DAYS_MS && trigger !== "cta_click") {
            return;
          }
        }
      } catch {}

      triggerFiredRef.current = true;
      setTriggerSource(trigger);
      setIsOpen(true);

      const device =
        typeof window !== "undefined"
          ? window.innerWidth < 768
            ? "mobile"
            : window.innerWidth < 1024
            ? "tablet"
            : "desktop"
          : "desktop";

      trackConversionPanelShown({
        triggerType: trigger,
        pageType,
        deviceCategory: device,
      });
    },
    [pageType, restricted]
  );

  const closePanel = useCallback(
    (method: "close_btn" | "backdrop" | "escape" | "link_click") => {
      setIsOpen(false);
      try {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
      } catch {}
      trackConversionPanelDismissed({
        method,
        pageType,
      });
    },
    [pageType]
  );

  // Setup intent triggers
  useEffect(() => {
    if (restricted) return;

    // 1. 45-second timer
    const timer = setTimeout(() => {
      openPanel("timer");
    }, 45000);

    // 2. 60% scroll depth
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = window.scrollY / scrollHeight;
      if (progress >= 0.6) {
        openPanel("scroll");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 3. Desktop exit intent
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && window.innerWidth >= 1024) {
        openPanel("exit_intent");
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    // 4. Custom trigger event from secondary CTA clicks
    const handleCustomTrigger = () => {
      openPanel("cta_click");
    };
    window.addEventListener("gigxomi:open-conversion-panel", handleCustomTrigger);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("gigxomi:open-conversion-panel", handleCustomTrigger);
    };
  }, [openPanel, restricted]);

  // Keyboard Escape listener and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePanel("escape");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Focus close button on mount
    const timeout = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen, closePanel]);

  if (!isOpen || restricted) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-panel-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closePanel("backdrop");
        }
      }}
    >
      <div className={styles.panel}>
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.closeButton}
          onClick={() => closePanel("close_btn")}
          aria-label="Close conversion panel"
        >
          <X size={18} />
        </button>

        <span className={styles.eyebrow}>
          <ShieldCheck size={14} /> Find the right Gigxomi path
        </span>
        <h2 id="conversion-panel-heading" className={styles.heading}>
          What are you here to manage?
        </h2>

        <div className={styles.choicesGrid}>
          {/* Agency Path */}
          <a
            href="https://app.gigxomi.com/signup?role=agency"
            className={styles.choiceCard}
            onClick={() => {
              trackConversionPathSelected({
                path: "agency",
                pageType,
                location: "modal",
              });
              closePanel("link_click");
            }}
          >
            <div>
              <div className={styles.choiceIconWrap}>
                <Briefcase size={20} />
              </div>
              <h3 className={styles.choiceTitle}>I run a video editing agency</h3>
              <p className={styles.choiceDesc}>
                Bring client conversations, editors, and project tracking into one workspace.
              </p>
            </div>
            <span className={styles.choiceCta}>
              Start free workspace <ArrowRight size={15} />
            </span>
          </a>

          {/* Freelancer Path */}
          <a
            href="https://app.gigxomi.com/signup?role=freelancer"
            className={styles.choiceCard}
            onClick={() => {
              trackConversionPathSelected({
                path: "freelancer",
                pageType,
                location: "modal",
              });
              closePanel("link_click");
            }}
          >
            <div>
              <div className={styles.choiceIconWrap}>
                <Film size={20} />
              </div>
              <h3 className={styles.choiceTitle}>I’m a freelance video editor</h3>
              <p className={styles.choiceDesc}>
                Build an editor profile, show your work, and explore project opportunities.
              </p>
            </div>
            <span className={styles.choiceCta}>
              Create editor profile <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        <p className={styles.footerNote}>
          Joining an existing team?{" "}
          <Link
            href="/login"
            onClick={() => {
              trackConversionPathSelected({
                path: "manager_invite",
                pageType,
                location: "modal",
              });
              closePanel("link_click");
            }}
          >
            Sign in with your agency invite
          </Link>
        </p>
      </div>
    </div>
  );
}
