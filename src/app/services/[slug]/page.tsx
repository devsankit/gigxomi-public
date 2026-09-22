import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { ServiceCtaButton, ServiceDetailView } from "@/components/services/service-ui";
import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";
import { getServiceBySlugFromFile, listPublicServicesFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { getMarketplaceServiceBySlugFromWordPress, type MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import { publicServiceTitle } from "@/lib/seo/service-metadata";

export const dynamic = "force-dynamic";

type ResolvedPublicService = {
  service: DummyService | MarketplaceSurfaceService;
  signals: MarketplaceSurfaceService | null;
};

async function getPublicServiceBySlug(slug: string): Promise<ResolvedPublicService | null> {
  try {
    const wordpressService = await getMarketplaceServiceBySlugFromWordPress(slug);
    if (wordpressService) {
      return {
        service: wordpressService,
        signals: wordpressService,
      };
    }
  } catch {
    // Fall through to the local store when the WordPress source is unavailable.
  }

  const service = await getServiceBySlugFromFile(slug);
  if (!service) {
    return null;
  }

  return {
    service,
    signals: (await listPublicServicesFromFile()).find((item) => item.slug === slug) ?? null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getPublicServiceBySlug(slug);

  if (!resolved) {
    return {
      title: "Service not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { service, signals } = resolved;
  const title = publicServiceTitle(service);
  const description = service.seoDescription || service.description || companyKnowledgeBase.homeDescription;
  const image = signals?.coverImageUrl || companyKnowledgeBase.logoPath;

  return {
    title,
    description,
    keywords: service.seoKeywords,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/services/${slug}`,
      type: "website",
      images: [
        {
          url: image,
          alt: service.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await getPublicServiceBySlug(slug);

  if (!resolved) {
    permanentRedirect("/discover");
  }

  const { service, signals } = resolved;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.seoDescription || service.summary || service.description,
    provider: {
      "@type": "Person",
      name: service.ownerName,
    },
    brand: {
      "@type": "Brand",
      name: companyKnowledgeBase.brandName,
    },
    serviceType: service.category,
    audience: {
      "@type": "Audience",
      audienceType: service.targetAudience || "Creators and brands",
    },
    areaServed: "Worldwide",
    url: buildSiteUrl(`/services/${service.slug}`),
    offers: {
      "@type": "Offer",
      priceCurrency: service.currency,
      price: service.basePrice,
      availability: "https://schema.org/InStock",
      url: buildSiteUrl(`/services/${service.slug}`),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Discover",
        item: buildSiteUrl("/discover"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: service.title,
        item: buildSiteUrl(`/services/${service.slug}`),
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="service-page-shell">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
        type="application/ld+json"
      />
      {service.faq.length ? (
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
          type="application/ld+json"
        />
      ) : null}
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
        type="application/ld+json"
      />
      <ServiceDetailView
        actions={<ServiceCtaButton href={buildServiceInquiryHref(service)} label="Message on WhatsApp" />}
        activeAgencySummary={signals?.activeAgencySummary}
        mode="public"
        service={service}
        trustBand={signals?.trustBand}
        turnaroundLabel={signals?.turnaroundLabel}
        workloadBand={signals?.workloadBand}
      />
    </main>
  );
}
