"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Link2Off, RefreshCcw, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";
import type { YouTubePublishJob } from "@/lib/gigxomi/delivery-portfolio-types";
import type { PlatformYouTubeConnectionView } from "@/lib/gigxomi/platform-youtube-types";

type YouTubeStatusPayload = {
  ok?: boolean;
  error?: string;
  connection?: PlatformYouTubeConnectionView | null;
  uploads?: YouTubePublishJob[];
};

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchYouTubeStatus() {
  const response = await fetch("/api/admin/youtube", {
    cache: "no-store",
    credentials: "include",
  });
  return (await response.json().catch(() => ({}))) as YouTubeStatusPayload;
}

function ConnectionStateCopy({ connection }: { connection: PlatformYouTubeConnectionView | null }) {
  if (!connection) {
    return <p className="muted-copy">Unable to load the shared channel state right now.</p>;
  }

  if (connection.status === "ENV_MISSING") {
    return <p className="muted-copy">Owner Google env is missing: {connection.missingEnv.join(", ")}.</p>;
  }

  if (connection.status === "DISCONNECTED") {
    return <p className="muted-copy">The shared Gigxomi channel is not connected yet. Super admin needs to complete Google OAuth once.</p>;
  }

  if (connection.status === "ERROR") {
    return <p className="muted-copy">{connection.lastError || "The shared channel connection needs attention before publish can continue."}</p>;
  }

  return (
    <p className="muted-copy">
      Shared channel: {connection.channelName || "Gigxomi"} {connection.channelHandle ? `(${connection.channelHandle})` : ""}. Last validated {formatDate(connection.lastValidatedAt)}.
    </p>
  );
}

export function AdminYouTubeConnectionCard() {
  const [connection, setConnection] = useState<PlatformYouTubeConnectionView | null>(null);
  const [uploads, setUploads] = useState<YouTubePublishJob[]>([]);

  useEffect(() => {
    fetchYouTubeStatus()
      .then((payload) => {
        setConnection(payload.connection ?? null);
        setUploads(payload.uploads ?? []);
      })
      .catch(() => {
        setConnection(null);
        setUploads([]);
      });
  }, []);

  return (
    <article className="brief-card">
      <span className="meta-pill">{connection?.status ?? "Unavailable"}</span>
      <strong>Shared YouTube channel</strong>
      <ConnectionStateCopy connection={connection} />
      <p className="muted-copy">{uploads.filter((item) => item.status === "PUBLISHED").length} published showcase uploads tracked so far.</p>
    </article>
  );
}

export function AdminYouTubeSetupPanel() {
  const [connection, setConnection] = useState<PlatformYouTubeConnectionView | null>(null);
  const [uploads, setUploads] = useState<YouTubePublishJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYouTubeStatus()
      .then((payload) => {
        setConnection(payload.connection ?? null);
        setUploads(payload.uploads ?? []);
      })
      .catch(() => {
        setConnection(null);
        setUploads([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack-list">
      <div className="brief-grid three-up">
        <article className="brief-card">
          <span className="meta-pill">{connection?.status ?? "Unavailable"}</span>
          <strong>Owner-managed channel</strong>
          <ConnectionStateCopy connection={connection} />
        </article>
        <article className="brief-card">
          <span className="meta-pill">Publishing rule</span>
          <strong>Agency approval first</strong>
          <p className="muted-copy">Freelancers can only publish after agency approval is captured in delivery review and the shared channel is connected.</p>
        </article>
        <article className="brief-card">
          <span className="meta-pill">Who controls it</span>
          <strong>Super admin only</strong>
          <p className="muted-copy">Admins and managers can monitor publish health here, but only super admin can connect or disconnect the shared Gigxomi channel.</p>
        </article>
      </div>
      <div className="board-list">
        {loading ? <p className="muted-copy">Loading YouTube publish history...</p> : null}
        {!loading && !uploads.length ? <p className="muted-copy">No real YouTube publish jobs have been created yet.</p> : null}
        {uploads.slice(0, 8).map((upload) => (
          <article className="lead-row" key={upload.id}>
            <div className="status-row">
              <span className="meta-pill">{upload.status}</span>
              <span className="meta-pill">{upload.privacy}</span>
            </div>
            <h3>{upload.title}</h3>
            <p>
              <strong>Freelancer:</strong> {upload.freelancerName ?? "Unknown"} - <strong>Source:</strong> {upload.sourceFileName}
            </p>
            <p>
              <strong>Queued:</strong> {formatDate(upload.queuedAt)} - <strong>Published:</strong> {formatDate(upload.publishedAt)}
            </p>
            {upload.videoUrl ? (
              <a className="secondary-button" href={upload.videoUrl} rel="noreferrer" target="_blank">
                Open YouTube video
                <ExternalLink size={14} strokeWidth={1.8} />
              </a>
            ) : null}
            {upload.error ? <p className="muted-copy">Last error: {upload.error}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminYouTubeChannelPanel() {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<PlatformYouTubeConnectionView | null>(null);
  const [uploads, setUploads] = useState<YouTubePublishJob[]>([]);
  const [status, setStatus] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchNotice = useMemo(() => searchParams.get("message") || searchParams.get("error") || "", [searchParams]);

  async function refresh() {
    const payload = await fetchYouTubeStatus();
    setConnection(payload.connection ?? null);
    setUploads(payload.uploads ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const payload = await fetchYouTubeStatus();
        if (cancelled) {
          return;
        }
        setConnection(payload.connection ?? null);
        setUploads(payload.uploads ?? []);
      } catch {
        if (cancelled) {
          return;
        }
        setConnection(null);
        setUploads([]);
      }
    };

    load().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function disconnectChannel() {
    setIsDisconnecting(true);
    const response = await fetch("/api/super-admin/youtube/disconnect", {
      method: "POST",
      credentials: "include",
    });
    const payload = (await response.json().catch(() => ({}))) as YouTubeStatusPayload;
    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to disconnect the shared YouTube channel.");
      setIsDisconnecting(false);
      return;
    }

    setConnection(payload.connection ?? null);
    setStatus("Shared Gigxomi YouTube channel disconnected.");
    setIsDisconnecting(false);
    await refresh().catch(() => undefined);
  }

  const canStartConnect = connection?.canConnect ?? false;
  const connectHref = canStartConnect ? "/api/super-admin/youtube/connect" : undefined;

  const publishedCount = useMemo(() => uploads.filter((item) => item.status === "PUBLISHED").length, [uploads]);

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Shared YouTube channel</p>
      <h2 className="section-heading">Super admin owns one shared Gigxomi channel connection. Freelancers publish only after agency approval, and successful uploads feed both freelancer and agency visibility.</h2>

      <div className="brief-grid three-up">
        <article className="brief-card">
          <div className="plugin-card-heading">
            <PluginBrandMark brand="youtube" size="sm" />
            <div>
              <span className="meta-pill">{connection?.status ?? "Unavailable"}</span>
              <strong>YouTube channel plugin</strong>
            </div>
          </div>
          <ConnectionStateCopy connection={connection} />
          <p className="muted-copy">Connected at: {formatDate(connection?.connectedAt)}</p>
        </article>
        <article className="brief-card">
          <span className="meta-pill">OAuth</span>
          <strong>Server env only</strong>
          <p className="muted-copy">Google client ID, secret, redirect URI, and token encryption key stay server-side only and are never editable in the UI.</p>
        </article>
        <article className="brief-card">
          <span className="meta-pill">Publish history</span>
          <strong>{publishedCount} videos live</strong>
          <p className="muted-copy">{uploads.length - publishedCount} queued or failed jobs are still visible below for retry and debugging.</p>
        </article>
      </div>

      <div className="freelancer-action-grid">
        {connectHref ? (
          <a className="freelancer-primary-button" href={connectHref}>
            <Video size={15} strokeWidth={1.8} />
            Connect shared YouTube channel
          </a>
        ) : (
          <button className="freelancer-primary-button" disabled type="button">
            <Video size={15} strokeWidth={1.8} />
            Add Google env first
          </button>
        )}
        <button className="freelancer-secondary-button" disabled={!connection || connection.status === "DISCONNECTED" || isDisconnecting} onClick={() => disconnectChannel().catch(() => undefined)} type="button">
          <Link2Off size={15} strokeWidth={1.8} />
          {isDisconnecting ? "Disconnecting..." : "Disconnect channel"}
        </button>
        <button className="freelancer-secondary-button" onClick={() => refresh().catch(() => undefined)} type="button">
          <RefreshCcw size={15} strokeWidth={1.8} />
          Refresh status
        </button>
      </div>

      {status || searchNotice ? <p className="helper-text">{status || searchNotice}</p> : null}

      <div className="board-list">
        {!uploads.length ? <p className="muted-copy">No publish jobs yet. Once freelancers publish approved work, the latest jobs will appear here.</p> : null}
        {uploads.slice(0, 10).map((upload) => (
          <article className="lead-row" key={upload.id}>
            <div className="status-row">
              <span className="meta-pill">{upload.status}</span>
              <span className="meta-pill">{upload.privacy}</span>
            </div>
            <h3>{upload.title}</h3>
            <p>
              <strong>Freelancer:</strong> {upload.freelancerName ?? "Unknown"} - <strong>Draft:</strong> {upload.draftId}
            </p>
            <p>
              <strong>Source:</strong> {upload.sourceFileName} - <strong>Last attempt:</strong> {formatDate(upload.lastAttemptAt)}
            </p>
            {upload.videoUrl ? (
              <a className="secondary-button" href={upload.videoUrl} rel="noreferrer" target="_blank">
                Open live video
                <ExternalLink size={14} strokeWidth={1.8} />
              </a>
            ) : null}
            {upload.error ? <p className="muted-copy">Last error: {upload.error}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
