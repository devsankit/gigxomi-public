"use client";

import {
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Film,
  FolderOpen,
  Globe,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  parseMediaUrls,
  resolveMediaUrl,
  type ResolvedMedia,
} from "@/lib/gigxomi/media";

type Review = {
  id: string;
  status: string;
  portfolioUrl: string;
  submissionVersion: number;
  submittedAt: string;
  reviewedAt: string | null;
  note: string | null;
  freelancer: { displayName: string };
  assessmentScore: number | null;
  trust: { score: number } | null;
  service: { title: string; primaryEditorCategory?: string; secondaryEditorCategories?: string[] } | null;
};
type Dispute = { id: string; reason: string; user: { displayName: string }; event: { component: string; delta: number } };

export function SuperAdminPortfolioApprovalPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/super-admin/freelancer-portfolio-reviews", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error);
    setReviews(payload.reviews ?? []);
    setDisputes(payload.disputes ?? []);
  }, []);
  useEffect(() => { void load().catch((reason) => setError(reason.message)); }, [load]);

  async function review(reviewId: string, action: string) {
    const note = action === "APPROVE" ? "" : window.prompt(action === "REQUEST_CHANGES" ? "What must the editor improve?" : "Why is this rejected?")?.trim() ?? "";
    if (action !== "APPROVE" && !note) return;
    setBusy(reviewId);
    try {
      const response = await fetch("/api/super-admin/freelancer-portfolio-reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId, action, note }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to review."); }
    finally { setBusy(null); }
  }

  async function resolve(disputeId: string, action: string) {
    const note = window.prompt("Add the resolution note")?.trim();
    if (!note) return;
    setBusy(disputeId);
    try {
      const response = await fetch("/api/super-admin/freelancer-trust-disputes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disputeId, action, note }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to resolve."); }
    finally { setBusy(null); }
  }

  const pending = reviews.filter((item) => item.status === "PENDING");
  const history = reviews.filter((item) => item.status !== "PENDING");

  return <div className="stack-list">
    <section className="dashboard-shell compact"><div className="freelancer-section-head"><div><p className="eyebrow">Portfolio qualification</p><h2 className="section-heading">Review the work, not the paperwork.</h2><p className="muted-copy">Approve the portfolio video before a freelancer appears in agency discovery.</p></div><button className="ghost-button" onClick={() => void load()} type="button"><RefreshCw size={15} /> Refresh</button></div>{error ? <p className="public-auth-error">{error}</p> : null}</section>
    <section className="super-admin-portfolio-grid">{pending.length ? pending.map((item) => <ReviewCard busy={busy === item.id} key={item.id} review={item} onAction={(action) => void review(item.id, action)} />) : <div className="dashboard-shell compact"><BadgeCheck size={26} /><h3>Portfolio queue is clear</h3><p className="muted-copy">New onboarding submissions will appear here.</p></div>}</section>
    {history.length ? (
      <section className="dashboard-shell compact">
        <p className="eyebrow">Submission history</p>
        <div className="brief-grid two-up">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    ) : null}
    {disputes.length ? <section className="dashboard-shell compact"><p className="eyebrow">Trust disputes</p><div className="brief-grid two-up">{disputes.map((item) => <article className="brief-card" key={item.id}><span className="meta-pill"><ShieldAlert size={13} /> {item.event.component}</span><strong>{item.user.displayName} · {item.event.delta}</strong><p className="muted-copy">{item.reason}</p><div className="freelancer-inline-actions"><button className="ghost-button" disabled={busy === item.id} onClick={() => void resolve(item.id, "UPHOLD")} type="button">Uphold</button><button className="primary-button" disabled={busy === item.id} onClick={() => void resolve(item.id, "RESTORE")} type="button">Restore</button></div></article>)}</div></section> : null}
  </div>;
}

function ReviewCard({
  review,
  busy,
  onAction,
}: {
  review: Review;
  busy: boolean;
  onAction: (action: string) => void;
}) {
  return (
    <article className="super-admin-portfolio-card">
      <PortfolioMediaViewer
        portfolioUrl={review.portfolioUrl}
        displayName={review.freelancer.displayName}
      />
      <div className="super-admin-portfolio-body">
        <div>
          <span className="meta-pill">Submission v{review.submissionVersion}</span>
          <span className="meta-pill">Assessment {review.assessmentScore ?? 0}/20</span>
          <span className="meta-pill">Trust {review.trust?.score ?? 0}/100</span>
        </div>
        <h3>{review.freelancer.displayName}</h3>
        <strong>{review.service?.title ?? "Freelancer portfolio"}</strong>
        <p className="muted-copy">
          {review.service?.primaryEditorCategory ?? "Video editing"}
          {review.service?.secondaryEditorCategories?.length
            ? ` · ${review.service.secondaryEditorCategories.join(" · ")}`
            : ""}
        </p>
        <div className="super-admin-portfolio-actions">
          <button disabled={busy} onClick={() => onAction("APPROVE")} type="button">
            <Check size={16} /> Approve
          </button>
          <button disabled={busy} onClick={() => onAction("REQUEST_CHANGES")} type="button">
            <RefreshCw size={16} /> Changes
          </button>
          <button disabled={busy} onClick={() => onAction("REJECT")} type="button">
            <X size={16} /> Reject
          </button>
          {busy ? <Loader2 className="spin" size={17} /> : null}
        </div>
      </div>
    </article>
  );
}

function PortfolioMediaViewer({
  portfolioUrl,
  displayName,
}: {
  portfolioUrl: string;
  displayName: string;
}) {
  const rawUrls = useMemo(() => parseMediaUrls(portfolioUrl), [portfolioUrl]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const activeUrl = rawUrls[activeIndex] || portfolioUrl || "";
  const resolved: ResolvedMedia = useMemo(() => resolveMediaUrl(activeUrl), [activeUrl]);

  const copyLink = useCallback(async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // Fallback
    }
  }, []);

  return (
    <div className="super-admin-portfolio-media-wrapper">
      {/* Multi-link selector tabs if freelancer provided more than 1 URL */}
      {rawUrls.length > 1 ? (
        <div className="super-admin-url-tabs">
          <span className="tabs-label">Submitted Links ({rawUrls.length}):</span>
          {rawUrls.map((url, idx) => {
            const itemResolved = resolveMediaUrl(url);
            return (
              <button
                key={idx}
                type="button"
                className={`super-admin-tab ${activeIndex === idx ? "active" : ""}`}
                onClick={() => setActiveIndex(idx)}
              >
                Link {idx + 1} ({itemResolved.platform})
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Main Media Player / Preview */}
      <div className="super-admin-portfolio-media">
        {resolved.type === "youtube" && resolved.embedUrl ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            src={resolved.embedUrl}
            title={`${displayName} portfolio video`}
          />
        ) : resolved.type === "drive_file" && resolved.embedUrl ? (
          <div className="drive-embed-container">
            <iframe
              allow="autoplay"
              allowFullScreen
              src={resolved.embedUrl}
              title={`${displayName} Google Drive video`}
            />
          </div>
        ) : resolved.type === "drive_folder" ? (
          <div className="drive-folder-card">
            <div className="drive-icon-pill">
              <FolderOpen size={36} />
            </div>
            <h4>Google Drive Portfolio Folder</h4>
            <p>
              The editor provided a Google Drive folder containing their portfolio videos and client work.
            </p>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="folder-open-button"
            >
              Open Google Drive Folder <ExternalLink size={15} />
            </a>
          </div>
        ) : resolved.type === "instagram" && resolved.embedUrl ? (
          <div className="instagram-embed-container">
            <iframe
              allowFullScreen
              src={resolved.embedUrl}
              title={`${displayName} Instagram reel`}
            />
          </div>
        ) : (resolved.type === "vimeo" || resolved.type === "loom") && resolved.embedUrl ? (
          <iframe
            allow="autoplay; fullscreen"
            allowFullScreen
            src={resolved.embedUrl}
            title={`${displayName} video`}
          />
        ) : resolved.type === "direct" && resolved.directUrl ? (
          <video controls playsInline src={resolved.directUrl} />
        ) : (
          <div className="drive-folder-card">
            <div className="drive-icon-pill">
              <Globe size={36} />
            </div>
            <h4>{resolved.label}</h4>
            <p>
              Direct in-page video playback is not supported for this provider. Open the submitted link to review the work.
            </p>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="folder-open-button"
            >
              Open Submitted Link <ExternalLink size={15} />
            </a>
          </div>
        )}
      </div>

      {/* Submitted Link Bar - ALWAYS VISIBLE */}
      <div className="super-admin-submitted-link-bar">
        <div className="submitted-link-info">
          <span className="platform-tag">{resolved.label}</span>
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="submitted-link-anchor"
            title={activeUrl}
          >
            {activeUrl}
          </a>
        </div>
        <div className="submitted-link-actions">
          <button
            type="button"
            className="link-tool-btn"
            onClick={() => void copyLink(activeUrl)}
            title="Copy video link"
          >
            {copiedUrl === activeUrl ? (
              <>
                <Check size={13} style={{ color: "#4ade80" }} />
                <span style={{ color: "#4ade80" }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-tool-btn open-btn"
            title="Open link in new tab"
          >
            <ExternalLink size={13} />
            <span>Open</span>
          </a>
        </div>
      </div>

      {/* Helpful note for Google Drive file permissions */}
      {resolved.type === "drive_file" ? (
        <p className="super-admin-drive-note">
          💡 If Google Drive asks for login or permissions, click <strong>Open</strong> above to view directly in Google Drive.
        </p>
      ) : null}
    </div>
  );
}

function HistoryCard({ item }: { item: Review }) {
  const urls = parseMediaUrls(item.portfolioUrl);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyLink = useCallback(async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // Fallback
    }
  }, []);

  return (
    <article className="brief-card">
      <div>
        <span className="meta-pill">{item.status.replaceAll("_", " ")}</span>
        <span className="meta-pill">Submission v{item.submissionVersion}</span>
      </div>
      <strong>
        {item.freelancer.displayName} · {item.service?.title ?? "Freelancer portfolio"}
      </strong>
      <p className="muted-copy">
        Submitted {new Date(item.submittedAt).toLocaleString("en-IN")}
        {item.reviewedAt ? ` · Reviewed ${new Date(item.reviewedAt).toLocaleString("en-IN")}` : ""}
      </p>
      {item.note ? <p className="muted-copy">{item.note}</p> : null}
      <div className="history-link-stack">
        {urls.map((url, uIdx) => {
          const res = resolveMediaUrl(url);
          return (
            <div key={uIdx} className="history-link-row">
              <span className="platform-tag">{res.label}</span>
              <a
                className="history-url"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
                title={url}
              >
                {url}
              </a>
              <button
                type="button"
                className="link-tool-btn"
                onClick={() => void copyLink(url)}
                title="Copy link"
              >
                {copiedUrl === url ? (
                  <Check size={12} style={{ color: "#4ade80" }} />
                ) : (
                  <Copy size={12} />
                )}
              </button>
              <a
                className="link-tool-btn open-btn"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
                title="Open in new tab"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          );
        })}
      </div>
    </article>
  );
}
