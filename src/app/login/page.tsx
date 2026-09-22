import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { MarketingSiteFooter } from "@/components/public/marketing-site-footer";
import { PublicAuthPanel } from "@/components/public/public-auth-panel";
import "@/app/gigxomi-onboarding.css";
import "@/app/public-theme-v3.css";
import { getSessionContext, getSafeRedirectPath } from "@/lib/auth/session";
import { listActiveRegistrationPackages } from "@/lib/gigxomi/public-growth-store";

export const metadata: Metadata = {
  title: "Login",
  description: "Secure Gigxomi login for agencies, creators, editors, and workspace team members.",
  robots: {
    index: false,
    follow: false,
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSessionContext();
  const params = await searchParams;
  const redirectTo = getValue(params.redirectTo);

  if (session.role !== "GUEST") {
    redirect(getSafeRedirectPath(redirectTo, session.role));
  }

  const [packages, error, message, identifier] = await Promise.all([
    listActiveRegistrationPackages(),
    getValue(params.error),
    getValue(params.message),
    getValue(params.identifier),
  ]);

  return (
    <div className="gx-auth-standalone-page public-theme-root">
      <div className="gx-auth-standalone-stack">
        <div className="gx-auth-standalone-header">
          <p className="gx-auth-eyebrow">
            <ShieldCheck size={14} strokeWidth={2.2} /> SECURE WORKSPACE LOGIN
          </p>
          <h1 className="gx-auth-heading">Sign in to Gigxomi</h1>
          <p className="gx-auth-subheading">
            Sign in with Google, WhatsApp OTP, or workspace password.
          </p>
        </div>

        <div className="gx-auth-standalone-card">
          <PublicAuthPanel
            allowInternalSupport
            defaultMode="login"
            error={error}
            identifier={identifier}
            message={message}
            packages={packages}
            redirectTo={redirectTo}
          />
        </div>

        <div className="gx-auth-standalone-nav">
          <p>
            Need an agency workspace account?{" "}
            <Link href="/signup" className="gx-auth-highlight-link">
              Start agency trial &rarr;
            </Link>
          </p>
          <p className="gx-auth-sublink">
            Agency team manager?{" "}
            <Link href="/manager-login">
              Manager sign in
            </Link>
          </p>
        </div>
      </div>
      <MarketingSiteFooter hideCta={true} />
    </div>
  );
}
