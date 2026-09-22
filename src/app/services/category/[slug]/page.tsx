import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Layers3,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { ServiceCard } from "@/components/public/service-card";
import { listPublicServicesFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { loadMarketplaceDataFromWordPress, type MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";
import { blogPosts } from "@/lib/seo/blog-posts";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import {
  filterServicesForNiche,
  getAllNicheSlugs,
  getNicheBySlug,
  NICHE_CATEGORIES,
} from "@/lib/seo/niche-catalog";

export const revalidate = 300;

export async function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const niche = getNicheBySlug(slug);

  if (!niche) {
    return {
      title: "Category not found | Gigxomi",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = buildSiteUrl(`/services/category/${niche.slug}`);

  return {
    title: { absolute: niche.seoTitle },
    description: niche.seoDescription,
    keywords: niche.targetKeywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: niche.seoTitle,
      description: niche.seoDescription,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: companyKnowledgeBase.logoPath,
          alt: `${niche.title} on ${companyKnowledgeBase.brandName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: niche.seoTitle,
      description: niche.seoDescription,
    },
  };
}

async function getServices() {
  try {
    const data = await loadMarketplaceDataFromWordPress();
    if (data.services.length > 0) {
      return data.services;
    }
  } catch {
    // Fall back to local store
  }
  return listPublicServicesFromFile();
}

export default async function NicheCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const niche = getNicheBySlug(slug);

  if (!niche) {
    notFound();
  }

  const allServices = await getServices();
  const matchedServices = filterServicesForNiche(allServices, niche);

  const categoryUrl = buildSiteUrl(`/services/category/${niche.slug}`);
  const salesWhatsappUrl = `https://wa.me/919993328124?text=${encodeURIComponent(
    `Hi Gigxomi Team, I am looking to hire vetted video editors for ${niche.title}. Please guide me on available editors and agency workspace onboarding.`
  )}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: niche.h1,
    serviceType: niche.categoryName,
    description: niche.seoDescription,
    provider: {
      "@type": "Organization",
      name: companyKnowledgeBase.brandName,
      url: companyKnowledgeBase.siteUrl,
      telephone: companyKnowledgeBase.supportPhone,
    },
    areaServed: "Worldwide",
    url: categoryUrl,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: 800,
      highPrice: 25000,
      offerCount: matchedServices.length || 1,
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${niche.title} Services & Editors`,
    itemListElement: matchedServices.slice(0, 10).map((svc, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: svc.title,
      url: buildSiteUrl(`/services/${svc.slug}`),
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: { "@type": "WebPage", "@id": companyKnowledgeBase.siteUrl, name: "Home" },
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Discover Services",
        item: { "@type": "WebPage", "@id": buildSiteUrl("/discover"), name: "Discover Services" },
      },
      {
        "@type": "ListItem",
        position: 3,
        name: niche.title,
        item: { "@type": "WebPage", "@id": categoryUrl, name: niche.title },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: niche.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const otherNiches = NICHE_CATEGORIES.filter((c) => c.slug !== niche.slug);

  const directGuides = blogPosts.filter((post) =>
    post.internalLinks.some((link) => link.href.includes(`/services/category/${niche.slug}`))
  );
  const fallbackGuideSlugs = [
    "how-to-manage-video-editing-clients",
    "how-to-scale-a-video-editing-business",
    "how-to-outsource-video-editing",
    "how-to-hire-video-editors",
    "how-to-get-video-editing-clients",
  ];
  const combinedGuides = [...directGuides];
  for (const fallbackSlug of fallbackGuideSlugs) {
    if (combinedGuides.length >= 3) break;
    const fallback = blogPosts.find((p) => p.slug === fallbackSlug);
    if (fallback && !combinedGuides.some((g) => g.slug === fallback.slug)) {
      combinedGuides.push(fallback);
    }
  }
  const relatedGuides = combinedGuides.slice(0, 6);

  return (
    <MarketingSiteShell>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50">
          <Link className="hover:text-white transition" href="/">
            Home
          </Link>
          <span>/</span>
          <Link className="hover:text-white transition" href="/discover">
            Discover
          </Link>
          <span>/</span>
          <span className="text-[color:var(--gx-primary)] font-medium">{niche.title}</span>
        </nav>

        {/* Hero Header */}
        <section className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 p-6 md:p-10 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gx-primary-border)] bg-[color:var(--gx-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--gx-primary)]">
              <Sparkles size={13} /> {niche.categoryName} Specialty
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <BadgeCheck size={13} /> Pre-Vetted Editors
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Clock3 size={13} /> Turnaround: {niche.turnaroundStandard}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-5xl leading-tight">
            {niche.h1}
          </h1>

          <p className="max-w-3xl text-base text-white/80 md:text-lg leading-relaxed">
            {niche.summary}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 md:gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <span className="block text-xs uppercase text-white/50">Typical Rates</span>
              <strong className="text-sm font-semibold text-white md:text-base">{niche.priceBenchmarkInr}</strong>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <span className="block text-xs uppercase text-white/50">Global Rates</span>
              <strong className="text-sm font-semibold text-white md:text-base">{niche.priceBenchmarkUsd}</strong>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <span className="block text-xs uppercase text-white/50">Standard Delivery</span>
              <strong className="text-sm font-semibold text-white md:text-base">{niche.turnaroundStandard}</strong>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <span className="block text-xs uppercase text-white/50">Platform Fee</span>
              <strong className="text-sm font-semibold text-[color:var(--gx-primary)] md:text-base">0% Commission</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Link
              className="inline-flex items-center gap-2 rounded-[14px] bg-[color:var(--gx-primary)] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              href="/pricing"
            >
              Explore Agency Workspace Plans <ArrowRight size={15} />
            </Link>
            <a
              className="inline-flex items-center gap-2 rounded-[14px] border border-white/16 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10] hover:border-white/25"
              href={salesWhatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={16} /> Hire via Sales WhatsApp (+91 99933 28124)
            </a>
          </div>
        </section>

        {/* Curated Service Gigs Grid */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Featured {niche.title} Gigs & Verified Editors
            </h2>
            <p className="text-sm text-white/60">
              Browse proven specialists ready to take on client edits, agency white-label overflow, or weekly retainers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matchedServices.map((service) => {
              const displayOwner = service.ownerName || service.ownerAlias || "Gigxomi Editor";
              const surfaceService = service as MarketplaceSurfaceService;
              const whatsappHref = buildServiceInquiryHref({
                title: service.title,
                slug: service.slug,
                basePrice: service.basePrice,
                deliveryTime: service.deliveryTime,
                ownerName: displayOwner,
                publicHref: surfaceService.publicHref,
              });

              const thumbnailUrl =
                ("sampleThumbnailUrl" in service && typeof service.sampleThumbnailUrl === "string" && service.sampleThumbnailUrl) ||
                ("coverImageUrl" in service && typeof service.coverImageUrl === "string" && service.coverImageUrl) ||
                ("media" in service && Array.isArray(service.media) && service.media[0]?.sourceUrl) ||
                null;

              return (
                <ServiceCard
                  deliveryLabel={service.deliveryTime || niche.turnaroundStandard}
                  href={`/services/${service.slug}`}
                  key={service.slug}
                  priceLabel={`INR ${(service.basePrice || 2500).toLocaleString("en-IN")}`}
                  ratingLabel="5.0"
                  thumbnailAccent="linear-gradient(135deg, rgba(210, 255, 31, 0.12), rgba(12, 18, 24, 0.95))"
                  thumbnailUrl={thumbnailUrl}
                  title={service.title}
                  whatsappHref={whatsappHref}
                />
              );
            })}
          </div>
        </section>

        {/* Agency Scale & Anti-Poaching Feature Callout */}
        <section className="relative overflow-hidden rounded-[28px] border border-[color:var(--gx-primary-border)] bg-gradient-to-r from-emerald-950/40 via-[color:var(--gx-primary-soft)] to-black/60 p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--gx-primary)]">
              For Video Production Agencies & Scaling Studios
            </span>
            <h2 className="text-2xl font-bold text-white md:text-3xl leading-snug">
              Hire and Retain {niche.title} Editors with 0% Commission & Anti-Poaching Shield
            </h2>
            <p className="text-sm md:text-base text-white/80 leading-relaxed">
              Stop losing high-ticket clients to rogue freelancers bypassing your agency. Gigxomi&apos;s <strong>Two-Lane Masked Chat</strong> keeps client WhatsApp messages strictly visible to managers and account executives, while your editors receive scoped revision tasks inside a protected production lane.
            </p>
            <ul className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-[color:var(--gx-primary)] shrink-0" size={16} /> 0% platform commission on billing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-[color:var(--gx-primary)] shrink-0" size={16} /> Masked client phone numbers & identities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-[color:var(--gx-primary)] shrink-0" size={16} /> Quality review gate before client preview
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="text-[color:var(--gx-primary)] shrink-0" size={16} /> Instant automated editor UPI payouts
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                className="inline-flex items-center gap-2 rounded-[14px] bg-[color:var(--gx-primary)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-95"
                href="/pricing"
              >
                View Agency Workspace Plans <ArrowRight size={14} />
              </Link>
              <a
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/16 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.10] hover:border-white/25"
                href={salesWhatsappUrl}
                rel="noreferrer"
                target="_blank"
              >
                Onboard via Agency Concierge
              </a>
            </div>
          </div>
        </section>

        {/* Buyer Guide & Technical Standards Section (E-E-A-T & GEO) */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* What to look for */}
          <article className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={20} />
              <h3 className="text-lg font-bold text-white">What to Look For in {niche.title}</h3>
            </div>
            <p className="text-sm text-white/70">{niche.buyerGuide.overview}</p>
            <ul className="flex flex-col gap-2.5 pt-2">
              {niche.buyerGuide.whatToLookFor.map((item) => (
                <li className="flex items-start gap-2 text-sm text-white/90" key={item}>
                  <CheckCircle2 className="mt-0.5 text-emerald-400 shrink-0" size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Common pitfalls */}
          <article className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert size={20} />
              <h3 className="text-lg font-bold text-white">Common Mistakes to Avoid</h3>
            </div>
            <p className="text-sm text-white/70">
              Low-cost or inexperienced editors often create hidden post-production bottlenecks:
            </p>
            <ul className="flex flex-col gap-2.5 pt-2">
              {niche.buyerGuide.commonMistakes.map((item) => (
                <li className="flex items-start gap-2 text-sm text-white/90" key={item}>
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* Deliverables Standard Checklist */}
        <section className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <div className="flex items-center gap-2 text-[color:var(--gx-primary)]">
            <Layers3 size={20} />
            <h3 className="text-lg font-bold text-white">Standard Deliverables Included in {niche.title}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 pt-2">
            {niche.deliverables.map((item) => (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.01] p-3 text-sm text-white/80" key={item}>
                <CheckCircle2 className="text-[color:var(--gx-primary)] shrink-0" size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions (AEO & Featured Snippets) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--gx-primary)]">
              <HelpCircle size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Expert Insights</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Frequently Asked Questions About {niche.title}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {niche.faqs.map((faq) => (
              <div
                className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-5 md:p-6"
                key={faq.question}
              >
                <h3 className="text-base font-semibold text-white md:text-lg">
                  {faq.question}
                </h3>
                <p className="text-sm md:text-base text-white/70 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Agency Guides & Workflows */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--gx-primary)]">
              <BookOpen size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Agency Growth &amp; Operations</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Related Agency Guides &amp; Workflows
            </h2>
            <p className="text-sm text-white/70">
              Operational blueprints and client acquisition systems for scaling {niche.title.toLowerCase()} retainers, hiring editors, and protecting client accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedGuides.map((guide) => (
              <Link
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-[color:var(--gx-primary-border)] hover:bg-white/[0.04]"
                href={`/blog/${guide.slug}`}
                key={guide.slug}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[color:var(--gx-primary)] uppercase tracking-wider">
                    {guide.category} · {guide.intent}
                  </span>
                  <h3 className="text-base font-bold text-white transition group-hover:text-[color:var(--gx-primary)]">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {guide.excerpt}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white">
                  <span>Read Agency Guide</span>
                  <ArrowRight className="transition-transform group-hover:translate-x-1" size={13} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-Niche Linking Grid */}
        <section className="flex flex-col gap-4 border-t border-white/10 pt-10">
          <h3 className="text-base font-semibold text-white/80">Explore Other Video Editing Specialties:</h3>
          <div className="flex flex-wrap gap-2">
            {otherNiches.map((item) => (
              <Link
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/70 transition hover:border-[color:var(--gx-primary-border)] hover:bg-[color:var(--gx-primary-soft)] hover:text-white"
                href={`/services/category/${item.slug}`}
                key={item.slug}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
