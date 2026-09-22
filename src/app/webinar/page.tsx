import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { GappWebinarLanding } from "@/components/public/gapp-webinar-landing";
import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { getActiveGappWebinar, getPublicGappLinks } from "@/lib/gigxomi/gapp-webinar-store";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "GAPP Webinar by Ankit Rathore | Build a Scalable Video Editing Agency";
const description = "Join Ankit Rathore, Founder of Post Production Work, for the Gigxomi Agency Partnership Program webinar for video editors who want systems, skilled editors, faster approvals, and agency growth infrastructure.";
const webinarSiteUrl = "https://ankit.gigxomi.com";

export const revalidate = 60;

function normalizeHostname(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
}

async function isDedicatedWebinarHost() {
  const requestHeaders = await headers();
  const hostname = normalizeHostname(requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"));
  return hostname === "ankit.gigxomi.com" || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(hostname));
}

export async function generateMetadata(): Promise<Metadata> {
  if (!(await isDedicatedWebinarHost())) {
    return { title: "Page not found", robots: { index: false, follow: false } };
  }

  return {
    title,
    description,
    alternates: { canonical: webinarSiteUrl },
    openGraph: { title, description, url: webinarSiteUrl, type: "website", images: [{ url: buildSiteUrl("/images/gapp/ankit-rathore-gapp-hero.png"), alt: "Ankit Rathore hosting the Gigxomi Agency Partnership Program webinar" }] },
    keywords: ["Gigxomi Agency Partnership Program", "GAPP webinar", "Ankit Rathore", "Post Production Work", "video editing agency", "freelancer video editor webinar", "agency growth ecosystem"],
    authors: [{ name: "Ankit Rathore" }],
    creator: "Gigxomi",
    publisher: "Gigxomi",
    twitter: { card: "summary_large_image", title, description, images: [buildSiteUrl("/images/gapp/ankit-rathore-gapp-hero.png")] },
  };
}

export default async function WebinarPage() {
  permanentRedirect("https://app.gigxomi.com/signup");

  const webinar = await getActiveGappWebinar();
  const links = getPublicGappLinks();
  if (!webinar) throw new Error("GAPP webinar is not configured.");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: webinar.title,
    description: webinar.description,
    startDate: webinar.scheduledAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: webinarSiteUrl },
    organizer: { "@type": "Organization", name: "Gigxomi", url: buildSiteUrl("/") },
    offers: { "@type": "Offer", price: String(Number(webinar.priceAmount)), priceCurrency: webinar.currency, availability: webinar.registrationEnabled ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${webinarSiteUrl}/#gapp-registration` },
  };

  return <MarketingSiteShell><script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} type="application/ld+json" /><GappWebinarLanding supportPhone={links.supportPhone} webinar={{ capacity: webinar.capacity, countdownEnabled: webinar.countdownEnabled, currency: webinar.currency, description: webinar.description, id: webinar.id, meetingLink: webinar.meetingLink, phonePeEnabled: webinar.phonePeEnabled, priceAmount: Number(webinar.priceAmount), priceMode: webinar.priceMode, registrationEnabled: webinar.registrationEnabled, registrationCount: webinar.registrationCount, scheduledAt: webinar.scheduledAt.toISOString(), thumbnailUrl: webinar.thumbnailUrl, title: webinar.title }} /></MarketingSiteShell>;
}
