"use client";

import { useEffect, useState } from "react";

type AccountingAudience = "agency" | "editor";

type AccountingRecord = {
  id: string;
  assignmentId?: string;
  commissionAmount?: number;
  commissionPercent?: number;
  conversationId: string;
  createdAt: string;
  customerName: string;
  dueLabel?: string;
  freelancerAmount?: number;
  freelancerName?: string;
  gatewayStatus?: string;
  lane: "customer" | "internal";
  merchantOrderId?: string;
  payerRole: "client" | "agency";
  payeeRole: "agency" | "freelancer";
  paymentLink?: string;
  provider?: string;
  rawStatus?: string;
  status: string;
  title: string;
  amount: number;
};

type AccountingPayload = {
  summary: {
    total: number;
    pending: number;
    paid: number;
    credited?: number;
    pendingAmount: number;
    paidAmount: number;
    walletCreditedAmount?: number;
    platformCommissionAmount?: number;
  };
  records: AccountingRecord[];
};

function formatCurrency(value: number) {
  return `INR ${Math.max(0, value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AccountingSection({ audience }: { audience: AccountingAudience }) {
  const [payload, setPayload] = useState<AccountingPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/accounting/requests?audience=${audience}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (!data?.ok) {
          setError(data?.error || "Unable to load accounting list.");
          setPayload(null);
          return;
        }
        setPayload({
          summary: data.summary,
          records: Array.isArray(data.records) ? data.records : [],
        });
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load accounting list.");
        setPayload(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [audience]);

  return (
    <section className="stack-list">
      <div className="dashboard-shell compact">
        <p className="eyebrow">Accounting</p>
        <h2 className="section-heading">
          {audience === "agency"
            ? "Editor payment requests collect through PhonePe into Gigxomi, then credit the editor wallet."
            : "Wallet credits and manual payout status for completed editor work."}
        </h2>
      </div>

      {loading ? <p className="muted-copy">Loading accounting records...</p> : null}
      {error ? <p className="muted-copy">{error}</p> : null}

      {payload ? (
        <>
          <div className="native-wallet-grid">
            <article className="native-wallet-card">
              <span>Total bills</span>
              <strong>{payload.summary.total}</strong>
            </article>
            <article className="native-wallet-card">
              <span>Pending</span>
              <strong>
                {payload.summary.pending} ({formatCurrency(payload.summary.pendingAmount)})
              </strong>
            </article>
            <article className="native-wallet-card">
              <span>{audience === "agency" ? "Wallet credited" : "Available wallet"}</span>
              <strong>
                {(payload.summary.credited ?? payload.summary.paid) || 0} ({formatCurrency(payload.summary.walletCreditedAmount ?? payload.summary.paidAmount)})
              </strong>
            </article>
          </div>

          <div className="dashboard-shell compact">
            {payload.records.length ? (
              <div className="stack-list">
                {payload.records.map((item) => (
                  <article className="wallet-ledger-item" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted-copy">
                        {item.freelancerName ?? item.customerName} - {item.status} - {item.provider ?? "PhonePe"}
                      </p>
                      {typeof item.freelancerAmount === "number" ? (
                        <p className="muted-copy">
                          Editor wallet: {formatCurrency(item.freelancerAmount)} after {item.commissionPercent ?? 0}% commission.
                        </p>
                      ) : null}
                    </div>
                    <div className="wallet-ledger-side">
                      <strong>{formatCurrency(item.amount)}</strong>
                      <span>{formatDate(item.createdAt)}</span>
                      {audience === "agency" && item.paymentLink && item.rawStatus === "PAYMENT_PENDING" ? (
                        <a className="gx-button gx-button-secondary" href={item.paymentLink} rel="noreferrer" target="_blank">
                          Pay with PhonePe
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No accounting records yet.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
