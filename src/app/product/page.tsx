import type { Metadata } from "next";
import { GigxomiProductHub } from "@/components/public/gigxomi-product-hub";
import { productPages } from "@/lib/seo/gigxomi-product-pages";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Video Editing Agency Platform Features & Workflow | Gigxomi";
const description =
  "Gigxomi connects client enquiries, editor capacity, controlled collaboration and project tracking so video agency owners can deliver work smoothly.";
const ogImage = "/images/home-demo/hero-dashboard-preview.png";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/product" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/product"),
    type: "website",
    images: [{ url: ogImage, alt: "Gigxomi Video Editing Agency Management Software" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function ProductPage() {
  return <GigxomiProductHub page={productPages.product} />;
}
