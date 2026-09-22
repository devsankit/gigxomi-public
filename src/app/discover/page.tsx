import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { PromptMatcher } from "@/components/public/prompt-matcher";
import { getSessionContext } from "@/lib/auth/session";
import { listPublicAgencyListingsFromFile } from "@/lib/gigxomi/agency-listing-store";
import { getPublicCatalogStatsFromFile, listPublicServicesFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { listActiveRegistrationPackages } from "@/lib/gigxomi/public-growth-store";
import { normalizePublicPresetParam, normalizePublicSurfaceParam } from "@/lib/gigxomi/public-shell-nav";
import { loadMarketplaceDataFromWordPress } from "@/lib/gigxomi/wordpress-marketplace";
import { blogPosts as editorialPosts } from "@/lib/seo/blog-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Video Editors, Services & Agencies",
  description: "Search Gigxomi video editing services, proven freelance editors, and verified agency delivery partners.",
  alternates: { canonical: "/discover" },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function shouldLoadWordPressMarketplace() {
  return process.env.GIGXOMI_WORDPRESS_MARKETPLACE_ENABLED !== "0";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (getValue(params.surface) === "agencies") {
    permanentRedirect("/agencies");
  }
  const initialPreset = normalizePublicPresetParam(getValue(params.preset));
  const initialSurface = normalizePublicSurfaceParam(getValue(params.surface));
  let catalogStats;
  let services;
  const [packages, agencies, session] = await Promise.all([listActiveRegistrationPackages(), listPublicAgencyListingsFromFile(), getSessionContext()]);
  const homepageBlogPosts = editorialPosts.map((post) => ({
    excerpt: post.excerpt,
    id: post.id,
    title: post.title,
    url: `/blog/${post.slug}`,
  }));

  if (shouldLoadWordPressMarketplace()) {
    try {
      ({ catalogStats, services } = await loadMarketplaceDataFromWordPress());
    } catch {
      [catalogStats, services] = await Promise.all([getPublicCatalogStatsFromFile(), listPublicServicesFromFile()]);
    }
  } else {
    [catalogStats, services] = await Promise.all([getPublicCatalogStatsFromFile(), listPublicServicesFromFile()]);
  }

  return (
    <main className="app-shell public-theme-root">
      <PromptMatcher
        agencies={agencies}
        blogPosts={homepageBlogPosts}
        catalogStats={catalogStats}
        initialPreset={initialPreset}
        initialSurface={initialSurface}
        packages={packages}
        session={session}
        services={services}
      />
    </main>
  );
}
