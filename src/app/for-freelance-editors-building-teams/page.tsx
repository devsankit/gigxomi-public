import type { Metadata } from "next";
import { FreelancerCoHub } from "@/components/public/freelancer-cohub";
import { listPublicServicesFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Video Editor Discovery & Capacity Workspace | Gigxomi";
const description =
  "Browse available editing capacity, review verified work samples, and assign project work with full brief and asset context in Gigxomi.";
const ogImage = "/images/home-demo/hero-dashboard-preview.png";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/for-freelance-editors-building-teams" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/for-freelance-editors-building-teams"),
    type: "website",
    images: [{ url: ogImage, alt: "Gigxomi CoHub for Video Editors" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default async function FreelancersLandingPage() {
  let services = [];
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 400),
    );
    services = await Promise.race([listPublicServicesFromFile(), timeoutPromise]);
  } catch {
    const { listPublicServices } = await import("@/lib/gigxomi/dummy-platform-store");
    services = listPublicServices();
  }
  return <FreelancerCoHub initialServices={services} />;
}
