import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

export function buildOrganizationStructuredData() {
  const organizationId = `${companyKnowledgeBase.siteUrl}#organization`;
  const logoUrl = buildSiteUrl(companyKnowledgeBase.iconPath);
  const marketingImageUrl = buildSiteUrl(companyKnowledgeBase.logoPath);

  return {
    "@type": "OnlineBusiness",
    "@id": organizationId,
    name: companyKnowledgeBase.brandName,
    legalName: companyKnowledgeBase.legalName,
    url: companyKnowledgeBase.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
    image: marketingImageUrl,
    description: companyKnowledgeBase.businessDescription,
    email: companyKnowledgeBase.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: companyKnowledgeBase.location.locality,
      addressRegion: companyKnowledgeBase.location.region,
      addressCountry: companyKnowledgeBase.location.country,
    },
    sameAs: [...companyKnowledgeBase.socialProfiles],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: companyKnowledgeBase.supportPhoneE164,
        url: companyKnowledgeBase.whatsappUrl,
        availableLanguage: ["en", "hi"],
      },
    ],
    knowsAbout: [...companyKnowledgeBase.keywords],
  };
}

export function buildHomepageStructuredData(description: string = companyKnowledgeBase.homeDescription) {
  const organization = buildOrganizationStructuredData();
  const organizationId = organization["@id"];
  const websiteId = `${companyKnowledgeBase.siteUrl}#website`;
  const logoUrl = buildSiteUrl(companyKnowledgeBase.iconPath);
  const marketingImageUrl = buildSiteUrl(companyKnowledgeBase.logoPath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: companyKnowledgeBase.brandName,
        alternateName: companyKnowledgeBase.homeTitle,
        url: companyKnowledgeBase.siteUrl,
        description,
        inLanguage: "en",
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${companyKnowledgeBase.siteUrl}#application`,
        name: companyKnowledgeBase.brandName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android",
        url: companyKnowledgeBase.siteUrl,
        image: marketingImageUrl,
        logo: logoUrl,
        description,
        publisher: {
          "@id": organizationId,
        },
        isPartOf: { "@id": websiteId },
        audience: companyKnowledgeBase.audiences.map((audience) => ({
          "@type": "Audience",
          audienceType: audience,
        })),
      },
    ],
  };
}
