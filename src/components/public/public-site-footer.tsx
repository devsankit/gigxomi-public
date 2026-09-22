"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Download,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Smartphone,
} from "lucide-react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { publicSupportWhatsApp } from "@/lib/seo/public-support-contact";

const marketplaceLinks = [
  { href: "/", label: "AI Freelancer Matcher" },
  { href: "/?surface=services", label: "Browse Services" },
  { href: "/?surface=agencies", label: "Verified Agencies" },
  { href: "/pricing", label: "Pricing" },
];

const growthLinks = [
  { href: "/for-freelance-editors-building-teams", label: "For Editors" },
  { href: "/for-video-editing-agencies", label: "For Agencies" },
  { href: "https://app.gigxomi.com/signup", label: "Create an Account", external: true, nofollow: true },
  { href: "https://app.gigxomi.com/login", label: "Open Workspace", external: true, nofollow: true },
];

const resourceLinks = [
  { href: "https://blog.gigxomi.com/blog/", label: "All Blog Articles", external: true },
  { href: "/knowledge-base", label: "Knowledge Base" },
  { href: "/contact", label: "Support & Contact" },
  { href: "https://wa.me/919993328124?text=Hi%20Gigxomi%20team%2C%20I%20want%20to%20talk%20to%20support.", label: "WhatsApp Support (+91 99933 28124)", external: true },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-and-cancellation-policy", label: "Refund & Cancellation" },
  { href: "/service-delivery-policy", label: "Service Delivery" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function FooterLink({
  external = false,
  nofollow = false,
  href,
  label,
}: {
  external?: boolean;
  nofollow?: boolean;
  href: string;
  label: string;
}) {
  if (external) {
    const isAppAuthLink = href.startsWith("https://app.gigxomi.com");
    return (
      <a
        href={href}
        rel={nofollow ? "nofollow noreferrer" : "noreferrer"}
        target={isAppAuthLink ? undefined : "_blank"}
      >
        {label}
        {!isAppAuthLink && <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.8} />}
      </a>
    );
  }

  return <Link href={href}>{label}</Link>;
}

export function PublicSiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="public-site-footer">
      <section className="public-footer-app-card" aria-labelledby="mobile-app-title">
        <div className="public-footer-app-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path fill="#4285F4" d="M3.6 1.8L13.5 12 3.6 22.2c-.4-.3-.6-.8-.6-1.4V3.2c0-.6.2-1.1.6-1.4z" />
            <path fill="#FBBC04" d="M16.8 8.7L4.7 1.8c-.3-.2-.7-.2-1.1 0l9.9 10.2 3.3-3.3z" />
            <path fill="#0F9D58" d="M16.8 15.3l-3.3-3.3-9.9 10.2c.4.2.8.2 1.1 0l12.1-6.9z" />
            <path fill="#EA4335" d="M20.8 10.4l-4 2.3-3.3-3.3 3.3-3.3 4 2.3c.7.4.7 1.6 0 2z" />
          </svg>
        </div>
        <div className="public-footer-app-copy">
          <p className="section-label">Google Play Application</p>
          <h2 id="mobile-app-title">Download App from Play Store</h2>
          <p>
            Get real-time push notifications for projects, revisions, client feedback, and instant payouts on Android. Never miss an urgent project assignment or lead.
          </p>
          <div className="public-footer-app-points">
            <span><BadgeCheck size={14} /> Instant push alerts on Android</span>
            <span><BadgeCheck size={14} /> Official Google Play app</span>
            <span><BadgeCheck size={14} /> iPhone users work directly via web dashboard</span>
          </div>
        </div>
        <div className="public-footer-app-actions">
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
            className="public-footer-iphone-link"
          >
            <span>iPhone &amp; Desktop users: Open Web Workspace &rarr;</span>
          </a>
        </div>
      </section>

      <div className="public-footer-main">
        <section className="public-footer-brand" aria-label="About Gigxomi">
          <BrandWordmark />
          <p>
            Gigxomi is the creative-work operating network for discovering proven talent, packaging freelancer services, and running agency delivery without
            fixed hiring pressure.
          </p>
          <div className="public-footer-trust-row">
            <span><BadgeCheck size={14} /> Verified workflows</span>
            <span><MessageCircle size={14} /> WhatsApp-first support</span>
          </div>
          <div className="public-footer-contact-list">
            <a href="mailto:studio@gigxomi.com"><Mail size={15} /> studio@gigxomi.com</a>
            <a href={publicSupportWhatsApp.href} rel="noreferrer" target="_blank"><MessageCircle size={15} /> {publicSupportWhatsApp.display}</a>
            <span><MapPin size={15} /> Dewas, Madhya Pradesh, India</span>
          </div>
        </section>

        <nav className="public-footer-link-column" aria-label="Marketplace footer links">
          <p>Marketplace</p>
          {marketplaceLinks.map((item) => <FooterLink {...item} key={item.href} />)}
        </nav>

        <nav className="public-footer-link-column" aria-label="Growth footer links">
          <p>Grow with Gigxomi</p>
          {growthLinks.map((item) => <FooterLink {...item} key={item.href} />)}
        </nav>

        <nav className="public-footer-link-column" aria-label="Resource footer links">
          <p>Learn</p>
          {resourceLinks.map((item) => <FooterLink {...item} key={item.href} />)}
        </nav>

        <nav className="public-footer-link-column" aria-label="Legal footer links">
          <p>Legal</p>
          {legalLinks.map((item) => <FooterLink {...item} key={item.href} />)}
        </nav>
      </div>

      <div className="public-footer-bottom">
        <p>© {year} Gigxomi. All rights reserved.</p>
        <div className="public-footer-social" aria-label="Gigxomi social profiles">
          <span>Follow Gigxomi</span>
          <a aria-label="Instagram" href="https://www.instagram.com/gigxomi/" rel="noreferrer" target="_blank"><Instagram size={16} /></a>
          <a aria-label="LinkedIn" href="https://www.linkedin.com/company/gigxomi/" rel="noreferrer" target="_blank"><Linkedin size={16} /></a>
          <a aria-label={`WhatsApp support at ${publicSupportWhatsApp.display}`} href={publicSupportWhatsApp.href} rel="noreferrer" target="_blank"><MessageCircle size={16} /></a>
        </div>
        <p>Creative services, freelancer growth, and agency operations in one trusted network.</p>
      </div>
    </footer>
  );
}
