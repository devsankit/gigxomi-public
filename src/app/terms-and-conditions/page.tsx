import type { Metadata } from "next";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Terms & Conditions | ${companyKnowledgeBase.brandName}`;
const description = `Review the core terms that govern use of the ${companyKnowledgeBase.brandName} platform, marketplace, and related business workflows.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/terms-and-conditions"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
};

export default function TermsAndConditionsPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Terms" title="Terms & Conditions">
      <div className="brief-grid">
        <article className="brief-card">
          <strong>Platform use</strong>
          <p className="muted-copy">Users must provide accurate information, use the product lawfully, and avoid misuse of the marketplace, onboarding, messaging, or collaboration systems.</p>
        </article>
        <article className="brief-card">
          <strong>Service delivery</strong>
          <p className="muted-copy">Project scopes, timelines, revisions, and final deliverables depend on the active service terms, workflow approvals, and communication maintained between both parties.</p>
        </article>
        <article className="brief-card">
          <strong>Account responsibility</strong>
          <p className="muted-copy">Each account holder is responsible for access security, approved content submissions, and activity performed through their role or workspace permissions.</p>
        </article>
      </div>
    </PublicInfoPage>
  );
}
