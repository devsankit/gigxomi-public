import React from "react";
import Link from "next/link";
import { ArrowUpRight, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { publicSupportWhatsApp } from "@/lib/seo/public-support-contact";

type PublicFooterProps = {
  hideCta?: boolean;
  className?: string;
};

const PLATFORM_LINKS = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product overview" },
  { href: "/features/unified-inbox", label: "Unified Inbox" },
  { href: "/features/project-tracking", label: "Project Tracking" },
  { href: "https://play.google.com/store/apps/details?id=com.gigxomi.app", label: "Download App (Google Play)", external: true },
  { href: "/pricing", label: "Pricing" },
  { href: "https://app.gigxomi.com/login", label: "Open workspace", external: false, nofollow: true },
];

const AUDIENCE_LINKS = [
  { href: "/for-video-editing-agencies", label: "For video editing agencies" },
  { href: "/for-freelance-editors-building-teams", label: "For freelance editors" },
  { href: "/pricing", label: "Agency license" },
];

const RESOURCE_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/knowledge-base", label: "Knowledge base" },
  { href: "/contact", label: "Help & support" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms-and-conditions", label: "Terms of service" },
];

export function PublicFooter({ hideCta = false, className = "" }: PublicFooterProps) {
  return (
    <footer className={`gx-public-footer ${className}`.trim()}>
      <div className="gx-footer-container">
        {!hideCta && (
          <div className="gx-footer-cta-card">
            <div className="gx-footer-cta-text">
              <span className="gx-eyebrow">Studio Operations &amp; Mobile App</span>
              <h2 className="gx-footer-cta-heading">Download App from Play Store</h2>
              <p className="gx-footer-cta-desc">
                Editors get real-time push notifications for projects, edits &amp; instant chat on Android.
              </p>
            </div>
            <div className="gx-footer-app-actions">
              <a
                href="https://play.google.com/store/apps/details?id=com.gigxomi.app"
                target="_blank"
                rel="noreferrer"
                className="gx-play-store-badge-btn"
                title="Download Gigxomi on Google Play Store"
              >
                <svg className="gx-play-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#4285F4" d="M3.6 1.8L13.5 12 3.6 22.2c-.4-.3-.6-.8-.6-1.4V3.2c0-.6.2-1.1.6-1.4z" />
                  <path fill="#FBBC04" d="M16.8 8.7L4.7 1.8c-.3-.2-.7-.2-1.1 0l9.9 10.2 3.3-3.3z" />
                  <path fill="#0F9D58" d="M16.8 15.3l-3.3-3.3-9.9 10.2c.4.2.8.2 1.1 0l12.1-6.9z" />
                  <path fill="#EA4335" d="M20.8 10.4l-4 2.3-3.3-3.3 3.3-3.3 4 2.3c.7.4.7 1.6 0 2z" />
                </svg>
                <div className="gx-play-badge-text">
                  <span className="gx-play-small">GET IT ON</span>
                  <strong className="gx-play-brand">Google Play</strong>
                </div>
              </a>
              <a
                href="https://app.gigxomi.com/login"
                rel="nofollow"
                className="gx-footer-iphone-link"
              >
                iPhone users: Work directly from web dashboard &rarr;
              </a>
            </div>
          </div>
        )}

        <div className="gx-footer-content-grid">
          <div className="gx-footer-brand-col">
            <BrandWordmark ariaLabel="Gigxomi" className="gx-footer-brand-logo" />
            <p className="gx-footer-brand-desc">
              Dedicated business management workspace for video editing agencies and editors.
            </p>
            <div className="gx-footer-contact-links">
              <a href="mailto:studio@gigxomi.com" className="gx-footer-contact-item">
                <Mail size={14} aria-hidden="true" />
                <span>studio@gigxomi.com</span>
              </a>
              <a
                href={publicSupportWhatsApp.href}
                target="_blank"
                rel="noreferrer"
                className="gx-footer-contact-item"
              >
                <MessageCircle size={14} aria-hidden="true" />
                <span>WhatsApp: {publicSupportWhatsApp.display}</span>
              </a>
            </div>
          </div>

          <div className="gx-footer-nav-col">
            <span className="gx-footer-nav-title">Platform</span>
            <ul className="gx-footer-nav-list">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      className="gx-footer-nav-link"
                      rel={"nofollow" in link && link.nofollow ? "nofollow noreferrer" : "noreferrer"}
                      target={"external" in link && link.external ? "_blank" : undefined}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="gx-footer-nav-link" prefetch={false}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="gx-footer-nav-col">
            <span className="gx-footer-nav-title">Audience</span>
            <ul className="gx-footer-nav-list">
              {AUDIENCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="gx-footer-nav-link" prefetch={false}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="gx-footer-nav-col">
            <span className="gx-footer-nav-title">Resources &amp; Legal</span>
            <ul className="gx-footer-nav-list">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="gx-footer-nav-link" prefetch={false}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="gx-footer-bottom-bar">
          <span className="gx-footer-copyright">
            &copy; {new Date().getFullYear()} Gigxomi. All rights reserved.
          </span>
          <div className="gx-footer-social-links" aria-label="Social media links">
            <a
              href="https://www.instagram.com/gigxomi/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="gx-footer-social-btn"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://www.linkedin.com/company/gigxomi/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="gx-footer-social-btn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={publicSupportWhatsApp.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp support: ${publicSupportWhatsApp.display}`}
              className="gx-footer-social-btn"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Compact Circular WhatsApp Support Button on Mobile (Never covers copy or CTAs) */}
      <a
        href={publicSupportWhatsApp.href}
        target="_blank"
        rel="noreferrer"
        className="gx-whatsapp-floating-support"
        aria-label={`Chat with Gigxomi support on WhatsApp at ${publicSupportWhatsApp.display}`}
      >
        <MessageCircle size={22} strokeWidth={2.2} aria-hidden="true" />
        <span className="gx-whatsapp-floating-label">
          <strong>WhatsApp Support</strong>
          <small>{publicSupportWhatsApp.display}</small>
        </span>
      </a>
    </footer>
  );
}
