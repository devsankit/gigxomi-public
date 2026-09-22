"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDashed,
  CreditCard,
  FileBadge2,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { FreelancerProjectTrackingKanban } from "@/components/freelancer/freelancer-project-tracking-kanban";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { InternalAppShell } from "@/components/ui/internal-app-shell";

import {
  dashboardSummary,
  freelancerActionQueue,
  freelancerNavItems,
  karmaMetrics,
  monetizationPlans,
  onboardingWizardSteps,
  payoutRequests,
  payoutRules,
  profileData,
  serviceDraftSections,
  services,
  type FreelancerSection,
  type WizardStepId,
  verificationChecklist,
  walletLedger,
  walletOverview,
} from "@/lib/gigxomi/freelancer-data";

const stepOrder: WizardStepId[] = ["signup", "profile", "payment", "finish"];

const navIcons: Record<FreelancerSection, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  "add-service": PlusCircle,
  "draft-services": Sparkles,
  "published-services": Sparkles,
  "apply-work": BriefcaseBusiness,
  chats: MessageSquareText,
  services: Sparkles,
  "portfolio-drafts": Sparkles,
  profile: UserRound,
  wallet: WalletCards,
  payouts: Banknote,
};

const sectionTitles: Record<FreelancerSection, string> = {
  dashboard: "Dashboard",
  projects: "Project Tracking",
  "add-service": "Add Service",
  "draft-services": "Draft Services",
  "published-services": "Published Services",
  "apply-work": "Apply for Work",
  chats: "Chats",
  services: "My Services",
  "portfolio-drafts": "Portfolio Drafts",
  profile: "Profile",
  wallet: "Wallet",
  payouts: "Payouts",
};

type WorkspaceProps = {
  initialOnboarded?: boolean;
  initialSection?: FreelancerSection;
};

type SignupMethod = "google" | "email";

type RegistrationModalProps = {
  isOpen: boolean;
  mode: "overlay" | "page";
  onClose?: () => void;
  onComplete: (section: FreelancerSection) => void;
};

function normalizeSection(section?: FreelancerSection | string): FreelancerSection {
  if (section && section in sectionTitles) {
    return section as FreelancerSection;
  }

  return "dashboard";
}

export function FreelancerRegistrationModal({ isOpen, mode, onClose, onComplete }: RegistrationModalProps) {
  const [wizardStep, setWizardStep] = useState<WizardStepId>("signup");
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("google");
  const [phone, setPhone] = useState(profileData.phone);
  const [fullName, setFullName] = useState(profileData.fullName);
  const [username, setUsername] = useState(profileData.username);
  const [profession, setProfession] = useState(profileData.profession);
  const [languages, setLanguages] = useState(profileData.languages);
  const [bio, setBio] = useState(profileData.bio);
  const [selectedPlan, setSelectedPlan] = useState(monetizationPlans[0]?.id ?? "standard");

  const currentStepIndex = stepOrder.indexOf(wizardStep);

  useEffect(() => {
    if (!isOpen || !onClose) {
      return;
    }

    const closeModal = onClose;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function moveStep(direction: "next" | "previous") {
    const currentIndex = stepOrder.indexOf(wizardStep);
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const nextStep = stepOrder[nextIndex];

    if (nextStep) {
      setWizardStep(nextStep);
    }
  }

  return (
    <div className={mode === "overlay" ? "freelancer-modal-overlay" : "freelancer-modal-page"}>
      {mode === "overlay" ? <button aria-label="Close freelancer registration" className="freelancer-modal-scrim" onClick={onClose} type="button" /> : null}
      <section className={mode === "overlay" ? "freelancer-modal-shell" : "freelancer-modal-shell route"}>
        <div className="freelancer-modal-head">
          <div>
            <p className="app-page-kicker">Freelancer registration</p>
            <h1 className="app-page-title">Start light, then move into the freelancer app.</h1>
            <p className="app-copy freelancer-modal-copy">Create the account, add the essentials, choose a plan, then continue.</p>
          </div>
          {onClose ? (
            <button aria-label="Close freelancer registration" className="freelancer-modal-close" onClick={onClose} type="button">
              <X size={16} strokeWidth={1.8} />
            </button>
          ) : null}
        </div>

        <div className="freelancer-modal-progress">
          {onboardingWizardSteps.map((step, index) => (
            <button
              className={index === currentStepIndex ? "freelancer-modal-step active" : index < currentStepIndex ? "freelancer-modal-step done" : "freelancer-modal-step"}
              key={step.id}
              onClick={() => setWizardStep(step.id)}
              type="button"
            >
              <span>{index < currentStepIndex ? <Check size={12} strokeWidth={2.2} /> : index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.title}</small>
              </div>
            </button>
          ))}
        </div>

        <div className="freelancer-modal-body">
          <aside className="freelancer-modal-aside">
            <p className="app-page-kicker">Current step</p>
            <h2 className="app-section-title">{onboardingWizardSteps[currentStepIndex]?.title}</h2>
            <p className="app-copy">{onboardingWizardSteps[currentStepIndex]?.description}</p>

            <div className="freelancer-modal-checkpoints">
              <div className="freelancer-modal-checkpoint">
                <strong>1. Register</strong>
                <span>Use Google or email and add your working phone number.</span>
              </div>
              <div className="freelancer-modal-checkpoint">
                <strong>2. Build profile</strong>
                <span>Add your public identity, profession, and short bio.</span>
              </div>
              <div className="freelancer-modal-checkpoint">
                <strong>3. Pick plan</strong>
                <span>Choose standard commission or the lower-fee subscription plan.</span>
              </div>
            </div>
          </aside>

          <section className="freelancer-modal-panel">
            {wizardStep === "signup" ? (
              <div className="freelancer-stage">
                <div className="freelancer-stage-head">
                  <div>
                    <p className="section-label">Signup</p>
                    <h2 className="app-section-title">Choose how the freelancer account should start.</h2>
                  </div>
                </div>

                <div className="freelancer-choice-grid">
                  <button
                    className={signupMethod === "google" ? "freelancer-choice-card active" : "freelancer-choice-card"}
                    onClick={() => setSignupMethod("google")}
                    type="button"
                  >
                    <BadgeCheck size={18} strokeWidth={1.8} />
                    <strong>Continue with Google</strong>
                    <span>Fastest route for editors. Phone number is still required after OAuth.</span>
                  </button>
                  <button
                    className={signupMethod === "email" ? "freelancer-choice-card active" : "freelancer-choice-card"}
                    onClick={() => setSignupMethod("email")}
                    type="button"
                  >
                    <CircleDashed size={18} strokeWidth={1.8} />
                    <strong>Email and password</strong>
                    <span>Use a dedicated Gigxomi login instead of Google auth.</span>
                  </button>
                </div>

                <div className="freelancer-form-grid">
                  <label className="freelancer-field">
                    <span>Email</span>
                    <input defaultValue="testingfreelancer@gmail.com" placeholder="your@email.com" />
                  </label>
                  <label className="freelancer-field">
                    <span>Phone number</span>
                    <input onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp-ready number" value={phone} />
                  </label>
                  <label className="freelancer-field">
                    <span>Password</span>
                    <input placeholder="Create password" type="password" />
                  </label>
                  <label className="freelancer-field">
                    <span>Confirm password</span>
                    <input placeholder="Repeat password" type="password" />
                  </label>
                </div>
              </div>
            ) : null}

            {wizardStep === "profile" ? (
              <div className="freelancer-stage">
                <div className="freelancer-stage-head">
                  <div>
                    <p className="section-label">Profile basics</p>
                    <h2 className="app-section-title">Set the public identity managers and clients will recognise.</h2>
                  </div>
                </div>

                <div className="freelancer-form-grid">
                  <label className="freelancer-field">
                    <span>Full name</span>
                    <input onChange={(event) => setFullName(event.target.value)} value={fullName} />
                  </label>
                  <label className="freelancer-field">
                    <span>Username</span>
                    <input onChange={(event) => setUsername(event.target.value)} value={username} />
                  </label>
                  <label className="freelancer-field">
                    <span>Profession</span>
                    <input onChange={(event) => setProfession(event.target.value)} value={profession} />
                  </label>
                  <label className="freelancer-field">
                    <span>Languages</span>
                    <input onChange={(event) => setLanguages(event.target.value)} value={languages} />
                  </label>
                  <label className="freelancer-field freelancer-field-full">
                    <span>Short bio</span>
                    <textarea onChange={(event) => setBio(event.target.value)} value={bio} />
                  </label>
                </div>

                <div className="freelancer-inline-note">
                  <ShieldCheck size={15} strokeWidth={1.8} />
                  <span>Verification continues inside Profile after account creation. You can start the app first, then submit ID there.</span>
                </div>
              </div>
            ) : null}

            {wizardStep === "payment" ? (
              <div className="freelancer-stage">
                <div className="freelancer-stage-head">
                  <div>
                    <p className="section-label">Plan selection</p>
                    <h2 className="app-section-title">Choose how Gigxomi should bill and settle your work.</h2>
                  </div>
                </div>

                <div className="freelancer-plan-grid">
                  {monetizationPlans.map((plan) => (
                    <button
                      className={selectedPlan === plan.id ? "freelancer-plan-card selectable active" : "freelancer-plan-card selectable"}
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      type="button"
                    >
                      <span className="meta-pill">{plan.badge}</span>
                      <strong>{plan.name}</strong>
                      <p>{plan.description}</p>
                      <b>{plan.effectiveFee} effective fee</b>
                    </button>
                  ))}
                </div>

                <div className="freelancer-form-grid">
                  <label className="freelancer-field">
                    <span>Bank account holder</span>
                    <input placeholder="Account holder name" />
                  </label>
                  <label className="freelancer-field">
                    <span>Bank account number</span>
                    <input placeholder="Account number" />
                  </label>
                  <label className="freelancer-field">
                    <span>Bank name</span>
                    <input placeholder="Bank name" />
                  </label>
                  <label className="freelancer-field">
                    <span>IFSC / routing code</span>
                    <input placeholder="Routing number" />
                  </label>
                </div>
              </div>
            ) : null}

            {wizardStep === "finish" ? (
              <div className="freelancer-stage">
                <div className="freelancer-stage-head">
                  <div>
                    <p className="section-label">Finish</p>
                    <h2 className="app-section-title">Account basics are done. Move into the freelancer app shell.</h2>
                  </div>
                </div>

                <div className="freelancer-summary-grid">
                  <article className="freelancer-summary-card">
                    <strong>Next step</strong>
                    <p>Create the first service draft. Public listing still waits for verification and admin approval.</p>
                  </article>
                  <article className="freelancer-summary-card">
                    <strong>Verification</strong>
                    <p>Profile now carries the verification block, review status, and `Verify profile` action.</p>
                  </article>
                  <article className="freelancer-summary-card">
                    <strong>Dashboard</strong>
                    <p>The app opens into reports, karma score, chats, and wallet summaries instead of onboarding forms.</p>
                  </article>
                </div>

                <div className="freelancer-complete-actions">
                  <button className="freelancer-primary-button" onClick={() => onComplete("add-service")} type="button">
                    Create first service
                  </button>
                  <button className="freelancer-secondary-button" onClick={() => onComplete("dashboard")} type="button">
                    Open dashboard
                  </button>
                </div>
              </div>
            ) : null}

            <div className="freelancer-wizard-actions">
              <button className="freelancer-secondary-button" disabled={currentStepIndex === 0} onClick={() => moveStep("previous")} type="button">
                Previous
              </button>
              {wizardStep !== "finish" ? (
                <button className="freelancer-primary-button" onClick={() => moveStep("next")} type="button">
                  Continue
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export function FreelancerWorkspace({ initialOnboarded = false, initialSection = "dashboard" }: WorkspaceProps) {
  const [isOnboarded, setIsOnboarded] = useState(initialOnboarded);
  const [currentSection, setCurrentSection] = useState<FreelancerSection>(normalizeSection(initialSection));
  const [serviceCategory, setServiceCategory] = useState<"Video Editing" | "Graphic Design">("Video Editing");

  function handleOnboardingComplete(nextSection: FreelancerSection) {
    setIsOnboarded(true);
    setCurrentSection(nextSection);
  }

  if (!isOnboarded) {
    return (
      <main className="freelancer-entry-shell">
        <div className="freelancer-entry-backdrop" />
        <div className="freelancer-entry-frame">
          <header className="freelancer-entry-topbar">
            <div>
              <BrandWordmark />
              <p className="freelancer-entry-kicker">Freelancer onboarding</p>
            </div>
            <Link className="freelancer-back" href="/">
              <ArrowLeft size={14} strokeWidth={1.8} />
              Back to home
            </Link>
          </header>

          <FreelancerRegistrationModal isOpen mode="page" onComplete={handleOnboardingComplete} />
        </div>
      </main>
    );
  }

  return (
    <InternalAppShell
      activeSection={currentSection}
      appLabel="Gigxomi freelancer app"
      headerPills={["Manager-first WhatsApp flow", "Wallet credits from final approved paid quote"]}
      homeHref="/"
      navItems={freelancerNavItems.map((item) => ({ ...item, icon: navIcons[item.id] }))}
      onNavigate={(section) => setCurrentSection(section as FreelancerSection)}
      profileMeta={profileData.monetizationPlan}
      profileName={profileData.username}
      title={sectionTitles[currentSection]}
    >
      <div className="freelancer-app-content">
          {currentSection === "dashboard" && (
            <div className="freelancer-app-stack">
              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Reports</p>
                    <h2>Dashboard is for reports and quick actions only.</h2>
                  </div>
                </div>

                <div className="freelancer-report-grid">
                  {dashboardSummary.map((item) => (
                    <article className="freelancer-report-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Karma score</p>
                    <h2>Operational trust comes from response speed, delivery discipline, and client feedback.</h2>
                  </div>
                </div>

                <div className="freelancer-analytics-grid">
                  {karmaMetrics.map((metric) => (
                    <article className="freelancer-analytics-card" key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <p>{metric.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Quick actions</p>
                    <h2>Move fast without opening every page manually.</h2>
                  </div>
                </div>

                <div className="freelancer-action-grid">
                  <button className="freelancer-quick-action" onClick={() => setCurrentSection("add-service")} type="button">
                    <PlusCircle size={16} strokeWidth={1.8} />
                    Add Service
                  </button>
                  <button className="freelancer-quick-action" onClick={() => setCurrentSection("profile")} type="button">
                    <ShieldCheck size={16} strokeWidth={1.8} />
                    Verify Profile
                  </button>
                  <button className="freelancer-quick-action" onClick={() => setCurrentSection("wallet")} type="button">
                    <WalletCards size={16} strokeWidth={1.8} />
                    Review Wallet
                  </button>
                  <Link className="freelancer-quick-action" href="/freelancer/chat">
                    <MessageSquareText size={16} strokeWidth={1.8} />
                    Open Chats
                  </Link>
                </div>

                <div className="freelancer-inline-list">
                  {freelancerActionQueue.map((item) => (
                    <div className="freelancer-inline-row" key={item}>
                      <ChevronRight size={15} strokeWidth={1.8} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {currentSection === "chats" && (
            <ChatWorkspace
              audience="freelancer"
              listLabel="Assigned chats"
              listTitle="Manager assigns the lead first."
              mode="inbox"
            />
          )}

          {currentSection === "projects" && (
            <FreelancerProjectTrackingKanban />
          )}

          {currentSection === "services" && (
            <section className="freelancer-app-panel">
              <div className="freelancer-section-head">
                <div>
                  <p className="section-label">My Services</p>
                  <h2>See every draft, approved listing, and review state in one place.</h2>
                </div>
              </div>

              <div className="freelancer-service-list">
                {services.map((service) => (
                  <article className="freelancer-service-card" key={service.id}>
                    <div className="freelancer-service-card-top">
                      <span className="meta-pill">{service.status}</span>
                      <span className="meta-pill">{service.category}</span>
                    </div>
                    <h3>{service.title}</h3>
                    <div className="freelancer-service-meta">
                      <div>
                        <span>Price</span>
                        <strong>{service.price}</strong>
                      </div>
                      <div>
                        <span>Delivery</span>
                        <strong>{service.deliveryTime}</strong>
                      </div>
                      <div>
                        <span>Media source</span>
                        <strong>{service.source}</strong>
                      </div>
                    </div>
                    <p>{service.performance}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {currentSection === "add-service" && (
            <section className="freelancer-app-panel">
              <div className="freelancer-section-head">
                <div>
                  <p className="section-label">Add Service</p>
                  <h2>Create a service draft with SEO, pricing, media, and approval-ready structure.</h2>
                </div>
              </div>

              <div className="freelancer-choice-row">
                <button
                  className={serviceCategory === "Video Editing" ? "freelancer-choice-card compact active" : "freelancer-choice-card compact"}
                  onClick={() => setServiceCategory("Video Editing")}
                  type="button"
                >
                  Video Editing
                </button>
                <button
                  className={serviceCategory === "Graphic Design" ? "freelancer-choice-card compact active" : "freelancer-choice-card compact"}
                  onClick={() => setServiceCategory("Graphic Design")}
                  type="button"
                >
                  Graphic Design
                </button>
              </div>
              
              <div className="freelancer-form-grid">
                <label className="freelancer-field">
                  <span>Service title</span>
                  <input placeholder="Wedding teaser editor for reels and cinematic highlights" />
                </label>
                <label className="freelancer-field">
                  <span>Summary</span>
                  <input placeholder="Fast buyer-facing one-line summary" />
                </label>
                <label className="freelancer-field">
                  <span>SEO title</span>
                  <input placeholder="SEO-friendly title suggestion" />
                </label>
                <label className="freelancer-field">
                  <span>SEO description</span>
                  <input placeholder="SEO-friendly description suggestion" />
                </label>
                <label className="freelancer-field">
                  <span>Delivery time</span>
                  <input placeholder="2 Days" />
                </label>
                <label className="freelancer-field">
                  <span>Revisions</span>
                  <input placeholder="2 revisions included" />
                </label>
                <label className="freelancer-field">
                  <span>Base price</span>
                  <input placeholder="INR 2500" />
                </label>
                <label className="freelancer-field">
                  <span>Tags / niches</span>
                  <input placeholder="wedding, podcast, fitness, skincare, finance" />
                </label>
                <label className="freelancer-field freelancer-field-full">
                  <span>Description</span>
                  <textarea placeholder="Describe deliverables, style, buyer type, and project expectation clearly." />
                </label>
              </div>

              <div className="freelancer-inline-list">
                {serviceDraftSections.map((item) => (
                  <div className="freelancer-inline-row" key={item}>
                    <ChevronRight size={15} strokeWidth={1.8} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="freelancer-summary-grid">
                <article className="freelancer-summary-card">
                  <strong>{serviceCategory === "Video Editing" ? "Gigxomi YouTube upload" : "Gigxomi Drive originals"}</strong>
                  <p>
                    {serviceCategory === "Video Editing"
                      ? "Video samples should be uploaded to the Gigxomi-owned YouTube channel as Unlisted."
                      : "Graphic originals stay in Gigxomi-controlled Drive-backed storage while search uses preview URLs."}
                  </p>
                </article>
                <article className="freelancer-summary-card">
                  <strong>Approval gate</strong>
                  <p>Service stays draft or pending review until profile verification and admin approval are complete.</p>
                </article>
                <article className="freelancer-summary-card">
                  <strong>Showcase rule</strong>
                  <p>Delivered work can later move into portfolio only after project approval plus client permission.</p>
                </article>
              </div>
            </section>
          )}

          {currentSection === "profile" && (
            <div className="freelancer-app-stack">
              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Profile</p>
                    <h2>Keep identity, profession, and verification in one place.</h2>
                  </div>
                  <span className="meta-pill">{profileData.verificationStatus}</span>
                </div>

                <div className="freelancer-form-grid">
                  <label className="freelancer-field">
                    <span>Full name</span>
                    <input defaultValue={profileData.fullName} />
                  </label>
                  <label className="freelancer-field">
                    <span>Profession</span>
                    <input defaultValue={profileData.profession} />
                  </label>
                  <label className="freelancer-field">
                    <span>Phone</span>
                    <input defaultValue={profileData.phone} />
                  </label>
                  <label className="freelancer-field">
                    <span>Languages</span>
                    <input defaultValue={profileData.languages} />
                  </label>
                  <label className="freelancer-field freelancer-field-full">
                    <span>Bio</span>
                    <textarea defaultValue={profileData.bio} />
                  </label>
                </div>
              </section>

              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Verification</p>
                    <h2>Publishing still waits for ID review and admin approval.</h2>
                  </div>
                  <button className="freelancer-primary-button" type="button">
                    Verify profile
                  </button>
                </div>

                <div className="freelancer-form-grid">
                  <label className="freelancer-field">
                    <span>ID type</span>
                    <select defaultValue="aadhaar">
                      <option value="aadhaar">Aadhaar</option>
                      <option value="passport">Passport</option>
                      <option value="license">Driving license</option>
                    </select>
                  </label>
                  <label className="freelancer-field">
                    <span>ID number</span>
                    <input placeholder="Government ID number" />
                  </label>
                  <label className="freelancer-field">
                    <span>Upload ID</span>
                    <input type="file" />
                  </label>
                  <label className="freelancer-field">
                    <span>Address</span>
                    <input placeholder="Permanent address" />
                  </label>
                </div>

                <div className="freelancer-inline-list">
                  {verificationChecklist.map((item) => (
                    <div className="freelancer-inline-row" key={item}>
                      <FileBadge2 size={15} strokeWidth={1.8} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {currentSection === "wallet" && (
            <div className="freelancer-app-stack">
              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Wallet</p>
                    <h2>Credits only come from final approved paid quotes after plan-based fee deduction.</h2>
                  </div>
                </div>

                <div className="freelancer-report-grid">
                  <article className="freelancer-report-card">
                    <span>Gross earned</span>
                    <strong>{walletOverview.grossEarned}</strong>
                  </article>
                  <article className="freelancer-report-card">
                    <span>Gigxomi fee</span>
                    <strong>{walletOverview.commissionDeducted}</strong>
                  </article>
                  <article className="freelancer-report-card">
                    <span>Pending clearance</span>
                    <strong>{walletOverview.pendingClearance}</strong>
                  </article>
                  <article className="freelancer-report-card">
                    <span>Available</span>
                    <strong>{walletOverview.availableForWithdrawal}</strong>
                  </article>
                </div>
              </section>

              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Ledger</p>
                    <h2>Each wallet row is transaction-based, not a loose balance guess.</h2>
                  </div>
                </div>

                <div className="freelancer-ledger-list">
                  {walletLedger.map((entry) => (
                    <article className="freelancer-ledger-row" key={entry.id}>
                      <div>
                        <strong>{entry.title}</strong>
                        <small>{entry.id}</small>
                      </div>
                      <div>
                        <span>Gross</span>
                        <strong>{entry.gross}</strong>
                      </div>
                      <div>
                        <span>Fee</span>
                        <strong>{entry.commission}</strong>
                      </div>
                      <div>
                        <span>Net</span>
                        <strong>{entry.net}</strong>
                      </div>
                      <span className="meta-pill">{entry.status}</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {currentSection === "payouts" && (
            <div className="freelancer-app-stack">
              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Payouts</p>
                    <h2>Support both the 30% commission model and the 5% subscription model inside the same wallet logic.</h2>
                  </div>
                </div>

                <div className="freelancer-plan-grid">
                  {monetizationPlans.map((plan) => (
                    <article className={plan.id === "standard" ? "freelancer-plan-card active" : "freelancer-plan-card"} key={plan.id}>
                      <span className="meta-pill">{plan.badge}</span>
                      <strong>{plan.name}</strong>
                      <p>{plan.description}</p>
                      <b>{plan.effectiveFee} effective fee</b>
                    </article>
                  ))}
                </div>

                <div className="freelancer-inline-list">
                  {payoutRules.map((rule) => (
                    <div className="freelancer-inline-row" key={rule}>
                      <CreditCard size={15} strokeWidth={1.8} />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="freelancer-app-panel">
                <div className="freelancer-section-head">
                  <div>
                    <p className="section-label">Payout requests</p>
                    <h2>Manual transfer can stay in v1, but requests and states still need to be structured.</h2>
                  </div>
                </div>

                <div className="freelancer-service-list">
                  {payoutRequests.map((request) => (
                    <article className="freelancer-service-card" key={request.id}>
                      <div className="freelancer-service-card-top">
                        <span className="meta-pill">{request.status}</span>
                      </div>
                      <h3>{request.amount}</h3>
                      <p>{request.note}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
      </div>
    </InternalAppShell>
  );
}


