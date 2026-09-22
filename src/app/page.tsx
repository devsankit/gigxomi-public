import type { Metadata } from "next";

import "@/app/gigxomi-homepage-v3.css";
import { GigxomiHomepage } from "@/components/public/gigxomi-homepage";
import { listPublicAgencyListingsFromFile } from "@/lib/gigxomi/agency-listing-store";
import { trackSalesReferralEvent } from "@/lib/gigxomi/sales-store";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Video Editing Agency Management Software & Team Building Tool | Gigxomi";
const description =
  "The system to build your video editing agency and manage other editors. Delegate cuts, review revisions, track deadlines, and talk to clients with Two-Lane masked chat. 0% commission.";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/"),
    type: "website",
    images: [{ url: buildSiteUrl("/og-cinematic-agency.png"), alt: "Gigxomi video editing agency management software & team building tool" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [buildSiteUrl("/og-cinematic-agency.png")],
  },
};

export default async function HomePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : undefined;
  const rawRef = params?.ref;
  const ref = Array.isArray(rawRef) ? rawRef[0] : rawRef;
  if (ref) {
    try {
      await trackSalesReferralEvent({
        code: ref,
        eventType: "PRICING_VIEW",
        path: "/",
        metadata: { target: "website" },
      });
    } catch {
      // non-blocking for referral tracking
    }
  }

  const agencies = await listPublicAgencyListingsFromFile();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Gigxomi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    description,
    url: buildSiteUrl("/"),
    audience: { "@type": "Audience", audienceType: "Video editing agency owners, managers and freelance editors building a team" },
    offers: { "@type": "Offer", name: "Gigxomi agency workspace", url: buildSiteUrl("/pricing") },
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <GigxomiHomepage agencies={agencies} />
    </>
  );
}
