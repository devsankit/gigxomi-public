"use client";

import { useEffect, useState } from "react";

type ServiceItem = {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  category: string;
  specialty?: string;
  description?: string;
  targetAudience?: string;
  deliveryTime?: string;
  revisions?: string;
  basePrice: number;
  currency?: string;
  status: string;
  reviewNote?: string;
  ownerId: string;
  ownerName: string;
  ownerAlias?: string;
  sampleVideoUrl?: string;
  sampleVideoEmbedUrl?: string;
  tags?: string[];
  deliverables?: string[];
  createdAt: string;
  updatedAt: string;
};

export function ServiceReviewWorkspace({ defaultFilter = "PENDING" }: { defaultFilter?: "PENDING" | "APPROVED" | "REJECTED" | "ALL" }) {
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">(defaultFilter);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function loadServices(selectedFilter = filter) {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/service-reviews?filter=${selectedFilter}`, { cache: "no-store" });
      const data = await response.json();
      if (data.ok && Array.isArray(data.services)) {
        setServices(data.services);
      }
    } catch {
      setNotice({ message: "Failed to load services for review.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices(filter);
  }, [filter]);

  async function handleDecision(serviceId: string, action: "approve" | "reject") {
    const note = noteInputs[serviceId]?.trim() || "";
    setBusyId(`${serviceId}:${action}`);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/service-reviews/${encodeURIComponent(serviceId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: note }),
      });
      const data = await response.json();
      if (data.ok) {
        setNotice({
          message: action === "approve" ? "Service successfully approved!" : "Service rejected with feedback.",
          type: "success",
        });
        await loadServices(filter);
      } else {
        setNotice({ message: data.error || "Decision could not be saved.", type: "error" });
      }
    } catch {
      setNotice({ message: "Network error occurred while saving decision.", type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#fff" }}>Freelancer Service Reviews</h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.875rem" }}>
            Review, approve, or reject video editing service listings submitted by freelancers.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", background: "#0f172a", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid #1e293b" }}>
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: filter === tab ? "#22c55e" : "transparent",
                color: filter === tab ? "#022c22" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              {tab === "PENDING" ? "Pending Review" : tab === "APPROVED" ? "Approved" : tab === "REJECTED" ? "Rejected" : "All Services"}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: notice.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: notice.type === "success" ? "#4ade80" : "#f87171",
            border: `1px solid ${notice.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          }}
        >
          {notice.message}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>Loading service review queue...</div>
      ) : !services.length ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "#0f172a", borderRadius: "0.75rem", border: "1px solid #1e293b" }}>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>
            No services found in {filter === "PENDING" ? "pending review" : filter.toLowerCase()} state.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {services.map((service) => {
            const isPending = service.status === "Pending Review";
            const sampleUrl = service.sampleVideoUrl || service.sampleVideoEmbedUrl;

            return (
              <div
                key={service.id}
                style={{
                  background: "#0f172a",
                  borderRadius: "0.75rem",
                  border: "1px solid #1e293b",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                        {service.category} • {service.specialty || "General"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          background: isPending ? "rgba(234, 179, 8, 0.15)" : service.status === "Approved" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isPending ? "#facc15" : service.status === "Approved" ? "#4ade80" : "#f87171",
                        }}
                      >
                        {service.status}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>{service.title}</h3>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                      By <strong style={{ color: "#e2e8f0" }}>{service.ownerName}</strong> ({service.ownerId})
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#22c55e" }}>
                      ₹{Number(service.basePrice || 0).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {service.deliveryTime || "2 Days"} • {service.revisions || "2 revisions"}
                    </div>
                  </div>
                </div>

                <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.875rem", lineHeight: 1.5 }}>
                  {service.description || service.summary || "No description provided."}
                </p>

                {service.deliverables && service.deliverables.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Deliverables:</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.35rem" }}>
                      {service.deliverables.map((item, idx) => (
                        <span key={idx} style={{ fontSize: "0.75rem", background: "#1e293b", color: "#e2e8f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sampleUrl && (
                  <div style={{ background: "#020617", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #1e293b" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>Portfolio Sample Link:</span>
                    <div style={{ marginTop: "0.25rem" }}>
                      <a href={sampleUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: "0.85rem", wordBreak: "break-all" }}>
                        {sampleUrl} ↗
                      </a>
                    </div>
                  </div>
                )}

                {service.reviewNote && (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic", background: "rgba(255,255,255,0.03)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                    Latest Note: {service.reviewNote}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #1e293b", paddingTop: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Review feedback / rejection reason (optional)"
                    value={noteInputs[service.id] || ""}
                    onChange={(e) => setNoteInputs({ ...noteInputs, [service.id]: e.target.value })}
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      background: "#020617",
                      border: "1px solid #334155",
                      color: "#fff",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.85rem",
                    }}
                  />

                  <button
                    disabled={busyId !== null}
                    onClick={() => handleDecision(service.id, "approve")}
                    style={{
                      background: "#22c55e",
                      color: "#022c22",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      padding: "0.45rem 1rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      cursor: busyId ? "not-allowed" : "pointer",
                      opacity: busyId ? 0.6 : 1,
                    }}
                  >
                    {busyId === `${service.id}:approve` ? "Approving..." : "Approve Service"}
                  </button>

                  <button
                    disabled={busyId !== null}
                    onClick={() => handleDecision(service.id, "reject")}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      padding: "0.45rem 1rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      cursor: busyId ? "not-allowed" : "pointer",
                      opacity: busyId ? 0.6 : 1,
                    }}
                  >
                    {busyId === `${service.id}:reject` ? "Rejecting..." : "Reject / Revisions"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}