import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GigxomiProductHub } from "@/components/public/gigxomi-product-hub";
import { productPages } from "@/lib/seo/gigxomi-product-pages";
const featureSlugs = ["unified-inbox", "editor-management", "client-collaboration", "project-tracking", "work-hub"] as const;
export function generateStaticParams() { return featureSlugs.map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = productPages[slug]; return page ? { title: `${page.title} | Gigxomi`, description: page.description, alternates: { canonical: `/features/${slug}` } } : {}; }
export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = productPages[slug]; if (!page || !featureSlugs.includes(slug as typeof featureSlugs[number])) notFound(); return <GigxomiProductHub page={page} />; }
