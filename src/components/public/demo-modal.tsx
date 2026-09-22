"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  CheckCircle2,
  ArrowRight,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  CtaLocation,
  MarketingPageType,
  trackDemoModalOpened,
  trackDemoRequested,
} from "@/lib/analytics/funnel";
import styles from "./demo-modal.module.css";

function resolvePageType(pathname: string): MarketingPageType {
  if (pathname === "/") return "homepage";
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/for-video-editing-agencies")) return "agency";
  if (pathname.startsWith("/for-freelance-editors-building-teams")) return "freelancer";
  if (pathname.startsWith("/product")) return "product";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/knowledge-base")) return "knowledge_base";
  return "agency";
}

export function openDemoModal(sourceLocation: CtaLocation = "hero") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gigxomi:open-demo-modal", {
        detail: { sourceLocation },
      })
    );
  }
}

export function DemoModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sourceLocation, setSourceLocation] = useState<CtaLocation>("hero");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [teamSize, setTeamSize] = useState("1 to 3 editors");
  const [preferredContact, setPreferredContact] = useState<"email" | "whatsapp">("email");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const pageType = resolvePageType(pathname);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceLocation?: CtaLocation }>;
      const loc = customEvent.detail?.sourceLocation || "hero";
      setSourceLocation(loc);
      setIsOpen(true);
      setIsSubmitted(false);

      trackDemoModalOpened({
        sourceLocation: loc,
        pageType,
      });
    };

    window.addEventListener("gigxomi:open-demo-modal", handleOpen);
    return () => {
      window.removeEventListener("gigxomi:open-demo-modal", handleOpen);
    };
  }, [pageType]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const timeout = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);

    // Track demo request with strictly zero PII
    trackDemoRequested({
      preferredContact,
      teamSize,
      pageType,
    });

    // Simulated short async submission (store demo inquiry locally / gracefully)
    try {
      const existing = JSON.parse(localStorage.getItem("gx_demo_requests") || "[]");
      existing.push({
        name: name.trim(),
        email: email.trim(),
        agencyName: agencyName.trim(),
        teamSize,
        preferredContact,
        whatsappNumber: whatsappNumber.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("gx_demo_requests", JSON.stringify(existing));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div className={styles.modal}>
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Close demo modal"
        >
          <X size={18} />
        </button>

        {!isSubmitted ? (
          <>
            <span className={styles.eyebrow}>
              <ShieldCheck size={14} /> Agency Workflow Demo
            </span>
            <h2 id="demo-modal-heading" className={styles.heading}>
              See Gigxomi with your workflow
            </h2>
            <p className={styles.subcopy}>
              Walk through client WhatsApp &amp; Instagram routing, editor assignment lanes, and manager review stages tailored to your agency.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="demo-name" className={styles.label}>
                  Your name *
                </label>
                <input
                  id="demo-name"
                  type="text"
                  required
                  className={styles.input}
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="demo-email" className={styles.label}>
                  Work email *
                </label>
                <input
                  id="demo-email"
                  type="email"
                  required
                  className={styles.input}
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="demo-agency" className={styles.label}>
                  Agency name <span>(optional)</span>
                </label>
                <input
                  id="demo-agency"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Apex Cuts Studio"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="demo-teamsize" className={styles.label}>
                  Team size
                </label>
                <select
                  id="demo-teamsize"
                  className={styles.select}
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                >
                  <option value="1 to 3 editors">1 to 3 video editors</option>
                  <option value="4 to 10 editors">4 to 10 video editors</option>
                  <option value="11 to 25 editors">11 to 25 video editors</option>
                  <option value="25+ editors">25+ video editors</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <span className={styles.label}>Preferred contact method</span>
                <div className={styles.contactMethodRow} role="radiogroup" aria-label="Preferred contact method">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={preferredContact === "email"}
                    className={`${styles.contactMethodBtn} ${
                      preferredContact === "email" ? styles.contactMethodBtnActive : ""
                    }`}
                    onClick={() => setPreferredContact("email")}
                  >
                    <Mail size={16} /> Email
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={preferredContact === "whatsapp"}
                    className={`${styles.contactMethodBtn} ${
                      preferredContact === "whatsapp" ? styles.contactMethodBtnActive : ""
                    }`}
                    onClick={() => setPreferredContact("whatsapp")}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                </div>
              </div>

              {preferredContact === "whatsapp" && (
                <div className={styles.formGroup}>
                  <label htmlFor="demo-whatsapp" className={styles.label}>
                    WhatsApp number with country code *
                  </label>
                  <input
                    id="demo-whatsapp"
                    type="tel"
                    required
                    className={styles.input}
                    placeholder="+91 98765 43210"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? "Submitting..." : "Request a demo"}
                <ArrowRight size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.confirmationBox}>
            <div className={styles.confirmIconWrap}>
              <CheckCircle2 size={28} />
            </div>
            <h3 className={styles.confirmHeading}>Demo request received</h3>
            <p className={styles.confirmDesc}>
              Thank you. We will reach out via your preferred contact method to demonstrate how Gigxomi manages your client channels and video editing pipeline.
            </p>
            <Link
              href="/signup?role=agency"
              className={styles.confirmCtaBtn}
              onClick={() => setIsOpen(false)}
            >
              Start free workspace now <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
