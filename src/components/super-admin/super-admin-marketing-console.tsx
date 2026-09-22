"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowRight, Bell, RefreshCcw, Send, Save } from "lucide-react";

import { MetricCard } from "@/components/ui/dashboard-primitives";
import type { MarketingDebugEvent, MarketingEventBlueprint, MarketingIntegrationSettings } from "@/lib/gigxomi/public-growth-types";

type MarketingConsolePayload = {
  ok?: boolean;
  error?: string;
  settings?: MarketingIntegrationSettings;
  blueprints?: MarketingEventBlueprint[];
  recentEvents?: MarketingDebugEvent[];
};

type PushBroadcastPayload = {
  ok?: boolean;
  error?: string;
  matched?: number;
  result?: {
    attempted?: number;
    sent?: number;
    failed?: number;
  };
  stats?: {
    active: number;
    android: number;
    ios: number;
    web: number;
    freelancer: number;
    editor: number;
  };
};

type StatusState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SuperAdminMarketingConsole({
  initialSettings,
  initialBlueprints,
  initialEvents,
}: {
  initialSettings: MarketingIntegrationSettings;
  initialBlueprints: MarketingEventBlueprint[];
  initialEvents: MarketingDebugEvent[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [blueprints, setBlueprints] = useState(initialBlueprints);
  const [recentEvents, setRecentEvents] = useState(initialEvents);
  const [status, setStatus] = useState<StatusState>(null);
  const [pushAudience, setPushAudience] = useState<"freelancer" | "editor" | "both">("both");
  const [pushPlatform, setPushPlatform] = useState<"all" | "mobile" | "web">("all");
  const [pushTitle, setPushTitle] = useState("Gigxomi update");
  const [pushBody, setPushBody] = useState("");
  const [pushDeepLinkUrl, setPushDeepLinkUrl] = useState("/notifications");
  const [pushStats, setPushStats] = useState<PushBroadcastPayload["stats"] | null>(null);
  const [pushStatus, setPushStatus] = useState<StatusState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);

  const configuredCount = [
    settings.gtmContainerId,
    settings.ga4MeasurementId,
    settings.searchConsoleVerification,
    settings.metaPixelId || settings.pixelEndpoint,
  ].filter(Boolean).length;

  async function refreshConsole() {
    setIsRefreshing(true);
    setStatus(null);

    const response = await fetch("/api/super-admin/marketing", {
      cache: "no-store",
      credentials: "include",
    });

    const payload = (await response.json().catch(() => ({}))) as MarketingConsolePayload;
    if (!response.ok || payload.ok === false) {
      setStatus({
        tone: "error",
        message: payload.error ?? "Unable to refresh the marketing console.",
      });
      setIsRefreshing(false);
      return;
    }

    setSettings(payload.settings ?? initialSettings);
    setBlueprints(payload.blueprints ?? initialBlueprints);
    setRecentEvents(payload.recentEvents ?? []);
    setStatus({
      tone: "success",
      message: "Marketing payloads refreshed from the live event log.",
    });
    setIsRefreshing(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const response = await fetch("/api/super-admin/marketing", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    const payload = (await response.json().catch(() => ({}))) as MarketingConsolePayload;
    if (!response.ok || payload.ok === false) {
      setStatus({
        tone: "error",
        message: payload.error ?? "Unable to save marketing settings right now.",
      });
      setIsSaving(false);
      return;
    }

    setSettings(payload.settings ?? settings);
    setBlueprints(payload.blueprints ?? blueprints);
    setRecentEvents(payload.recentEvents ?? recentEvents);
    setStatus({
      tone: "success",
      message: "Marketing settings saved. GTM, GA4, Search Console, and pixel values will now load from this console.",
    });
    setIsSaving(false);
  }

  async function sendPushBroadcast(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPushSending(true);
    setPushStatus(null);

    const response = await fetch("/api/super-admin/push-notifications/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetMode: "audience",
        audience: pushAudience,
        platform: pushPlatform,
        title: pushTitle,
        message: pushBody,
        deepLinkUrl: pushDeepLinkUrl,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      stats?: PushBroadcastPayload["stats"] | null;
      recipientsCount?: number;
      pushResult?: { sent?: number };
    };

    if (!response.ok || payload.ok === false) {
      setPushStatus({ tone: "error", message: payload.error ?? "Push broadcast failed." });
      setPushStats(payload.stats ?? null);
      setIsPushSending(false);
      return;
    }

    setPushStatus({
      tone: "success",
      message: payload.message ?? `Push delivered to ${payload.recipientsCount ?? 0} user(s) (${payload.pushResult?.sent ?? 0} device pushes).`,
    });
    setIsPushSending(false);
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Marketing</p>
      <h2 className="section-heading">Configure GTM, GA4, Search Console, and pixel settings here, then inspect the exact public payloads reaching the event bus.</h2>

      <div className="metric-grid">
        <MetricCard label="Integrations set" value={String(configuredCount)} />
        <MetricCard label="Tracked events" value={String(blueprints.length)} />
        <MetricCard label="Recent payloads" value={String(recentEvents.length)} />
        <MetricCard label="Search Console site" value={settings.searchConsoleSiteUrl ? "Ready" : "Missing"} />
      </div>

      <div className="brief-grid two-up">
        <section className="brief-card">
          <span className="meta-pill">Integration settings</span>
          <strong>Public marketing controls</strong>
          <form className="freelancer-form-grid marketing-form-grid" onSubmit={handleSubmit}>
            <label className="freelancer-field">
              <span>GTM container ID</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, gtmContainerId: event.target.value }))}
                placeholder="GTM-XXXXXXX"
                value={settings.gtmContainerId}
              />
            </label>

            <label className="freelancer-field">
              <span>GA4 measurement ID</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, ga4MeasurementId: event.target.value }))}
                placeholder="G-XXXXXXXXXX"
                value={settings.ga4MeasurementId}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Search Console site URL</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, searchConsoleSiteUrl: event.target.value }))}
                placeholder="https://gigxomi.com"
                value={settings.searchConsoleSiteUrl}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Search Console verification token</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, searchConsoleVerification: event.target.value }))}
                placeholder="google-site-verification token"
                value={settings.searchConsoleVerification}
              />
            </label>

            <label className="freelancer-field">
              <span>Meta pixel ID</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, metaPixelId: event.target.value }))}
                placeholder="123456789012345"
                value={settings.metaPixelId}
              />
            </label>

            <label className="freelancer-field">
              <span>Pixel endpoint (optional)</span>
              <input
                onChange={(event) => setSettings((current) => ({ ...current, pixelEndpoint: event.target.value }))}
                placeholder="https://pixel.example.com/collect"
                value={settings.pixelEndpoint}
              />
            </label>

            <div className="package-form-actions freelancer-field-full">
              <button className="freelancer-primary-button" disabled={isSaving} type="submit">
                <Save size={15} strokeWidth={1.8} />
                {isSaving ? "Saving settings..." : "Save marketing settings"}
              </button>
              <button className="freelancer-secondary-button" disabled={isRefreshing} onClick={refreshConsole} type="button">
                <RefreshCcw size={15} strokeWidth={1.8} />
                {isRefreshing ? "Refreshing..." : "Refresh debug feed"}
              </button>
            </div>
          </form>

          {status ? <p className={status.tone === "success" ? "dashboard-inline-status success" : "dashboard-inline-status error"}>{status.message}</p> : null}
        </section>

        <section className="brief-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span className="meta-pill">Push & Drip Intelligence</span>
            <Link
              href="/super-admin/push-notifications"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#38BDF8", textDecoration: "none", fontWeight: 600 }}
            >
              <Bell size={13} />
              Open Full Push & Drip Dashboard
              <ArrowRight size={13} />
            </Link>
          </div>
          <strong>Push Notifications & Automated Drip Campaigns</strong>
          <form className="freelancer-form-grid marketing-form-grid" onSubmit={sendPushBroadcast}>
            <label className="freelancer-field">
              <span>Audience</span>
              <select value={pushAudience} onChange={(event) => setPushAudience(event.target.value as "freelancer" | "editor" | "both")}>
                <option value="both">Freelancer + editor</option>
                <option value="freelancer">Freelancer</option>
                <option value="editor">Editor</option>
              </select>
            </label>

            <label className="freelancer-field">
              <span>Device target</span>
              <select value={pushPlatform} onChange={(event) => setPushPlatform(event.target.value as "all" | "mobile" | "web")}>
                <option value="all">Web + phone</option>
                <option value="mobile">Phone only</option>
                <option value="web">Web only</option>
              </select>
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Title</span>
              <input onChange={(event) => setPushTitle(event.target.value)} value={pushTitle} />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Message</span>
              <textarea
                onChange={(event) => setPushBody(event.target.value)}
                placeholder="Write the notification message"
                rows={4}
                value={pushBody}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Open path</span>
              <input onChange={(event) => setPushDeepLinkUrl(event.target.value)} placeholder="/notifications" value={pushDeepLinkUrl} />
            </label>

            <div className="package-form-actions freelancer-field-full">
              <button className="freelancer-primary-button" disabled={isPushSending || !pushBody.trim()} type="submit">
                <Send size={15} strokeWidth={1.8} />
                {isPushSending ? "Sending..." : "Send push notification"}
              </button>
            </div>
          </form>
          {pushStatus ? <p className={pushStatus.tone === "success" ? "dashboard-inline-status success" : "dashboard-inline-status error"}>{pushStatus.message}</p> : null}
          {pushStats ? (
            <div className="marketing-summary-grid">
              <div className="marketing-summary-item"><span>Active tokens</span><strong>{pushStats.active}</strong></div>
              <div className="marketing-summary-item"><span>Phones</span><strong>{pushStats.android + pushStats.ios}</strong></div>
              <div className="marketing-summary-item"><span>Web</span><strong>{pushStats.web}</strong></div>
              <div className="marketing-summary-item"><span>Freelancers</span><strong>{pushStats.freelancer}</strong></div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="brief-grid two-up">
        <section className="brief-card">
          <span className="meta-pill">Live config</span>
          <strong>What the public app will boot with</strong>
          <div className="marketing-summary-grid">
            <div className="marketing-summary-item">
              <span>GTM</span>
              <strong>{settings.gtmContainerId || "Not configured"}</strong>
            </div>
            <div className="marketing-summary-item">
              <span>GA4</span>
              <strong>{settings.ga4MeasurementId || "Not configured"}</strong>
            </div>
            <div className="marketing-summary-item">
              <span>Search Console</span>
              <strong>{settings.searchConsoleVerification ? "Verification ready" : "Token missing"}</strong>
            </div>
            <div className="marketing-summary-item">
              <span>Pixel</span>
              <strong>{settings.metaPixelId || settings.pixelEndpoint || "Not configured"}</strong>
            </div>
          </div>

          <div className="stack-list">
            <div className="bullet-row">
              <Activity size={16} strokeWidth={1.8} />
              <p>GTM is the event bus. Public prompt, search, service, sample, link, WhatsApp, and auth events all land in `window.dataLayer` first.</p>
            </div>
            <div className="bullet-row">
              <Activity size={16} strokeWidth={1.8} />
              <p>Search Console stays verification-only. It stores your site target and token but does not receive runtime events.</p>
            </div>
            <div className="bullet-row">
              <Activity size={16} strokeWidth={1.8} />
              <p>The debug feed below captures recent public payloads so the team can verify what is being emitted before touching GTM previews or live dashboards.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="brief-grid two-up">
        <section className="brief-card">
          <span className="meta-pill">Event blueprint</span>
          <strong>Tracked public events</strong>
          <div className="marketing-blueprint-list">
            {blueprints.map((item) => (
              <article className="marketing-blueprint-row" key={item.event}>
                <div>
                  <h3>{item.event}</h3>
                  <p className="muted-copy">{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="brief-card">
          <span className="meta-pill">Debug feed</span>
          <strong>Recent public payloads</strong>
          <div className="marketing-event-list">
            {recentEvents.length ? (
              recentEvents.map((eventItem) => (
                <article className="marketing-event-row" key={eventItem.id}>
                  <div className="marketing-event-head">
                    <div>
                      <h3>{eventItem.event}</h3>
                      <p className="muted-copy">
                        {eventItem.path || "/"} - {formatDateTime(eventItem.createdAt)}
                      </p>
                    </div>
                  </div>
                  <pre className="marketing-code-block">{JSON.stringify(eventItem.payload, null, 2)}</pre>
                </article>
              ))
            ) : (
              <p className="muted-copy">No public events have been captured yet. Open the homepage, search, submit a prompt, or click a service CTA to populate this feed.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
