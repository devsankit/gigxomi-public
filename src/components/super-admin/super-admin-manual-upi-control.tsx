"use client";

import { useState } from "react";
import { CheckCircle2, IndianRupee, Loader2, MessageCircle, QrCode, XCircle } from "lucide-react";

import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";

type ManualUpiAdminConfigView = {
  isActive: boolean;
  readyForPayments: boolean;
  envFallbackActive?: boolean;
  missingFields: string[];
  updatedAt: string | null;
  settings: {
    pluginEnabled: boolean;
    upiId: string;
    payeeName: string;
    supportWhatsApp: string;
    instructions: string;
  };
};

type ManualUpiPaymentRow = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  updatedAt: string;
  user: {
    displayName: string;
    phone: string;
    email: string | null;
    packageStatus: string | null;
  };
  package: {
    name: string;
    packageType: string;
  };
  subscription: {
    id: string;
    status: string;
    paymentStatus: string;
  } | null;
  lastLog: {
    eventType: string;
    status: string | null;
    createdAt: string;
  } | null;
};

type SubscriptionReminderSettingsView = {
  enabled: boolean;
  reminderDays: number[];
  updatedAt: string | null;
};

type StatusState = { tone: "success" | "error"; message: string } | null;

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount: string, currency: string) {
  const numeric = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function SuperAdminManualUpiControl({
  initialConfig,
  initialPayments,
  initialReminderSettings,
}: {
  initialConfig: ManualUpiAdminConfigView;
  initialPayments: ManualUpiPaymentRow[];
  initialReminderSettings: SubscriptionReminderSettingsView;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [draft, setDraft] = useState(initialConfig.settings);
  const [payments, setPayments] = useState(initialPayments);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(initialReminderSettings);
  const [reminderDraft, setReminderDraft] = useState({
    enabled: initialReminderSettings.enabled,
    reminderDays: initialReminderSettings.reminderDays.join(", "),
  });
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>(null);

  async function saveSettings() {
    setIsSaving(true);
    setStatus(null);
    const response = await fetch("/api/super-admin/payment-providers/manual-upi", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; config?: ManualUpiAdminConfigView };
    if (!response.ok || !payload.ok || !payload.config) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to save manual UPI settings." });
      setIsSaving(false);
      return;
    }
    setConfig(payload.config);
    setDraft(payload.config.settings);
    setStatus({ tone: "success", message: "Manual UPI settings saved." });
    setIsSaving(false);
  }

  async function saveReminderSettings() {
    setIsSavingReminders(true);
    setStatus(null);
    const response = await fetch("/api/super-admin/billing-reminders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: reminderDraft.enabled,
        reminderDays: reminderDraft.reminderDays,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      settings?: SubscriptionReminderSettingsView;
    };
    if (!response.ok || !payload.ok || !payload.settings) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to save renewal reminder settings." });
      setIsSavingReminders(false);
      return;
    }

    setReminderSettings(payload.settings);
    setReminderDraft({
      enabled: payload.settings.enabled,
      reminderDays: payload.settings.reminderDays.join(", "),
    });
    setStatus({ tone: "success", message: "Renewal reminder settings saved." });
    setIsSavingReminders(false);
  }

  async function reviewPayment(paymentId: string, action: "approve" | "reject") {
    setBusyPaymentId(paymentId);
    setStatus(null);
    const response = await fetch(`/api/super-admin/manual-upi-payments/${paymentId}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: action === "reject" ? JSON.stringify({ reason: "Rejected from manual UPI queue." }) : "{}",
    });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setStatus({ tone: "error", message: payload.error ?? `Unable to ${action} payment.` });
      setBusyPaymentId(null);
      return;
    }
    setPayments((current) => current.filter((payment) => payment.id !== paymentId));
    setStatus({ tone: "success", message: action === "approve" ? "Payment approved and package activated." : "Payment marked for resubmission." });
    setBusyPaymentId(null);
  }

  return (
    <div className="manual-upi-admin-stack">
      <section className="billing-control-card">
        <div className="billing-control-card__header">
          <div className="plugin-card-heading">
            <PluginBrandMark brand="manual-upi" size="lg" />
            <div>
              <span className={config.readyForPayments ? "billing-status-pill success" : "billing-status-pill warning"}>
                <QrCode size={15} strokeWidth={1.9} />
                {config.readyForPayments ? "Manual UPI ready" : "Manual UPI needs setup"}
              </span>
              <h3>Manual UPI payments</h3>
              <p>Use fixed-amount UPI QR payments with WhatsApp screenshot verification.</p>
              {config.envFallbackActive ? <small>Server .env UPI fallback is active for checkout.</small> : null}
            </div>
          </div>
          <label className="billing-toggle-row compact">
            <input checked={draft.pluginEnabled} onChange={(event) => setDraft((current) => ({ ...current, pluginEnabled: event.target.checked }))} type="checkbox" />
            <span>
              <strong>Enable manual UPI</strong>
              <small>Paid packages use this instead of PhonePe/Razorpay.</small>
            </span>
          </label>
        </div>

        <div className="billing-setup-grid">
          <label className="billing-setup-field">
            <span>UPI ID</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, upiId: event.target.value }))} placeholder="name@bank" value={draft.upiId} />
          </label>
          <label className="billing-setup-field">
            <span>Payee name</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, payeeName: event.target.value }))} placeholder="Gigxomi" value={draft.payeeName} />
          </label>
          <label className="billing-setup-field">
            <span>WhatsApp support</span>
            <input onChange={(event) => setDraft((current) => ({ ...current, supportWhatsApp: event.target.value }))} placeholder="+919981807309" value={draft.supportWhatsApp} />
          </label>
          <label className="billing-setup-field wide">
            <span>Payment instructions</span>
            <textarea onChange={(event) => setDraft((current) => ({ ...current, instructions: event.target.value }))} rows={3} value={draft.instructions} />
          </label>
        </div>

        {config.missingFields.length ? <p className="public-auth-error compact">Missing: {config.missingFields.join(", ")}</p> : null}
        {status ? <p className={status.tone === "success" ? "public-auth-success" : "public-auth-error"}>{status.message}</p> : null}

        <div className="billing-control-footer">
          <span>Last updated: {formatDate(config.updatedAt)}</span>
          <button className="primary-button" disabled={isSaving} onClick={saveSettings} type="button">
            {isSaving ? <Loader2 size={15} strokeWidth={1.9} /> : <CheckCircle2 size={15} strokeWidth={1.9} />}
            Save UPI settings
          </button>
        </div>
      </section>

      <section className="billing-control-card">
        <div className="billing-control-card__header">
          <div>
            <span className={reminderSettings.enabled ? "billing-status-pill success" : "billing-status-pill warning"}>
              <MessageCircle size={15} strokeWidth={1.9} />
              {reminderSettings.enabled ? "Renewal reminders active" : "Renewal reminders paused"}
            </span>
            <h3>Subscription renewal reminders</h3>
            <p>Send WhatsApp pay-now reminders before expiry and let the billing job create a fresh renewal payment link automatically.</p>
            <small>Configure the CTA template names in WhatsApp Control. The job uses days like 5, 4, 3, 2, 1, 0 before renewal.</small>
          </div>
          <label className="billing-toggle-row compact">
            <input
              checked={reminderDraft.enabled}
              onChange={(event) => setReminderDraft((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
            <span>
              <strong>Enable reminders</strong>
              <small>Billing job will send reminders only for active recurring subscriptions.</small>
            </span>
          </label>
        </div>

        <div className="billing-setup-grid">
          <label className="billing-setup-field wide">
            <span>Reminder days before expiry</span>
            <input
              onChange={(event) => setReminderDraft((current) => ({ ...current, reminderDays: event.target.value }))}
              placeholder="5, 4, 3, 2, 1, 0"
              value={reminderDraft.reminderDays}
            />
          </label>
        </div>

        <p className="muted-copy">Current schedule: {reminderSettings.reminderDays.length ? reminderSettings.reminderDays.join(", ") : "No reminder days saved"} days before expiry.</p>

        <div className="billing-control-footer">
          <span>Last updated: {formatDate(reminderSettings.updatedAt)}</span>
          <button className="primary-button" disabled={isSavingReminders} onClick={saveReminderSettings} type="button">
            {isSavingReminders ? <Loader2 size={15} strokeWidth={1.9} /> : <CheckCircle2 size={15} strokeWidth={1.9} />}
            Save reminder settings
          </button>
        </div>
      </section>

      <section className="billing-control-card">
        <div className="billing-control-card__header">
          <div>
            <span className="billing-status-pill">
              <IndianRupee size={15} strokeWidth={1.9} />
              {payments.length} pending
            </span>
            <h3>Manual payment approval queue</h3>
            <p>Approve only after matching the WhatsApp screenshot or UTR with the payment reference.</p>
          </div>
        </div>

        {payments.length ? (
          <div className="manual-upi-payment-list">
            {payments.map((payment) => (
              <article className="manual-upi-payment-row" key={payment.id}>
                <div>
                  <strong>{payment.user.displayName}</strong>
                  <span>{payment.user.phone}</span>
                  <small>{payment.reference}</small>
                </div>
                <div>
                  <strong>{payment.package.name}</strong>
                  <span>{formatMoney(payment.amount, payment.currency)}</span>
                  <small>{payment.subscription?.status ?? payment.status}</small>
                </div>
                <div>
                  <span>Updated {formatDate(payment.updatedAt)}</span>
                  {payment.lastLog ? <small>{payment.lastLog.eventType.replace(/_/g, " ")}</small> : <small>No WhatsApp log yet</small>}
                </div>
                <div className="manual-upi-review-actions">
                  <a className="secondary-button" href={`https://wa.me/${payment.user.phone.replace(/\D/g, "")}`} rel="noreferrer" target="_blank">
                    <MessageCircle size={14} strokeWidth={1.8} />
                    WhatsApp
                  </a>
                  <button className="primary-button" disabled={busyPaymentId === payment.id} onClick={() => reviewPayment(payment.id, "approve")} type="button">
                    <CheckCircle2 size={14} strokeWidth={1.8} />
                    Approve
                  </button>
                  <button className="secondary-button" disabled={busyPaymentId === payment.id} onClick={() => reviewPayment(payment.id, "reject")} type="button">
                    <XCircle size={14} strokeWidth={1.8} />
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No pending manual UPI payments right now.</p>
        )}
      </section>
    </div>
  );
}
