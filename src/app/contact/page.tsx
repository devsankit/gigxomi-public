import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Contact | ${companyKnowledgeBase.brandName}`;
const description = `Get in touch with ${companyKnowledgeBase.brandName} for platform onboarding, service questions, agency partnerships, or support.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/contact"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
};

export default function ContactPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Contact" title="Contact Gigxomi">
      <div className="brief-grid">
        <article className="brief-card">
          <strong>WhatsApp</strong>
          <p className="muted-copy">
            For the fastest support, message us on WhatsApp at{" "}
            <Link href={companyKnowledgeBase.whatsappUrl} rel="noreferrer" target="_blank">
              {companyKnowledgeBase.supportPhone}
            </Link>
            .
          </p>
        </article>
        <article className="brief-card">
          <strong>Email</strong>
          <p className="muted-copy">For product, onboarding, or support questions, reach us at {companyKnowledgeBase.contactEmail}.</p>
        </article>
        <article className="brief-card">
          <strong>Who this is for</strong>
          <p className="muted-copy">Agencies, creators, and operators who want help choosing the right workflow, service category, or onboarding route can contact the team directly.</p>
        </article>
        <article className="brief-card">
          <strong>Fastest next step</strong>
          <p className="muted-copy">If you already know the kind of editing support you need, the live matcher and service discovery flow are still the fastest path to the right shortlist.</p>
        </article>
      </div>
    </PublicInfoPage>
  );
}
