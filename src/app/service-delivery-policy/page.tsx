import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Service Delivery Policy | ${companyKnowledgeBase.brandName}`;
const description = "Understand how Gigxomi digital creative services begin, move through review and revision, and reach final delivery.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/service-delivery-policy" },
  openGraph: { title, description, url: buildSiteUrl("/service-delivery-policy"), type: "website", images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }] },
};

export default function ServiceDeliveryPolicyPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Legal • Digital services" title="Service Delivery Policy">
      <div className="public-policy-sections">
        <section><span>01</span><div><h2>Digital delivery only</h2><p>Gigxomi facilitates custom digital creative services. No physical product is shipped. Deliverables may be provided through the Gigxomi workspace, an approved cloud link, or another delivery channel recorded in the project conversation.</p></div></section>
        <section><span>02</span><div><h2>When the delivery clock starts</h2><p>The stated turnaround begins after the provider accepts the order and receives the complete brief, usable source files, access credentials where required, brand instructions, and any reference material needed to begin.</p></div></section>
        <section><span>03</span><div><h2>Drafts, review, and revisions</h2><p>Drafts are reviewed against the agreed scope. Included revision rounds depend on the selected service or written project terms. A revision means a reasonable change within the original brief; a new direction, added deliverable, or materially changed source may require a revised quote and timeline.</p></div></section>
        <section><span>04</span><div><h2>Client responsibilities</h2><p>Clients must provide lawful assets, timely feedback, and clear approvals. Delays caused by missing files, access, decisions, or feedback extend the delivery timeline and do not by themselves establish refund eligibility.</p></div></section>
        <section><span>05</span><div><h2>Final approval</h2><p>Final files are released or marked complete after the agreed review flow. Intellectual-property transfer, usage permissions, confidentiality requirements, and portfolio restrictions are governed by the project terms and Gigxomi Terms & Conditions.</p></div></section>
        <section><span>06</span><div><h2>Delivery concerns</h2><p>Raise a delivery concern before final approval with the order reference and supporting context. Gigxomi may review the brief, timestamps, files, revision history, and communication record. See the <Link href="/refund-and-cancellation-policy">Refund & Cancellation Policy</Link> for available resolution paths.</p></div></section>
      </div>
    </PublicInfoPage>
  );
}
