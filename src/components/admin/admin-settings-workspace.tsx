"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  Lock,
  MessageSquare,
  MessageSquareText,
  Phone,
  QrCode,
  Radio,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Volume2,
} from "lucide-react";

import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";
import type { AgencyListingProfile } from "@/lib/gigxomi/agency-listing-types";
import type { DummyCustomerPrivacySettings, DummyUpiConfig } from "@/lib/gigxomi/dummy-platform-store";

export type SettingsTab = "profile" | "system" | "whatsapp" | "security" | "team";

interface AdminSettingsWorkspaceProps {
  initialProfile: AgencyListingProfile;
}

export function AdminSettingsWorkspace({ initialProfile }: AdminSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  // Tab 1: Profile State
  const [profile, setProfile] = useState({
    publicName: initialProfile.publicName || "",
    slug: initialProfile.slug || "",
    tagline: initialProfile.tagline || "",
    description: initialProfile.description || "",
    contactEmail: initialProfile.contactEmail || "",
    whatsappNumber: initialProfile.whatsappNumber || "",
    logoUrl: initialProfile.logoUrl || "",
    coverUrl: initialProfile.coverUrl || "",
    isPublished: Boolean(initialProfile.isPublished),
  });

  // Tab 4: Security / Privacy State
  const [privacySettings, setPrivacySettings] = useState<DummyCustomerPrivacySettings | null>(null);
  const [defaultEditorChatPolicy, setDefaultEditorChatPolicy] = useState<"readonly" | "allow">("readonly");

  // Tab 2: System / UPI State
  const [upiConfig, setUpiConfig] = useState<DummyUpiConfig | null>(null);
  const [isCopiedReferral, setIsCopiedReferral] = useState<string | null>(null);

  // Tab 2: Notifications State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync tab from URL on mount with backwards compatibility
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "profile" || tabParam === "system" || tabParam === "whatsapp" || tabParam === "security" || tabParam === "team") {
        setActiveTab(tabParam);
      } else if (tabParam === "policy") {
        setActiveTab("security");
      } else if (tabParam === "payments" || tabParam === "notifications") {
        setActiveTab("system");
      }

      const savedSound = localStorage.getItem("gigxomi_sound_alert");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "1");
      }
      if (typeof Notification !== "undefined") {
        setPushEnabled(Notification.permission === "granted");
      }
    } catch {}
  }, []);

  // Fetch Privacy Settings
  useEffect(() => {
    fetch("/api/admin/customer-privacy", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings) {
          setPrivacySettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch UPI Settings
  useEffect(() => {
    fetch("/api/admin/upi", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.config) {
          setUpiConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const switchTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setStatusMessage(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicName: profile.publicName,
            slug: profile.slug,
            tagline: profile.tagline,
            description: profile.description,
            contactEmail: profile.contactEmail,
            whatsappNumber: profile.whatsappNumber,
            logoUrl: profile.logoUrl,
            coverUrl: profile.coverUrl,
            isPublished: profile.isPublished,
          }),
        });
        const data = await response.json();
        if (data.ok) {
          setStatusMessage({
            text: profile.isPublished
              ? "Agency profile saved and published to public marketplace."
              : "Agency profile saved as private workspace.",
            tone: "success",
          });
        } else {
          setStatusMessage({ text: data.error || "Failed to save profile.", tone: "error" });
        }
      } catch {
        setStatusMessage({ text: "Network error saving agency profile.", tone: "error" });
      }
    });
  };

  // Toggle Privacy Field
  const handleTogglePrivacy = async (field: "maskCustomerPhoneForManagers" | "maskCustomerPhoneForFreelancers") => {
    if (!privacySettings) return;
    const nextVal = !privacySettings[field];
    try {
      const response = await fetch("/api/admin/customer-privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextVal }),
      });
      const data = await response.json();
      if (data.ok && data.settings) {
        setPrivacySettings(data.settings);
        setStatusMessage({ text: "Contact masking policy updated successfully.", tone: "success" });
      }
    } catch {
      setStatusMessage({ text: "Failed to update privacy policy.", tone: "error" });
    }
  };

  // Save UPI Config
  const handleSaveUpi = async (updates: Partial<DummyUpiConfig>) => {
    if (!upiConfig) return;
    try {
      const response = await fetch("/api/admin/upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: updates.enabled ?? upiConfig.enabled,
          upiId: updates.upiId ?? upiConfig.upiId,
          payeeName: updates.payeeName ?? upiConfig.payeeName,
          currency: updates.currency ?? upiConfig.currency,
          notePrefix: updates.notePrefix ?? upiConfig.notePrefix,
        }),
      });
      const data = await response.json();
      if (data.ok && data.config) {
        setUpiConfig(data.config);
        setStatusMessage({ text: "Payment settings saved successfully.", tone: "success" });
      } else {
        setStatusMessage({ text: data.error || "Failed to save UPI settings.", tone: "error" });
      }
    } catch {
      setStatusMessage({ text: "Network error saving UPI settings.", tone: "error" });
    }
  };

  // Test Chime Audio
  const playChimeTest = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const copyReferral = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setIsCopiedReferral(id);
      setTimeout(() => setIsCopiedReferral(null), 2500);
    } catch {}
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Building2 }> = [
    { id: "profile", label: "Profile", icon: Building2 },
    { id: "system", label: "System", icon: Sliders },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquareText },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "team", label: "Team", icon: Users },
  ];

  return (
    <div className="dashboard-shell compact">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Settings Workspace</p>
            <h2 className="section-heading" style={{ margin: 0 }}>
              Agency profile, system preferences, WhatsApp, security, and team management.
            </h2>
          </div>
          {profile.slug ? (
            <Link
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/90 transition-all shadow-sm"
              href={`/agency/${profile.slug}`}
              target="_blank"
            >
              <Globe size={14} className="text-lime-400" />
              <span>Public Page</span>
              <ExternalLink size={12} className="text-white/40" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-[18px] bg-white/[0.03] border border-white/[0.10] backdrop-blur-md overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#B9F719] text-[#08090C] font-semibold shadow-sm border border-[#B9F719]"
                  : "text-white/70 hover:text-white hover:bg-white/[0.05]"
              }`}
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              type="button"
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Notification */}
      {statusMessage ? (
        <div
          className={`p-3 rounded-2xl text-xs mt-3 flex items-center gap-2 ${
            statusMessage.tone === "success"
              ? "bg-emerald-400/10 border border-emerald-400/25 text-emerald-400"
              : "bg-rose-400/10 border border-rose-400/25 text-rose-400"
          }`}
        >
          {statusMessage.tone === "success" ? <Check size={14} /> : <ShieldAlert size={14} />}
          <span>{statusMessage.text}</span>
        </div>
      ) : null}

      {/* TAB 1: PROFILE & BRAND */}
      {activeTab === "profile" && (
        <form className="mt-4 flex flex-col gap-6" onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Details */}
            <div className="brief-card flex flex-col gap-4">
              <strong className="text-sm text-white flex items-center gap-2">
                <Building2 size={16} className="text-lime-400" />
                <span>Agency Public Identity</span>
              </strong>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Agency Public Name</span>
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                  onChange={(e) => setProfile((p) => ({ ...p, publicName: e.target.value }))}
                  placeholder="e.g. Gigxomi Creative Studio"
                  required
                  type="text"
                  value={profile.publicName}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Public Profile Handle / Slug</span>
                <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/10 focus-within:border-lime-400/60 overflow-hidden text-sm">
                  <span className="px-3 text-white/40 text-xs border-r border-white/10 bg-white/[0.02]">gigxomi.com/agency/</span>
                  <input
                    className="flex-1 bg-transparent px-3 py-2 text-white placeholder-white/30 outline-none text-sm"
                    onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                    placeholder="my-studio"
                    required
                    type="text"
                    value={profile.slug}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Tagline</span>
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                  onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="e.g. High-velocity video editing and design for creators"
                  type="text"
                  value={profile.tagline}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>About / Agency Bio</span>
                <textarea
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all resize-y"
                  onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your agency specialty, turnaround times, and delivery standards..."
                  rows={3}
                  value={profile.description}
                />
              </label>
            </div>

            {/* Visuals & Contact */}
            <div className="brief-card flex flex-col gap-4">
              <strong className="text-sm text-white flex items-center gap-2">
                <Sparkles size={16} className="text-lime-400" />
                <span>Brand Visuals & Direct Contact</span>
              </strong>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Agency Logo Image URL</span>
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                  onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  type="url"
                  value={profile.logoUrl}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Contact Email</span>
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                  onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="admin@studio.com"
                  type="email"
                  value={profile.contactEmail}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-white/70">
                <span>Agency WhatsApp Phone</span>
                <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/10 focus-within:border-lime-400/60 overflow-hidden text-sm">
                  <span className="px-3 text-white/40 text-xs border-r border-white/10 bg-white/[0.02]">
                    <Phone size={13} />
                  </span>
                  <input
                    className="flex-1 bg-transparent px-3 py-2 text-white placeholder-white/30 outline-none text-sm"
                    onChange={(e) => setProfile((p) => ({ ...p, whatsappNumber: e.target.value }))}
                    placeholder="+91 99818 07309"
                    type="text"
                    value={profile.whatsappNumber}
                  />
                </div>
              </label>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4 mt-2">
                <div>
                  <strong className="text-sm text-white block">Public Agency Directory Listing</strong>
                  <span className="text-xs text-white/60">
                    {profile.isPublished
                      ? "Published: Anyone can discover your agency and submit project inquiries."
                      : "Private Workspace: Only invited clients and editors can access project threads."}
                  </span>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    profile.isPublished
                      ? "bg-lime-400 text-black font-semibold shadow-sm"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  }`}
                  onClick={() => setProfile((p) => ({ ...p, isPublished: !p.isPublished }))}
                  type="button"
                >
                  {profile.isPublished ? "Published" : "Private Draft"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              className="freelancer-primary-button inline-flex items-center gap-2 px-6"
              disabled={isPending}
              type="submit"
            >
              <Save size={16} />
              <span>{isPending ? "Saving..." : "Save Agency Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SYSTEM & PREFERENCES */}
      {activeTab === "system" && (
        <div className="mt-4 flex flex-col gap-6">
          {/* Notifications & Sound Alerts */}
          <div className="brief-card flex flex-col gap-4">
            <div>
              <span className="meta-pill">Alert Preferences</span>
              <strong className="text-base text-white block mt-1">Browser Alerts & Audio Notifications</strong>
            </div>

            <p className="text-sm text-white/70">
              Manage how your agency receives alerts for inbound client messages, manager assignments, and deliverable submissions.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              {/* Push Notifications */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell className="text-lime-400 shrink-0" size={18} />
                  <div>
                    <strong className="text-sm text-white block">Browser Web Push Notifications</strong>
                    <span className="text-xs text-white/60">
                      Instant desktop notifications when a client sends a message or when work is completed.
                    </span>
                  </div>
                </div>
                <button
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    pushEnabled
                      ? "bg-emerald-400 text-black font-semibold"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  }`}
                  onClick={async () => {
                    if (typeof Notification !== "undefined") {
                      const res = await Notification.requestPermission();
                      setPushEnabled(res === "granted");
                      setStatusMessage({
                        text: res === "granted" ? "Push notifications enabled for this browser." : "Push notifications denied or blocked.",
                        tone: res === "granted" ? "success" : "error",
                      });
                    }
                  }}
                  type="button"
                >
                  {pushEnabled ? "Enabled" : "Enable Push"}
                </button>
              </div>

              {/* Sound Chime */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="text-lime-400 shrink-0" size={18} />
                  <div>
                    <strong className="text-sm text-white block">Chat Audio Chime</strong>
                    <span className="text-xs text-white/60">
                      Play a subtle audio tone when new messages arrive in the active chat workspace.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all"
                    onClick={playChimeTest}
                    title="Preview sound tone"
                    type="button"
                  >
                    Test Tone
                  </button>
                  <button
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      soundEnabled
                        ? "bg-lime-400 text-black font-semibold shadow-sm"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      try {
                        localStorage.setItem("gigxomi_sound_alert", next ? "1" : "0");
                      } catch {}
                    }}
                    type="button"
                  >
                    {soundEnabled ? "Chime ON" : "Chime Muted"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agency UPI Configuration */}
          <div className="brief-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PluginBrandMark brand="manual-upi" size="md" />
                <div>
                  <span className="meta-pill">Direct Bank Settlement</span>
                  <strong className="text-base text-white block mt-0.5">Agency UPI ID & VPA Collection</strong>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                0% Transaction Fee
              </span>
            </div>

            <p className="text-sm text-white/70">
              When client payment requests are generated in chat, Gigxomi creates dynamic UPI QR intent links directly to this VPA. Payments settle 100% directly into your bank.
            </p>

            {upiConfig ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <label className="flex flex-col gap-1.5 text-xs text-white/70">
                  <span>Agency UPI ID / VPA</span>
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all font-mono"
                    defaultValue={upiConfig.upiId}
                    onBlur={(e) => handleSaveUpi({ upiId: e.target.value })}
                    placeholder="agency@okhdfcbank"
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-white/70">
                  <span>Payee / Registered Business Name</span>
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                    defaultValue={upiConfig.payeeName}
                    onBlur={(e) => handleSaveUpi({ payeeName: e.target.value })}
                    placeholder="Gigxomi Media Pvt Ltd"
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-white/70">
                  <span>Invoice / Payment Note Prefix</span>
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400/60 outline-none transition-all"
                    defaultValue={upiConfig.notePrefix}
                    onBlur={(e) => handleSaveUpi({ notePrefix: e.target.value })}
                    placeholder="Order"
                    type="text"
                  />
                </label>

                <div className="flex flex-col justify-end">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div className="text-xs">
                      <strong className="text-white block">UPI Chat Payments</strong>
                      <span className="text-white/50">{upiConfig.enabled ? "Active in chat lanes" : "Paused"}</span>
                    </div>
                    <button
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        upiConfig.enabled
                          ? "bg-emerald-400 text-black font-semibold"
                          : "bg-white/10 text-white/70 hover:bg-white/15"
                      }`}
                      onClick={() => handleSaveUpi({ enabled: !upiConfig.enabled })}
                      type="button"
                    >
                      {upiConfig.enabled ? "Active" : "Enable"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Live UPI Intent Preview */}
            {upiConfig?.upiId ? (
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 mt-1">
                <div className="flex items-center gap-3">
                  <QrCode className="text-lime-400 shrink-0" size={20} />
                  <div className="text-xs">
                    <span className="text-white/40 block">Generated UPI Intent String:</span>
                    <code className="text-white/80 font-mono text-[11px]">
                      upi://pay?pa={upiConfig.upiId}&pn={encodeURIComponent(upiConfig.payeeName)}&cu=INR
                    </code>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all shrink-0"
                  onClick={() => copyReferral("upi", `upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(upiConfig.payeeName)}&cu=INR`)}
                  type="button"
                >
                  {isCopiedReferral === "upi" ? "Copied" : "Copy Intent"}
                </button>
              </div>
            ) : null}
          </div>

          {/* Payment Gateway Referral Partner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Razorpay Card */}
            <div className="brief-card flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PluginBrandMark brand="razorpay" size="md" />
                    <div>
                      <span className="meta-pill">Partner Referral</span>
                      <strong className="text-base text-white block mt-0.5">Razorpay Payment Gateway</strong>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-400/15 text-blue-400 border border-blue-400/30">
                    0.5% Discounted MDR
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-3 leading-relaxed">
                  Instant onboarding for Indian Credit Cards, Debit Cards, and Netbanking. Fast settlement directly to your current account.
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">Partner Code:</span>
                  <code className="font-mono text-lime-400 font-semibold">GIGXOMI_PARTNER</code>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <a
                  className="freelancer-primary-button flex-1 text-center justify-center inline-flex items-center gap-1.5"
                  href="https://razorpay.com/partner/gigxomi"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Open Partner Portal</span>
                  <ExternalLink size={13} />
                </a>
                <button
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all"
                  onClick={() => copyReferral("razorpay", "https://razorpay.com/partner/gigxomi")}
                  type="button"
                >
                  {isCopiedReferral === "razorpay" ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Stripe Card */}
            <div className="brief-card flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PluginBrandMark brand="stripe" size="md" />
                    <div>
                      <span className="meta-pill">Global Partner Referral</span>
                      <strong className="text-base text-white block mt-0.5">Stripe Global Invoicing</strong>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-400/15 text-purple-400 border border-purple-400/30">
                    135+ Currencies
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-3 leading-relaxed">
                  Seamless client payments with Apple Pay, Google Pay, and international cards. Fast multi-currency conversions into INR.
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">Partner Code:</span>
                  <code className="font-mono text-lime-400 font-semibold">STRIPE_GIGXOMI_GLOBAL</code>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <a
                  className="freelancer-primary-button flex-1 text-center justify-center inline-flex items-center gap-1.5"
                  href="https://marketplace.stripe.com/gigxomi-agency"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Open Stripe Connect</span>
                  <ExternalLink size={13} />
                </a>
                <button
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all"
                  onClick={() => copyReferral("stripe", "https://marketplace.stripe.com/gigxomi-agency")}
                  type="button"
                >
                  {isCopiedReferral === "stripe" ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP & CHANNELS */}
      {activeTab === "whatsapp" && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="brief-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PluginBrandMark brand="whatsapp" size="md" />
                <div>
                  <span className="meta-pill">Cloud API Status</span>
                  <strong className="text-base text-white block mt-0.5">WhatsApp Business Integration</strong>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                Connected & Operational
              </span>
            </div>

            <p className="text-sm text-white/70">
              Your WhatsApp Business number is connected for incoming leads, automated responses, and OTP verification routing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Active Number</span>
                <strong className="text-white text-sm font-mono">{profile.whatsappNumber || "+91 99818 07309"}</strong>
                <span className="text-[11px] text-emerald-400 mt-1">Verified Agency Caller ID</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Webhook Ingress</span>
                <strong className="text-white text-sm font-mono">/api/webhooks/whatsapp</strong>
                <span className="text-[11px] text-emerald-400 mt-1">Active (Zero Latency Queue)</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Template Sync</span>
                <strong className="text-white text-sm">Meta Approved</strong>
                <span className="text-[11px] text-white/50 mt-1">Welcome, Quote & Delivery Alerts</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              <Link className="secondary-button text-xs" href="/admin/integrations/whatsapp">
                <Radio size={14} className="text-lime-400" />
                <span>Open Dedicated WhatsApp Setup</span>
              </Link>
              <Link className="secondary-button text-xs" href="/admin/chatbot">
                <Bot size={14} className="text-lime-400" />
                <span>Configure Chatbot Rules</span>
              </Link>
              <Link className="secondary-button text-xs" href="/admin/integrations/instagram">
                <Send size={14} className="text-lime-400" />
                <span>Instagram Setup</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & PRIVACY */}
      {activeTab === "security" && (
        <div className="mt-4 flex flex-col gap-6">
          {/* Freelancer Client Communication Lock Policy */}
          <div className="brief-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="meta-pill">Security & Client Governance</span>
                <strong className="text-base text-white block mt-1">Freelancer Direct Client-Communication Policy</strong>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-lime-400/15 text-lime-400 border border-lime-400/30">
                Enforced Across Web & Mobile
              </span>
            </div>

            <p className="text-sm text-white/70">
              Configure the default client communication permission for team editors and freelancers assigned to your client projects:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              {/* Option 1: Read-Only (Recommended) */}
              <div
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  defaultEditorChatPolicy === "readonly"
                    ? "bg-lime-400/[0.06] border-lime-400/50 shadow-sm"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
                onClick={() => {
                  setDefaultEditorChatPolicy("readonly");
                  setStatusMessage({ text: "Default policy set: Freelancers are locked to Read-Only mode in customer lanes.", tone: "success" });
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="text-lime-400" size={16} />
                      <strong className="text-sm text-white">Read-Only Mode (Recommended)</strong>
                    </div>
                    {defaultEditorChatPolicy === "readonly" ? <BadgeCheck className="text-lime-400" size={18} /> : null}
                  </div>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed">
                    Freelancers can read all client messages to understand creative instructions, but typing and sending in the customer lane is locked.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] text-white/50 font-mono">
                  Banner shown to editor: &quot;Client messaging is set to read-only by agency. Use the internal team lane to coordinate with your manager.&quot;
                </div>
              </div>

              {/* Option 2: Allow Direct Chat */}
              <div
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  defaultEditorChatPolicy === "allow"
                    ? "bg-lime-400/[0.06] border-lime-400/50 shadow-sm"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
                onClick={() => {
                  setDefaultEditorChatPolicy("allow");
                  setStatusMessage({ text: "Default policy set: Freelancers can message clients directly.", tone: "success" });
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-white/60" size={16} />
                      <strong className="text-sm text-white">Allow Direct Client Chat</strong>
                    </div>
                    {defaultEditorChatPolicy === "allow" ? <BadgeCheck className="text-lime-400" size={18} /> : null}
                  </div>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed">
                    Freelancers can send text messages directly to the client in the shared customer lane under your agency banner.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] text-white/50 font-mono">
                  Note: Private negotiation mode stays hidden from freelancers regardless of this toggle.
                </div>
              </div>
            </div>
          </div>

          {/* Contact Masking & Privacy Panel */}
          <div className="brief-card flex flex-col gap-4">
            <div>
              <span className="meta-pill">Privacy Protection</span>
              <strong className="text-base text-white block mt-1">Client Phone Number & Identity Masking</strong>
            </div>

            <p className="text-sm text-white/70">
              Prevent direct client poaching and protect confidentiality by masking personal phone numbers and direct email addresses in team views.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-sm text-white block">Mask Customer Phone for Freelancers & Editors</strong>
                  <span className="text-xs text-white/60">
                    Client phone number is obscured as `+91 998•• •••09` in freelancer contact drawers and conversation metadata.
                  </span>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    privacySettings?.maskCustomerPhoneForFreelancers
                      ? "bg-lime-400 text-black font-semibold shadow-sm"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  }`}
                  onClick={() => handleTogglePrivacy("maskCustomerPhoneForFreelancers")}
                  type="button"
                >
                  {privacySettings?.maskCustomerPhoneForFreelancers ? "Masked (Enabled)" : "Visible (Disabled)"}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-sm text-white block">Mask Customer Phone for Operations Managers</strong>
                  <span className="text-xs text-white/60">
                    Managers coordinate through Gigxomi chat without accessing raw unencrypted phone numbers.
                  </span>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    privacySettings?.maskCustomerPhoneForManagers
                      ? "bg-lime-400 text-black font-semibold shadow-sm"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  }`}
                  onClick={() => handleTogglePrivacy("maskCustomerPhoneForManagers")}
                  type="button"
                >
                  {privacySettings?.maskCustomerPhoneForManagers ? "Masked (Enabled)" : "Visible (Disabled)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEAM & ROLES */}
      {activeTab === "team" && (
        <div className="mt-4 flex flex-col gap-6">
          <div className="brief-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="meta-pill">Team Governance</span>
                <strong className="text-base text-white block mt-1">Agency Staff & Role Hierarchy</strong>
              </div>
              <Link className="freelancer-primary-button text-xs inline-flex items-center gap-1.5" href="/admin/staff">
                <UserPlus size={14} />
                <span>Assign Staff & Managers</span>
              </Link>
            </div>

            <p className="text-sm text-white/70">
              Manage operational roles and permissions across your agency workspace. Each role has strict access boundaries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-lime-400" size={18} />
                  <strong className="text-sm text-white">Agency Owner / Admin</strong>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Full control of roles, integrations, subscription packages, payout approvals, and system policies.
                </p>
                <span className="text-[11px] text-lime-400 font-medium mt-auto">Unrestricted Access</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-blue-400" size={18} />
                  <strong className="text-sm text-white">Operations Manager</strong>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Handles intake, assignment, quote creation, project progress tracking, deliverable review, and escalations.
                </p>
                <span className="text-[11px] text-blue-400 font-medium mt-auto">Operational Control</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-400" size={18} />
                  <strong className="text-sm text-white">Freelance Editor</strong>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Own profile, listed services, assigned project deliverable submission, progress updates, and wallet payouts.
                </p>
                <span className="text-[11px] text-purple-400 font-medium mt-auto">Scoped Work Lane</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              <Link className="secondary-button text-xs" href="/admin/staff">
                <UserCheck size={14} className="text-lime-400" />
                <span>View Assigned Managers</span>
              </Link>
              <Link className="secondary-button text-xs" href="/admin/freelancers">
                <Users size={14} className="text-lime-400" />
                <span>Browse Team Editors</span>
              </Link>
              <Link className="secondary-button text-xs" href="/admin/contacts">
                <Building2 size={14} className="text-lime-400" />
                <span>Client Directory</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
