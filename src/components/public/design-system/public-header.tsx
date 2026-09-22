"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

type NavLink = {
  href: string;
  label: string;
  matchPrefix?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/product", label: "Product", matchPrefix: true },
  { href: "/for-video-editing-agencies", label: "For agencies", matchPrefix: true },
  { href: "/for-freelance-editors-building-teams", label: "For editors", matchPrefix: true },
  { href: "/pricing", label: "Pricing", matchPrefix: true },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="gx-header-root">
      <div className="gx-header-bar">
        {/* Official Gigxomi Dashboard Logo Asset */}
        <div className="gx-header-logo-wrap">
          <BrandWordmark ariaLabel="Gigxomi home" className="gx-header-brand-logo" priority />
        </div>

        {/* Plain Geist text navigation links with short lime underline on hover/active */}
        <nav aria-label="Primary navigation" className="gx-header-desktop-nav">
          {NAV_LINKS.map((link) => {
            const isActive = link.matchPrefix
              ? pathname === link.href || pathname.startsWith(`${link.href}/`)
              : pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`gx-header-nav-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                prefetch={false}
              >
                <span className="gx-header-nav-label">{link.label}</span>
                {isActive && <span className="gx-header-nav-indicator" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="gx-header-actions-desktop">
          <a
            href="https://app.gigxomi.com/login"
            rel="nofollow"
            className="gx-button-secondary gx-header-login-btn"
          >
            Login
          </a>
          <Link href="/pricing" className="gx-button-primary gx-header-cta-btn" prefetch={false}>
            <span>Start agency</span>
            <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="gx-header-mobile-trigger-wrap">
          <button
            type="button"
            className="gx-header-mobile-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu Modal */}
      {mobileMenuOpen && (
        <div className="gx-header-mobile-overlay" role="dialog" aria-modal="true">
          <div
            className="gx-header-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="gx-header-mobile-drawer">
            <div className="gx-header-mobile-drawer-top">
              <BrandWordmark ariaLabel="Gigxomi home" className="gx-header-brand-logo" priority />
              <button
                type="button"
                className="gx-header-mobile-toggle"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="gx-header-mobile-nav">
              {NAV_LINKS.map((link) => {
                const isActive = link.matchPrefix
                  ? pathname === link.href || pathname.startsWith(`${link.href}/`)
                  : pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`gx-header-mobile-nav-link ${isActive ? "is-active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    prefetch={false}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="gx-header-mobile-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>

            <div className="gx-header-mobile-actions">
              <a
                href="https://app.gigxomi.com/login"
                rel="nofollow"
                className="gx-button-secondary gx-header-mobile-action-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </a>
              <Link
                href="/pricing"
                className="gx-button-primary gx-header-mobile-action-btn"
                onClick={() => setMobileMenuOpen(false)}
                prefetch={false}
              >
                <span>Start agency</span>
                <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
