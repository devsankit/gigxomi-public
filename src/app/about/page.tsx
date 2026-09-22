import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import { buildOrganizationStructuredData } from "@/lib/seo/homepage-structured-data";

const title = `About ${companyKnowledgeBase.brandName} | Business OS for Video Editors`;
const description = `${companyKnowledgeBase.brandName} is a connected business operating system for video editors, solo editing businesses, and video editing agencies.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: companyKnowledgeBase.aboutPath },
  openGraph: {
    title,
    description,
    url: buildSiteUrl(companyKnowledgeBase.aboutPath),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
  twitter: { card: "summary_large_image", title, description, images: [companyKnowledgeBase.logoPath] },
};

export default function AboutPage() {
  const organization = buildOrganizationStructuredData();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "AboutPage",
        "@id": `${buildSiteUrl(companyKnowledgeBase.aboutPath)}#page`,
        name: title,
        description,
        url: buildSiteUrl(companyKnowledgeBase.aboutPath),
        mainEntity: { "@id": organization["@id"] },
        isPartOf: { "@id": `${companyKnowledgeBase.siteUrl}#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: buildSiteUrl("/") },
          { "@type": "ListItem", position: 2, name: `About ${companyKnowledgeBase.brandName}`, item: buildSiteUrl(companyKnowledgeBase.aboutPath) },
        ],
      },
    ],
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <PublicInfoPage description={description} eyebrow="Company profile" title={`About ${companyKnowledgeBase.brandName}`}>
        <div className="brief-grid">
          <article className="brief-card">
            <strong>What Gigxomi is</strong>
            <p className="muted-copy">{companyKnowledgeBase.businessDescription}</p>
          </article>
          <article className="brief-card">
            <strong>Who Gigxomi serves</strong>
            <p className="muted-copy">{companyKnowledgeBase.audiences.join(", ")}.</p>
          </article>
          <article className="brief-card">
            <strong>Connected workflow</strong>
            <p className="muted-copy">{companyKnowledgeBase.differentiators.join(" ")}</p>
          </article>
          <article className="brief-card">
            <strong>Company location</strong>
            <p className="muted-copy">{companyKnowledgeBase.location.locality}, {companyKnowledgeBase.location.region}, India.</p>
          </article>
          <article className="brief-card">
            <strong>Official resources</strong>
            <p className="muted-copy">
              Read the <Link href="/knowledge-base">Gigxomi Knowledge Base</Link>, visit the <Link href="/blog">video editing agency blog</Link>, or download the <a href={companyKnowledgeBase.playStoreUrl} rel="noreferrer" target="_blank">official Android app</a>.
            </p>
          </article>
          <article className="brief-card">
            <strong>Contact Gigxomi</strong>
            <p className="muted-copy">
              Email <a href={`mailto:${companyKnowledgeBase.contactEmail}`}>{companyKnowledgeBase.contactEmail}</a> or use <a href={companyKnowledgeBase.whatsappUrl} rel="noreferrer" target="_blank">WhatsApp support</a>.
            </p>
          </article>
        </div>
      </PublicInfoPage>
    </>
  );
}
