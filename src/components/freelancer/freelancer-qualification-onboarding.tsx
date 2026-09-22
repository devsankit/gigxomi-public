"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  Crown,
  FileVideo,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "./freelancer-qualification-onboarding.module.css";

type Question = {
  id: string;
  competency: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
};

type OnboardingState = {
  completed: boolean;
  currentStep: number;
  categories: string[];
  selectedCategories: { primary: string | null; secondary: string[] };
  service: Record<string, unknown> | null;
  assessment: { submitted: boolean; score: number | null; questions: Question[] };
  profile: Record<string, unknown>;
  drafts: {
    service: Record<string, unknown>;
    profile: Record<string, unknown>;
    answers: Record<string, string>;
  };
  identity: {
    status: string;
    verified: boolean;
    skipped: boolean;
    verifiedName: string | null;
    documentType: string | null;
  };
  trust: { score: number; provisional: boolean };
};

type SessionPlanInfo = {
  packageName: string;
  statusText: string;
  isTrial: boolean;
  daysRemaining: number | null;
};

const emptyService = {
  title: "",
  summary: "",
  description: "",
  targetAudience: "",
  deliveryTime: "",
  revisions: "",
  basePrice: "",
  tags: "",
  deliverables: "",
  sampleVideoUrl: "",
  primaryCategory: "",
  secondaryCategories: [] as string[],
};

const emptyProfile = {
  fullName: "",
  displayName: "",
  profession: "",
  profileImageUrl: "",
  bio: "",
  experience: "",
  languages: "",
  location: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  availability: "",
};

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Something went wrong.");
  }
  return payload;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function isSupportedPortfolioUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return (
      hostname === "youtu.be" ||
      hostname.endsWith("youtube.com") ||
      hostname.endsWith("instagram.com") ||
      hostname === "drive.google.com"
    );
  } catch {
    return false;
  }
}

function readDraft<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function FreelancerQualificationOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [step, setStep] = useState(1);
  const [service, setService] = useState(emptyService);
  const [profile, setProfile] = useState(emptyProfile);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [digiLockerAvailable, setDigiLockerAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [planInfo, setPlanInfo] = useState<SessionPlanInfo>({
    packageName: "Freelancer Standard",
    statusText: "Active",
    isTrial: false,
    daysRemaining: null,
  });

  async function load() {
    const payload = await jsonRequest("/api/freelancer/onboarding");
    const next = payload.onboarding as OnboardingState;
    setState(next);
    setStep(next.completed ? 3 : next.currentStep);

    const savedService =
      typeof window !== "undefined"
        ? readDraft<typeof emptyService>("gx-freelancer-onboarding-service")
        : null;
    const serverServiceDraft = next.drafts?.service as Partial<typeof emptyService> | undefined;
    const serviceRecord = next.service ?? {};

    setService(
      savedService ?? {
        ...{
          title: asText(serviceRecord.title),
          summary: asText(serviceRecord.summary),
          description: asText(serviceRecord.description),
          targetAudience: asText(serviceRecord.targetAudience),
          deliveryTime: asText(serviceRecord.deliveryTime),
          revisions: asText(serviceRecord.revisions),
          basePrice: serviceRecord.basePrice ? String(serviceRecord.basePrice) : "",
          tags: asList(serviceRecord.tags),
          deliverables: asList(serviceRecord.deliverables),
          sampleVideoUrl: Array.isArray(serviceRecord.media)
            ? asText((serviceRecord.media[0] as Record<string, unknown>)?.sourceUrl)
            : "",
          primaryCategory: next.selectedCategories.primary ?? asText(serviceRecord.specialty),
          secondaryCategories: next.selectedCategories.secondary,
        },
        ...serverServiceDraft,
      }
    );

    const p = next.profile;
    const serverProfile = {
      fullName: asText(p.fullName),
      displayName: asText(p.displayName),
      profession: asText(p.profession),
      profileImageUrl: asText(p.profileImageUrl),
      bio: asText(p.bio),
      experience: asText(p.experience),
      languages: asList(p.languages),
      location: asText(p.location),
      timezone: asText(p.timezone) || emptyProfile.timezone,
      availability: asText(p.availability),
    };
    const serverProfileDraft = next.drafts?.profile as Partial<typeof emptyProfile> | undefined;
    setProfile(
      typeof window !== "undefined"
        ? readDraft<typeof emptyProfile>("gx-freelancer-onboarding-profile") ?? {
            ...serverProfile,
            ...serverProfileDraft,
          }
        : { ...serverProfile, ...serverProfileDraft }
    );

    if (typeof window !== "undefined") {
      setAnswers(
        readDraft<Record<string, string>>("gx-freelancer-onboarding-answers") ??
          next.drafts?.answers ??
          {}
      );
    }
    if (next.assessment.questions.length) {
      setQuestions(next.assessment.questions);
    }
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));

    // Fetch session for Plan Pill & Trial Days info
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!payload?.session) return;
        const s = payload.session as {
          packageName?: string | null;
          packageStatus?: string | null;
          packageExpiresAt?: string | null;
          workspaceMode?: string | null;
        };
        const pkgName =
          s.packageName?.trim() ||
          (s.workspaceMode === "FREELANCER" ? "Freelancer Pro" : "Freelancer Workspace");
        let daysRemaining: number | null = null;
        let isTrial = false;
        if (s.packageExpiresAt) {
          const diff = new Date(s.packageExpiresAt).getTime() - Date.now();
          daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
        if (s.packageStatus === "TRIALING" || (daysRemaining !== null && daysRemaining <= 14)) {
          isTrial = true;
        }
        const statusText =
          daysRemaining !== null
            ? `${isTrial ? "Trial: " : ""}${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
            : s.packageStatus || "Active";
        setPlanInfo({
          packageName: pkgName,
          statusText,
          isTrial,
          daysRemaining,
        });
      })
      .catch(() => undefined);

    void jsonRequest("/api/freelancer/onboarding/identity/authorize")
      .then((payload) => {
        const available = Boolean(payload.available);
        setDigiLockerAvailable(available);
        setDocumentTypes(available ? payload.documentTypes : []);
        setDocumentType(available ? payload.documentTypes[0] ?? "" : "");
      })
      .catch(() => setDigiLockerAvailable(false));
  }, []);

  useEffect(() => {
    const refreshProgress = () => {
      if (document.visibilityState !== "visible") return;
      void load().catch((error) => setMessage(error.message));
    };
    window.addEventListener("focus", refreshProgress);
    document.addEventListener("visibilitychange", refreshProgress);
    return () => {
      window.removeEventListener("focus", refreshProgress);
      document.removeEventListener("visibilitychange", refreshProgress);
    };
  }, []);

  useEffect(() => {
    if (state?.currentStep === 2 && typeof window !== "undefined") {
      localStorage.setItem("gx-freelancer-onboarding-service", JSON.stringify(service));
    }
  }, [service, state?.currentStep]);

  useEffect(() => {
    if (state?.completed === false && typeof window !== "undefined") {
      localStorage.setItem("gx-freelancer-onboarding-profile", JSON.stringify(profile));
    }
  }, [profile, state?.completed]);

  useEffect(() => {
    if (state?.assessment.submitted === false && typeof window !== "undefined") {
      localStorage.setItem("gx-freelancer-onboarding-answers", JSON.stringify(answers));
    }
  }, [answers, state?.assessment.submitted]);

  useEffect(() => {
    if (!state || state.completed) return;
    const draft = step === 1 ? profile : step === 2 ? service : answers;
    const stage = step === 1 ? "profile" : step === 2 ? "service" : "assessment";
    const timer = window.setTimeout(() => {
      void jsonRequest("/api/freelancer/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ stage, draft }),
      })
        .then((payload) =>
          setLastSaved(
            new Date(payload.savedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          )
        )
        .catch(() => setLastSaved("Pending connection"));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [answers, profile, service, state, step]);

  const progress = useMemo(
    () => (state?.completed ? 100 : step === 1 ? 25 : step === 2 ? 60 : 90),
    [state?.completed, step]
  );

  async function handleSkipToDashboard() {
    setBusy(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("gx_freelancer_skipped", "1");
        document.cookie = "gx_freelancer_skipped=1; path=/; max-age=31536000; SameSite=Lax";
      }
      await fetch("/api/freelancer/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip", stage: "skip" }),
      }).catch(() => undefined);
    } finally {
      router.push("/freelancer");
    }
  }

  async function submitService() {
    if (!isSupportedPortfolioUrl(service.sampleVideoUrl)) {
      setMessage("Portfolio video: paste a playable YouTube, Instagram, or Google Drive link.");
      document.getElementById("portfolio-video-url")?.focus();
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest("/api/freelancer/onboarding/service", {
        method: "POST",
        body: JSON.stringify(service),
      });
      localStorage.removeItem("gx-freelancer-onboarding-service");
      const assessment = await jsonRequest("/api/freelancer/onboarding/assessment");
      setQuestions(assessment.assessment.questions);
      setStep(3);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit service.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAssessment() {
    if (questions.some((question) => !answers[question.id])) {
      setMessage("Answer all ten questions before continuing.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest("/api/freelancer/onboarding/assessment", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      localStorage.removeItem("gx-freelancer-onboarding-answers");
      setAnswers({});
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit assessment.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("avatar", file);
    try {
      const response = await fetch("/api/freelancer/onboarding/avatar", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setProfile((current) => ({ ...current, profileImageUrl: payload.profileImageUrl }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload photo.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest("/api/freelancer/onboarding/profile", {
        method: "POST",
        body: JSON.stringify(profile),
      });
      localStorage.removeItem("gx-freelancer-onboarding-profile");
      if (!documentTypes.length) {
        const payload = await jsonRequest("/api/freelancer/onboarding/identity/authorize");
        const available = Boolean(payload.available);
        setDigiLockerAvailable(available);
        setDocumentTypes(available ? payload.documentTypes : []);
        setDocumentType(available ? payload.documentTypes[0] ?? "" : "");
      }
      await load();
      setStep(2);
      setMessage("Profile saved. Continue to your portfolio or skip to dashboard anytime.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function startDigiLocker() {
    setBusy(true);
    setMessage("");
    try {
      const payload = await jsonRequest("/api/freelancer/onboarding/identity/authorize", {
        method: "POST",
        body: JSON.stringify({ documentType }),
      });
      window.location.assign(payload.authorizeUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect DigiLocker.");
      setBusy(false);
    }
  }

  async function skipIdentity() {
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest("/api/freelancer/onboarding/identity/skip", { method: "POST", body: "{}" });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to skip verification.");
    } finally {
      setBusy(false);
    }
  }

  function updateService(key: keyof typeof emptyService, value: string | string[]) {
    setService((current) => ({ ...current, [key]: value }));
  }

  function updateProfile(key: keyof typeof emptyProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  if (!state) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <Loader2 className={styles.spin} /> Preparing your editor workspace…
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambient} />

      {/* Modern Gigxomi Onboarding Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link className={styles.brandLink} href="/">
            <Sparkles size={18} color="var(--lime)" />
            <span className={styles.brandLogo}>GIGXOMI</span>
            <span className={styles.brandTag}>Editor Workspace</span>
          </Link>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.planInfoPill}>
            <Crown size={14} color="var(--lime)" />
            <span className={styles.planName}>{planInfo.packageName}</span>
            <span className={styles.planStatus}>{planInfo.statusText}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {lastSaved ? <span className={styles.saveTime}>Autosaved {lastSaved}</span> : null}
          <button
            className={styles.headerSkipBtn}
            disabled={busy}
            onClick={handleSkipToDashboard}
            title="Skip onboarding and go directly to workspace"
            type="button"
          >
            Skip for now &rarr;
          </button>
          <a
            className={styles.headerLogoutBtn}
            href="/api/auth/logout"
            title="Sign out of Gigxomi"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </a>
        </div>
      </header>

      <section className={styles.shell}>
        <div className={styles.progressHeader}>
          <div>
            <p>Freelancer onboarding &amp; qualification</p>
            <h1>
              {state.completed
                ? "Your Trust Score is ready for review."
                : step === 1
                ? "Complete the person behind the work."
                : step === 2
                ? "Show agencies what you do best."
                : "Build your starting Trust Score."}
            </h1>
          </div>
          <span>Stage {step} of 3</span>
        </div>

        <div className={styles.track}>
          <i style={{ width: `${progress}%` }} />
        </div>

        <nav aria-label="Onboarding progress" className={styles.steps}>
          {[
            { icon: UserRound, label: "Profile & identity" },
            { icon: FileVideo, label: "Portfolio & service" },
            { icon: Sparkles, label: "Dynamic Q&A & Trust" },
          ].map((item, index) => (
            <div
              className={`${styles.step} ${step >= index + 1 ? styles.active : ""}`}
              key={item.label}
              onClick={() => {
                if (state.completed) return;
                setStep(index + 1);
              }}
              style={{ cursor: state.completed ? "default" : "pointer" }}
              title={`Jump to step ${index + 1}: ${item.label}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {step > index + 1 || state.completed ? <Check size={15} /> : null}
            </div>
          ))}
        </nav>

        {/* Step 1: Profile & Identity */}
        {step === 1 && !state.completed ? (
          <section className={styles.panel}>
            <div className={styles.panelIntro}>
              <p>01 / PROFILE &amp; IDENTITY</p>
              <h2>Put a real, accountable profile behind your work.</h2>
              <span>
                Start with your professional profile. DigiLocker is optional; you may verify now or skip anytime.
              </span>
            </div>
            <div className={styles.profileLayout}>
              <div className={styles.avatarCard}>
                {profile.profileImageUrl ? (
                  <Image
                    alt="Profile preview"
                    height={118}
                    src={profile.profileImageUrl}
                    unoptimized
                    width={118}
                  />
                ) : (
                  <UserRound size={46} />
                )}
                <label>
                  <Upload size={16} /> Upload profile photo
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                <span>JPG, PNG or WebP · max 5 MB</span>
              </div>
              <div className={styles.grid}>
                <Field
                  label="Proper full name"
                  onChange={(value) => updateProfile("fullName", value)}
                  placeholder="As shown on your government document"
                  value={profile.fullName}
                />
                <Field
                  label="Public display name"
                  onChange={(value) => updateProfile("displayName", value)}
                  placeholder="Name agencies will see"
                  value={profile.displayName}
                />
                <label className={styles.field}>
                  <span>Primary profession</span>
                  <select
                    onChange={(event) => updateProfile("profession", event.target.value)}
                    value={profile.profession}
                  >
                    <option value="">Choose your strongest editing lane</option>
                    {state.categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <TextArea
                  label="Professional bio"
                  onChange={(value) => updateProfile("bio", value)}
                  placeholder="Describe your strongest work, process and client experience."
                  value={profile.bio}
                />
                <TextArea
                  label="Experience"
                  onChange={(value) => updateProfile("experience", value)}
                  placeholder="3 years · creator channels, podcasts and agency retainers"
                  value={profile.experience}
                />
                <Field
                  label="Languages"
                  onChange={(value) => updateProfile("languages", value)}
                  placeholder="English, Hindi"
                  value={profile.languages}
                />
                <Field
                  label="Location"
                  onChange={(value) => updateProfile("location", value)}
                  placeholder="Indore, India"
                  value={profile.location}
                />
                <Field
                  label="Timezone"
                  onChange={(value) => updateProfile("timezone", value)}
                  placeholder="Asia/Kolkata"
                  value={profile.timezone}
                />
                <Field
                  label="Availability"
                  onChange={(value) => updateProfile("availability", value)}
                  placeholder="30 hours/week · weekdays"
                  value={profile.availability}
                />
              </div>
            </div>

            <div className={styles.identityCard}>
              <div>
                <ShieldCheck size={25} />
                <div>
                  <strong>DigiLocker identity verification (Optional)</strong>
                  <span>
                    Authorize one supported government document. Gigxomi stores verification metadata, not your raw document.
                  </span>
                </div>
              </div>
              {state.identity.verified ? (
                <div className={styles.verified}>
                  <BadgeCheck size={18} /> Gigxomi Identity Verified · {state.identity.documentType}
                </div>
              ) : state.identity.skipped ? (
                <div className={styles.skipped}>
                  Skipped for now · you can verify later anytime from profile settings.
                </div>
              ) : (
                <div className={styles.identityActions}>
                  {digiLockerAvailable ? (
                    <>
                      <select
                        onChange={(event) => setDocumentType(event.target.value)}
                        value={documentType}
                      >
                        {documentTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                      <button
                        disabled={busy || !documentType}
                        onClick={startDigiLocker}
                        type="button"
                      >
                        Verify with DigiLocker <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <span>
                      DigiLocker verification will appear here when Gigxomi&apos;s requester connection is enabled.
                    </span>
                  )}
                  <button disabled={busy} onClick={skipIdentity} type="button">
                    Skip verification
                  </button>
                </div>
              )}
            </div>

            <div className={styles.actionRow}>
              <button
                className={styles.secondaryAction}
                disabled={busy}
                onClick={handleSkipToDashboard}
                type="button"
              >
                Skip for now &amp; Go to Dashboard &rarr;
              </button>
              <div className={styles.actionRowRight}>
                <button
                  className={styles.primaryAction}
                  disabled={busy}
                  onClick={saveProfile}
                  type="button"
                >
                  {busy ? <Loader2 className={styles.spin} size={18} /> : null}
                  Save profile &amp; Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Step 2: Portfolio & Service */}
        {step === 2 && !state.completed ? (
          <section className={styles.panel}>
            <div className={styles.panelIntro}>
              <p>02 / PORTFOLIO &amp; SERVICE</p>
              <h2>List one focused editing service.</h2>
              <span>
                Your portfolio stays private until Gigxomi admin review approves it for marketplace visibility.
              </span>
            </div>
            <div className={styles.grid}>
              <Field
                label="Service title"
                onChange={(value) => updateService("title", value)}
                placeholder="I will edit retention-focused YouTube videos"
                value={service.title}
              />
              <label className={styles.field}>
                <span>Primary editor category</span>
                <select
                  onChange={(event) => updateService("primaryCategory", event.target.value)}
                  value={service.primaryCategory}
                >
                  <option value="">Choose your strongest lane</option>
                  {state.categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <Field
                label="One-line summary"
                onChange={(value) => updateService("summary", value)}
                placeholder="Clean story edits for creator-led channels"
                value={service.summary}
                wide
              />
              <label className={`${styles.field} ${styles.wide}`}>
                <span>Secondary categories · choose up to two</span>
                <div className={styles.categoryGrid}>
                  {state.categories
                    .filter((category) => category !== service.primaryCategory)
                    .map((category) => {
                      const selected = service.secondaryCategories.includes(category);
                      return (
                        <button
                          className={selected ? styles.categorySelected : ""}
                          key={category}
                          onClick={() =>
                            updateService(
                              "secondaryCategories",
                              selected
                                ? service.secondaryCategories.filter((item) => item !== category)
                                : service.secondaryCategories.length < 2
                                ? [...service.secondaryCategories, category]
                                : service.secondaryCategories
                            )
                          }
                          type="button"
                        >
                          {selected ? <Check size={14} /> : null}
                          {category}
                        </button>
                      );
                    })}
                </div>
              </label>
              <TextArea
                label="Service description"
                onChange={(value) => updateService("description", value)}
                placeholder="Describe your workflow, outcome and the client this is best for."
                value={service.description}
              />
              <TextArea
                label="Deliverables · one per line"
                onChange={(value) => updateService("deliverables", value)}
                placeholder={"Final master\nProject archive\nTwo revision rounds"}
                value={service.deliverables}
              />
              <Field
                label="Best for"
                onChange={(value) => updateService("targetAudience", value)}
                placeholder="YouTube agencies and creator teams"
                value={service.targetAudience}
              />
              <label className={styles.field}>
                <span>Portfolio video URL</span>
                <input
                  id="portfolio-video-url"
                  onChange={(event) => updateService("sampleVideoUrl", event.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  value={service.sampleVideoUrl}
                />
                <small style={{ color: "#7f887f", fontSize: 11, lineHeight: 1.45 }}>
                  Playable YouTube, Instagram, or Google Drive link only.
                </small>
              </label>
              <Field
                label="Delivery time"
                onChange={(value) => updateService("deliveryTime", value)}
                placeholder="3 business days"
                value={service.deliveryTime}
              />
              <Field
                label="Revisions"
                onChange={(value) => updateService("revisions", value)}
                placeholder="2 revisions included"
                value={service.revisions}
              />
              <Field
                label="Starting price (INR)"
                onChange={(value) => updateService("basePrice", value)}
                placeholder="2500"
                value={service.basePrice}
              />
              <Field
                label="Search tags"
                onChange={(value) => updateService("tags", value)}
                placeholder="youtube, retention, b-roll"
                value={service.tags}
              />
            </div>
            <div className={styles.actionRow}>
              <button className={styles.back} onClick={() => setStep(1)} type="button">
                <ChevronLeft size={17} /> Back
              </button>
              <div className={styles.actionRowRight}>
                <button
                  className={styles.secondaryAction}
                  disabled={busy}
                  onClick={handleSkipToDashboard}
                  type="button"
                >
                  Skip for now &amp; Go to Dashboard &rarr;
                </button>
                <button
                  className={styles.primaryAction}
                  disabled={busy}
                  onClick={submitService}
                  type="button"
                >
                  {busy ? <Loader2 className={styles.spin} size={18} /> : null}
                  Submit portfolio &amp; Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Step 3: Dynamic Q&A */}
        {step === 3 && !state.completed ? (
          <section className={styles.panel}>
            <div className={styles.panelIntro}>
              <p>03 / DYNAMIC Q&amp;A</p>
              <h2>Ten private questions. One Trust Score.</h2>
              <span>
                Your set is selected from the assessment bank for{" "}
                {service.primaryCategory || state.selectedCategories.primary} and covers expertise,
                tools, QA, communication, and file security.
              </span>
            </div>
            <div className={styles.questions}>
              {questions.map((question, index) => (
                <fieldset className={styles.question} key={question.id}>
                  <legend>
                    <em>{String(index + 1).padStart(2, "0")}</em>
                    <span>{question.prompt}</span>
                  </legend>
                  {question.options.map((option) => (
                    <label
                      className={answers[question.id] === option.id ? styles.answerSelected : ""}
                      key={option.id}
                    >
                      <input
                        checked={answers[question.id] === option.id}
                        name={question.id}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: option.id }))
                        }
                        type="radio"
                      />
                      <i />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <div className={styles.actionRow}>
              <button className={styles.back} onClick={() => setStep(2)} type="button">
                <ChevronLeft size={17} /> Back
              </button>
              <div className={styles.actionRowRight}>
                <button
                  className={styles.secondaryAction}
                  disabled={busy}
                  onClick={handleSkipToDashboard}
                  type="button"
                >
                  Skip for now &amp; Go to Dashboard &rarr;
                </button>
                <button
                  className={styles.primaryAction}
                  disabled={busy}
                  onClick={submitAssessment}
                  type="button"
                >
                  {busy ? <Loader2 className={styles.spin} size={18} /> : null}
                  Calculate Trust Score <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Completed State */}
        {state.completed ? (
          <section className={styles.panel}>
            <div className={styles.complete}>
              <BadgeCheck size={38} />
              <div>
                <strong>Trust Score calculated · admin review pending</strong>
                <span>
                  Your onboarding is complete. Your service remains private until Gigxomi approves
                  the submitted portfolio; only then can it appear in General editor search and the
                  marketplace.
                </span>
              </div>
              <Link href="/freelancer">
                Open workspace <ArrowRight size={17} />
              </Link>
            </div>
          </section>
        ) : null}

        {message ? (
          <div className={styles.message} role="status">
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <label className={`${styles.field} ${wide ? styles.wide : ""}`}>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className={`${styles.field} ${styles.wide}`}>
      <span>{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
