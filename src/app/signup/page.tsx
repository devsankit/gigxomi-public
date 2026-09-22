import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingSiteFooter } from "@/components/public/marketing-site-footer";
import { SignupFlow } from "@/components/public/auth/signup-flow";
import { getSessionContext, getSafeRedirectPath } from "@/lib/auth/session";
import "@/app/gigxomi-onboarding.css";

export const metadata: Metadata = {
  title: "Set up Gigxomi",
  description: "Create a Gigxomi account for video editing agency operations or freelance editor workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSessionContext();
  const params = await searchParams;
  const redirectTo = getValue(params.redirectTo);
  const cookieStore = await cookies();
  const isOnboardingActive = cookieStore.get("gx_onboarding")?.value === "1";

  if (session.role !== "GUEST" && !isOnboardingActive) {
    redirect(getSafeRedirectPath(redirectTo, session.role));
  }

  return (
    <div className="gx-onboarding-root">
      <main className="gx-onboarding-container">
        <SignupFlow />
      </main>
      <MarketingSiteFooter hideCta={true} />
    </div>
  );
}
