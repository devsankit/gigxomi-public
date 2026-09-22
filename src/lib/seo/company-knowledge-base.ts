export const companyKnowledgeBase = {
  brandName: "Gigxomi",
  legalName: "Gigxomi",
  siteUrl: "https://www.gigxomi.com",
  blogUrl: "https://blog.gigxomi.com",
  aboutPath: "/about",
  homeTitle: "Workspace for Video Editors Managing Other Editors",
  tagline: "Video Editing Agency Management Software",
  homeDescription:
    "Gigxomi is video editing agency management software for editors managing other editors. Keep client conversations, editor coordination, and project tracking in one workspace.",
  businessDescription:
    "Gigxomi is a video editing agency workspace for lead editors and post-production managers coordinating freelance editors and recurring client work.",
  logoPath: "/gigxomi-logo.png",
  iconPath: "/icon.png",
  iconSvgPath: "/icon.svg",
  wordmarkPath: "/gigxomi-wordmark.svg",
  contactEmail: "studio@gigxomi.com",
  supportPhone: "+91 99818 07309",
  supportPhoneE164: "+919981807309",
  whatsappUrl: "https://wa.me/919981807309",
  salesPhone: "+91 99933 28124",
  salesPhoneE164: "+919993328124",
  salesWhatsappUrl: "https://wa.me/919993328124",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.gigxomi.app",
  location: {
    locality: "Dewas",
    region: "Madhya Pradesh",
    country: "IN",
  },
  socialProfiles: [
    "https://www.instagram.com/gigxomi/",
    "https://www.linkedin.com/company/gigxomi/",
    "https://www.facebook.com/gigxomi/",
  ],
  keywords: [
    "software to manage video editors",
    "video editors managing other editors",
    "how to manage video editors",
    "tool to manage freelance video editors",
    "lead video editor project management",
    "video editing team management software",
    "delegate video editing without client poaching",
    "video editing agency workspace",
    "manage video editing gigs",
    "WhatsApp Business inbox for video editors",
    "Instagram Business inbox for editors",
    "video editing project management",
  ],
  audiences: [
    "Video editors managing other editors",
    "Lead video editors delegating edits",
    "Post-production managers",
    "Video editing agency owners",
  ],
  coreServices: [
    "Short-form video editing",
    "Long-form video editing",
    "UGC and social content editing",
    "Post-production support for agencies",
  ],
  differentiators: [
    "Manage WhatsApp Business and Instagram Business enquiries in one connected inbox.",
    "Coordinate clients, managers, editors, tasks, review, delivery, accounting, and payouts.",
    "Move from solo gigs to a structured video editing agency workspace.",
  ],
  knowledgeBaseSections: [
    {
      title: "Company profile",
      items: [
        "Gigxomi is positioned as video editing agency management software and a team building tool for editors managing other editors.",
        "The platform supports solo editing businesses, post-production teams, and scaling video editing agencies.",
        "The core promise is managing video editing gigs from enquiry through client delivery and payout.",
      ],
    },
    {
      title: "Ideal customers",
      items: [
        "Employed editors who want to start side gigs and build an independent business.",
        "Social-media editors who receive enquiries from followers and manage projects alone.",
        "Solo editors and agencies that need structured team delivery and client communication.",
      ],
    },
    {
      title: "Primary SEO topics",
      items: [
        "Tools to manage video editing gigs and clients.",
        "Video editing agency software and business systems.",
        "Freelancer registration and agency project opportunities.",
      ],
    },
  ],
} as const;

export function buildSiteUrl(path = "/") {
  return new URL(path, companyKnowledgeBase.siteUrl).toString();
}
