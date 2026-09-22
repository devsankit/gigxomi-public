"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Building2, Check, Clock, Lock, Mail, MessageCircleMore, ShieldCheck, Sparkles, UserRound, Zap } from "lucide-react";

import { normalizePublicDisplayName, validatePublicDisplayName, validatePublicNamePart } from "@/lib/auth/public-display-name";
import { pushGrowthEvent } from "@/lib/gigxomi/public-growth-client";
import type { RegistrationPackage } from "@/lib/gigxomi/public-growth-types";
import { AppSelect } from "@/components/ui/app-select";

type AuthMode = "login" | "signup";

type PublicAuthPanelProps = {
  defaultMode?: AuthMode;
  redirectTo?: string;
  packages: RegistrationPackage[];
  packageId?: string;
  error?: string;
  message?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  identifier?: string;
  salesReferralCode?: string;
  packageConflictKind?: "same-package" | "package-change" | "";
  conflictExistingPackageName?: string;
  conflictExistingPackageAudience?: string;
  conflictRequestedPackageId?: string;
  conflictRequestedPackageName?: string;
  conflictRequestedPackageAudience?: string;
  allowInternalSupport?: boolean;
  onModeChange?: (mode: AuthMode) => void;
};

const COUNTRY_OPTIONS = [
  { code: "IN", label: "India", dialCode: "+91", maxDigits: 10, group: "Popular countries" },
  { code: "AE", label: "UAE", dialCode: "+971", maxDigits: 9, group: "Popular countries" },
  { code: "US", label: "United States", dialCode: "+1", maxDigits: 10, group: "Popular countries" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", maxDigits: 10, group: "Popular countries" },
  { code: "CA", label: "Canada", dialCode: "+1", maxDigits: 10, group: "Popular countries" },
  { code: "AU", label: "Australia", dialCode: "+61", maxDigits: 9, group: "Popular countries" },
  { code: "SG", label: "Singapore", dialCode: "+65", maxDigits: 8, group: "Popular countries" },
  { code: "SA", label: "Saudi Arabia", dialCode: "+966", maxDigits: 9, group: "Popular countries" },
  { code: "QA", label: "Qatar", dialCode: "+974", maxDigits: 8, group: "Popular countries" },
  { code: "OM", label: "Oman", dialCode: "+968", maxDigits: 8, group: "Popular countries" },
  { code: "KW", label: "Kuwait", dialCode: "+965", maxDigits: 8, group: "Popular countries" },
  { code: "NZ", label: "New Zealand", dialCode: "+64", maxDigits: 9, group: "Popular countries" },
  { code: "DE", label: "Germany", dialCode: "+49", maxDigits: 11, group: "More countries" },
  { code: "FR", label: "France", dialCode: "+33", maxDigits: 9, group: "More countries" },
  { code: "NL", label: "Netherlands", dialCode: "+31", maxDigits: 9, group: "More countries" },
  { code: "MY", label: "Malaysia", dialCode: "+60", maxDigits: 9, group: "More countries" },
  { code: "ID", label: "Indonesia", dialCode: "+62", maxDigits: 11, group: "More countries" },
  { code: "PH", label: "Philippines", dialCode: "+63", maxDigits: 10, group: "More countries" },
  { code: "PK", label: "Pakistan", dialCode: "+92", maxDigits: 10, group: "More countries" },
  { code: "BD", label: "Bangladesh", dialCode: "+880", maxDigits: 10, group: "More countries" },
  { code: "NP", label: "Nepal", dialCode: "+977", maxDigits: 10, group: "More countries" },
  { code: "LK", label: "Sri Lanka", dialCode: "+94", maxDigits: 9, group: "More countries" },
  { code: "ZA", label: "South Africa", dialCode: "+27", maxDigits: 9, group: "More countries" },
  { code: "NG", label: "Nigeria", dialCode: "+234", maxDigits: 10, group: "More countries" },
  { code: "KE", label: "Kenya", dialCode: "+254", maxDigits: 9, group: "More countries" },
] as const;

type CountryCode = (typeof COUNTRY_OPTIONS)[number]["code"];

function getFlagFromCode(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}

function CountrySelector({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CountryCode;
  onChange: (value: CountryCode) => void;
}) {
  const selectedCountry = COUNTRY_OPTIONS.find((country) => country.code === value) ?? COUNTRY_OPTIONS[0];

  return (
    <AppSelect
      ariaLabel="Select country"
      buttonClassName="public-auth-country-trigger"
      className="public-auth-country-select"
      id={id}
      menuWidth={264}
      onChange={(nextValue) => onChange(nextValue as CountryCode)}
      renderSelectedValue={() => (
        <span className="public-auth-country-selected">
          <span aria-hidden="true" className="public-auth-country-flag">
            {getFlagFromCode(selectedCountry.code)}
          </span>
          <span className="public-auth-country-code">{selectedCountry.dialCode}</span>
        </span>
      )}
      value={value}
    >
      {(["Popular countries", "More countries"] as const).map((group) => (
        <optgroup key={group} label={group}>
          {COUNTRY_OPTIONS.filter((country) => country.group === group).map((country) => (
          <option key={country.code} value={country.code}>
            <span className="public-auth-country-option">
              <span className="public-auth-country-option-name">{country.label}</span>
              <span className="public-auth-country-option-dial">{country.dialCode}</span>
            </span>
          </option>
          ))}
        </optgroup>
      ))}
    </AppSelect>
  );
}

function getAudienceIcon(audience: RegistrationPackage["audience"]) {
  return audience === "AGENCY" ? <Building2 size={16} strokeWidth={1.8} /> : <UserRound size={16} strokeWidth={1.8} />;
}

function detectCountryByPhone(value: string) {
  const normalized = value.trim();
  return COUNTRY_OPTIONS.find((country) => normalized.startsWith(country.dialCode)) ?? COUNTRY_OPTIONS[0];
}

function normalizeLocalPhone(value: string, maxDigits: number) {
  return value.replace(/[^\d]/g, "").slice(0, maxDigits);
}

function buildIdentifier(rawValue: string, countryCode: string) {
  const value = rawValue.trim();
  if (!value) return "";
  if (value.includes("@")) return value.toLowerCase();
  if (value.startsWith("+")) return value.replace(/[^\d+]/g, "");

  const country = COUNTRY_OPTIONS.find((item) => item.code === countryCode) ?? COUNTRY_OPTIONS[0];
  return `${country.dialCode}${normalizeLocalPhone(value, country.maxDigits)}`;
}

function formatBillingType(value: RegistrationPackage["billingType"]) {
  if (value === "FREE") return "Free";
  if (value === "ONE_TIME_PAID") return "One-time paid";
  if (value === "RECURRING") return "Recurring";
  return "Package";
}

function formatBillingInterval(value: RegistrationPackage["billingInterval"]) {
  if (value === "MONTHLY") return "Monthly";
  if (value === "QUARTERLY") return "Quarterly";
  if (value === "YEARLY") return "Yearly";
  if (value === "ONE_TIME") return "One-time";
  if (value === "CUSTOM") return "Custom";
  return "Configured billing";
}

function getPackagePromise(pkg: RegistrationPackage) {
  if (pkg.audience === "FREELANCER") return "No subscription fee";
  if (pkg.billingInterval === "YEARLY" && (pkg.amount === 17700 || pkg.amount === 12000)) return "₹1,475/month equivalent";
  return pkg.billingLabel;
}

function getPackageBillingDetail(pkg: RegistrationPackage) {
  if (pkg.billingType === "FREE" || pkg.isFree) return "Free forever";
  if (pkg.billingInterval === "YEARLY") return "Billed once per year";
  return formatBillingInterval(pkg.billingInterval);
}

export function PublicAuthPanel({
  defaultMode = "login",
  redirectTo = "",
  packages,
  packageId = "",
  error,
  message,
  displayName = "",
  firstName = "",
  lastName = "",
  phone = "",
  email = "",
  identifier = "",
  salesReferralCode = "",
  packageConflictKind = "",
  conflictExistingPackageName = "",
  conflictExistingPackageAudience = "",
  conflictRequestedPackageId = "",
  conflictRequestedPackageName = "",
  conflictRequestedPackageAudience = "",
  allowInternalSupport = false,
  onModeChange,
}: PublicAuthPanelProps) {
  const initialLoginCountry = useMemo(() => detectCountryByPhone(identifier), [identifier]);
  const initialSignupCountry = useMemo(() => detectCountryByPhone(phone), [phone]);
  const normalizedSignupPhone = useMemo(() => {
    const detectedCountry = detectCountryByPhone(phone);
    return normalizeLocalPhone(phone.replace(detectedCountry.dialCode, ""), detectedCountry.maxDigits);
  }, [phone]);

  const matchedPackageId = packages.find((item) => item.id === packageId.trim())?.id ?? "";
  const initialPackageId = matchedPackageId || packages[0]?.id || "";
  const [mode, setMode] = useState<AuthMode>(matchedPackageId ? "signup" : defaultMode);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [searchIdentifier, setSearchIdentifier] = useState(identifier);
  const [loginCountryCode, setLoginCountryCode] = useState<CountryCode>(initialLoginCountry.code);
  const [signupCountryCode, setSignupCountryCode] = useState<CountryCode>(initialSignupCountry.code);
  const [signupPhone, setSignupPhone] = useState(normalizedSignupPhone);
  const initialNameParts = useMemo(() => {
    const normalizedFirstName = normalizePublicDisplayName(firstName);
    const normalizedLastName = normalizePublicDisplayName(lastName);
    if (normalizedFirstName || normalizedLastName) {
      return {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      };
    }

    const parts = normalizePublicDisplayName(displayName).split(" ").filter(Boolean);
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
    };
  }, [displayName, firstName, lastName]);
  const [signupFirstName, setSignupFirstName] = useState(initialNameParts.firstName);
  const [signupLastName, setSignupLastName] = useState(initialNameParts.lastName);
  const [signupNameError, setSignupNameError] = useState("");
  const [confirmPackageChange, setConfirmPackageChange] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setGoogleConfigured(Boolean(data.configured)))
      .catch(() => setGoogleConfigured(false));
  }, []);

  const activePackage = packages.find((item) => item.id === selectedPackageId) ?? packages[0] ?? null;
  const selectedSignupCountry = COUNTRY_OPTIONS.find((item) => item.code === signupCountryCode) ?? COUNTRY_OPTIONS[0];
  const normalizedLoginIdentifier = buildIdentifier(searchIdentifier, loginCountryCode);
  const normalizedSignupPhoneValue = signupPhone ? `${selectedSignupCountry.dialCode}${signupPhone}` : "";
  const hasVisiblePackageConflict = mode === "signup" && Boolean(packageConflictKind) && selectedPackageId === conflictRequestedPackageId;
  const requiresPackageChangeConfirmation = hasVisiblePackageConflict && packageConflictKind === "package-change";
  const blocksDirectSignup = hasVisiblePackageConflict && packageConflictKind === "same-package";
  const selectedAudienceLabel = activePackage?.audience === "AGENCY" ? "agency" : "freelancer";
  const existingAudienceLabel = conflictExistingPackageAudience === "AGENCY" ? "agency" : "freelancer";
  const passwordIdentifierIsEmail = searchIdentifier.includes("@");

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const safeLoginPhonePlaceholder = "WhatsApp number";
  const safeFirstNamePlaceholder = "First name";
  const safeLastNamePlaceholder = "Last name";
  const safePhonePlaceholder = "WhatsApp number";
  const safeEmailPlaceholder = "name@company.com";
  const whatsappLoginAction = "/api/auth/login/whatsapp";
  const passwordLoginAction = "/api/auth/login/password";
  const signupAction = "/api/auth/signup";

  return (
    <div className="public-auth-shell">
      <div className="public-auth-tabs" role="tablist">
        <button className={mode === "login" ? "public-auth-tab active" : "public-auth-tab"} onClick={() => switchMode("login")} type="button">
          Login
        </button>
        <button className={mode === "signup" ? "public-auth-tab active" : "public-auth-tab"} onClick={() => switchMode("signup")} type="button">
          Register
        </button>
      </div>

      {message ? <p className="public-auth-message">{message}</p> : null}
      {error ? <p className="public-auth-error">{error}</p> : null}

      {mode === "login" ? (
        <div className="public-auth-grid">
          <section className="public-auth-card">
            <h2>Welcome back to Gigxomi.</h2>
            <p className="muted-copy">Sign in to your agency or editor workspace.</p>

            <div style={{ margin: "16px 0" }}>
              <a
                href={`/api/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="gx-google-btn"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg
                  className="gx-google-icon"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
              {showGoogleNotice && (
                <div className="gx-setup-mode-banner" style={{ marginTop: "10px", fontSize: "0.78rem" }}>
                  <AlertCircle size={15} />
                  <span>
                    Google sign-in requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> configured in your environment. Use WhatsApp OTP or password below.
                  </span>
                </div>
              )}
            </div>

            <div className="gx-auth-divider" style={{ margin: "16px 0" }}>
              <span>or sign in with WhatsApp OTP</span>
            </div>

            <form action={whatsappLoginAction} className="public-auth-form" method="post">
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <input name="phone" type="hidden" value={normalizedLoginIdentifier} />
              <label className="freelancer-field freelancer-field-full">
                <span>WhatsApp number</span>
                <div className="public-auth-phone-input">
                  <CountrySelector id="public-auth-login-country" onChange={setLoginCountryCode} value={loginCountryCode} />
                  <input
                    autoComplete="off"
                    inputMode="tel"
                    onChange={(event) => setSearchIdentifier(event.target.value)}
                    placeholder={safeLoginPhonePlaceholder}
                    required
                    value={searchIdentifier}
                  />
                </div>
              </label>
              <button
                className="freelancer-primary-button"
                onClick={() =>
                    pushGrowthEvent("gigxomi_auth_submitted", {
                      authMode: "login",
                      authMethod: "whatsapp_otp",
                      identifierType: "phone",
                    })
                }
                type="submit"
              >
                Continue to WhatsApp OTP
              </button>
            </form>

            <details className="public-auth-support">
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--gx-text-accent, #9ae600)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={16} /> Login with email
                </summary>
                <form action={passwordLoginAction} className="public-auth-form" method="post" style={{ marginTop: "14px" }}>
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <input name="identifier" type="hidden" value={normalizedLoginIdentifier} />
                  <label className="freelancer-field freelancer-field-full">
                    <span>Work email or phone</span>
                    <div className="public-auth-phone-input">
                      {passwordIdentifierIsEmail ? null : <CountrySelector id="public-auth-password-country" onChange={setLoginCountryCode} value={loginCountryCode} />}
                      <input
                        autoComplete="username"
                        inputMode={passwordIdentifierIsEmail ? "email" : "text"}
                        onChange={(event) => setSearchIdentifier(event.target.value)}
                        placeholder="name@company.com or phone"
                        required
                        type={passwordIdentifierIsEmail ? "email" : "text"}
                        value={searchIdentifier}
                      />
                    </div>
                  </label>
                  <label className="freelancer-field freelancer-field-full">
                    <span>Password</span>
                    <input name="password" placeholder="Enter your password" required type="password" />
                  </label>
                  <button
                    className="freelancer-secondary-button"
                    onClick={() =>
                      pushGrowthEvent("gigxomi_auth_submitted", {
                        authMode: "login",
                        authMethod: "password",
                      })
                    }
                    type="submit"
                  >
                    Sign in with email
                  </button>
                </form>
            </details>
          </section>

          <section className="public-auth-card public-auth-card-aside">
            <span className="meta-pill">What happens next</span>
            <h3>Quick, secure, and WhatsApp-first.</h3>
            <div className="stack-list">
              <p className="muted-copy">1. Enter the WhatsApp number you want to verify.</p>
              <p className="muted-copy">2. Open the official agency WhatsApp line and send Get OTP from that number.</p>
              <p className="muted-copy">3. The chatbot replies with a fresh code; enter it here once to continue.</p>
            </div>
            <button className="ghost-button" onClick={() => switchMode("signup")} type="button">
              Create new account &rarr;
            </button>
          </section>
        </div>
      ) : (
        <div className="public-auth-grid gx-signup-split-grid">
          {/* LEFT: Package Showcase - What they are getting */}
          <section className="public-auth-card gx-package-showcase-card">
            {activePackage?.audience === "FREELANCER" ? (
              <>
                <div className="gx-showcase-badge-row">
                  <span className="meta-pill">Freelancer Workspace</span>
                  <span className="gx-showcase-free-pill">₹0 Forever · No Fees</span>
                </div>
                <div className="gx-showcase-head">
                  <div className="gx-showcase-icon-box">
                    <UserRound size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2>Freelance Editor</h2>
                    <p className="muted-copy">Showcase your portfolio, receive agency offers, and manage deliveries.</p>
                  </div>
                </div>

                <div className="gx-showcase-features-list">
                  <p className="gx-showcase-features-label">Included with your free account:</p>
                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Public Portfolio & Profile</strong>
                      <span>Share your best edits, video styles, and rate cards with clients</span>
                    </div>
                  </div>
                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Agency Project Offers</strong>
                      <span>Receive direct assignment briefs from vetted video editing agencies</span>
                    </div>
                  </div>
                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Project Delivery & Revisions</strong>
                      <span>Upload cuts, track timestamped feedback, and coordinate directly with agencies</span>
                    </div>
                  </div>
                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Milestone & Payout Tracking</strong>
                      <span>Track completed project deliverables and payout records transparently</span>
                    </div>
                  </div>
                </div>

                <div className="gx-showcase-guarantee-note">
                  <Zap size={15} />
                  <span>Free forever. Zero monthly subscription or membership fees.</span>
                </div>
              </>
            ) : (
              <>
                <div className="gx-showcase-badge-row">
                  <span className="meta-pill gx-trial-meta-pill">7-Day Free Trial · 2 Projects</span>
                  <span className="gx-showcase-free-pill">₹0 Charged Today</span>
                </div>

                <div className="gx-showcase-head">
                  <div className="gx-showcase-icon-box">
                    <Building2 size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2>Agency Workspace</h2>
                    <p className="muted-copy">Complete operations software for video editing agencies</p>
                  </div>
                </div>

                {/* Billing Preview Toggle */}
                <div className="gx-billing-toggle-shell">
                  <div className="gx-billing-toggle-bar" role="group" aria-label="Billing preview options">
                    <button
                      className={billingCycle === "yearly" ? "gx-billing-tab active" : "gx-billing-tab"}
                      onClick={() => setBillingCycle("yearly")}
                      type="button"
                    >
                      <span>Annual Billing</span>
                      <span className="gx-save-badge">Save ₹6,300/yr</span>
                    </button>
                    <button
                      className={billingCycle === "monthly" ? "gx-billing-tab active" : "gx-billing-tab"}
                      onClick={() => setBillingCycle("monthly")}
                      type="button"
                    >
                      <span>Monthly Billing</span>
                    </button>
                  </div>

                  <div className="gx-billing-preview-display">
                    <div className="gx-price-main">
                      <span className="gx-price-number">{billingCycle === "yearly" ? "₹1,475" : "₹2,000"}</span>
                      <span className="gx-price-cadence">/month</span>
                    </div>
                    <p className="gx-price-subtext">
                      {billingCycle === "yearly"
                        ? "Billed annually at ₹17,700/year after your 7-day free trial."
                        : "Billed monthly at ₹2,000/month after your 7-day free trial."}
                    </p>
                  </div>
                </div>

                {/* What they get in the package - explicit feature breakdown */}
                <div className="gx-showcase-features-list">
                  <p className="gx-showcase-features-label">Everything included in your workspace:</p>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Multi-Channel Client Inbox</strong>
                      <span>WhatsApp Business & Instagram DM in one place — clients install 0 apps</span>
                    </div>
                  </div>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Two-Lane Delegation Engine</strong>
                      <span>Separate external client communication from private internal team and editor coordination</span>
                    </div>
                  </div>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Manager Delegation & Stage Kanban</strong>
                      <span>Track Inbound &rarr; Quotation &rarr; In Progress &rarr; Review &rarr; Delivered</span>
                    </div>
                  </div>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Curated Editor Capacity (2 Projects in Trial)</strong>
                      <span>Assign active edits to confirmed editors with brief and asset context</span>
                    </div>
                  </div>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Client Review Links & Approvals</strong>
                      <span>Watermarked video player for frame-by-frame client feedback and sign-off</span>
                    </div>
                  </div>

                  <div className="gx-showcase-feature-item">
                    <ShieldCheck className="gx-feat-icon" size={17} strokeWidth={2} />
                    <div>
                      <strong>Invoices, Collections & Financials</strong>
                      <span>Track client deals, invoice payments, and editor compensation in real time</span>
                    </div>
                  </div>
                </div>

                <div className="gx-showcase-guarantee-note">
                  <Clock size={15} />
                  <span>Start with 2 free projects or 7 days. Zero payment today. Cancel anytime.</span>
                </div>
              </>
            )}
          </section>

          {/* RIGHT: The Clean Registration Form */}
          <section className="public-auth-card gx-signup-form-card">
            <div className="gx-form-card-header">
              <span className="meta-pill">Instant Access</span>
              <h2>{activePackage?.audience === "FREELANCER" ? "Create your editor account" : "Create your agency account"}</h2>
              <p className="muted-copy">
                {activePackage?.audience === "FREELANCER"
                  ? "Enter your WhatsApp number to receive your secure verification code."
                  : "Enter your WhatsApp number to launch your 7-day free trial."}
              </p>
            </div>

            <div style={{ margin: "16px 0" }}>
              <a
                href={`/api/auth/google?role=${activePackage?.audience === "FREELANCER" ? "freelancer" : "agency"}&redirectTo=${encodeURIComponent(redirectTo)}`}
                className="gx-google-btn"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg
                  className="gx-google-icon"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
              {showGoogleNotice && (
                <div className="gx-setup-mode-banner" style={{ marginTop: "10px", fontSize: "0.78rem" }}>
                  <AlertCircle size={15} />
                  <span>
                    Google sign-in requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> configured in your environment. Register with WhatsApp below.
                  </span>
                </div>
              )}
            </div>

            <div className="gx-auth-divider" style={{ margin: "16px 0 20px" }}>
              <span>or register with WhatsApp</span>
            </div>

            <form
              action={signupAction}
              className="public-auth-form"
              method="post"
              onSubmit={(event) => {
                const firstNameValidation = validatePublicNamePart(signupFirstName, "first name");
                const lastNameValidation = validatePublicNamePart(signupLastName, "last name");
                const displayNameValidation = validatePublicDisplayName(`${signupFirstName} ${signupLastName}`);
                if (!firstNameValidation.ok || !lastNameValidation.ok || !displayNameValidation.ok) {
                  event.preventDefault();
                  const nextError = !firstNameValidation.ok
                    ? firstNameValidation.error
                    : !lastNameValidation.ok
                      ? lastNameValidation.error
                      : !displayNameValidation.ok
                        ? displayNameValidation.error
                        : "Enter your first and last name.";
                  setSignupNameError(nextError);
                  return;
                }
                setSignupFirstName(firstNameValidation.value);
                setSignupLastName(lastNameValidation.value);
                setSignupNameError("");
              }}
            >
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <input name="packageId" type="hidden" value={selectedPackageId || activePackage?.id || ""} />
              <input name="ref" type="hidden" value={salesReferralCode} />
              <input name="country" type="hidden" value={selectedSignupCountry.label} />
              <input name="phone" type="hidden" value={normalizedSignupPhoneValue} />
              <input name="confirmPackageChange" type="hidden" value={requiresPackageChangeConfirmation && confirmPackageChange ? "1" : ""} />
              {hasVisiblePackageConflict ? (
                <div className="brief-card public-auth-upgrade-notice">
                  <span className="meta-pill">{packageConflictKind === "same-package" ? "Package already active" : "Confirm package change"}</span>
                  <strong>
                    {packageConflictKind === "same-package"
                      ? `${conflictExistingPackageName || activePackage?.name || "This package"} is already running on this account.`
                      : `This account is currently on ${conflictExistingPackageName || "an active package"}.`}
                  </strong>
                  <p className="muted-copy">
                    {packageConflictKind === "same-package"
                      ? `This WhatsApp number already has a live ${existingAudienceLabel} package. Use login OTP to continue, or choose a different package if you want to switch.`
                      : `You are moving this account from ${conflictExistingPackageName || existingAudienceLabel} to ${conflictRequestedPackageName || activePackage?.name || selectedAudienceLabel}. Confirm once, then send Get OTP from the same WhatsApp number.`}
                  </p>
                  {requiresPackageChangeConfirmation ? (
                    <label className="package-checkbox-row public-auth-upgrade-checkbox">
                      <input
                        checked={confirmPackageChange}
                        onChange={(event) => setConfirmPackageChange(event.target.checked)}
                        type="checkbox"
                      />
                      <span>
                        {conflictExistingPackageAudience === "FREELANCER" && conflictRequestedPackageAudience === "AGENCY"
                          ? "Yes, upgrade this account from freelancer to agency and continue to WhatsApp."
                          : "Yes, change this package on the same account and continue to WhatsApp."}
                      </span>
                    </label>
                  ) : (
                    <button className="ghost-button" onClick={() => switchMode("login")} type="button">
                      Use login OTP instead
                    </button>
                  )}
                </div>
              ) : null}

              <div className="public-auth-name-grid">
                <label className="freelancer-field">
                  <span>First name</span>
                  <input
                    autoComplete="given-name"
                    maxLength={40}
                    name="firstName"
                    onChange={(event) => {
                      const nextValue = normalizePublicDisplayName(event.target.value);
                      setSignupFirstName(nextValue);
                      if (signupNameError) {
                        const validation = validatePublicNamePart(nextValue, "first name");
                        setSignupNameError(validation.ok ? "" : validation.error);
                      }
                    }}
                    placeholder={safeFirstNamePlaceholder}
                    required
                    value={signupFirstName}
                  />
                </label>
                <label className="freelancer-field">
                  <span>Last name</span>
                  <input
                    autoComplete="family-name"
                    maxLength={40}
                    name="lastName"
                    onChange={(event) => {
                      const nextValue = normalizePublicDisplayName(event.target.value);
                      setSignupLastName(nextValue);
                      if (signupNameError) {
                        const validation = validatePublicNamePart(nextValue, "last name");
                        setSignupNameError(validation.ok ? "" : validation.error);
                      }
                    }}
                    placeholder={safeLastNamePlaceholder}
                    required
                    value={signupLastName}
                  />
                </label>
                <input name="displayName" type="hidden" value={`${signupFirstName} ${signupLastName}`.trim()} />
                <p className="muted-copy public-auth-name-help">Use your real first and last name. Numbers are not allowed.</p>
                {signupNameError ? <p className="public-auth-error">{signupNameError}</p> : null}
              </div>

              <label className="freelancer-field freelancer-field-full">
                <span>WhatsApp number</span>
                <div className="public-auth-phone-input">
                  <CountrySelector
                    id="public-auth-signup-country"
                    onChange={(nextCode) => {
                      const nextCountry = COUNTRY_OPTIONS.find((item) => item.code === nextCode) ?? COUNTRY_OPTIONS[0];
                      setSignupCountryCode(nextCountry.code);
                      setSignupPhone((currentValue) => normalizeLocalPhone(currentValue, nextCountry.maxDigits));
                    }}
                    value={signupCountryCode}
                  />
                  <input
                    autoComplete="off"
                    inputMode="tel"
                    maxLength={selectedSignupCountry.maxDigits}
                    onChange={(event) => setSignupPhone(normalizeLocalPhone(event.target.value, selectedSignupCountry.maxDigits))}
                    placeholder={safePhonePlaceholder}
                    required
                    value={signupPhone}
                  />
                </div>
              </label>

              <label className="freelancer-field freelancer-field-full">
                <span>Work email (optional)</span>
                <input autoComplete="off" defaultValue={email} name="email" placeholder={safeEmailPlaceholder} type="email" />
              </label>

              <button
                className="freelancer-primary-button gx-auth-cta-btn"
                disabled={!selectedPackageId || blocksDirectSignup || (requiresPackageChangeConfirmation && !confirmPackageChange)}
                onClick={() =>
                  pushGrowthEvent("gigxomi_auth_submitted", {
                    authMode: "signup",
                    authMethod: "whatsapp_otp",
                    packageId: selectedPackageId,
                    packageAudience: activePackage?.audience ?? null,
                  })
                }
                type="submit"
              >
                {blocksDirectSignup
                  ? "Login to continue"
                  : requiresPackageChangeConfirmation
                    ? confirmPackageChange
                      ? "Confirm change and continue"
                      : "Confirm package change first"
                    : activePackage?.audience === "FREELANCER"
                      ? "Start Free with WhatsApp OTP →"
                      : "Start 7-Day Free Trial →"}
              </button>

              <p className="gx-auth-trust-subtext">
                <Lock size={12} />
                <span>Zero payment today · Instant WhatsApp OTP verification</span>
              </p>
            </form>

            <div className="gx-form-footer-switch">
              <span>Already registered?</span>
              <button className="ghost-button" onClick={() => switchMode("login")} type="button">
                Sign in to your workspace &rarr;
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
