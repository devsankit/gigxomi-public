import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, BadgeIndianRupee, CheckCircle2, Clock3, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import type { DummyPublicServiceCard, DummyService } from "@/lib/gigxomi/dummy-platform-store";

function formatPrice(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

type MarketplaceServiceCardProps = {
  service: DummyPublicServiceCard;
  href?: string;
  ctaLabel?: string;
};

export function MarketplaceServiceCard({
  service,
  href = `/services/${service.slug}`,
  ctaLabel = "View Service",
}: MarketplaceServiceCardProps) {
  return (
    <article className="marketplace-service-card">
      <div className="marketplace-service-cover" style={{ background: service.media[0]?.accent }}>
        <span className="meta-pill">{service.category}</span>
        <span className="meta-pill">{service.turnaroundLabel}</span>
      </div>

      <div className="marketplace-service-card-body">
        <div className="marketplace-service-head">
          <h3>{service.title}</h3>
          <p>{service.ownerName}</p>
        </div>

        <p className="marketplace-service-summary">{service.summary}</p>

        <div className="service-signal-row">
          <span className="service-signal-chip">Trust: {service.trustBand}</span>
          <span className="service-signal-chip">Workload: {service.workloadBand}</span>
          <span className="service-signal-chip">{service.activeAgencySummary}</span>
        </div>

        <div className="marketplace-service-metrics">
          <div>
            <span>Starting at</span>
            <strong>{formatPrice(service.basePrice)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{service.deliveryTime}</strong>
          </div>
        </div>

        <Link className="primary-button" href={href}>
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

type ServiceDetailViewProps = {
  service: DummyService;
  trustBand?: string;
  workloadBand?: string;
  activeAgencySummary?: string;
  turnaroundLabel?: string;
  mode: "public" | "preview";
  actions?: ReactNode;
};

export function ServiceDetailView({
  service,
  trustBand,
  workloadBand,
  activeAgencySummary,
  turnaroundLabel,
  mode,
  actions,
}: ServiceDetailViewProps) {
  return (
    <div className="service-detail-shell">
      <section className="service-detail-hero">
        <div className="service-detail-copy">
          <div className="service-detail-badges">
            <span className="meta-pill">{service.category}</span>
            <span className="meta-pill">{service.status}</span>
            {turnaroundLabel ? <span className="meta-pill">{turnaroundLabel}</span> : null}
          </div>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
          <div className="service-signal-row">
            {trustBand ? <span className="service-signal-chip">Trust: {trustBand}</span> : null}
            {workloadBand ? <span className="service-signal-chip">Workload: {workloadBand}</span> : null}
            {activeAgencySummary ? <span className="service-signal-chip">{activeAgencySummary}</span> : null}
            <span className="service-signal-chip">{service.ownerName}</span>
            {service.identityVerified ? <span className="gigxomi-verified-badge" title="Identity verified through DigiLocker"><BadgeCheck size={15} /> Gigxomi Identity Verified</span> : null}
          </div>
        </div>

        <aside className="service-detail-sidebar">
          <div className="service-detail-price-card">
            <span>Starting at</span>
            <strong>{formatPrice(service.basePrice)}</strong>
            <small>{service.deliveryTime}</small>
            <div className="service-detail-stat-row">
              <div>
                <Clock3 size={15} strokeWidth={1.8} />
                <span>{service.deliveryTime}</span>
              </div>
              <div>
                <Layers3 size={15} strokeWidth={1.8} />
                <span>{service.revisions}</span>
              </div>
            </div>
            {actions}
          </div>
        </aside>
      </section>

      <section className="service-detail-grid">
        <article className="service-detail-panel">
          <p className="section-label">About this service</p>
          <h2>{service.specialty}</h2>
          <p>{service.description}</p>
          <div className="freelancer-inline-list">
            {service.deliverables.map((item) => (
              <div className="freelancer-inline-row" key={item}>
                <CheckCircle2 size={15} strokeWidth={1.8} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="service-detail-panel">
          <p className="section-label">Best for</p>
          <h2>{service.targetAudience}</h2>
          <div className="service-signal-row">
            {service.tags.map((tag) => (
              <span className="service-signal-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {mode === "preview" ? (
            <p className="muted-copy">Preview mode uses the same buyer-facing layout that will show publicly after approval.</p>
          ) : null}
        </article>
      </section>

      <section className="service-detail-media-grid">
        {service.media.map((item) => (
          <article className="service-media-card" key={item.id} style={{ background: item.accent }}>
            <span className="meta-pill">{item.kind === "video" ? "Sample" : "Preview"}</span>
            <strong>{item.title}</strong>
            <small>{service.ownerAlias}</small>
          </article>
        ))}
      </section>

      <section className="service-detail-grid">
        <article className="service-detail-panel">
          <p className="section-label">SEO snapshot</p>
          <div className="service-detail-seo-block">
            <div>
              <ShieldCheck size={16} strokeWidth={1.8} />
              <div>
                <strong>{service.seoTitle}</strong>
                <p>{service.seoDescription}</p>
              </div>
            </div>
            <div>
              <Sparkles size={16} strokeWidth={1.8} />
              <p>{service.seoKeywords.join(", ")}</p>
            </div>
          </div>
        </article>

        <article className="service-detail-panel">
          <p className="section-label">FAQ</p>
          <div className="service-detail-faq-list">
            {service.faq.map((item) => (
              <div className="service-detail-faq-item" key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      {mode === "public" ? (
        <section
          className="service-detail-agency-pitch"
          style={{
            marginTop: "32px",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid rgba(215, 255, 47, 0.25)",
            background: "linear-gradient(135deg, rgba(215, 255, 47, 0.06) 0%, rgba(12, 14, 12, 0.9) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent, #D7FF2F)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            For Video Editing Agencies & Studios
          </span>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--gx-page-ink, #fff)" }}>
            Want to hire and manage editors like {service.ownerName} with zero risk?
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--gx-page-muted, rgba(255, 255, 255, 0.7))", lineHeight: 1.5 }}>
            Register your agency workspace on Gigxomi. Manage client WhatsApp intake, relay revision notes with Two-Lane masked privacy (no client poaching), and automate editor payouts with 0% platform commission.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px" }}>
            <Link className="primary-button" href="/pricing" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              Explore Agency Workspace Plans <ArrowRight size={14} />
            </Link>
            <a
              className="primary-button"
              href={`https://wa.me/919993328124?text=${encodeURIComponent(
                `Hi Gigxomi Team, I saw ${service.ownerName}'s listing (${service.title}) and want to onboard our agency to hire and manage editors on Gigxomi.`
              )}`}
              rel="noreferrer"
              style={{ background: "#25D366", color: "#051A0B", padding: "8px 16px", fontSize: "0.85rem" }}
              target="_blank"
            >
              Hire via Agency Concierge (+91 99933 28124)
            </a>
          </div>
        </section>
      ) : null}

      <section className="service-detail-footer-note">
        <BadgeIndianRupee size={16} strokeWidth={1.8} />
        <p>
          {mode === "preview"
            ? "Draft preview shares the same public structure, but this listing will stay private until it is approved."
            : "Client inquiries enter through WhatsApp-first intake, then move into manager/admin routing before editor work starts."}
        </p>
      </section>
    </div>
  );
}

export function ServiceCtaButton({ href, label }: { href: string; label: string }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a className="primary-button" href={href} rel="noreferrer" target="_blank">
        {label}
        <ArrowRight size={14} strokeWidth={1.8} />
      </a>
    );
  }

  return (
    <Link className="primary-button" href={href}>
      {label}
      <ArrowRight size={14} strokeWidth={1.8} />
    </Link>
  );
}
