type PublicServiceSeo = { title: string; seoTitle?: string; ownerName?: string };

export function publicServiceTitle(service: PublicServiceSeo) {
  const title = (service.seoTitle || service.title).replace(/\s+/g, " ").trim();
  const owner = service.ownerName?.replace(/\s+/g, " ").trim();
  // Retain a deliberately authored SEO title. Imported defaults need their visible author.
  if (!owner || (service.seoTitle && service.seoTitle.trim() !== service.title.trim()) || title.toLowerCase().includes(owner.toLowerCase())) return title;
  return `${title} by ${owner}`;
}
