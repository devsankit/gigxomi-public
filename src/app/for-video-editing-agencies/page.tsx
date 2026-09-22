import type { Metadata } from "next";
import { GigxomiProductHub } from "@/components/public/gigxomi-product-hub";
import { productPages } from "@/lib/seo/gigxomi-product-pages";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Agency Management Workspace for Video Teams | Gigxomi";
const description = productPages.agency.description;
const ogImage = "/images/home-demo/hero-dashboard-preview.png";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/for-video-editing-agencies" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/for-video-editing-agencies"),
    type: "website",
    images: [{ url: ogImage, alt: "Gigxomi Video Editing Agency Software" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function AgenciesLandingPage() {
  return <GigxomiProductHub page={productPages.agency} />;
}
