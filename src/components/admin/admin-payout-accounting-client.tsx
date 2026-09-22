"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileEdit,
  Filter,
  MessageCircle,
  MinusCircle,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import type {
  AgencyEditorSummary,
  LedgerAdjustmentRecord,
  PayoutRequestRecord,
  PayoutRequestStatus,
} from "@/lib/gigxomi/admin-payout-accounting-store";

type Metrics = {
  totalRequests: number;
  paidVolume: number;
  pendingVolume: number;
  grossVolume: number;
  agencyMargin: number;
  totalCredits: number;
  totalDebits: number;
  netAdjustments: number;
};

export function AdminPayoutAccountingClient() {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestRecord[]>([]);
  const [ledgerAdjustments, setLedgerAdjustments] = useState<LedgerAdjustmentRecord[]>([]);
  const [editors, setEditors] = useState<AgencyEditorSummary[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRequests: 0,
    paidVolume: 0,
    pendingVolume: 0,
    grossVolume: 0,
    agencyMargin: 0,
    totalCredits: 0,
    totalDebits: 0,
    netAdjustments: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"payouts" | "ledger">("payouts");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedPayoutForNote, setSelectedPayoutForNote] = useState<PayoutRequestRecord | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Adjustment form state
  const [adjEditorId, setAdjEditorId] = useState("");
  const [adjType, setAdjType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjCategory, setAdjCategory] = useState("Rush Delivery Bonus");
  const [adjNote, setAdjNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchAccountingData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/payout-requests", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setPayoutRequests(data.payoutRequests || []);
        setLedgerAdjustments(data.ledgerAdjustments || []);
        setEditors(data.editors || []);
        setMetrics(data.metrics || metrics);
        if (data.editors?.length && !adjEditorId) {
          setAdjEditorId(data.editors[0].id);
        }
      }
    } catch {
      // Ignore network errors on fetch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccountingData();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: PayoutRequestStatus, customNote?: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", id, status: nextStatus, note: customNote }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionFeedback(`Status successfully updated to ${nextStatus}.`);
        setTimeout(() => setActionFeedback(null), 4000);
        void fetchAccountingData();
      }
    } catch {
      setActionFeedback("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedPayoutForNote) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_NOTE", id: selectedPayoutForNote.id, note: noteDraft }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsNoteModalOpen(false);
        setActionFeedback("Internal note updated.");
        setTimeout(() => setActionFeedback(null), 4000);
        void fetchAccountingData();
      }
    } catch {
      setActionFeedback("Failed to update note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjEditorId || !adjAmount || Number(adjAmount) <= 0) {
      alert("Please enter a valid amount and select an editor.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ADJUSTMENT",
          editorId: adjEditorId,
          type: adjType,
          amount: Number(adjAmount),
          category: adjCategory,
          note: adjNote,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAdjustmentModalOpen(false);
        setAdjAmount("");
        setAdjNote("");
        setActionFeedback(`Ledger adjustment (${adjType === "CREDIT" ? "+" : "-"}₹${adjAmount}) recorded.`);
        setTimeout(() => setActionFeedback(null), 4000);
        void fetchAccountingData();
      }
    } catch {
      setActionFeedback("Failed to record adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayouts = useMemo(() => {
    return payoutRequests.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.editorName.toLowerCase().includes(q) ||
        r.editorUpiId.toLowerCase().includes(q) ||
        r.projectTitle.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [payoutRequests, statusFilter, searchQuery]);

  return (
    <div className="dashboard-shell compact gx-clean-operating-page">
      {/* 1. TOP METRICS GRID */}
      <div className="metric-grid" style={{ marginBottom: "24px" }}>
        <div className="metric-card">
          <p className="metric-label">Total Requests</p>
          <strong className="metric-value">{metrics.totalRequests}</strong>
          <span className="metric-note">Lifetime payout requests</span>
        </div>
        <div className="metric-card">
          <p className="metric-label">Paid to Editors</p>
          <strong className="metric-value" style={{ color: "#22c55e" }}>
            ₹{metrics.paidVolume.toLocaleString("en-IN")}
          </strong>
          <span className="metric-note">Successfully settled payouts</span>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending Approval</p>
          <strong className="metric-value" style={{ color: "#ccff00" }}>
            ₹{metrics.pendingVolume.toLocaleString("en-IN")}
          </strong>
          <span className="metric-note">Awaiting admin sign-off or transfer</span>
        </div>
        <div className="metric-card">
          <p className="metric-label">Manual Adjustments</p>
          <strong
            className="metric-value"
            style={{ color: metrics.netAdjustments >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {metrics.netAdjustments >= 0 ? "+" : ""}₹{metrics.netAdjustments.toLocaleString("en-IN")}
          </strong>
          <span className="metric-note">
            +₹{metrics.totalCredits.toLocaleString("en-IN")} credits / -₹{metrics.totalDebits.toLocaleString("en-IN")} debits
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "rgba(204, 255, 0, 0.12)",
            border: "1px solid rgba(204, 255, 0, 0.35)",
            color: "#ccff00",
            fontSize: "0.86rem",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          ✓ {actionFeedback}
        </div>
      )}

      {/* 2. TAB SWITCHER & ACTION BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("payouts")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: activeTab === "payouts" ? "#ccff00" : "rgba(255, 255, 255, 0.1)",
              background: activeTab === "payouts" ? "rgba(204, 255, 0, 0.12)" : "rgba(255, 255, 255, 0.04)",
              color: activeTab === "payouts" ? "#ccff00" : "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Payout Requests ({payoutRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: activeTab === "ledger" ? "#ccff00" : "rgba(255, 255, 255, 0.1)",
              background: activeTab === "ledger" ? "rgba(204, 255, 0, 0.12)" : "rgba(255, 255, 255, 0.04)",
              color: activeTab === "ledger" ? "#ccff00" : "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Manual Ledger Adjustments ({ledgerAdjustments.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAdjustmentModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 18px",
            borderRadius: "10px",
            background: "#ccff00",
            color: "#080b09",
            fontWeight: 800,
            fontSize: "0.82rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(204, 255, 0, 0.2)",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Manual Adjustment (+/-)</span>
        </button>
      </div>

      {/* TAB 1: PAYOUT REQUESTS */}
      {activeTab === "payouts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filter / Search Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "14px",
              background: "rgba(14, 18, 15, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
              <Search size={16} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search by editor name, UPI ID, project, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {["ALL", "REQUESTED", "UNDER_REVIEW", "APPROVED", "PAID", "REJECTED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor: statusFilter === st ? "#ccff00" : "rgba(255, 255, 255, 0.08)",
                    background: statusFilter === st ? "rgba(204, 255, 0, 0.15)" : "transparent",
                    color: statusFilter === st ? "#ccff00" : "#9ca3af",
                    cursor: "pointer",
                  }}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              overflowX: "auto",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "#0c100e",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#9ca3af", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "16px" }}>Freelancer / Editor</th>
                  <th style={{ padding: "16px" }}>Project &amp; Chat</th>
                  <th style={{ padding: "16px" }}>Payout Amount</th>
                  <th style={{ padding: "16px" }}>Status</th>
                  <th style={{ padding: "16px" }}>Internal Memo / Notes</th>
                  <th style={{ padding: "16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((request) => {
                  const initials = request.editorName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={request.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* 1. EDITOR */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              background: "rgba(204, 255, 0, 0.12)",
                              border: "1px solid rgba(204, 255, 0, 0.3)",
                              color: "#ccff00",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </span>
                          <div>
                            <strong style={{ display: "block", color: "#ffffff", fontSize: "0.88rem" }}>
                              {request.editorName}
                            </strong>
                            <span style={{ color: "#22c55e", fontSize: "0.72rem", fontFamily: "monospace" }}>
                              UPI: {request.editorUpiId}
                            </span>
                            <span style={{ display: "block", color: "#6b7280", fontSize: "0.68rem" }}>
                              {request.editorPhone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. PROJECT & CHAT */}
                      <td style={{ padding: "16px" }}>
                        <strong style={{ display: "block", color: "#e5e7eb", fontSize: "0.85rem", marginBottom: "4px" }}>
                          {request.projectTitle}
                        </strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Link
                            href={`/admin/chat?conversationId=${request.conversationId || ""}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "rgba(204, 255, 0, 0.1)",
                              border: "1px solid rgba(204, 255, 0, 0.25)",
                              color: "#ccff00",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <MessageCircle size={12} />
                            <span>Open Chat</span>
                          </Link>
                          <span style={{ color: "#6b7280", fontSize: "0.68rem" }}>
                            {new Date(request.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </td>

                      {/* 3. AMOUNT */}
                      <td style={{ padding: "16px" }}>
                        <strong style={{ display: "block", color: "#ccff00", fontSize: "1.05rem", fontWeight: 800 }}>
                          ₹{request.netAmount.toLocaleString("en-IN")}
                        </strong>
                        <span style={{ color: "#9ca3af", fontSize: "0.7rem", display: "block" }}>
                          Gross: ₹{request.grossAmount.toLocaleString("en-IN")}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: "0.68rem" }}>
                          Agency Fee: -₹{request.agencyFee.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* 4. STATUS */}
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                            background:
                              request.status === "PAID"
                                ? "rgba(34, 197, 94, 0.18)"
                                : request.status === "APPROVED"
                                ? "rgba(204, 255, 0, 0.18)"
                                : request.status === "REJECTED"
                                ? "rgba(239, 68, 68, 0.18)"
                                : "rgba(234, 179, 8, 0.18)",
                            color:
                              request.status === "PAID"
                                ? "#4ade80"
                                : request.status === "APPROVED"
                                ? "#ccff00"
                                : request.status === "REJECTED"
                                ? "#f87171"
                                : "#facc15",
                            border: "1px solid currentColor",
                          }}
                        >
                          {request.status.replace(/_/g, " ")}
                        </span>
                        {request.paidAt && (
                          <small style={{ display: "block", color: "#6b7280", fontSize: "0.65rem", marginTop: "3px" }}>
                            Paid {new Date(request.paidAt).toLocaleDateString("en-IN")}
                          </small>
                        )}
                      </td>

                      {/* 5. NOTES */}
                      <td style={{ padding: "16px", maxWidth: "220px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.75rem", lineHeight: 1.4 }}>
                            {request.note || "No memo added."}
                          </p>
                          <button
                            type="button"
                            title="Edit internal memo"
                            onClick={() => {
                              setSelectedPayoutForNote(request);
                              setNoteDraft(request.note);
                              setIsNoteModalOpen(true);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#6b7280",
                              cursor: "pointer",
                              padding: "2px",
                              flexShrink: 0,
                            }}
                          >
                            <FileEdit size={14} />
                          </button>
                        </div>
                      </td>

                      {/* 6. ACTIONS */}
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", flexWrap: "wrap" }}>
                          {request.status !== "PAID" && (
                            <>
                              {request.status !== "APPROVED" && (
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleUpdateStatus(request.id, "APPROVED")}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                    background: "rgba(204, 255, 0, 0.12)",
                                    border: "1px solid rgba(204, 255, 0, 0.3)",
                                    color: "#ccff00",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleUpdateStatus(request.id, "PAID")}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  background: "#22c55e",
                                  border: "none",
                                  color: "#080b09",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                Mark Paid
                              </button>
                            </>
                          )}
                          {request.status === "PAID" && (
                            <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 700 }}>
                              ✓ Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isLoading && !filteredPayouts.length && (
              <div style={{ padding: "36px", textAlign: "center", color: "#9ca3af" }}>
                No payout requests found matching your filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL ACCOUNTING LEDGER */}
      {activeTab === "ledger" && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0c100e",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#9ca3af", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "16px" }}>Date</th>
                <th style={{ padding: "16px" }}>Freelancer / Editor</th>
                <th style={{ padding: "16px" }}>Type</th>
                <th style={{ padding: "16px" }}>Category</th>
                <th style={{ padding: "16px" }}>Amount</th>
                <th style={{ padding: "16px" }}>Reason &amp; Audit Note</th>
                <th style={{ padding: "16px" }}>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {ledgerAdjustments.map((adj) => (
                <tr key={adj.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "16px", color: "#6b7280", fontSize: "0.75rem" }}>
                    {new Date(adj.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <strong style={{ color: "#ffffff" }}>{adj.editorName}</strong>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        background: adj.type === "CREDIT" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: adj.type === "CREDIT" ? "#4ade80" : "#f87171",
                        border: "1px solid currentColor",
                      }}
                    >
                      {adj.type === "CREDIT" ? "+ CREDIT" : "- DEBIT"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#d1d5db" }}>{adj.category}</td>
                  <td style={{ padding: "16px" }}>
                    <strong
                      style={{
                        fontSize: "0.95rem",
                        color: adj.type === "CREDIT" ? "#4ade80" : "#f87171",
                        fontWeight: 800,
                      }}
                    >
                      {adj.type === "CREDIT" ? "+" : "-"}₹{adj.amount.toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td style={{ padding: "16px", color: "#9ca3af", maxWidth: "260px" }}>{adj.note}</td>
                  <td style={{ padding: "16px", color: "#6b7280", fontSize: "0.75rem" }}>{adj.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ledgerAdjustments.length && (
            <div style={{ padding: "36px", textAlign: "center", color: "#9ca3af" }}>
              No manual accounting adjustments recorded yet.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD MANUAL ADJUSTMENT */}
      {isAdjustmentModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              background: "#0e1310",
              border: "1px solid rgba(204, 255, 0, 0.3)",
              borderRadius: "22px",
              padding: "28px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(204, 255, 0, 0.15)",
                    color: "#ccff00",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Wallet size={18} />
                </span>
                <div>
                  <h3 style={{ margin: 0, color: "#ffffff", fontSize: "1.1rem", fontWeight: 700 }}>Manual Accounting Adjustment</h3>
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.75rem" }}>Add credit addition or subtract deduction from editor ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAdjustment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Select Editor */}
              <div>
                <label style={{ display: "block", color: "#d1d5db", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                  Select Freelancer / Editor:
                </label>
                <select
                  value={adjEditorId}
                  onChange={(e) => setAdjEditorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#141a16",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                >
                  {editors.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name} ({ed.role} · {ed.upiId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type Switcher */}
              <div>
                <label style={{ display: "block", color: "#d1d5db", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                  Adjustment Type:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setAdjType("CREDIT")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: adjType === "CREDIT" ? "#22c55e" : "rgba(255, 255, 255, 0.1)",
                      background: adjType === "CREDIT" ? "rgba(34, 197, 94, 0.15)" : "transparent",
                      color: adjType === "CREDIT" ? "#4ade80" : "#9ca3af",
                      fontWeight: 750,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <PlusCircle size={16} />
                    <span>+ Add Credit / Bonus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("DEBIT")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: adjType === "DEBIT" ? "#ef4444" : "rgba(255, 255, 255, 0.1)",
                      background: adjType === "DEBIT" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                      color: adjType === "DEBIT" ? "#f87171" : "#9ca3af",
                      fontWeight: 750,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <MinusCircle size={16} />
                    <span>- Deduct / Penalty</span>
                  </button>
                </div>
              </div>

              {/* Amount & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", color: "#d1d5db", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                    Amount in ₹:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1500"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#141a16",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#d1d5db", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                    Category:
                  </label>
                  <select
                    value={adjCategory}
                    onChange={(e) => setAdjCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#141a16",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: "0.82rem",
                      outline: "none",
                    }}
                  >
                    {adjType === "CREDIT" ? (
                      <>
                        <option value="Rush Delivery Bonus">Rush Delivery Bonus</option>
                        <option value="Extra Revision Fee">Extra Revision Fee</option>
                        <option value="Urgent Weekend Incentive">Urgent Weekend Incentive</option>
                        <option value="Advance Payment">Advance Payment</option>
                        <option value="Quality Excellence Reward">Quality Excellence Reward</option>
                      </>
                    ) : (
                      <>
                        <option value="Delay Penalty">Delay Penalty</option>
                        <option value="Stock Asset / Music License">Stock Asset / Music License</option>
                        <option value="Client Revision Deduction">Client Revision Deduction</option>
                        <option value="TDS / Tax Deduction">TDS / Tax Deduction</option>
                        <option value="Advance Recovery">Advance Recovery</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display: "block", color: "#d1d5db", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                  Reason &amp; Audit Note:
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this amount was credited or deducted..."
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#141a16",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "#d1d5db",
                    fontWeight: 650,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "#ccff00",
                    border: "none",
                    color: "#080b09",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Recording..." : "Save & Update Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT INTERNAL NOTE */}
      {isNoteModalOpen && selectedPayoutForNote && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              background: "#0e1310",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "1.05rem", fontWeight: 700 }}>
                Edit Internal Memo
              </h3>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 14px", color: "#9ca3af", fontSize: "0.78rem" }}>
              Add payment transaction reference (e.g. PhonePe/IMPS ref #), revision hold remarks, or payout sign-off notes for{" "}
              <strong style={{ color: "#ffffff" }}>{selectedPayoutForNote.editorName}</strong>.
            </p>

            <textarea
              rows={4}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="e.g. Settled via PhonePe UPI Ref #PP998817264 on HDFC Bank"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#141a16",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
                resize: "none",
                marginBottom: "18px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "#d1d5db",
                  fontWeight: 650,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveNote}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  background: "#ccff00",
                  border: "none",
                  color: "#080b09",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
