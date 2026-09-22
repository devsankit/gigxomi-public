import type { Metadata } from "next";

import { FreelancerRegistrationLanding } from "@/components/public/freelancer-registration-landing";
import { listActiveRegistrationPackages } from "@/lib/gigxomi/public-growth-store";
import { buildRegistrationPackageHref, findPreferredRegistrationPackage } from "@/lib/gigxomi/registration-package-links";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";

const title = "Freelancer Registration | Get Projects from Gigxomi Agencies";
const description = "Register free as a video editor, submit original work and realistic pricing, and apply for projects from approved Gigxomi agencies.";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/freelancers" },
  openGraph: { title, description, url: buildSiteUrl("/freelancers"), type: "website" },
};

export default async function FreelancersPage() {
  const packages = await listActiveRegistrationPackages();
  const starterPackage = findPreferredRegistrationPackage(packages, "FREELANCER");
  return <FreelancerRegistrationLanding signupHref={buildRegistrationPackageHref(starterPackage, "FREELANCER")} />;
}
