"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DeliveryAsset, YouTubePublishJob } from "@/lib/gigxomi/delivery-portfolio-types";

type DeliveryAudience = "admin" | "manager" | "freelancer";

type DeliveryReviewWorkspaceProps = {
  audience: DeliveryAudience;
  focusAssetId?: string;
  detailHrefBase: string;
  portfolioHrefBase: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatBytes(value: number) {
  if (!value) {
    return "0 MB";
  }

  const mb = value / (1024 * 1024);
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

export function DeliveryReviewWorkspace({
  audience,
  focusAssetId,
  detailHrefBase,
  portfolioHrefBase,
}: DeliveryReviewWorkspaceProps) {
  const [assets, setAssets] = useState<DeliveryAsset[]>([]);
  const [publishJobs, setPublishJobs] = useState<YouTubePublishJob[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const isOpsAudience = audience !== "freelancer";

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/delivery/assets", { cache: "no-store" });
      const payload = (await response.json()) as {
        assets?: DeliveryAsset[];
        publishJobs?: YouTubePublishJob[];
        error?: string;
      };

      if (!response.ok) {
        setStatus(payload.error ?? "Unable to load delivery review right now.");
        setAssets([]);
        setPublishJobs([]);
        return;
      }

      setAssets(payload.assets ?? []);
      setPublishJobs(payload.publishJobs ?? []);
      setStatus("");
    } catch {
      setStatus("Unable to load delivery review right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace().catch(() => undefined);
  }, [loadWorkspace]);

  const visibleAssets = useMemo(
    () => (focusAssetId ? assets.filter((asset) => asset.id === focusAssetId) : assets),
    [assets, focusAssetId],
  );

  async function updateApproval(assetId: string, approved: boolean) {
    const response = await fetch(`/api/delivery/assets/${assetId}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved,
        note: approved
          ? "Agency approved this work for showcase and shared YouTube publishing."
          : "Agency declined showcase permission for this uploaded delivery.",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setStatus(
      response.ok
        ? approved
          ? "Agency approval captured. The freelancer can now complete metadata and publish."
          : "Showcase permission declined and the draft has been locked again."
        : payload.error ?? "Unable to update agency approval.",
    );
    if (response.ok) {
      await loadWorkspace();
    }
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Agency approval queue</p>
      <h2 className="section-heading">
        {focusAssetId
          ? "Review the uploaded source file, decide whether the agency allows showcase use, and keep the shared YouTube publish status attached to the same record."
          : "Freelancers upload the final video into Gigxomi first. Admin or manager approves showcase permission here, then the freelancer finishes metadata and publishes on the shared Gigxomi channel."}
      </h2>

      {status ? <p className="helper-text">{status}</p> : null}

      <section className="dashboard-grid">
        <div className="board-list">
          {loading ? <p className="muted-copy">Loading delivery review queue...</p> : null}
          {!loading && !visibleAssets.length ? (
            <div className="brief-card">
              <span className="meta-pill">No uploads yet</span>
              <strong>No freelancer delivery upload is waiting for review right now.</strong>
              <p className="muted-copy">Once a freelancer uploads a final video from portfolio drafts, the agency approval queue will appear here.</p>
            </div>
          ) : null}

          {visibleAssets.map((asset) => {
            const latestVersion = asset.versions.find((version) => version.id === asset.latestVersionId) ?? asset.versions.at(-1);
            const publishJob = publishJobs.find((job) => job.id === asset.youtubePublishJobId) ?? null;

            return (
              <article className="lead-row" key={asset.id}>
                <div className="status-row">
                  <span className="meta-pill">{asset.status}</span>
                  <span className="meta-pill">{asset.showcaseApprovalStatus}</span>
                  {publishJob ? <span className="meta-pill">{publishJob.status}</span> : null}
                </div>
                <h3>{asset.customerName}</h3>
                <p>
                  <strong>Service:</strong> {asset.serviceTitle}
                </p>
                <p>
                  <strong>Freelancer:</strong> {asset.assignedFreelancerName ?? "Not assigned"} - <strong>Versions:</strong> {asset.versions.length}
                </p>
                {latestVersion ? (
                  <p>
                    <strong>Latest upload:</strong>{" "}
                    <a href={latestVersion.downloadUrl} rel="noreferrer" target="_blank">
                      {latestVersion.fileName}
                    </a>{" "}
                    ({formatBytes(latestVersion.sizeBytes)}) - uploaded {formatDate(latestVersion.uploadedAt)}
                  </p>
                ) : null}
                <p>
                  <strong>Approval note:</strong> {asset.showcaseApprovalNote || "Waiting for agency decision."}
                </p>
                {publishJob?.videoUrl ? (
                  <p>
                    <strong>YouTube:</strong>{" "}
                    <a href={publishJob.videoUrl} rel="noreferrer" target="_blank">
                      Open published video
                    </a>
                  </p>
                ) : null}
                {publishJob?.error ? (
                  <p>
                    <strong>Publish error:</strong> {publishJob.error}
                  </p>
                ) : null}

                <div className="freelancer-action-grid">
                  <Link className="freelancer-secondary-button" href={`${detailHrefBase}/${asset.id}`}>
                    Open delivery detail
                  </Link>
                  {asset.portfolioDraftId ? (
                    <Link className="freelancer-secondary-button" href={`${portfolioHrefBase}/${asset.portfolioDraftId}`}>
                      Open publish draft
                    </Link>
                  ) : null}
                  {isOpsAudience ? (
                    <>
                      <button className="freelancer-primary-button" onClick={() => updateApproval(asset.id, true).catch(() => undefined)} type="button">
                        Approve showcase use
                      </button>
                      <button className="freelancer-secondary-button" onClick={() => updateApproval(asset.id, false).catch(() => undefined)} type="button">
                        Decline showcase use
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="board-stack">
          <div className="brief-card">
            <span className="meta-pill">Flow</span>
            <strong>Upload → agency approval → metadata → publish</strong>
            <p className="muted-copy">This page is the permission gate. Publish does not unlock until the agency approves showcase use for the uploaded work.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Channel owner</span>
            <strong>Shared Gigxomi YouTube</strong>
            <p className="muted-copy">Super admin owns the channel connection. Admin and manager approve the work, but do not manually upload it for the freelancer.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
