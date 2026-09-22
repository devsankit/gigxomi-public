import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { getPublicAgencyListingBySlugFromFile } from "@/lib/gigxomi/agency-listing-store";
import { listPublishedPortfolioDrafts } from "@/lib/gigxomi/delivery-portfolio-store";
import { buildAgencyInquiryHref } from "@/lib/gigxomi/public-contact";
import { companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

type AgencyShowcasePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateMetadata({ params }: AgencyShowcasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getPublicAgencyListingBySlugFromFile(slug);

  if (!agency) {
    return {
      title: "Agency not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = agency.description || `${agency.publicName} is a Gigxomi partner agency for video editing and post-production support.`;
  const keywords = Array.from(new Set([...agency.categories, ...agency.specialties, "video editing agency", "Gigxomi agency"]));

  return {
    title: agency.publicName,
    description,
    keywords,
    alternates: {
      canonical: `/agency/${agency.slug}`,
    },
    openGraph: {
      title: agency.publicName,
      description,
      url: `/agency/${agency.slug}`,
      type: "website",
      images: [
        {
          url: companyKnowledgeBase.logoPath,
          alt: `${agency.publicName} on Gigxomi`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: agency.publicName,
      description,
      images: [companyKnowledgeBase.logoPath],
    },
  };
}

export default async function AgencyShowcasePage({ params }: AgencyShowcasePageProps) {
  const { slug } = await params;
  const agency = await getPublicAgencyListingBySlugFromFile(slug);

  if (!agency) {
    notFound();
  }

  const publishedShowcases = await listPublishedPortfolioDrafts({
    tenantId: agency.tenantId,
    showcasePlacement: ["AGENCY_SHOWCASE", "PUBLIC_SERVICE"],
  });

  const locationLabel = [agency.office.city, agency.office.state].filter(Boolean).join(", ");
  const officeAddressVisible = agency.office.hasOffice && agency.office.isAddressPublic && agency.office.publicOfficeAddress;
  const primaryReview = agency.reviews[0] ?? null;
  const secondaryReviews = agency.reviews.slice(1, 4);
  const agencyWhatsappHref = buildAgencyInquiryHref({
    agencyName: agency.publicName,
    agencySlug: agency.slug,
    whatsappNumber: agency.whatsappNumber,
  });
  const listAgencyWhatsappHref = `https://wa.me/919993328124?text=${encodeURIComponent(
    "Hi Gigxomi, I want to list my video editing agency too."
  )}`;
  const navItems = [
    { href: "#overview", label: "Overview" },
    { href: "#offers", label: "Offers" },
    { href: "#portfolio", label: "Portfolio" },
    { href: "#published-work", label: "Work" },
    { href: "#proof", label: "Proof" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];
  const heroMetrics = [
    {
      label: "Completed orders",
      value: `${agency.stats.completedOrders}`,
      note: "Delivery proof that can be shown publicly.",
    },
    {
      label: "Avg response",
      value: `${agency.stats.responseSlaMinutes} min`,
      note: "Fast first reply with manager-led follow-through.",
    },
    {
      label: "Repeat clients",
      value: `${agency.stats.repeatClientPercent}%`,
      note: "Retention signal that supports agency trust.",
    },
  ];
  const proofMetrics = [
    {
      icon: Star,
      label: "Review score",
      value: `${agency.stats.averageRating || 0}/5`,
      note: `${agency.stats.reviewCount} verified reviews from delivered work.`,
    },
    {
      icon: Users,
      label: "Editor bench",
      value: `${agency.stats.activeEditors}`,
      note: `${agency.stats.openOpportunities} live openings in the network.`,
    },
    {
      icon: Building2,
      label: "Office model",
      value: agency.office.hasOffice ? "Physical office" : "Remote-first",
      note: officeAddressVisible ? agency.office.publicOfficeAddress : locationLabel || agency.office.country,
    },
    {
      icon: Clock3,
      label: "Working hours",
      value: agency.office.officeHours || "By appointment",
      note: "Useful for response and availability expectations.",
    },
  ];

  return (
    <main className="app-shell public-theme-root">
      <PublicShell
        activeSurface="agencies"
        canvasClassName="public-shell-page-canvas agency-site-page-canvas"
        title={agency.publicName}
        topbarActions={[
          {
            external: true,
            href: `mailto:${agency.contactEmail}`,
            icon: "mail",
            label: "Email",
          },
          {
            external: true,
            href: listAgencyWhatsappHref,
            label: "List your Video editing Agency too",
          },
        ]}
      >
        <div className="public-shell-page-stack agency-site-frame">
          <section className="agency-site-topbar">
            <nav aria-label="Agency page sections" className="agency-site-nav">
              {navItems.map((item) => (
                <a className="agency-site-nav-link" href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="agency-site-topbar-actions">
              <span className="meta-pill">
                <Globe size={13} strokeWidth={1.8} />
                Custom-domain ready
              </span>
              <Link className="agency-site-back" href="/agencies">
                Back to directory
              </Link>
            </div>
          </section>

        <section className="agency-site-hero" id="overview">
          <div className="agency-site-hero-copy">
            <div className="agency-site-brand-row">
              <div className="agency-site-logo">{getInitials(agency.publicName)}</div>
              <div className="agency-site-brand-copy">
                <p className="eyebrow">Agency website</p>
                <span>{locationLabel || agency.office.country}</span>
              </div>
            </div>

            <div className="agency-site-copy-stack">
              <h1>{agency.publicName}</h1>
              <p className="agency-site-tagline">{agency.tagline || agency.niche}</p>
              <p className="agency-site-description">{agency.description}</p>
            </div>

            <div className="agency-site-pill-row">
              <span className="meta-pill">{agency.hiringStatus}</span>
              <span className="meta-pill">
                <ShieldCheck size={13} strokeWidth={1.8} />
                {agency.reputation.band} - {agency.reputation.score}/100 karma
              </span>
              {agency.office.hasOffice && agency.office.officeVerified ? (
                <span className="meta-pill">
                  <BadgeCheck size={13} strokeWidth={1.8} />
                  Verified office
                </span>
              ) : null}
              <span className="meta-pill">
                <MapPin size={13} strokeWidth={1.8} />
                {locationLabel || agency.office.country}
              </span>
              <span className="meta-pill">
                <Globe size={13} strokeWidth={1.8} />
                Website mode enabled
              </span>
            </div>

            <div className="agency-site-cta-row">
              <a className="primary-button" href={listAgencyWhatsappHref} rel="noreferrer" target="_blank">
                List your Video editing Agency too
                <ArrowRight size={15} strokeWidth={1.9} />
              </a>
              <a className="ghost-button" href={`mailto:${agency.contactEmail}`}>
                Email agency
              </a>
              <Link className="ghost-button" href="/">
                Back to directory
              </Link>
            </div>

            <div className="agency-site-metric-strip">
              {heroMetrics.map((item) => (
                <article className="agency-site-metric-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="agency-site-visual-stage" aria-hidden="true">
            <div className="agency-site-orb agency-site-orb-one" />
            <div className="agency-site-orb agency-site-orb-two" />

            <div className="agency-site-visual-panel">
              <div className="agency-site-visual-panel-top">
                <span className="meta-pill">
                  <Sparkles size={13} strokeWidth={1.8} />
                  Public website preview
                </span>
                <span className="agency-site-window-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>

              <div className="agency-site-visual-feature">
                <div>
                  <p className="eyebrow">Featured positioning</p>
                  <h2>{agency.tagline || agency.niche}</h2>
                </div>
                <div className="agency-site-visual-score">
                  <strong>{agency.reputation.score}</strong>
                  <span>Karma score</span>
                </div>
              </div>

              <div className="agency-site-visual-grid">
                {agency.serviceOffers.slice(0, 3).map((offer, index) => (
                  <article className={`agency-site-visual-card tone-${(index % 3) + 1}`} key={offer.id}>
                    <span>{offer.priceLabel}</span>
                    <strong>{offer.title}</strong>
                    <p>{offer.summary}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="agency-site-floating-card agency-site-floating-card-review">
              <span>Client proof</span>
              <strong>
                {agency.stats.averageRating || 0}/5 from {agency.stats.reviewCount} reviews
              </strong>
              <p>Verified delivery feedback visible on the same page.</p>
            </div>

            <div className="agency-site-floating-card agency-site-floating-card-team">
              <span>Editor bench</span>
              <div className="agency-site-avatar-row">
                {agency.showcaseEditors.slice(0, 4).map((editor) => (
                  <b key={editor.editorId}>{getInitials(editor.displayName)}</b>
                ))}
              </div>
              <p>{agency.stats.activeEditors} active editors inside the agency network.</p>
            </div>
          </div>
        </section>

        <section className="agency-site-chip-band">
          {agency.specialties.slice(0, 6).map((specialty) => (
            <span className="service-signal-chip agency-site-band-chip" key={specialty}>
              {specialty}
            </span>
          ))}
          <span className="service-signal-chip agency-site-band-chip">WhatsApp-first intake</span>
          <span className="service-signal-chip agency-site-band-chip">Custom-domain ready</span>
        </section>

        <section className="agency-site-section" id="offers">
          <div className="agency-site-section-head">
            <div>
              <p className="section-label">Signature offers</p>
              <h2>Offer blocks that feel like a real agency website, not an internal dashboard card list.</h2>
            </div>
            <p>Each block can later be used as a conversion section on the agency’s own domain, with package summaries, portfolio links, and inquiry hooks.</p>
          </div>

          <div className="agency-site-offer-grid">
            {agency.serviceOffers.map((offer, index) => (
              <article className={`agency-site-offer-card tone-${(index % 3) + 1}`} key={offer.id}>
                <div className="agency-site-offer-top">
                  <span className="agency-site-offer-price">{offer.priceLabel}</span>
                  <span className="meta-pill">Agency service</span>
                </div>
                <h3>{offer.title}</h3>
                <p>{offer.summary}</p>
                <a className="agency-site-inline-link" href={agencyWhatsappHref} rel="noreferrer" target="_blank">
                  Ask about this service
                  <ArrowUpRight size={14} strokeWidth={1.8} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="agency-site-section" id="portfolio">
          <div className="agency-site-section-head">
            <div>
              <p className="section-label">Portfolio and editors</p>
              <h2>Use visual blocks and editor showcases so this page can genuinely replace a small agency website.</h2>
            </div>
            <p>Customers get portfolio-style storytelling, while editors see the same trust layer before deciding whether the agency is worth joining.</p>
          </div>

          <div className="agency-site-portfolio-layout">
            <div className="agency-site-portfolio-canvas">
              <div className="agency-site-canvas-stage">
                <div className="agency-site-canvas-main">
                  <span className="meta-pill">
                    <BriefcaseBusiness size={13} strokeWidth={1.8} />
                    Core positioning
                  </span>
                  <strong>{agency.niche}</strong>
                  <p>{agency.categories.join(" · ")}</p>
                </div>
                <div className="agency-site-canvas-mini-grid">
                  {agency.specialties.slice(0, 4).map((specialty, index) => (
                    <div className={`agency-site-canvas-tile tone-${(index % 3) + 1}`} key={specialty}>
                      <span>Specialty</span>
                      <strong>{specialty}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="agency-site-editor-grid">
              {agency.showcaseEditors.map((editor) => (
                <article className="agency-site-editor-card" key={editor.editorId}>
                  <div className="agency-site-editor-top">
                    <span className="meta-pill">{editor.membershipStatus}</span>
                    <span className="meta-pill">{editor.leaderTier} tier</span>
                  </div>
                  <div className="agency-site-editor-avatar">{getInitials(editor.displayName)}</div>
                  <h3>{editor.displayName}</h3>
                  <p className="agency-site-editor-alias">{editor.publicAlias}</p>
                  <div className="service-signal-row">
                    {editor.specialties.slice(0, 3).map((specialty) => (
                      <span className="service-signal-chip" key={specialty}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <p>{editor.highlight}</p>
                  <div className="agency-site-editor-meta">
                    <span>Karma {editor.karmaScore}/100</span>
                    <span>Agency showcase</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="agency-site-section" id="published-work">
          <div className="agency-site-section-head">
            <div>
              <p className="section-label">Published work</p>
              <h2>Approved YouTube publishes should become reusable proof blocks for both the agency website and the freelancer portfolio layer.</h2>
            </div>
            <p>These cards come from the same approved Gigxomi publish pipeline, so the agency page reflects real work that already passed internal permission and YouTube publish checks.</p>
          </div>

          <div className="agency-site-offer-grid">
            {publishedShowcases.slice(0, 6).map((draft, index) => (
              <article className={`agency-site-offer-card tone-${(index % 3) + 1}`} key={draft.id}>
                <div className="agency-site-offer-top">
                  <span className="agency-site-offer-price">{draft.price ? `INR ${draft.price.toLocaleString("en-IN")}` : "Pricing on request"}</span>
                  <span className="meta-pill">{draft.showcasePlacement}</span>
                </div>
                <h3>{draft.title}</h3>
                <p>{draft.summary || draft.description}</p>
                <p className="muted-copy">Delivery time: {draft.deliveryTime || "Not listed yet"}</p>
                {draft.sourceVideoUrl ? (
                  <a className="agency-site-inline-link" href={draft.sourceVideoUrl} rel="noreferrer" target="_blank">
                    Watch on YouTube
                    <ArrowUpRight size={14} strokeWidth={1.8} />
                  </a>
                ) : null}
              </article>
            ))}
            {!publishedShowcases.length ? (
              <article className="agency-site-offer-card tone-1">
                <div className="agency-site-offer-top">
                  <span className="agency-site-offer-price">Awaiting first publish</span>
                  <span className="meta-pill">Pipeline live</span>
                </div>
                <h3>Approved YouTube showcases will appear here.</h3>
                <p>Once a freelancer uploads inside Gigxomi, gets agency approval, and publishes to the shared channel, this website section updates from the same record.</p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="agency-site-section" id="proof">
          <div className="agency-site-section-head">
            <div>
              <p className="section-label">Trust and proof</p>
              <h2>The proof layer should feel premium enough that agencies can treat this page as their public website.</h2>
            </div>
            <p>This is where we combine review proof, response discipline, location clarity, editor bench size, and the Gigxomi karma model into one narrative section.</p>
          </div>

          <div className="agency-site-proof-layout">
            <article className="agency-site-proof-feature">
              <div className="agency-site-proof-score">
                <span>Agency karma</span>
                <strong>{agency.reputation.score}</strong>
                <p>{agency.reputation.band} band with trust signals derived from response speed, completion quality, reviews, disputes, and repeat clients.</p>
              </div>
              <div className="agency-site-proof-reasons">
                {agency.reputation.reasons.map((reason) => (
                  <div className={`agency-site-proof-reason agency-site-proof-reason-${reason.tone}`} key={reason.label}>
                    <span>{reason.label}</span>
                    <strong>{reason.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <div className="agency-site-proof-grid">
              {proofMetrics.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="agency-site-proof-card" key={item.label}>
                    <span className="agency-site-proof-label">
                      <Icon size={14} strokeWidth={1.8} />
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                    <p>{item.note}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="agency-site-section" id="reviews">
          <div className="agency-site-section-head">
            <div>
              <p className="section-label">Reviews</p>
              <h2>Reviews should look like social proof on a landing page, not like hidden backend metadata.</h2>
            </div>
            <p>These review records are native Gigxomi proof items, so the public page can carry meaningful trust without pretending to be a generic theme.</p>
          </div>

          <div className="agency-site-review-layout">
            {primaryReview ? (
              <article className="agency-site-review-feature">
                <div className="agency-site-review-feature-top">
                  <span className="meta-pill">
                    <Star size={13} strokeWidth={1.8} />
                    {primaryReview.rating}/5
                  </span>
                  <span className="meta-pill">{primaryReview.projectType}</span>
                </div>
                <blockquote>{primaryReview.comment}</blockquote>
                <div className="agency-site-review-author">
                  <strong>{primaryReview.authorLabel}</strong>
                  <span>{formatDate(primaryReview.createdAt)}</span>
                </div>
              </article>
            ) : null}

            <div className="agency-site-review-list">
              {secondaryReviews.map((review) => (
                <article className="agency-site-review-card" key={review.id}>
                  <div className="agency-site-review-card-top">
                    <span className="meta-pill">
                      <Star size={13} strokeWidth={1.8} />
                      {review.rating}/5
                    </span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <strong>{review.authorLabel}</strong>
                  <p>{review.comment}</p>
                </article>
              ))}

              <article className="agency-site-review-card agency-site-review-card-note">
                <span className="meta-pill">
                  <Globe size={13} strokeWidth={1.8} />
                  Website-ready page
                </span>
                <strong>Future custom domain support fits this layout directly.</strong>
                <p>This single-page structure is ready for a branded domain later, while already working as a public agency website today.</p>
              </article>
            </div>
          </div>
        </section>

          <section className="agency-site-cta-banner" id="contact">
          <div className="agency-site-cta-copy">
            <p className="section-label">Contact and conversion</p>
            <h2>Turn the agency profile into a website customers can trust and agencies can eventually map to their own domain.</h2>
            <p>
              Gigxomi handles the network trust layer, while the agency gets a public-facing landing page with offers, reviews, editor proof, and future
              custom-domain flexibility.
            </p>
          </div>
          <div className="agency-site-cta-actions">
            <a className="primary-button" href={listAgencyWhatsappHref} rel="noreferrer" target="_blank">
              List your Video editing Agency too
              <ArrowRight size={15} strokeWidth={1.9} />
            </a>
            <a className="ghost-button" href={`mailto:${agency.contactEmail}`}>
              Email agency
            </a>
          </div>
          </section>
        </div>
      </PublicShell>
    </main>
  );
}
