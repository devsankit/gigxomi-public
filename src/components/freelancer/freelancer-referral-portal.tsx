"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Globe,
  Info,
  MousePointerClick,
  Search,
  Smartphone,
  TrendingUp,
  Trophy,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

type ReferralEntry = {
  id: string;
  customerName: string;
  customerContact: string;
  date: string;
  product: string;
  planType: "Premium" | "Free";
  amount: string;
  commission: string;
  commValue: number;
  status: "Active" | "Pending" | "Terminated";
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function FreelancerReferralPortal() {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPlan, setFilterPlan] = useState("All");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [freelancerCode, setFreelancerCode] = useState("creator");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingVesting, setPendingVesting] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [minPayout] = useState(500);
  const [views, setViews] = useState(0);
  const [signups, setSignups] = useState(0);
  const [realEntries, setRealEntries] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.email) {
          const rawCode = data.user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
          setFreelancerCode(rawCode || "creator");
        }
      })
      .catch(() => {});

    fetch("/api/freelancer/wallet/overview", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.availableBalance !== undefined) {
          setAvailableBalance(Number(data.availableBalance) || 0);
        }
        if (data?.pendingBalance !== undefined) {
          setPendingVesting(Number(data.pendingBalance) || 0);
        }
        if (data?.withdrawnBalance !== undefined) {
          setTotalWithdrawn(Number(data.withdrawnBalance) || 0);
        }
      })
      .catch(() => {});
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.gigxomi.com";
  const websiteUrl = `${origin}/?ref=${encodeURIComponent(freelancerCode)}`;
  const androidAppUrl = `${origin}/go/app?ref=${encodeURIComponent(freelancerCode)}`;

  function copyText(text: string, msg: string) {
    navigator.clipboard?.writeText(text);
    setCopiedMessage(msg);
    setTimeout(() => setCopiedMessage(null), 3000);
  }

  const conversionRate = views > 0 ? `${((signups / views) * 100).toFixed(1)}%` : "0.0%";
  const totalEarnedCommission = availableBalance + totalWithdrawn;

  const filteredEntries = useMemo(() => {
    return realEntries.filter((item) => {
      if (filterStatus !== "All" && item.status !== filterStatus) return false;
      if (filterPlan === "Premium" && item.planType !== "Premium") return false;
      if (filterPlan === "Free" && item.planType !== "Free") return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.customerContact.toLowerCase().includes(q) ||
          item.product.toLowerCase().includes(q) ||
          item.amount.toLowerCase().includes(q) ||
          item.commission.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.date.includes(q)
        );
      }
      return true;
    });
  }, [realEntries, filterStatus, filterPlan, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleWithdrawSubmit(event: FormEvent) {
    event.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < minPayout) {
      setWithdrawStatus(`Minimum withdrawal amount is ${money(minPayout)}.`);
      return;
    }
    if (Number(withdrawAmount) > availableBalance) {
      setWithdrawStatus(`Amount exceeds available balance of ${money(availableBalance)}.`);
      return;
    }
    setIsSubmittingWithdraw(true);
    setWithdrawStatus("");
    try {
      const res = await fetch("/api/freelancer/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(withdrawAmount), note: withdrawNote }),
      });
      if (!res.ok) throw new Error("Request failed");
      setWithdrawStatus("Withdrawal requested successfully!");
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawNote("");
        setWithdrawStatus("");
      }, 1200);
    } catch {
      setWithdrawStatus("Failed to submit withdrawal request.");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  }

  return (
    <div className="sales-referral-view">
      {/* Toast Notification */}
      {copiedMessage ? (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--color-surface-elevated, #141911)",
            color: "var(--color-primary, #D7FF2F)",
            border: "1px solid var(--color-border-strong, rgba(215, 255, 47, 0.3))",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: "0.85rem",
            fontWeight: 600,
            zIndex: 10000,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {copiedMessage}
        </div>
      ) : null}

      {/* Top Metrics Strip */}
      <section className="sales-command-strip" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <article className="sales-wallet-card" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 10, padding: 16 }}>
          <MousePointerClick size={18} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Referral Clicks</span>
          <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.6rem", fontWeight: 700 }}>{views}</strong>
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>Website & Android App visits</small>
        </article>

        <article className="sales-wallet-card" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 10, padding: 16 }}>
          <UserRound size={18} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Referral Signups</span>
          <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.6rem", fontWeight: 700 }}>{signups}</strong>
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>Accounts registered via link</small>
        </article>

        <article className="sales-wallet-card" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 10, padding: 16 }}>
          <TrendingUp size={18} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Conversion Rate</span>
          <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.6rem", fontWeight: 700 }}>{conversionRate}</strong>
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>Paid subscriptions</small>
        </article>

        <article className="sales-wallet-card" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 10, padding: 16 }}>
          <Coins size={18} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Available Commission</span>
          <strong style={{ color: "var(--color-primary, #D7FF2F)", fontSize: "1.6rem", fontWeight: 700 }}>{money(availableBalance)}</strong>
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>Min payout {money(minPayout)}</small>
        </article>

        <article className="sales-wallet-card" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 10, padding: 16 }}>
          <Trophy size={18} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Total Commission Earned</span>
          <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.6rem", fontWeight: 700 }}>{money(totalEarnedCommission)}</strong>
          <small style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>20% on Premium purchases</small>
        </article>
      </section>

      {/* Main Two-Column Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* Left Column: Commission Balance & Payout */}
        <article className="sales-panel" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 12, padding: 20 }}>
          <div className="sales-panel-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <WalletCards size={18} style={{ color: "var(--color-primary, #D7FF2F)" }} />
            <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.05rem" }}>Commission Balance & Payout</strong>
          </div>

          <div className="sales-referral-wallet-card">
            <span className="sales-referral-wallet-label">Available for Withdrawal</span>
            <div className="sales-referral-wallet-value">{money(availableBalance)}</div>

            <div className="sales-referral-wallet-meta">
              <div className="sales-referral-meta-item">
                <span>Pending Maturation (7-day hold)</span>
                <strong>{money(pendingVesting)}</strong>
              </div>
              <div className="sales-referral-meta-item">
                <span>Total Amount Withdrawn</span>
                <strong>{money(totalWithdrawn)}</strong>
              </div>
              <div className="sales-referral-meta-item">
                <span>Commission Rate</span>
                <strong style={{ color: "var(--color-primary, #D7FF2F)" }}>20% on Premium</strong>
              </div>
              <div className="sales-referral-meta-item">
                <span>Freemium & Freelancer Plans</span>
                <span>0% (Free tiers)</span>
              </div>
            </div>

            <button
              className="sales-primary-button full-width"
              disabled={availableBalance < minPayout}
              onClick={() => {
                setWithdrawAmount(availableBalance >= minPayout ? availableBalance : "");
                setShowWithdrawModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 18px",
                background: availableBalance >= minPayout ? "var(--color-primary, #D7FF2F)" : "rgba(255,255,255,0.08)",
                color: availableBalance >= minPayout ? "#000" : "var(--color-text-muted)",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: availableBalance >= minPayout ? "pointer" : "not-allowed",
              }}
              type="button"
            >
              <ArrowDownToLine size={16} /> Request Withdrawal ({money(minPayout)} min)
            </button>

            {availableBalance < minPayout ? (
              <p className="muted-copy" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                <Info size={14} /> You can request a withdrawal once your available balance reaches {money(minPayout)}.
              </p>
            ) : (
              <p className="muted-copy" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, color: "var(--color-success, #22c55e)", fontSize: "0.82rem" }}>
                <CheckCircle2 size={14} /> Balance is ready for withdrawal to your saved payout method.
              </p>
            )}
          </div>
        </article>

        {/* Right Column: Dual Referral Links */}
        <article className="sales-panel" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 12, padding: 20 }}>
          <div className="sales-panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={18} style={{ color: "var(--color-primary, #D7FF2F)" }} />
              <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.05rem" }}>Your Dual Referral Links</strong>
            </div>
            <span style={{ fontSize: "0.75rem", background: "rgba(215,255,47,0.1)", color: "var(--color-primary, #D7FF2F)", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
              20% on Premium
            </span>
          </div>

          <div className="sales-referral-rule-card">
            <div className="sales-referral-rule-pill">Commission Policy</div>
            <p>
              Earn <strong>20% commission</strong> when referred users purchase any paid <strong>Premium</strong> plan.
              Freemium and Freelancer plans are eligible for <strong>0% commission</strong> until a paid upgrade is completed.
              Payouts are processed directly on request.
            </p>
          </div>

          <div className="sales-referral-link-section">
            <div className="sales-referral-link-label">
              <Globe size={15} />
              <strong>Website Referral Link</strong>
              <span>Web platform landing</span>
            </div>
            <div className="sales-link-input-group">
              <input className="sales-referral-input" readOnly value={websiteUrl} />
              <button
                className="sales-primary-button compact"
                onClick={() => copyText(websiteUrl, "Website referral link copied!")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "var(--color-primary, #D7FF2F)",
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                type="button"
              >
                <Copy size={14} /> Copy
              </button>
              <a
                className="sales-secondary-button compact icon-only"
                href={websiteUrl}
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--color-text-secondary, #a8aea2)",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                  borderRadius: 6,
                }}
                target="_blank"
                title="Open website link"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="sales-referral-link-section">
            <div className="sales-referral-link-label">
              <Smartphone size={15} />
              <strong>Android App Referral Link</strong>
              <span>Google Play Store attribution</span>
            </div>
            <div className="sales-link-input-group">
              <input className="sales-referral-input" readOnly value={androidAppUrl} />
              <button
                className="sales-primary-button compact"
                onClick={() => copyText(androidAppUrl, "Android App referral link copied!")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "var(--color-primary, #D7FF2F)",
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                type="button"
              >
                <Copy size={14} /> Copy
              </button>
              <a
                className="sales-secondary-button compact icon-only"
                href={androidAppUrl}
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--color-text-secondary, #a8aea2)",
                  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
                  borderRadius: 6,
                }}
                target="_blank"
                title="Open Play Store link"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="sales-tracking-code-pill">
            <span>Tracking attribution code:</span>
            <code>{freelancerCode}</code>
          </div>
        </article>
      </section>

      {/* Referrals & Commission Ledger */}
      <section className="sales-page-grid" style={{ width: "100%" }}>
        <article className="sales-panel" style={{ background: "var(--color-surface, #0A0D0B)", border: "1px solid var(--color-border, rgba(255,255,255,0.06))", borderRadius: 12, padding: 20 }}>
          <div className="sales-panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <strong style={{ color: "var(--color-text-primary, #f5f7fa)", fontSize: "1.05rem" }}>Referrals & Commission Ledger</strong>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
              {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          <div className="sales-referral-toolbar">
            <div className="sales-referral-search-box">
              <Search size={15} style={{ color: "var(--color-text-muted)" }} />
              <input
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search customer, plan, status..."
                value={searchTerm}
              />
            </div>

            <div className="sales-referral-filters">
              <select
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                value={filterStatus}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Terminated">Terminated</option>
              </select>

              <select
                onChange={(e) => {
                  setFilterPlan(e.target.value);
                  setCurrentPage(1);
                }}
                value={filterPlan}
              >
                <option value="All">All Plans</option>
                <option value="Premium">Premium Plans (20%)</option>
                <option value="Free">Free / Freemium (0%)</option>
              </select>
            </div>
          </div>

          <div className="sales-referral-table-header">
            <span>Customer</span>
            <span>Date</span>
            <span>Plan / Product</span>
            <span>Paid Amount</span>
            <span>Commission (20%)</span>
            <span>Status</span>
          </div>

          <div className="sales-table">
            {paginatedEntries.map((entry) => (
              <div className="sales-referral-table-row" key={entry.id}>
                <div className="sales-referral-customer-cell">
                  <strong>{entry.customerName}</strong>
                  <span>{entry.customerContact}</span>
                </div>
                <span>{entry.date}</span>
                <div>
                  <span style={{ color: entry.planType === "Premium" ? "var(--color-primary)" : "inherit" }}>
                    {entry.product}
                  </span>
                </div>
                <span>{entry.amount}</span>
                <span className="sales-referral-comm-cell">{entry.commission}</span>
                <div>
                  <span
                    className={`sales-chip ${
                      entry.status === "Active" ? "success" : entry.status === "Terminated" ? "danger" : "warning"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}

            {!filteredEntries.length ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  No referral transactions recorded yet. Share your Website or Android App links above to start tracking clicks and earning 20% commission on Premium subscriptions!
                </p>
              </div>
            ) : null}
          </div>

          {totalPages > 1 ? (
            <div className="sales-referral-pagination">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
              </span>
              <div className="sales-referral-page-controls">
                <button
                  className="sales-referral-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    className={`sales-referral-page-btn ${currentPage === page ? "active" : ""}`}
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    type="button"
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="sales-referral-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </section>

      {/* Withdrawal Modal */}
      {showWithdrawModal ? (
        <div className="sales-referral-modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="sales-referral-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sales-referral-modal-header">
              <h3>Request Commission Payout</h3>
              <button
                className="sales-referral-modal-close"
                onClick={() => setShowWithdrawModal(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="sales-referral-wallet-meta" style={{ borderTop: "none", padding: "0 0 10px" }}>
                <div className="sales-referral-meta-item">
                  <span>Available Balance:</span>
                  <strong style={{ color: "var(--color-primary, #D7FF2F)" }}>{money(availableBalance)}</strong>
                </div>
                <div className="sales-referral-meta-item">
                  <span>Minimum Withdrawal:</span>
                  <strong>{money(minPayout)}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                  Withdrawal Amount (₹)
                </label>
                <input
                  max={availableBalance || undefined}
                  min={minPayout}
                  onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder={`Min ${money(minPayout)}`}
                  required
                  style={{
                    width: "100%",
                    background: "var(--color-surface, #0a0d0b)",
                    border: "1px solid var(--color-border-strong, rgba(255,255,255,0.1))",
                    borderRadius: 6,
                    padding: "9px 12px",
                    color: "var(--color-text-primary, #f5f7fa)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    outline: "none",
                  }}
                  type="number"
                  value={withdrawAmount}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                  Payout Details (UPI ID / Bank Account & IFSC)
                </label>
                <textarea
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="e.g. UPI: name@upi or Bank Account: 123456789, IFSC: HDFC0001234"
                  required
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--color-surface, #0a0d0b)",
                    border: "1px solid var(--color-border-strong, rgba(255,255,255,0.1))",
                    borderRadius: 6,
                    padding: "9px 12px",
                    color: "var(--color-text-primary, #f5f7fa)",
                    fontSize: "0.88rem",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  value={withdrawNote}
                />
              </div>

              {withdrawStatus ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.84rem",
                    color: withdrawStatus.includes("success") ? "var(--color-success, #22c55e)" : "var(--color-error, #ef4444)",
                  }}
                >
                  {withdrawStatus}
                </p>
              ) : null}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  style={{
                    border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
                    background: "transparent",
                    color: "var(--color-text-secondary, #a8aea2)",
                    borderRadius: 6,
                    padding: "9px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingWithdraw}
                  style={{
                    border: "none",
                    background: "var(--color-primary, #D7FF2F)",
                    color: "#000",
                    borderRadius: 6,
                    padding: "9px 18px",
                    fontWeight: 700,
                    cursor: isSubmittingWithdraw ? "not-allowed" : "pointer",
                  }}
                  type="submit"
                >
                  {isSubmittingWithdraw ? "Submitting..." : "Submit Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
