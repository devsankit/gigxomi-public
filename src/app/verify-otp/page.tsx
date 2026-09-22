import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPublicAuthIntentById } from "@/lib/auth/public-auth-intent-store";
import {
  buildPublicAuthWhatsAppHref,
  getPublicAuthOtpChannelInfo,
  getPublicAuthOtpCommand,
} from "@/lib/auth/public-whatsapp";
import { getSessionContext, getSafeRedirectPath } from "@/lib/auth/session";
import { SUPER_ADMIN_LOGIN_ROUTE } from "@/lib/auth/super-admin-config";

export const metadata: Metadata = {
  title: "Verify OTP",
  description: "Secure OTP verification for Gigxomi workspace access.",
  robots: {
    index: false,
    follow: false,
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function maskIdentifier(value: string) {
  if (!value) return "Your Gigxomi account";
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    if (!local || !domain) return "Your Gigxomi account";
    const safeLocal = local.length <= 2 ? `${local[0] ?? ""}*` : `${local.slice(0, 2)}***`;
    return `${safeLocal}@${domain}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "Authorized account";
  return `******${digits.slice(-4)}`;
}

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSessionContext();
  const params = await searchParams;
  const challengeId = getValue(params.challengeId);
  const intentId = getValue(params.intentId);
  const redirectTo = getValue(params.redirectTo);
  const identifier = getValue(params.identifier);
  const phone = getValue(params.phone) || identifier;
  const message = getValue(params.message);
  const error = getValue(params.error);
  const otpHint = getValue(params.otpHint);
  const otpFallback = getValue(params.otpFallback);
  const loginScope = getValue(params.loginScope);
  const code = getValue(params.code);
  const showOtpHint = process.env.NODE_ENV !== "production" && otpHint;
  const isSuperAdminScope = loginScope === "super-admin";
  const intent = intentId ? await getPublicAuthIntentById(intentId) : null;
  const resolvedChallengeId = intent?.challengeId ?? challengeId;
  const resolvedRedirectTo = intent?.redirectTo ?? redirectTo;
  const resolvedIdentifier = intent?.phone ?? identifier ?? phone;
  const hasIssuedOtp = Boolean(resolvedChallengeId) || Boolean(code);
  const canEnterOtp = true;
  const isSignupIntent = intent?.flow === "SIGNUP";
  const otpChannel = await getPublicAuthOtpChannelInfo();
  const otpCommand = getPublicAuthOtpCommand();
  const whatsappHref = await buildPublicAuthWhatsAppHref();
  const needsWhatsAppFallback = !isSuperAdminScope && otpFallback === "whatsapp-command";
  const canUseWhatsAppCommand = !isSuperAdminScope && Boolean(whatsappHref);
  const canRequestOtp = !isSuperAdminScope && Boolean(intentId);
  const loginReturnHref = isSuperAdminScope ? SUPER_ADMIN_LOGIN_ROUTE : isSignupIntent ? "/signup" : "/login";
  const loginReturnLabel = isSignupIntent ? "Back to signup" : "Back to login";
  const heroTitle = isSuperAdminScope
    ? "Enter the owner OTP to unlock the super-admin console."
    : hasIssuedOtp
      ? "Enter the WhatsApp code to finish your secure sign in."
      : needsWhatsAppFallback
        ? "Open WhatsApp, send Get OTP, then enter the code here."
      : "Request a fresh OTP and enter it here.";
  const heroBody = isSuperAdminScope
    ? "Use the latest six-digit code sent to the authorized owner WhatsApp number. We will open the super-admin workspace immediately after verification."
    : hasIssuedOtp
      ? isSignupIntent
        ? "Use the six-digit code from your WhatsApp chat to finish onboarding and open the right workspace immediately."
        : "Use the six-digit code from your WhatsApp chat to open the right Gigxomi workspace immediately."
      : needsWhatsAppFallback
        ? otpChannel.isConfigured
          ? `We could not send the OTP directly. Open the official Gigxomi WhatsApp line ${otpChannel.label}, send ${otpCommand} from this same number, and enter the code here once it arrives.`
          : "WhatsApp OTP fallback is not configured yet. Ask super admin to complete WhatsApp setup first."
      : otpChannel.isConfigured
        ? `Tap the button below and we will send a fresh six-digit OTP to your WhatsApp number.`
        : "WhatsApp OTP delivery is not configured yet. Ask super admin to complete WhatsApp setup first.";

  if (session.role !== "GUEST") {
    redirect(getSafeRedirectPath(resolvedRedirectTo, session.role));
  }

  return (
    <main className="app-shell public-theme-root public-auth-page-shell public-auth-otp-screen">
      <div className="public-auth-otp-topbar">
        <span className="section-label">Secure account verification</span>
        <Link className="topbar-link" href={loginReturnHref}>
          {loginReturnLabel}
        </Link>
      </div>

      <section className="public-auth-otp-layout">
        <section className="public-auth-otp-hero">
          <div className="public-auth-otp-copy">
            <p className="section-label">{isSuperAdminScope ? "Verify super-admin OTP" : "Verify OTP"}</p>
            <h1 className="section-heading">{heroTitle}</h1>
            <p className="muted-copy">{heroBody}</p>
          </div>

          <div className="public-auth-otp-steps">
            <article className="public-auth-otp-step">
              <span className="public-auth-otp-step-number">1</span>
              <strong>Confirm your number</strong>
              <p>
                {isSuperAdminScope
                  ? "Use the authorized owner WhatsApp account for this verification."
                  : "Use the same WhatsApp number linked to this Gigxomi account."}
              </p>
            </article>
            <article className="public-auth-otp-step">
              <span className="public-auth-otp-step-number">2</span>
              <strong>
                {isSuperAdminScope
                  ? "Find the latest OTP"
                  : hasIssuedOtp
                    ? "Check WhatsApp for the OTP"
                    : needsWhatsAppFallback
                      ? `Open WhatsApp and send ${otpCommand}`
                      : "Request the OTP"}
              </strong>
              <p>
                {isSuperAdminScope
                  ? "Look for the latest six-digit owner OTP in that WhatsApp chat."
                  : otpChannel.isConfigured
                    ? hasIssuedOtp
                      ? "We sent the latest six-digit code to your WhatsApp number."
                      : needsWhatsAppFallback
                        ? `Send ${otpCommand} to ${otpChannel.label} from this same number, then wait for the reply.`
                      : "Use the button below to send a fresh six-digit code to your WhatsApp number."
                    : "Ask super admin to finish WhatsApp setup before requesting a code."}
              </p>
            </article>
            <article className="public-auth-otp-step">
              <span className="public-auth-otp-step-number">3</span>
              <strong>Enter the code here</strong>
              <p>
                {hasIssuedOtp
                  ? "Paste the six-digit OTP below and continue straight into your workspace."
                  : needsWhatsAppFallback
                    ? "After the OTP arrives in WhatsApp, enter it below to continue."
                  : "Request the code first, then paste it below to continue."}
              </p>
            </article>
          </div>
        </section>

        <section className="public-auth-card public-auth-otp-card">
          <span className="meta-pill">Verification target</span>
          <strong className="public-auth-otp-target">{maskIdentifier(resolvedIdentifier)}</strong>
          <p className="muted-copy">
            {isSuperAdminScope
              ? "We will unlock the super-admin workspace as soon as the owner OTP is verified."
              : hasIssuedOtp
                ? "Enter the latest six-digit OTP from your WhatsApp chat to continue securely."
                : needsWhatsAppFallback
                  ? "Use WhatsApp to trigger the OTP reply from this same number, then enter the code here to continue securely."
                : "Request a fresh OTP for this WhatsApp number, then enter it here to continue securely."}
          </p>

          {message ? <p className="public-auth-message">{message}</p> : null}
          {error ? <p className="public-auth-error">{error}</p> : null}
          {showOtpHint ? (
            <div className="public-auth-debug-note">
              <span className="meta-pill">Local preview code</span>
              <p>
                Use <strong>{otpHint}</strong> in local or staging testing.
              </p>
            </div>
          ) : null}

          {canUseWhatsAppCommand && whatsappHref ? (
            <a className="freelancer-primary-button public-auth-otp-link public-auth-otp-whatsapp-link" href={whatsappHref} rel="noreferrer" target="_blank">
              Open WhatsApp and Get OTP
            </a>
          ) : null}

          {canRequestOtp ? (
            <form action="/api/auth/request-otp" className="public-auth-otp-request-form" method="post">
              <input name="intentId" type="hidden" value={intentId} />
              <input name="redirectTo" type="hidden" value={resolvedRedirectTo} />
              <input name="loginScope" type="hidden" value={loginScope} />
              <button className="freelancer-secondary-button public-auth-otp-link" disabled={!otpChannel.isConfigured} type="submit">
                {needsWhatsAppFallback
                  ? "Try automatic send again"
                  : hasIssuedOtp
                    ? "Send OTP automatically"
                    : "Send OTP automatically"}
              </button>
            </form>
          ) : null}

          <form action="/api/auth/verify-otp" className="freelancer-form-grid public-auth-otp-form" method="post">
            <input name="challengeId" type="hidden" value={resolvedChallengeId} />
            <input name="intentId" type="hidden" value={intentId} />
            <input name="redirectTo" type="hidden" value={resolvedRedirectTo} />
            <input name="loginScope" type="hidden" value={loginScope} />
            <input name="phone" type="hidden" value={resolvedIdentifier} />
            <label className="freelancer-field freelancer-field-full public-auth-otp-field">
              <span>OTP code</span>
              <input
                autoComplete="one-time-code"
                autoFocus={canEnterOtp}
                defaultValue={code}
                disabled={!canEnterOtp}
                inputMode="numeric"
                maxLength={6}
                name="code"
                pattern="[0-9]{6}"
                placeholder="111111"
                required={hasIssuedOtp}
              />
            </label>
            <button className="freelancer-primary-button public-auth-otp-submit" disabled={!canEnterOtp} type="submit">
              {code && code.length === 6 && !error ? "Verifying..." : "Verify and continue"}
            </button>
          </form>
          {code && code.length === 6 && !error ? (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    function autoSubmit() {
                      var form = document.querySelector('.public-auth-otp-form');
                      if (form && !form.dataset.autoSubmitted) {
                        form.dataset.autoSubmitted = 'true';
                        form.submit();
                      }
                    }
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', autoSubmit);
                    } else {
                      autoSubmit();
                    }
                  })();
                `,
              }}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}
