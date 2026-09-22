import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Search, Star, UsersRound } from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { AgencyDirectoryFeed } from "@/components/public/prompt-matcher";
import { listPublicAgencyListingsFromFile } from "@/lib/gigxomi/agency-listing-store";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Find a Video Editing Agency in India";
const description = "Search active Gigxomi video editing agencies by niche, location, office model, and hiring status. Compare offers, ratings, orders, editors, and verified offices.";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/agencies" },
  openGraph: { title, description, url: buildSiteUrl("/agencies"), type: "website" },
};

export default async function AgenciesPage() {
  const agencies = await listPublicAgencyListingsFromFile();
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: agencies.length,
    itemListElement: agencies.map((agency, index) => ({ "@type": "ListItem", position: index + 1, name: agency.publicName, url: buildSiteUrl(`/agency/${agency.slug}`) })),
  };

  return (
    <MarketingSiteShell>
      <main>
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} type="application/ld+json" />
        <section className="gx-directory-hero">
          <div className="gx-directory-copy">
            <p className="gx-eyebrow"><MapPin size={14} /> Gigxomi Agency Network</p>
            <h1>Find a Video Editing Agency in India.</h1>
            <p>Compare active, setup-complete agency partners through niche, location, offers, delivery proof, hiring status, ratings, editors, and verified-office signals.</p>
            <div className="gx-cta-row"><a className="gx-button gx-button-primary" href="#agency-directory">Explore Agencies <ArrowRight size={16} /></a><Link className="gx-button gx-button-secondary" href="/blog/video-editing-agency-management-software-system">Agency Blueprint</Link><Link className="gx-text-link" href="/pricing">View Pricing Plans</Link></div>
          </div>
          <div className="gx-directory-overview">
            <div className="gx-directory-search-preview"><Search size={18} /><span>Search by niche, city, or service…</span></div>
            <article><span>GS</span><div><small>FEATURED AGENCY</small><strong>Gigxomi Studio</strong><p>Creator growth · Short-form systems</p></div><em><BadgeCheck size={13} /> Verified</em></article>
            <section><span><b>{agencies.length}</b> published</span><span><b>{agencies.filter((agency) => agency.office.officeVerified).length}</b> verified offices</span><span><b>{agencies.reduce((total, agency) => total + agency.stats.activeEditors, 0)}</b> active editors</span></section>
            <div className="gx-directory-signal-row"><span><Star size={13} /> Visible ratings</span><span><UsersRound size={13} /> Hiring status</span><span><MapPin size={13} /> Live locations</span></div>
          </div>
        </section>
        <div className="gx-directory-feed" id="agency-directory"><AgencyDirectoryFeed agencies={agencies} /></div>
        <section className="gx-final-cta"><p className="gx-eyebrow">Build a business clients can discover</p><h2>Learn the business model, then choose your Gigxomi workspace plan.</h2><p>Set up your services, team, client workflow, and public operating proof in one connected system.</p><div className="gx-cta-row"><Link className="gx-button gx-button-primary" href="/blog/video-editing-agency-management-software-system">Read Agency Blueprint</Link><Link className="gx-button gx-button-secondary" href="/pricing">View Pricing Plans</Link></div></section>
      </main>
    </MarketingSiteShell>
  );
}
