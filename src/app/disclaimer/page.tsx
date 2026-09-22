import type { Metadata } from "next";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Disclaimer | ${companyKnowledgeBase.brandName}`;
const description = `Important limitations, responsibility boundaries, and general-use notes for the ${companyKnowledgeBase.brandName} website and platform.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/disclaimer",
  },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/disclaimer"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
};

export default function DisclaimerPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Disclaimer" title="Disclaimer">
      <div className="brief-grid">
        <article className="brief-card">
          <strong>General information</strong>
          <p className="muted-copy">Content across the site is provided for general information and product guidance. It should not be treated as legal, financial, or regulated professional advice.</p>
        </article>
        <article className="brief-card">
          <strong>Availability and outcomes</strong>
          <p className="muted-copy">Feature availability, service timelines, and workflow outcomes may vary by package, active operators, platform status, and the quality of client inputs.</p>
        </article>
        <article className="brief-card">
          <strong>Third-party services</strong>
          <p className="muted-copy">External platforms, embeds, integrations, and communication tools may introduce dependencies outside direct Gigxomi control.</p>
        </article>
      </div>
    </PublicInfoPage>
  );
}
