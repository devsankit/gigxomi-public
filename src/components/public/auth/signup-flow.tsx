"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Film,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Users,
  Briefcase,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  trackSignupStarted,
  trackSignupPathSelected,
  trackSignupMethodSelected,
  trackSignupStepCompleted,
  trackSignupCompleted,
  trackWhatsappVerificationStarted,
} from "@/lib/analytics/funnel";

type RoleChoice = "agency" | "freelancer";
type FlowStage = "role_selection" | "auth" | "whatsapp_collection" | "onboarding";

interface AgencyData {
  agencyName: string;
  websiteOrHandle: string;
  roleInAgency: string;
  editorCount: string;
  workType: string;
  workspaceSlug: string;
  currency: string;
  firstWorkflow: "inbox" | "team" | "project";
  whatsappNumber: string;
  instagramHandle: string;
}

interface FreelancerData {
  editingFocus: string[];
  displayName: string;
  headline: string;
  location: string;
  availability: string;
  portfolioUrl: string;
  toolsUsed: string[];
}

const DEFAULT_AGENCY_DATA: AgencyData = {
  agencyName: "",
  websiteOrHandle: "",
  roleInAgency: "Owner",
  editorCount: "1 to 3 editors",
  workType: "Reels & Short-form",
  workspaceSlug: "",
  currency: "INR (₹)",
  firstWorkflow: "team",
  whatsappNumber: "",
  instagramHandle: "",
};

const DEFAULT_FREELANCER_DATA: FreelancerData = {
  editingFocus: ["Short-form (Reels / TikTok)"],
  displayName: "",
  headline: "",
  location: "",
  availability: "Full-time available",
  portfolioUrl: "",
  toolsUsed: ["Adobe Premiere Pro"],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role")?.toLowerCase();
  const stepParam = searchParams.get("step")?.toLowerCase();
  const initialError = searchParams.get("error") || "";

  const [role, setRole] = useState<RoleChoice>(
    roleParam === "freelancer" || roleParam === "editor" ? "freelancer" : "agency"
  );
  const [hasChosenRole, setHasChosenRole] = useState<boolean>(
    Boolean(roleParam === "agency" || roleParam === "freelancer" || roleParam === "editor")
  );

  const [stage, setStage] = useState<FlowStage>(
    stepParam === "onboarding" ? "onboarding" : hasChosenRole ? "auth" : "role_selection"
  );

  // Authentication form state
  const [authMethod, setAuthMethod] = useState<"email" | "whatsapp">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth state
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [showGoogleSetupNotice, setShowGoogleSetupNotice] = useState(false);

  // WhatsApp post-auth collection state
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [agencyOptIn, setAgencyOptIn] = useState(true);
  const [waCollectionOptIn, setWaCollectionOptIn] = useState(true);
  const [isSavingStep1, setIsSavingStep1] = useState(false);

  // Wizard state
  const [agencyStep, setAgencyStep] = useState<number>(1);
  const [freelancerStep, setFreelancerStep] = useState<number>(1);
  const [agencyData, setAgencyData] = useState<AgencyData>(DEFAULT_AGENCY_DATA);
  const [freelancerData, setFreelancerData] = useState<FreelancerData>(DEFAULT_FREELANCER_DATA);

  // Check Google OAuth availability on mount
  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setGoogleConfigured(Boolean(data.configured)))
      .catch(() => setGoogleConfigured(false));
  }, []);

  // Check authenticated session and prompt for WhatsApp number if user logged in via Google without phone
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.session) {
          const userPhone = String(data.session.phone ?? "");
          const isPlaceholderPhone = !userPhone || userPhone.startsWith("+google-") || userPhone.startsWith("+email-");
          if (isPlaceholderPhone) {
            setStage("whatsapp_collection");
          }
          if (data.session.displayName) {
            if (data.session.role === "FREELANCER" || role === "freelancer") {
              setFreelancerData((prev) => ({ ...prev, displayName: prev.displayName || data.session.displayName }));
            } else {
              setAgencyData((prev) => ({
                ...prev,
                agencyName: prev.agencyName || `${data.session.displayName}'s Agency`,
                workspaceSlug: prev.workspaceSlug || slugify(data.session.displayName),
              }));
            }
          }
        }
      })
      .catch(() => {});
  }, [role]);

  const handleSaveWhatsAppPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappError("");
    const cleaned = whatsappPhone.trim();
    if (!cleaned) {
      setWhatsappError("Please enter your WhatsApp number.");
      return;
    }
    if (!waCollectionOptIn) {
      setWhatsappError("Please confirm opt-in for offers and promotions to proceed.");
      return;
    }
    setIsSavingPhone(true);
    try {
      const res = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setWhatsappError(payload.error || "Failed to update WhatsApp number.");
        setIsSavingPhone(false);
        return;
      }
      if (role === "agency") {
        updateAgency({ whatsappNumber: payload.phone || cleaned });
      }
      setStage("onboarding");
      setIsSavingPhone(false);
    } catch {
      setWhatsappError("Network error. Please try again.");
      setIsSavingPhone(false);
    }
  };

  // Hydrate saved onboarding progress from localStorage
  useEffect(() => {
    try {
      const savedAgency = localStorage.getItem("gx_onboarding_agency_draft");
      if (savedAgency) {
        const parsed = JSON.parse(savedAgency);
        if (parsed.data) {
          setAgencyData((prev) => ({ ...prev, ...parsed.data }));
          setRole("agency");
          setStage("onboarding");
        }
        if (parsed.step) setAgencyStep(parsed.step);
      } else {
        const savedFreelancer = localStorage.getItem("gx_onboarding_freelancer_draft");
        if (savedFreelancer) {
          const parsed = JSON.parse(savedFreelancer);
          if (parsed.data) {
            setFreelancerData((prev) => ({ ...prev, ...parsed.data }));
            setRole("freelancer");
            setStage("onboarding");
          }
          if (parsed.step) setFreelancerStep(parsed.step);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save agency progress
  const updateAgency = (patch: Partial<AgencyData>) => {
    setAgencyData((prev) => {
      const updated = { ...prev, ...patch };
      if (patch.agencyName !== undefined && !patch.workspaceSlug) {
        updated.workspaceSlug = slugify(patch.agencyName);
      }
      try {
        localStorage.setItem(
          "gx_onboarding_agency_draft",
          JSON.stringify({ step: agencyStep, data: updated })
        );
      } catch {}
      return updated;
    });
  };

  const changeAgencyStep = (nextStep: number) => {
    trackSignupStepCompleted({
      role: "agency",
      stepNumber: agencyStep,
      stepName: `agency_step_${agencyStep}`,
    });
    setAgencyStep(nextStep);
    try {
      localStorage.setItem(
        "gx_onboarding_agency_draft",
        JSON.stringify({ step: nextStep, data: agencyData })
      );
    } catch {}
  };

  // Save freelancer progress
  const updateFreelancer = (patch: Partial<FreelancerData>) => {
    setFreelancerData((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(
          "gx_onboarding_freelancer_draft",
          JSON.stringify({ step: freelancerStep, data: updated })
        );
      } catch {}
      return updated;
    });
  };

  const changeFreelancerStep = (nextStep: number) => {
    trackSignupStepCompleted({
      role: "freelancer",
      stepNumber: freelancerStep,
      stepName: `freelancer_step_${freelancerStep}`,
    });
    setFreelancerStep(nextStep);
    try {
      localStorage.setItem(
        "gx_onboarding_freelancer_draft",
        JSON.stringify({ step: nextStep, data: freelancerData })
      );
    } catch {}
  };

  // Handle Google OAuth button click
  const handleGoogleClick = () => {
    trackSignupMethodSelected({ method: "google", role });
    if (!googleConfigured) {
      setShowGoogleSetupNotice(true);
      return;
    }
    window.location.href = `/api/auth/google?role=${role}`;
  };

  // Handle email signup submission
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid work email.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    trackSignupMethodSelected({ method: "email", role });
    try {
      const res = await fetch("/api/auth/signup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role === "agency" ? "AGENCY" : "FREELANCER",
          displayName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data.error || "Could not complete signup. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Populate default name in onboarding draft
      if (role === "agency") {
        updateAgency({ agencyName: `${fullName}'s Agency` });
      } else {
        updateFreelancer({ displayName: fullName });
      }

      // Transition smoothly to Onboarding
      setStage("onboarding");
      setIsSubmitting(false);
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // Complete Agency Onboarding
  const handleFinishAgencyOnboarding = () => {
    trackSignupCompleted({
      role: "agency",
      workspaceType: agencyData.editorCount,
      workflowChoice: agencyData.firstWorkflow,
    });
    try {
      localStorage.removeItem("gx_onboarding_agency_draft");
      document.cookie = "gx_onboarding=; Path=/; Max-Age=0;";
    } catch {}

    const dest =
      agencyData.firstWorkflow === "team"
        ? "/admin/freelancers"
        : agencyData.firstWorkflow === "project"
        ? "/admin/assignments"
        : "/admin";
    router.push(dest);
  };

  // Complete Freelancer Onboarding
  const handleFinishFreelancerOnboarding = () => {
    trackSignupCompleted({
      role: "freelancer",
      workspaceType: freelancerData.availability,
      workflowChoice: freelancerData.editingFocus[0],
    });
    try {
      localStorage.removeItem("gx_onboarding_freelancer_draft");
      document.cookie = "gx_onboarding=; Path=/; Max-Age=0;";
    } catch {}
    router.push("/freelancer");
  };

  // -------------------------------------------------------------
  // RENDER: SCREEN 1 - ROLE SELECTION
  // -------------------------------------------------------------
  if (stage === "role_selection") {
    return (
      <div className="gx-onboarding-card">
        <div className="gx-onboarding-header">
          <p className="gx-onboarding-eyebrow">
            <ShieldCheck size={14} strokeWidth={2.2} /> GIGXOMI WORKSPACE
          </p>
          <h1 className="gx-onboarding-title">Set up Gigxomi for your work.</h1>
          <p className="gx-onboarding-desc">
            Choose the workspace experience that matches your business or editing practice.
          </p>
        </div>

        <div className="gx-role-selection-grid">
          {/* Choice 1: Agency */}
          <button
            type="button"
            className={`gx-role-choice-card ${role === "agency" ? "is-selected" : ""}`}
            onClick={() => {
              trackSignupPathSelected({
                role: "agency",
                sourceLocation: "card",
                pageType: "signup",
              });
              setRole("agency");
              setHasChosenRole(true);
              setStage("auth");
            }}
          >
            <div className="gx-role-choice-icon">
              <Building2 size={22} strokeWidth={1.8} />
            </div>
            <div className="gx-role-choice-content">
              <h2 className="gx-role-choice-title">I run an agency</h2>
              <p className="gx-role-choice-desc">
                Manage client conversations, editors, and projects.
              </p>
              <span className="gx-role-choice-meta">
                For video agencies, creative studios &amp; post-production founders
              </span>
            </div>
          </button>

          {/* Choice 2: Freelance Editor */}
          <button
            type="button"
            className={`gx-role-choice-card ${role === "freelancer" ? "is-selected" : ""}`}
            onClick={() => {
              trackSignupPathSelected({
                role: "freelancer",
                sourceLocation: "card",
                pageType: "signup",
              });
              setRole("freelancer");
              setHasChosenRole(true);
              setStage("auth");
            }}
          >
            <div className="gx-role-choice-icon">
              <Film size={22} strokeWidth={1.8} />
            </div>
            <div className="gx-role-choice-content">
              <h2 className="gx-role-choice-title">I’m a video editor</h2>
              <p className="gx-role-choice-desc">
                Create a profile and join project opportunities.
              </p>
              <span className="gx-role-choice-meta">
                For freelance video editors, motion designers &amp; colorists
              </span>
            </div>
          </button>
        </div>

        <div className="gx-manager-invite-note">
          Joining an agency team? Ask your agency owner for an invite.
          <Link href="/manager-login">Manager sign in</Link>
        </div>

        <div className="gx-onboarding-footer">
          <p>
            Already have an account?{" "}
            <Link href="/login">Sign in to your workspace &rarr;</Link>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SCREEN 2 - AUTHENTICATION
  // -------------------------------------------------------------
  if (stage === "auth") {
    return (
      <div className="gx-onboarding-card">
        <div className="gx-onboarding-topbar">
          <div className="gx-onboarding-nav-row">
            <button
              type="button"
              className="gx-onboarding-back-btn"
              onClick={() => setStage("role_selection")}
            >
              <ArrowLeft size={14} /> Change role
            </button>
            <span className="gx-onboarding-step-indicator">
              {role === "agency" ? "Agency setup" : "Editor profile"}
            </span>
          </div>
        </div>

        <div className="gx-onboarding-header">
          <p className="gx-onboarding-eyebrow">
            <ShieldCheck size={14} strokeWidth={2.2} /> SECURE REGISTRATION
          </p>
          <h1 className="gx-onboarding-title">
            {role === "agency" ? "Create your agency account" : "Create your video editor account"}
          </h1>
          <p className="gx-onboarding-desc">
            {role === "agency"
              ? "Start managing client inboxes, editor delegation, and production pipelines."
              : "Set up your editor workspace to view project context and deliver cuts."}
          </p>
        </div>

        {formError ? (
          <div className="gx-setup-mode-banner" style={{ borderColor: "#ff6b6b", background: "rgba(255, 107, 107, 0.08)" }}>
            <AlertCircle size={16} style={{ color: "#ff6b6b" }} />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="gx-auth-actions-stack">
          {/* Google Sign In */}
          <a
            href={`/api/auth/google?role=${role}`}
            className="gx-google-btn"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => trackSignupMethodSelected({ method: "google", role })}
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

          {showGoogleSetupNotice && (
            <div className="gx-setup-mode-banner">
              <AlertCircle size={16} />
              <div>
                <strong>Google sign-in setup mode:</strong>
                <p style={{ margin: "4px 0 0", color: "#c2c9bc", fontSize: "0.78rem" }}>
                  Google OAuth requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> configured in your environment. Sign up using email &amp; password below.
                </p>
              </div>
            </div>
          )}

          <div className="gx-auth-divider">
            <span>or continue with email</span>
          </div>

          {authMethod === "email" ? (
            <form onSubmit={handleEmailSignup} className="gx-form-stack">
              <div className="gx-field">
                <label className="gx-field-label" htmlFor="auth-fullname">
                  <span>Full name</span>
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  className="gx-input"
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="gx-field">
                <label className="gx-field-label" htmlFor="auth-email">
                  <span>Work email</span>
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="gx-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="gx-field">
                <label className="gx-field-label" htmlFor="auth-password">
                  <span>Password</span>
                  <span className="gx-field-optional">8+ characters</span>
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="gx-input"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="gx-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating workspace…" : "Continue to setup →"}
              </button>

              <p style={{ textAlign: "center", margin: "6px 0 0", fontSize: "0.8rem", color: "#8a9284" }}>
                Prefer WhatsApp verification?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMethod("whatsapp")}
                  style={{ background: "none", border: "none", color: "#d7ff2f", cursor: "pointer", textDecoration: "underline" }}
                >
                  Verify with phone
                </button>
              </p>
            </form>
          ) : (
            <form action="/api/auth/signup" method="post" className="gx-form-stack">
              <input type="hidden" name="packageId" value={role === "agency" ? "pkg-agency-launch" : "pkg-freelancer-starter"} />
              
              <div className="gx-field">
                <label className="gx-field-label" htmlFor="auth-wa-name">
                  <span>Full name</span>
                </label>
                <input
                  id="auth-wa-name"
                  name="displayName"
                  type="text"
                  className="gx-input"
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="gx-field">
                <label className="gx-field-label" htmlFor="auth-wa-phone">
                  <span>WhatsApp phone number (with country code)</span>
                </label>
                <input
                  id="auth-wa-phone"
                  name="phone"
                  type="tel"
                  className="gx-input"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="gx-btn-primary">
                Verify with WhatsApp OTP &rarr;
              </button>

              <p style={{ textAlign: "center", margin: "6px 0 0", fontSize: "0.8rem", color: "#8a9284" }}>
                Prefer password login?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  style={{ background: "none", border: "none", color: "#d7ff2f", cursor: "pointer", textDecoration: "underline" }}
                >
                  Sign up with email
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="gx-onboarding-footer">
          <p>
            Already have an account?{" "}
            <Link href="/login">Sign in &rarr;</Link>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SCREEN - WHATSAPP COLLECTION (POST-AUTH)
  // -------------------------------------------------------------
  if (stage === "whatsapp_collection") {
    return (
      <div className="gx-onboarding-card">
        <div className="gx-onboarding-header">
          <p className="gx-onboarding-eyebrow">
            <ShieldCheck size={14} strokeWidth={2.2} /> VERIFIED AGENCY LISTING
          </p>
          <h1 className="gx-onboarding-title">Connect your WhatsApp number</h1>
          <p className="gx-onboarding-desc">
            please provide your whatsApp number agency got listed on Gigxomi so that customer can directly contact with you on whatsApp
          </p>
        </div>

        {whatsappError ? (
          <div className="gx-setup-mode-banner" style={{ borderColor: "#ff6b6b", background: "rgba(255, 107, 107, 0.08)" }}>
            <AlertCircle size={16} style={{ color: "#ff6b6b" }} />
            <span>{whatsappError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSaveWhatsAppPhone} className="gx-form-stack">
          <div className="gx-field">
            <label className="gx-field-label" htmlFor="wa-phone-collect">
              <span>WhatsApp phone number (with country code)</span>
              <span className="gx-field-optional">e.g. +91 9876543210</span>
            </label>
            <input
              id="wa-phone-collect"
              type="tel"
              className="gx-input"
              placeholder="+91 9876543210 or +1 555 123 4567"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              required
              autoFocus
            />
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: "0.82rem", color: "#d2d8ce", lineHeight: 1.4, margin: "2px 0 6px" }}>
            <input
              type="checkbox"
              checked={waCollectionOptIn}
              onChange={(e) => setWaCollectionOptIn(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#d7ff2f", width: 16, height: 16 }}
            />
            <span>yes opt in for the offer and promotions form Gigxomi</span>
          </label>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.07)" }}>
            <Lock size={15} style={{ color: "#d7ff2f", flexShrink: 0, marginTop: "2px" }} />
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#a5aba0", lineHeight: 1.5 }}>
              Your WhatsApp number connects your agency with direct client leads and enables instant WhatsApp login in the Gigxomi Mobile App.
            </p>
          </div>

          <button
            type="submit"
            className="gx-btn-primary"
            disabled={isSavingPhone || !whatsappPhone.trim() || !waCollectionOptIn}
          >
            {isSavingPhone ? "Saving number…" : "Save & Continue to Onboarding →"}
          </button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SCREEN 3 - ROLE ONBOARDING WIZARD
  // -------------------------------------------------------------

  // ================= AGENCY 5-STEP WIZARD =================
  if (role === "agency") {
    return (
      <div className="gx-onboarding-card">
        {/* Top bar & Progress */}
        <div className="gx-onboarding-topbar">
          <div className="gx-onboarding-nav-row">
            {agencyStep > 1 ? (
              <button
                type="button"
                className="gx-onboarding-back-btn"
                onClick={() => changeAgencyStep(agencyStep - 1)}
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <span />
            )}
            <span className="gx-onboarding-step-indicator">
              Step <strong>{agencyStep}</strong> of 5
            </span>
          </div>
          <div className="gx-progress-bar-track" role="progressbar" aria-valuenow={agencyStep} aria-valuemin={1} aria-valuemax={5}>
            <div className="gx-progress-bar-fill" style={{ width: `${(agencyStep / 5) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1: Name your agency & WhatsApp Contact */}
        {agencyStep === 1 && (
          <div className="gx-form-stack">
            <div className="gx-onboarding-header">
              <p className="gx-onboarding-eyebrow">STEP 1: IDENTITY &amp; CONTACT</p>
              <h1 className="gx-onboarding-title">Name your agency</h1>
              <p className="gx-onboarding-desc">
                Set up your agency identity and WhatsApp connection for direct customer inquiries and mobile app sync.
              </p>
            </div>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="agency-name">
                <span>Agency or Studio Name (Required)</span>
              </label>
              <input
                id="agency-name"
                type="text"
                className="gx-input"
                placeholder="e.g. Apex Visuals"
                value={agencyData.agencyName}
                onChange={(e) => updateAgency({ agencyName: e.target.value })}
                autoFocus
                required
              />
            </div>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="agency-wa-input">
                <span>Agency WhatsApp Number (Required for Listing)</span>
              </label>
              <p style={{ margin: "2px 0 8px", fontSize: "0.82rem", color: "#c2c9bc", lineHeight: 1.45 }}>
                please provide your whatsApp number agency got listed on Gigxomi so that customer can directly contact with you on whatsApp
              </p>
              <input
                id="agency-wa-input"
                type="tel"
                className="gx-input"
                placeholder="+91 9876543210 or +1 555 123 4567"
                value={agencyData.whatsappNumber}
                onChange={(e) => updateAgency({ whatsappNumber: e.target.value })}
                required
              />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: "0.82rem", color: "#d2d8ce", lineHeight: 1.4, margin: "2px 0 6px" }}>
              <input
                type="checkbox"
                checked={agencyOptIn}
                onChange={(e) => setAgencyOptIn(e.target.checked)}
                style={{ marginTop: 2, accentColor: "#d7ff2f", width: 16, height: 16 }}
              />
              <span>yes opt in for the offer and promotions form Gigxomi</span>
            </label>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="agency-website">
                <span>Website or Instagram handle</span>
                <span className="gx-field-optional">Optional</span>
              </label>
              <input
                id="agency-website"
                type="text"
                className="gx-input"
                placeholder="e.g. apexvisuals.com or @apexvisuals"
                value={agencyData.websiteOrHandle}
                onChange={(e) => updateAgency({ websiteOrHandle: e.target.value })}
              />
            </div>

            <button
              type="button"
              className="gx-btn-primary"
              disabled={
                isSavingStep1 ||
                !agencyData.agencyName.trim() ||
                !agencyData.whatsappNumber.trim() ||
                !agencyOptIn
              }
              onClick={async () => {
                const cleanedPhone = agencyData.whatsappNumber.trim();
                if (!agencyData.agencyName.trim() || !cleanedPhone || !agencyOptIn) {
                  return;
                }
                setIsSavingStep1(true);
                try {
                  await fetch("/api/auth/update-phone", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: cleanedPhone }),
                  });
                } catch {}
                setIsSavingStep1(false);
                changeAgencyStep(2);
              }}
            >
              {isSavingStep1 ? "Saving details…" : "Continue to team setup →"}
            </button>
          </div>
        )}

        {/* STEP 2: How does your team work? */}
        {agencyStep === 2 && (
          <div className="gx-form-stack">
            <div className="gx-onboarding-header">
              <p className="gx-onboarding-eyebrow">STEP 2: OPERATIONS</p>
              <h1 className="gx-onboarding-title">How does your team work?</h1>
              <p className="gx-onboarding-desc">
                Help us calibrate your initial stage defaults and delegation flow.
              </p>
            </div>

            <div className="gx-field">
              <label className="gx-field-label">
                <span>Your primary role</span>
              </label>
              <div className="gx-chip-grid">
                {["Owner / Founder", "Lead Editor / Creative Director", "Executive Producer"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`gx-chip-btn ${agencyData.roleInAgency === opt ? "is-active" : ""}`}
                    onClick={() => updateAgency({ roleInAgency: opt })}
                  >
                    {agencyData.roleInAgency === opt && <Check size={14} />} {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="gx-field">
              <label className="gx-field-label">
                <span>Number of video editors you coordinate</span>
              </label>
              <div className="gx-chip-grid">
                {["1 to 3 editors", "4 to 10 editors", "11+ editors"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`gx-chip-btn ${agencyData.editorCount === opt ? "is-active" : ""}`}
                    onClick={() => updateAgency({ editorCount: opt })}
                  >
                    {agencyData.editorCount === opt && <Check size={14} />} {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="gx-field">
              <label className="gx-field-label">
                <span>Typical work format</span>
              </label>
              <div className="gx-chip-grid">
                {["Reels & Short-form", "YouTube Long-form", "Commercials & Performance Ads", "Mixed Video Formats"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`gx-chip-btn ${agencyData.workType === opt ? "is-active" : ""}`}
                    onClick={() => updateAgency({ workType: opt })}
                  >
                    {agencyData.workType === opt && <Check size={14} />} {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="gx-btn-primary"
              onClick={() => changeAgencyStep(3)}
            >
              Confirm workspace &rarr;
            </button>
          </div>
        )}

        {/* STEP 3: Create your workspace */}
        {agencyStep === 3 && (
          <div className="gx-form-stack">
            <div className="gx-onboarding-header">
              <p className="gx-onboarding-eyebrow">STEP 3: WORKSPACE</p>
              <h1 className="gx-onboarding-title">Create your workspace</h1>
              <p className="gx-onboarding-desc">
                Your agency workspace hosts your client inboxes, Kanban stage boards, and editor assignments.
              </p>
            </div>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="ws-slug">
                <span>Workspace URL handle</span>
              </label>
              <input
                id="ws-slug"
                type="text"
                className="gx-input"
                placeholder="agency-slug"
                value={agencyData.workspaceSlug}
                onChange={(e) => updateAgency({ workspaceSlug: slugify(e.target.value) })}
              />
            </div>

            <div className="gx-slug-preview-box">
              gigxomi.com/app/<span>{agencyData.workspaceSlug || "your-agency"}</span>
            </div>

            <div className="gx-field">
              <label className="gx-field-label">
                <span>Primary billing currency</span>
              </label>
              <div className="gx-chip-grid">
                {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"].map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    className={`gx-chip-btn ${agencyData.currency === cur ? "is-active" : ""}`}
                    onClick={() => updateAgency({ currency: cur })}
                  >
                    {agencyData.currency === cur && <Check size={14} />} {cur}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="gx-btn-primary"
              onClick={() => changeAgencyStep(4)}
            >
              Configure client channels &rarr;
            </button>
          </div>
        )}

        {/* STEP 4: Connect client channels (WhatsApp & Instagram) */}
        {agencyStep === 4 && (
          <div className="gx-form-stack">
            <div className="gx-onboarding-header">
              <p className="gx-onboarding-eyebrow">STEP 4: CLIENT CHANNELS</p>
              <h1 className="gx-onboarding-title">Connect your client channels</h1>
              <p className="gx-onboarding-desc">
                Clients send video briefs and revisions via WhatsApp and Instagram. Enter your studio channels to route client chats into your unified inbox.
              </p>
            </div>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="agency-whatsapp-channel">
                <span>WhatsApp Business phone number</span>
                <span className="gx-field-optional">With country code</span>
              </label>
              <input
                id="agency-whatsapp-channel"
                type="tel"
                className="gx-input"
                placeholder="e.g. +91 9876543210"
                value={agencyData.whatsappNumber}
                onChange={(e) => updateAgency({ whatsappNumber: e.target.value })}
              />
            </div>

            <div className="gx-field">
              <label className="gx-field-label" htmlFor="agency-ig-channel">
                <span>Instagram studio or agency handle</span>
                <span className="gx-field-optional">e.g. @apexvisuals</span>
              </label>
              <input
                id="agency-ig-channel"
                type="text"
                className="gx-input"
                placeholder="e.g. @apexvisuals"
                value={agencyData.instagramHandle}
                onChange={(e) => updateAgency({ instagramHandle: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.07)" }}>
              <ShieldCheck size={16} style={{ color: "#d7ff2f", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#a5aba0", lineHeight: 1.5 }}>
                Gigxomi&apos;s Two-Lane Engine automatically keeps external client messaging separate from private internal editor coordination.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="gx-btn-primary"
                style={{ flex: 1 }}
                onClick={async () => {
                  if (agencyData.whatsappNumber || agencyData.instagramHandle) {
                    await fetch("/api/admin/channels/setup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        whatsappNumber: agencyData.whatsappNumber,
                        instagramHandle: agencyData.instagramHandle,
                      }),
                    }).catch(() => {});
                  }
                  changeAgencyStep(5);
                }}
              >
                Save channels & continue &rarr;
              </button>
              <button
                type="button"
                className="ghost-button"
                style={{ alignSelf: "center", whiteSpace: "nowrap" }}
                onClick={() => changeAgencyStep(5)}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Start with your first workflow */}
        {agencyStep === 5 && (
          <div className="gx-form-stack">
            <div className="gx-onboarding-header">
              <p className="gx-onboarding-eyebrow">STEP 5: GETTING STARTED</p>
              <h1 className="gx-onboarding-title">Where would you like to begin?</h1>
              <p className="gx-onboarding-desc">
                Select your starting destination. We recommend entering the Editor Cohub to search, recruit, and assign video editors to your team.
              </p>
            </div>

            <div className="gx-workflow-choices-grid">
              {/* Option 1: Editor Cohub (Recommended) */}
              <button
                type="button"
                className={`gx-workflow-card ${agencyData.firstWorkflow === "team" ? "is-active" : ""}`}
                onClick={() => updateAgency({ firstWorkflow: "team" })}
              >
                <div className="gx-workflow-icon">
                  <Users size={18} />
                </div>
                <div className="gx-workflow-details">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 className="gx-workflow-title" style={{ margin: 0 }}>Editor Cohub</h3>
                    <span className="meta-pill" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>Recommended</span>
                  </div>
                  <p className="gx-workflow-desc">
                    Search verified video editors by format (Reels, YouTube, Ads), review cut portfolios, and add them to your team to assign client briefs immediately.
                  </p>
                </div>
              </button>

              {/* Option 2: Client Inbox */}
              <button
                type="button"
                className={`gx-workflow-card ${agencyData.firstWorkflow === "inbox" ? "is-active" : ""}`}
                onClick={() => updateAgency({ firstWorkflow: "inbox" })}
              >
                <div className="gx-workflow-icon">
                  <MessageSquare size={18} />
                </div>
                <div className="gx-workflow-details">
                  <h3 className="gx-workflow-title">Unified Client Inbox</h3>
                  <p className="gx-workflow-desc">
                    View active client conversations routed from WhatsApp Business and Instagram DM.
                  </p>
                </div>
              </button>

              {/* Option 3: Work Hub */}
              <button
                type="button"
                className={`gx-workflow-card ${agencyData.firstWorkflow === "project" ? "is-active" : ""}`}
                onClick={() => updateAgency({ firstWorkflow: "project" })}
              >
                <div className="gx-workflow-icon">
                  <Briefcase size={18} />
                </div>
                <div className="gx-workflow-details">
                  <h3 className="gx-workflow-title">Work Hub &amp; Deals</h3>
                  <p className="gx-workflow-desc">
                    Track stage Kanban: Inbound &rarr; Quotation &rarr; In Progress &rarr; Review &rarr; Delivered.
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              className="gx-btn-primary"
              onClick={handleFinishAgencyOnboarding}
            >
              {agencyData.firstWorkflow === "team" ? "Enter Editor Cohub →" : "Enter agency workspace →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= FREELANCER 4-STEP WIZARD =================
  return (
    <div className="gx-onboarding-card">
      {/* Top bar & Progress */}
      <div className="gx-onboarding-topbar">
        <div className="gx-onboarding-nav-row">
          {freelancerStep > 1 ? (
            <button
              type="button"
              className="gx-onboarding-back-btn"
              onClick={() => changeFreelancerStep(freelancerStep - 1)}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <span />
          )}
          <span className="gx-onboarding-step-indicator">
            Step <strong>{freelancerStep}</strong> of 4
          </span>
        </div>
        <div className="gx-progress-bar-track" role="progressbar" aria-valuenow={freelancerStep} aria-valuemin={1} aria-valuemax={4}>
          <div className="gx-progress-bar-fill" style={{ width: `${(freelancerStep / 4) * 100}%` }} />
        </div>
      </div>

      {/* STEP 1: Your editing focus */}
      {freelancerStep === 1 && (
        <div className="gx-form-stack">
          <div className="gx-onboarding-header">
            <p className="gx-onboarding-eyebrow">STEP 1: FOCUS</p>
            <h1 className="gx-onboarding-title">Your editing focus</h1>
            <p className="gx-onboarding-desc">
              Select the styles and formats you edit best. Agencies use this to match relevant assignments.
            </p>
          </div>

          <div className="gx-chip-grid">
            {[
              "Short-form (Reels / TikTok / Shorts)",
              "YouTube Long-form",
              "Motion Design & 2D/3D VFX",
              "Documentary & Storytelling",
              "Brand Commercials & Ads",
              "Gaming & Stream Highlights",
            ].map((focus) => {
              const selected = freelancerData.editingFocus.includes(focus);
              return (
                <button
                  key={focus}
                  type="button"
                  className={`gx-chip-btn ${selected ? "is-active" : ""}`}
                  onClick={() => {
                    const next = selected
                      ? freelancerData.editingFocus.filter((f) => f !== focus)
                      : [...freelancerData.editingFocus, focus];
                    updateFreelancer({ editingFocus: next });
                  }}
                >
                  {selected && <Check size={14} />} {focus}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="gx-btn-primary"
            disabled={freelancerData.editingFocus.length === 0}
            onClick={() => changeFreelancerStep(2)}
          >
            Continue to profile &rarr;
          </button>
        </div>
      )}

      {/* STEP 2: Your profile */}
      {freelancerStep === 2 && (
        <div className="gx-form-stack">
          <div className="gx-onboarding-header">
            <p className="gx-onboarding-eyebrow">STEP 2: PROFILE</p>
            <h1 className="gx-onboarding-title">Your profile</h1>
            <p className="gx-onboarding-desc">
              Your professional name and current availability.
            </p>
          </div>

          <div className="gx-field">
            <label className="gx-field-label" htmlFor="fl-name">
              <span>Display name</span>
            </label>
            <input
              id="fl-name"
              type="text"
              className="gx-input"
              placeholder="e.g. Maya Lin"
              value={freelancerData.displayName}
              onChange={(e) => updateFreelancer({ displayName: e.target.value })}
              required
            />
          </div>

          <div className="gx-field">
            <label className="gx-field-label" htmlFor="fl-headline">
              <span>Headline</span>
            </label>
            <input
              id="fl-headline"
              type="text"
              className="gx-input"
              placeholder="e.g. Senior Premiere & After Effects Editor · 4 yrs experience"
              value={freelancerData.headline}
              onChange={(e) => updateFreelancer({ headline: e.target.value })}
            />
          </div>

          <div className="gx-field">
            <label className="gx-field-label" htmlFor="fl-loc">
              <span>Location</span>
              <span className="gx-field-optional">Optional</span>
            </label>
            <input
              id="fl-loc"
              type="text"
              className="gx-input"
              placeholder="e.g. Mumbai, India or Remote"
              value={freelancerData.location}
              onChange={(e) => updateFreelancer({ location: e.target.value })}
            />
          </div>

          <div className="gx-field">
            <label className="gx-field-label">
              <span>Availability</span>
            </label>
            <div className="gx-chip-grid">
              {["Full-time available", "Part-time (15-25 hrs/wk)", "Available for project briefs"].map((avail) => (
                <button
                  key={avail}
                  type="button"
                  className={`gx-chip-btn ${freelancerData.availability === avail ? "is-active" : ""}`}
                  onClick={() => updateFreelancer({ availability: avail })}
                >
                  {freelancerData.availability === avail && <Check size={14} />} {avail}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="gx-btn-primary"
            disabled={!freelancerData.displayName.trim()}
            onClick={() => changeFreelancerStep(3)}
          >
            Continue to showcase &rarr;
          </button>
        </div>
      )}

      {/* STEP 3: Show your work */}
      {freelancerStep === 3 && (
        <div className="gx-form-stack">
          <div className="gx-onboarding-header">
            <p className="gx-onboarding-eyebrow">STEP 3: SHOWCASE</p>
            <h1 className="gx-onboarding-title">Show your work</h1>
            <p className="gx-onboarding-desc">
              Link your editing portfolio and select the software you work in daily.
            </p>
          </div>

          <div className="gx-field">
            <label className="gx-field-label" htmlFor="fl-portfolio">
              <span>Portfolio or Showcase URL</span>
              <span className="gx-field-optional">Optional</span>
            </label>
            <input
              id="fl-portfolio"
              type="url"
              className="gx-input"
              placeholder="https://vimeo.com/... or Google Drive / YouTube"
              value={freelancerData.portfolioUrl}
              onChange={(e) => updateFreelancer({ portfolioUrl: e.target.value })}
            />
          </div>

          <div className="gx-field">
            <label className="gx-field-label">
              <span>Editing tools &amp; software</span>
            </label>
            <div className="gx-chip-grid">
              {[
                "Adobe Premiere Pro",
                "Adobe After Effects",
                "DaVinci Resolve",
                "CapCut Desktop",
                "Final Cut Pro",
                "Blender / Cinema 4D",
                "Photoshop",
              ].map((tool) => {
                const selected = freelancerData.toolsUsed.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    className={`gx-chip-btn ${selected ? "is-active" : ""}`}
                    onClick={() => {
                      const next = selected
                        ? freelancerData.toolsUsed.filter((t) => t !== tool)
                        : [...freelancerData.toolsUsed, tool];
                      updateFreelancer({ toolsUsed: next });
                    }}
                  >
                    {selected && <Check size={14} />} {tool}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="gx-btn-primary"
            onClick={() => changeFreelancerStep(4)}
          >
            Review workspace &rarr;
          </button>
        </div>
      )}

      {/* STEP 4: Your Gigxomi workspace */}
      {freelancerStep === 4 && (
        <div className="gx-form-stack">
          <div className="gx-onboarding-header">
            <p className="gx-onboarding-eyebrow">STEP 4: READY</p>
            <h1 className="gx-onboarding-title">Your Gigxomi workspace</h1>
            <p className="gx-onboarding-desc">
              Your profile is registered and ready.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(215, 255, 47, 0.1)",
                  display: "grid",
                  placeItems: "center",
                  color: "#d7ff2f",
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "1rem", color: "#f5f7fa" }}>
                  {freelancerData.displayName || "Video Editor"}
                </strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#8f9689" }}>
                  {freelancerData.headline || "Video Editing Specialist"}
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.55, color: "#a8aea2" }}>
              When agencies assign you to projects, you will receive briefs and footage context directly in your dashboard, collaborate internally with team managers, and submit video cuts for review.
            </p>
          </div>

          <button
            type="button"
            className="gx-btn-primary"
            onClick={handleFinishFreelancerOnboarding}
          >
            Open Editor Workspace &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
