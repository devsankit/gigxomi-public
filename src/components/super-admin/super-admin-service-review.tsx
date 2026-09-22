"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileVideo,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Tag,
  User,
  XCircle,
} from "lucide-react";

import { MetricCard, StatusPill } from "@/components/ui/dashboard-primitives";

export type ServiceReviewItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  specialty?: string;
  summary?: string;
  description?: string;
  basePrice?: number;
  currency?: string;
  deliveryTime?: string;
  revisions?: string;
  status: "Pending Review" | "Approved" | "Rejected" | "Draft" | "Paused" | string;
  reviewNote?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAlias?: string;
  sampleVideoUrl?: string;
  sampleVideoEmbedUrl?: string;
  deliverables?: string[];
  faq?: Array<{ question: string; answer: string }>;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ReviewCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
};

export function SuperAdminServiceReview({ className = "" }: { className?: string }) {
  const [services, setServices] = useState<ServiceReviewItem[]>([]);
  const [counts, setCounts] = useState<ReviewCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Pending Review");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceReviewItem | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchServices(targetStatus = statusFilter) {
    setLoading(true);
    setFeedback(null);
    try {
      const url =
        targetStatus && targetStatus !== "ALL"
          ? `/api/super-admin/services/review?status=${encodeURIComponent(targetStatus)}`
          : "/api/super-admin/services/review";
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok) {
        setServices(data.services || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to load services." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error loading services." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchServices(statusFilter);
  }, [statusFilter]);

  async function handleReviewAction(serviceId: string, action: "APPROVE" | "REJECT", note?: string) {
    setActionBusyId(serviceId);
    setFeedback(null);
    try {
      const response = await fetch("/api/super-admin/services/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          action,
          note: note || (action === "APPROVE" ? "Approved by Super Admin" : "Needs revision"),
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setFeedback({
          type: "success",
          message: data.message || `Service ${action === "APPROVE" ? "approved" : "rejected"} successfully.`,
        });
        setSelectedService(null);
        setReviewNoteInput("");
        await fetchServices(statusFilter);
      } else {
        setFeedback({ type: "error", message: data.error || "Action failed." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error performing review action." });
    } finally {
      setActionBusyId(null);
    }
  }

  const filteredServices = services.filter((service) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      service.title?.toLowerCase().includes(q) ||
      service.ownerName?.toLowerCase().includes(q) ||
      service.specialty?.toLowerCase().includes(q) ||
      service.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-lime-400" />
            Freelancer Services Review
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Review, approve, or reject video editing services created by freelancers before they go live on the marketplace.
          </p>
        </div>

        <button
          onClick={() => void fetchServices()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 text-neutral-300 hover:text-white hover:border-neutral-600 text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {feedback ? (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-rose-950/40 border-rose-800 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter("Pending Review")}
          className={`cursor-pointer transition rounded-2xl p-4 border ${
            statusFilter === "Pending Review"
              ? "bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{counts.pending}</div>
          <div className="text-xs text-neutral-400 mt-1">Requires admin approval</div>
        </div>

        <div
          onClick={() => setStatusFilter("Approved")}
          className={`cursor-pointer transition rounded-2xl p-4 border ${
            statusFilter === "Approved"
              ? "bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{counts.approved}</div>
          <div className="text-xs text-neutral-400 mt-1">Live in marketplace</div>
        </div>

        <div
          onClick={() => setStatusFilter("Rejected")}
          className={`cursor-pointer transition rounded-2xl p-4 border ${
            statusFilter === "Rejected"
              ? "bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <span>Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{counts.rejected}</div>
          <div className="text-xs text-neutral-400 mt-1">Sent back for changes</div>
        </div>

        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer transition rounded-2xl p-4 border ${
            statusFilter === "ALL"
              ? "bg-lime-950/30 border-lime-500/60 ring-1 ring-lime-500/40"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-lime-400 text-xs font-semibold uppercase tracking-wider">
            <span>All Services</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{counts.all}</div>
          <div className="text-xs text-neutral-400 mt-1">Total created</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "Pending Review", value: "Pending Review", count: counts.pending },
            { label: "Approved", value: "Approved", count: counts.approved },
            { label: "Rejected", value: "Rejected", count: counts.rejected },
            { label: "All", value: "ALL", count: counts.all },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-2 ${
                statusFilter === tab.value
                  ? "bg-lime-400 text-black font-semibold shadow"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.value ? "bg-black/20 text-black" : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service or editor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400"
          />
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="p-12 text-center text-neutral-400 text-sm flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-lime-400" />
          <span>Loading freelancer services...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
          <FileVideo className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-white font-medium text-sm">No services found</p>
          <p className="text-neutral-400 text-xs mt-1">
            {statusFilter === "Pending Review"
              ? "All submitted services have been reviewed! New submissions will appear here."
              : "No services matching this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const isPending = service.status === "Pending Review";
            const isApproved = service.status === "Approved";
            const isRejected = service.status === "Rejected";

            return (
              <div
                key={service.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition"
              >
                <div className="space-y-3">
                  {/* Top line: Freelancer & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 font-bold text-xs">
                        {(service.ownerName || "GX").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{service.ownerName || "Freelancer"}</div>
                        <div className="text-[10px] text-neutral-400">{service.specialty || "Video Editor"}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        isApproved
                          ? "bg-emerald-950/60 border-emerald-600/50 text-emerald-300"
                          : isPending
                          ? "bg-amber-950/60 border-amber-600/50 text-amber-300"
                          : isRejected
                          ? "bg-rose-950/60 border-rose-600/50 text-rose-300"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{service.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {service.summary || service.description || "Video editing service package."}
                    </p>
                  </div>

                  {/* Price & Turnaround Badge */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs font-semibold text-lime-400">
                      ₹{service.basePrice?.toLocaleString("en-IN") || "Custom"}
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.deliveryTime || "2-3 Days"}</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      <span>{service.revisions || "2 revisions"}</span>
                    </div>
                  </div>

                  {/* Video Preview / Link */}
                  {service.sampleVideoUrl || service.sampleVideoEmbedUrl ? (
                    <div className="pt-2">
                      <a
                        href={service.sampleVideoUrl || service.sampleVideoEmbedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 underline font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Sample Video
                      </a>
                    </div>
                  ) : null}

                  {/* Review Note if any */}
                  {service.reviewNote ? (
                    <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-neutral-300">
                      <span className="font-semibold text-neutral-400">Note: </span>
                      {service.reviewNote}
                    </div>
                  ) : null}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReviewAction(service.id, "REJECT")}
                    disabled={actionBusyId === service.id}
                    className="px-3 py-1.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Reject
                  </button>

                  <button
                    onClick={() => handleReviewAction(service.id, "APPROVE")}
                    disabled={actionBusyId === service.id}
                    className="px-4 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    Approve Service
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
