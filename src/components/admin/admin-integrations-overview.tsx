"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Search, Sparkles, X } from "lucide-react";

import { PluginBrandMark, type PluginBrand } from "@/components/ui/plugin-brand-mark";
import type { DummyInstagramConnectionState, DummyWhatsAppConnectionState } from "@/lib/gigxomi/dummy-platform-store";

type AdminWhatsAppPayload = {
  ok?: boolean;
  error?: string;
  connection?: DummyWhatsAppConnectionState | null;
};

type AdminInstagramPayload = {
  ok?: boolean;
  error?: string;
  connection?: DummyInstagramConnectionState | null;
};

type PluginCategory = "all" | "messaging" | "automation" | "payments" | "media";

interface PluginItem {
  id: string;
  title: string;
  brand: PluginBrand;
  category: PluginCategory;
  categoryLabel: string;
  summary: string;
  badge?: string;
  verified?: boolean;
  hasActiveToggle?: boolean;
  referralLink?: string;
  referralCode?: string;
  referralPerk?: string;
  setupHref?: string;
  isOperational?: boolean;
}

const PLUGINS: PluginItem[] = [
  {
    id: "whatsapp",
    title: "WhatsApp Business API",
    brand: "whatsapp",
    category: "messaging",
    categoryLabel: "Messaging Channels",
    summary: "Cloud API connectivity, webhook delivery events, verified templates, and OTP routing for client communication.",
    badge: "Verified Meta Partner",
    verified: true,
    hasActiveToggle: true,
    setupHref: "/admin/integrations/whatsapp",
    isOperational: true,
  },
  {
    id: "instagram",
    title: "Instagram DM & Inbox",
    brand: "instagram",
    category: "messaging",
    categoryLabel: "Messaging Channels",
    summary: "Direct message synchronization, story mentions, and customer conversation routing directly in Gigxomi chat.",
    badge: "Verified Meta API",
    verified: true,
    hasActiveToggle: true,
    setupHref: "/admin/integrations/instagram",
    isOperational: true,
  },
  {
    id: "chatbot",
    title: "WhatsApp Chatbot Builder",
    brand: "whatsapp",
    category: "automation",
    categoryLabel: "Automation & Bots",
    summary: "Visual rule builder for automated greeting flows, intake questionnaires, keyword triggers, and live agent handoffs.",
    badge: "Verified Automation Flow",
    verified: true,
    setupHref: "/admin/chatbot",
    isOperational: true,
  },
  {
    id: "phonepe",
    title: "PhonePe Direct UPI",
    brand: "phonepe",
    category: "payments",
    categoryLabel: "Payments & Gateways",
    summary: "Instant dynamic UPI payment links with 0% MDR, merchant callbacks, and automated transaction reconciliation in chat.",
    badge: "Verified UPI Rail",
    verified: true,
    setupHref: "/admin/system-settings?tab=system",
    isOperational: true,
  },
  {
    id: "razorpay",
    title: "Razorpay Partner Gateway",
    brand: "razorpay",
    category: "payments",
    categoryLabel: "Payments & Gateways",
    summary: "Credit cards, debit cards, netbanking, and international payments with domestic settlement directly to agency bank account.",
    badge: "Verified Partner Link",
    verified: true,
    referralLink: "https://razorpay.com/partner/gigxomi",
    referralCode: "GIGXOMI_PARTNER",
    referralPerk: "Instant Onboarding + 0.5% Discounted MDR + Waived Setup Fees",
  },
  {
    id: "stripe",
    title: "Stripe Global Invoicing",
    brand: "stripe",
    category: "payments",
    categoryLabel: "Payments & Gateways",
    summary: "Cross-border client payments in 135+ currencies with Apple Pay, Google Pay, and localized bank rails worldwide.",
    badge: "Verified Global Partner",
    verified: true,
    referralLink: "https://marketplace.stripe.com/gigxomi-agency",
    referralCode: "STRIPE_GIGXOMI_GLOBAL",
    referralPerk: "Fast-Track Approval + Multi-Currency Conversion + Global Payouts",
  },
  {
    id: "youtube",
    title: "YouTube Channel Publishing",
    brand: "youtube",
    category: "media",
    categoryLabel: "Media & Storage",
    summary: "One-click publishing of approved client video edits to agency YouTube channels for review or public showcase.",
    badge: "Verified Google API",
    verified: true,
    setupHref: "/admin/system-settings?tab=profile",
    isOperational: true,
  },
  {
    id: "google-drive",
    title: "Google Drive Cloud Assets",
    brand: "google-drive",
    category: "media",
    categoryLabel: "Media & Storage",
    summary: "Centralized raw footage submission, folder generation per project, and organized 4K delivery export links.",
    badge: "Verified Cloud Storage",
    verified: true,
    setupHref: "/admin/system-settings?tab=profile",
    isOperational: true,
  },
];

async function fetchWhatsAppConnection() {
  const response = await fetch("/api/admin/whatsapp?ensureDraft=1", { cache: "no-store", credentials: "include" });
  const payload = (await response.json()) as AdminWhatsAppPayload;
  return {
    ok: response.ok,
    status: response.status,
    error: payload.error ?? null,
    connection: payload.connection ?? null,
  };
}

async function fetchInstagramConnection() {
  const response = await fetch("/api/admin/instagram?ensureDraft=1", { cache: "no-store", credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as AdminInstagramPayload;
  return {
    ok: response.ok,
    status: response.status,
    error: payload.error ?? null,
    connection: payload.connection ?? null,
  };
}

export function AdminIntegrationsOverview() {
  const [connection, setConnection] = useState<DummyWhatsAppConnectionState | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<DummyInstagramConnectionState | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWhatsAppConnection()
      .then((result) => {
        setConnection(result.connection);
        setAuthRequired(result.status === 401 || result.status === 403);
        if (!result.ok && result.error) {
          setStatus(result.error);
        }
      })
      .catch(() => {
        setConnection(null);
        setStatus("Unable to load integration status right now.");
      });
    fetchInstagramConnection()
      .then((result) => {
        setInstagramConnection(result.connection);
        setAuthRequired((current) => current || result.status === 401 || result.status === 403);
        if (!result.ok && result.error) {
          setStatus(result.error);
        }
      })
      .catch(() => setInstagramConnection(null));
  }, []);

  const whatsAppPluginEnabled = Boolean(connection?.pluginEnabled);
  const instagramPluginEnabled = Boolean(instagramConnection?.pluginEnabled);

  async function setWhatsAppPluginEnabled(enabled: boolean) {
    setIsSaving(true);
    setStatus(null);
    setAuthRequired(false);

    const response = await fetch("/api/admin/whatsapp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginEnabled: enabled,
        status: enabled ? (connection?.status === "Number connected" ? "Number connected" : "Onboarding in progress") : "Not started",
        note: enabled
          ? connection?.note ?? "WhatsApp API plugin enabled. Complete onboarding in the setup workspace."
          : "WhatsApp API disabled for this agency. Saved configuration remains intact.",
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as AdminWhatsAppPayload & { ok?: boolean; error?: string };

    if (!response.ok || payload.ok === false) {
      setAuthRequired(response.status === 401 || response.status === 403);
      setStatus(payload.error ?? "Unable to update the WhatsApp API plugin.");
      setIsSaving(false);
      return;
    }

    setConnection(payload.connection ?? null);
    window.dispatchEvent(new Event("gigxomi:whatsapp-plugin-updated"));
    setStatus(enabled ? "WhatsApp API plugin enabled. The dedicated setup menu is now available." : "WhatsApp API plugin disabled.");
    setIsSaving(false);
  }

  const enableWhatsAppPlugin = () => setWhatsAppPluginEnabled(true);

  async function setInstagramPluginEnabled(enabled: boolean) {
    setIsSaving(true);
    setStatus(null);
    setAuthRequired(false);

    const response = await fetch("/api/admin/instagram", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginEnabled: enabled,
        status: enabled ? (instagramConnection?.status === "Connected" ? "Connected" : "Plugin enabled") : "Not started",
        note: enabled
          ? instagramConnection?.note ?? "Instagram Inbox enabled. Complete the dedicated setup before routing DMs."
          : "Instagram Inbox disabled for this agency. Saved settings remain private and delivery is paused.",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as AdminInstagramPayload;

    if (!response.ok || payload.ok === false) {
      setAuthRequired(response.status === 401 || response.status === 403);
      setStatus(payload.error ?? "Unable to update the Instagram Inbox plugin.");
      setIsSaving(false);
      return;
    }

    setInstagramConnection(payload.connection ?? null);
    window.dispatchEvent(new Event("gigxomi:instagram-plugin-updated"));
    setStatus(enabled ? "Instagram Inbox enabled. Its setup menu is now available." : "Instagram Inbox disabled.");
    setIsSaving(false);
  }

  const handleCopyReferral = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const filteredPlugins = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PLUGINS.filter((plugin) => {
      const matchesCategory = selectedCategory === "all" || plugin.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        plugin.title.toLowerCase().includes(query) ||
        plugin.summary.toLowerCase().includes(query) ||
        plugin.categoryLabel.toLowerCase().includes(query) ||
        (plugin.referralPerk && plugin.referralPerk.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, selectedCategory]);

  const categories: Array<{ id: PluginCategory; label: string; count: number }> = useMemo(() => {
    return [
      { id: "all", label: "All Plugins", count: PLUGINS.length },
      { id: "messaging", label: "Messaging Channels", count: PLUGINS.filter((p) => p.category === "messaging").length },
      { id: "automation", label: "Automation & Bots", count: PLUGINS.filter((p) => p.category === "automation").length },
      { id: "payments", label: "Payments & Gateways", count: PLUGINS.filter((p) => p.category === "payments").length },
      { id: "media", label: "Media & Storage", count: PLUGINS.filter((p) => p.category === "media").length },
    ];
  }, []);

  return (
    <div className="dashboard-shell compact">
      <div className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Integrations Hub</p>
            <h2 className="section-heading" style={{ margin: 0 }}>
              Active plugins, payment gateways, and channel connections for your agency workspace.
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/70">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{PLUGINS.length} Modular Integrations Ready</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={1.8} />
          <input
            className="w-full bg-white/[0.035] border border-white/12 hover:border-white/20 focus:border-[#B9F719] focus:ring-1 focus:ring-[#B9F719]/30 rounded-[14px] pl-9 pr-8 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins, channels, payments..."
            type="text"
            value={searchQuery}
          />
          {searchQuery ? (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                className={`integration-category-chip px-3.5 py-2 rounded-[14px] text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "active bg-[#B9F719] !text-[#08090C] font-bold shadow-sm border border-[#B9F719]"
                    : "bg-white/[0.035] text-white/70 hover:bg-white/[0.07] hover:text-white border border-white/10"
                }`}
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={
                  isActive
                    ? {
                        backgroundColor: "#B9F719",
                        color: "#08090C",
                        borderColor: "#B9F719",
                        fontWeight: 700,
                      }
                    : undefined
                }
                type="button"
              >
                {cat.label}{" "}
                <span
                  className={`ml-1 text-[10px] ${isActive ? "!text-[#08090C]/80 font-bold" : "text-white/40"}`}
                  style={isActive ? { color: "rgba(8, 9, 12, 0.8)", fontWeight: 700 } : undefined}
                >
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {status ? (
        <div className="p-3 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs">
          {status}
        </div>
      ) : null}
      {authRequired ? (
        <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs">
          Admin authentication is required for integration changes. Refresh this page or sign in again.
        </div>
      ) : null}

      {/* Plugins Grid */}
      <div className="brief-grid two-up" style={{ marginTop: "8px" }}>
        {filteredPlugins.map((plugin) => {
          const isWhatsApp = plugin.id === "whatsapp";
          const isInstagram = plugin.id === "instagram";
          const isWhatsAppActive = isWhatsApp && whatsAppPluginEnabled;
          const isInstagramActive = isInstagram && instagramPluginEnabled;

          return (
            <article className="brief-card flex flex-col justify-between" key={plugin.id}>
              <div>
                <div className="plugin-card-heading justify-between">
                  <div className="flex items-center gap-3">
                    <PluginBrandMark brand={plugin.brand} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="meta-pill">{plugin.categoryLabel}</span>
                        {plugin.badge ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-lime-400/15 text-lime-400 border border-lime-400/30">
                            {plugin.verified ? <BadgeCheck size={11} className="text-lime-400" /> : <Sparkles size={10} />}
                            <span>{plugin.badge}</span>
                          </span>
                        ) : null}
                      </div>
                      <strong className="text-base text-white block mt-0.5">{plugin.title}</strong>
                    </div>
                  </div>

                  {/* Status Indicator & Active Toggle */}
                  <div>
                    {plugin.hasActiveToggle ? (
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            (isWhatsApp ? isWhatsAppActive : isInstagramActive)
                              ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30"
                              : "bg-white/5 text-white/40 border border-white/10"
                          }`}
                        >
                          {(isWhatsApp ? isWhatsAppActive : isInstagramActive) ? "Active" : "Disabled"}
                        </span>
                        <button
                          aria-checked={isWhatsApp ? isWhatsAppActive : isInstagramActive}
                          aria-label={`Toggle ${plugin.title}`}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            (isWhatsApp ? isWhatsAppActive : isInstagramActive) ? "bg-lime-400" : "bg-white/15"
                          }`}
                          disabled={isSaving}
                          onClick={() => {
                            if (isWhatsApp) {
                              void setWhatsAppPluginEnabled(!isWhatsAppActive);
                            } else {
                              void setInstagramPluginEnabled(!isInstagramActive);
                            }
                          }}
                          role="switch"
                          title={`Toggle ${plugin.title}`}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                              (isWhatsApp ? isWhatsAppActive : isInstagramActive)
                                ? "translate-x-5 bg-black"
                                : "translate-x-0 bg-white/70"
                            }`}
                          />
                        </button>
                      </div>
                    ) : plugin.referralLink ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-400/15 text-blue-400 border border-blue-400/30">
                        Referral Partner
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-white/10 text-white/80 border border-white/10">
                        Integrated
                      </span>
                    )}
                  </div>
                </div>

                <p className="muted-copy mt-3 text-sm text-white/70">{plugin.summary}</p>

                {/* Referral Benefit Callout */}
                {plugin.referralPerk ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2">
                    <Sparkles className="text-lime-400 shrink-0 mt-0.5" size={14} />
                    <div className="text-xs">
                      <span className="text-white/90 font-medium">{plugin.referralPerk}</span>
                      {plugin.referralCode ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/50 text-[11px]">Partner Code:</span>
                          <code className="px-1.5 py-0.5 rounded bg-white/10 text-lime-400 font-mono text-[11px]">
                            {plugin.referralCode}
                          </code>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="freelancer-action-grid mt-4 pt-3 border-t border-white/5">
                {isWhatsApp ? (
                  <div className="flex items-center gap-2 w-full">
                    {isWhatsAppActive ? (
                      <Link className="secondary-button flex-1 text-center justify-center" href="/admin/integrations/whatsapp">
                        Open WhatsApp Setup
                      </Link>
                    ) : (
                      <button
                        className="freelancer-primary-button flex-1"
                        disabled={isSaving}
                        onClick={() => void setWhatsAppPluginEnabled(true)}
                        type="button"
                      >
                        Enable WhatsApp API
                      </button>
                    )}
                    {isWhatsAppActive ? (
                      <button
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                        disabled={isSaving}
                        onClick={() => void setWhatsAppPluginEnabled(false)}
                        title="Disable WhatsApp"
                        type="button"
                      >
                        Disable
                      </button>
                    ) : null}
                  </div>
                ) : isInstagram ? (
                  <div className="flex items-center gap-2 w-full">
                    {isInstagramActive ? (
                      <Link className="secondary-button flex-1 text-center justify-center" href="/admin/integrations/instagram">
                        Open Instagram Setup
                      </Link>
                    ) : (
                      <button
                        className="freelancer-primary-button flex-1"
                        disabled={isSaving}
                        onClick={() => void setInstagramPluginEnabled(true)}
                        type="button"
                      >
                        Enable Instagram Inbox
                      </button>
                    )}
                    {isInstagramActive ? (
                      <button
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                        disabled={isSaving}
                        onClick={() => void setInstagramPluginEnabled(false)}
                        title="Disable Instagram"
                        type="button"
                      >
                        Disable
                      </button>
                    ) : null}
                  </div>
                ) : plugin.referralLink ? (
                  <div className="flex items-center gap-2 w-full">
                    <a
                      className="freelancer-primary-button flex-1 text-center justify-center inline-flex items-center gap-1.5"
                      href={plugin.referralLink}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>Open Partner Portal</span>
                      <ExternalLink size={13} />
                    </a>
                    <button
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all inline-flex items-center gap-1"
                      onClick={() => handleCopyReferral(plugin.id, plugin.referralLink!)}
                      title="Copy Partner Link"
                      type="button"
                    >
                      {copiedId === plugin.id ? <Check className="text-emerald-400" size={14} /> : <Copy size={14} />}
                      <span>{copiedId === plugin.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                ) : plugin.setupHref ? (
                  <Link className="secondary-button w-full text-center justify-center" href={plugin.setupHref}>
                    Manage Integration
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {filteredPlugins.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 mt-4">
          <p className="text-white/60 text-sm">No plugins found matching &quot;{searchQuery}&quot;.</p>
          <button
            className="mt-3 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            type="button"
          >
            Reset Filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

