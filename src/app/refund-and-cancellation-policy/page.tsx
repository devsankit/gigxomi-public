import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Refund & Cancellation Policy | ${companyKnowledgeBase.brandName}`;
const description = "Read Gigxomi’s refund, cancellation, one-time provider switch, processing-fee, and resolution terms for custom creative services.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/refund-and-cancellation-policy" },
  openGraph: { title, description, url: buildSiteUrl("/refund-and-cancellation-policy"), type: "website", images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }] },
};

export default function RefundAndCancellationPolicyPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Legal • Last updated 01 January 2026" title="Refund & Cancellation Policy">
      <div className="public-policy-notice"><strong>Important acknowledgement</strong><p>Custom creative work cannot be returned like a physical product. Refund eligibility depends on whether work has commenced and on the circumstances below.</p></div>
      <div className="public-policy-sections">
        <section><span>01</span><div><h2>General refund policy</h2><p>Because video editing, graphic design, and content creation are custom digital services, Gigxomi does not offer a refund once a project has commenced. A project is considered commenced when the service provider accepts the order and begins creative work or receives the required raw files or assets.</p></div></section>
        <section><span>02</span><div><h2>One-time Provider Switch guarantee</h2><p>If creative alignment or service quality is not satisfactory, the client may request one service-provider replacement per order instead of a monetary refund. The issue must be reported to Gigxomi support before final files are approved. Gigxomi will then work to assign another suitable editor, designer, or creator.</p></div></section>
        <section><span>03</span><div><h2>Cancellation before work starts</h2><p>If Gigxomi approves a monetary refund because cancellation occurs before work begins, or because of another circumstance approved by administration, a flat 10% processing deduction applies. This covers non-refundable payment-gateway and platform-administration costs. The remaining eligible amount is returned to the original payment method, generally within 5–7 business days after approval.</p></div></section>
        <section><span>04</span><div><h2>Non-refundable scenarios</h2><ul><li>A change of mind after the work has started.</li><li>Subjective dislike where the provider followed the supplied brief; the one-time provider switch is the available path.</li><li>Delay caused by the client not supplying assets, decisions, access, or feedback in time.</li><li>Approval of final files or completion of the agreed deliverables.</li><li>Account action or dispute caused by prohibited off-platform payment or other material terms violations.</li></ul></div></section>
        <section><span>05</span><div><h2>How to request help</h2><p>Contact Gigxomi support with the order reference, a concise explanation, relevant conversation history, and the resolution requested. Gigxomi may review the brief, delivery, revision record, and platform activity before deciding the appropriate outcome.</p><p><Link href="/contact">Contact support</Link> before approving final delivery whenever possible.</p></div></section>
      </div>
      <p className="public-policy-footnote">This policy applies alongside the <Link href="/terms-and-conditions">Terms & Conditions</Link> and <Link href="/service-delivery-policy">Service Delivery Policy</Link>.</p>
    </PublicInfoPage>
  );
}
