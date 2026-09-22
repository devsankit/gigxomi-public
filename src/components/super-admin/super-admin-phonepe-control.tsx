"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";

export type PhonePeAdminConfigView = {
  environment: "sandbox" | "production";
  isActive: boolean;
  missingEnvKeys: string[];
  missingWebhookEnvKeys: string[];
  readyForPayments: boolean;
  settings: {
    autopayEnabled: boolean;
    oneTimeEnabled: boolean;
    pluginEnabled: boolean;
    webhookEnabled: boolean;
  };
  updatedAt: string | null;
  lastProviderStatus?: string | null;
  lastRequestId?: string | null;
  lastCheckedAt?: string | null;
  envStatus?: Array<{ key: string; configured: boolean; required: boolean }>;
};

type StatusState = { tone: "success" | "error"; message: string } | null;

type ApiPayload = {
  ok?: boolean;
  error?: string;
  config?: PhonePeAdminConfigView;
};

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SuperAdminPhonePeControl({ initialConfig }: { initialConfig: PhonePeAdminConfigView }) {
  const [config, setConfig] = useState(initialConfig);
  const [draft, setDraft] = useState(initialConfig.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  async function saveSettings() {
    setIsSaving(true);
    setStatus(null);
    const response = await fetch("/api/super-admin/payment-providers/phonepe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await response.json().catch(() => ({}))) as ApiPayload;

    if (!response.ok || !payload.ok || !payload.config) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to save PhonePe plugin settings." });
      setIsSaving(false);
      return;
    }

    setConfig(payload.config);
    setDraft(payload.config.settings);
    setStatus({ tone: "success", message: "PhonePe plugin settings saved." });
    setIsSaving(false);
  }

  return (
    <section className="billing-control-card">
      <div className="billing-control-card__header">
        <div className="plugin-card-heading">
          <PluginBrandMark brand="phonepe" size="lg" />
          <div>
            <span className={config.readyForPayments ? "billing-status-pill success" : "billing-status-pill warning"}>
              {config.readyForPayments ? <CheckCircle2 size={15} strokeWidth={1.9} /> : <XCircle size={15} strokeWidth={1.9} />}
              {config.readyForPayments ? "PhonePe ready" : "PhonePe needs setup"}
            </span>
            <h3>PhonePe gateway</h3>
            <p>Control AutoPay and the explicitly chosen one-time PhonePe fallback. Gateway availability does not confirm merchant approval.</p>
            <small>Environment: {config.environment.toUpperCase()}</small>
          </div>
        </div>
        <label className="billing-toggle-row compact">
          <input checked={draft.pluginEnabled} onChange={(event) => setDraft((current) => ({ ...current, pluginEnabled: event.target.checked }))} type="checkbox" />
          <span>
            <strong>Enable PhonePe</strong>
            <small>Gateway actions stay blocked while this switch is off.</small>
          </span>
        </label>
      </div>

      <div className="brief-grid three-up">
        <label className="billing-toggle-row compact">
          <input checked={draft.oneTimeEnabled} onChange={(event) => setDraft((current) => ({ ...current, oneTimeEnabled: event.target.checked }))} type="checkbox" />
          <span>
            <strong>One-time checkout</strong>
            <small>Packages and chat payment links.</small>
          </span>
        </label>
        <label className="billing-toggle-row compact">
          <input checked={draft.autopayEnabled} onChange={(event) => setDraft((current) => ({ ...current, autopayEnabled: event.target.checked }))} type="checkbox" />
          <span>
            <strong>Autopay</strong>
            <small>Subscription mandate controls.</small>
          </span>
        </label>
        <label className="billing-toggle-row compact">
          <input checked={draft.webhookEnabled} onChange={(event) => setDraft((current) => ({ ...current, webhookEnabled: event.target.checked }))} type="checkbox" />
          <span>
            <strong>Webhook</strong>
            <small>Payment success/failure callbacks.</small>
          </span>
        </label>
      </div>

      <div className="brief-grid three-up" aria-label="PhonePe diagnostics">
        <div className="brief-card">
          <span className="meta-pill">Environment</span>
          <strong>{config.environment.toUpperCase()}</strong>
          <p className="muted-copy">{config.readyForPayments ? "Server configuration is ready for provider calls." : "Provider calls are blocked until the required settings are ready."}</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Last provider status</span>
          <strong>{config.lastProviderStatus ?? "No checkout checked yet"}</strong>
          <p className="muted-copy">{config.lastCheckedAt ? formatDate(config.lastCheckedAt) : "A redacted status is recorded after the next checkout attempt."}</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Request ID</span>
          <strong>{config.lastRequestId ?? "—"}</strong>
          <p className="muted-copy">Use this ID to find the server-side diagnostic without exposing secrets.</p>
        </div>
      </div>

      {config.missingEnvKeys.length ? <p className="public-auth-error compact">Missing server env: {config.missingEnvKeys.join(", ")}</p> : null}
      <details><summary>Required-key presence (values never shown)</summary><ul>{config.envStatus?.map((item) => <li key={item.key}>{item.key}: {item.configured ? "Configured" : "Missing"}{item.required ? " (required)" : ""}</li>)}</ul></details>
      {config.missingWebhookEnvKeys.length && draft.webhookEnabled ? <p className="public-auth-error compact">Missing webhook env: {config.missingWebhookEnvKeys.join(", ")}</p> : null}
      {status ? <p className={status.tone === "success" ? "public-auth-success" : "public-auth-error"}>{status.message}</p> : null}

      <div className="billing-control-footer">
        <span>Last updated: {formatDate(config.updatedAt)}</span>
        <button className="primary-button" disabled={isSaving} onClick={saveSettings} type="button">
          {isSaving ? <Loader2 size={15} strokeWidth={1.9} /> : <CheckCircle2 size={15} strokeWidth={1.9} />}
          Save PhonePe plugin
        </button>
      </div>
    </section>
  );
}
