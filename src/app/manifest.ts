import type { MetadataRoute } from "next";

import { companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: companyKnowledgeBase.homeTitle,
    short_name: companyKnowledgeBase.brandName,
    description: companyKnowledgeBase.homeDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#D7FF2F",
    icons: [
      {
        src: companyKnowledgeBase.iconPath,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: companyKnowledgeBase.iconPath,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
