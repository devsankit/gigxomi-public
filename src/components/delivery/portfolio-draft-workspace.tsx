"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PortfolioDraft, ShowcasePlacement } from "@/lib/gigxomi/delivery-portfolio-types";
import type { PlatformYouTubeConnectionView } from "@/lib/gigxomi/platform-youtube-types";
import type { DummyConversationView } from "@/lib/gigxomi/dummy-platform-store";

type PortfolioAudience = "admin" | "manager" | "freelancer";

type PortfolioDraftWorkspaceProps = {
  audience: PortfolioAudience;
  focusDraftId?: string;
};

const showcaseOptions: ShowcasePlacement[] = ["PRIVATE_ONLY", "FREELANCER_PROFILE", "PUBLIC_SERVICE", "AGENCY_SHOWCASE"];
const youtubeCategoryOptions = [
  { id: "22", label: "People & Blogs" },
  { id: "24", label: "Entertainment" },
  { id: "27", label: "Education" },
  { id: "26", label: "Howto & Style" },
  { id: "28", label: "Science & Technology" },
] as const;

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizePortfolioDraft(draft: PortfolioDraft): PortfolioDraft {
  const privacy = draft.youtubePrivacy === "public" || draft.youtubePrivacy === "unlisted" || draft.youtubePrivacy === "private" ? draft.youtubePrivacy : "private";
  const placement = showcaseOptions.includes(draft.showcasePlacement) ? draft.showcasePlacement : "PRIVATE_ONLY";

  return {
    ...draft,
    title: safeString(draft.title),
    deliveryTime: safeString(draft.deliveryTime),
    category: safeString(draft.category),
    summary: safeString(draft.summary),
    description: safeString(draft.description),
    tags: safeStringArray(draft.tags),
    seoTitle: safeString(draft.seoTitle),
    seoDescription: safeString(draft.seoDescription),
    showcasePlacement: placement,
    youtubeTitle: safeString(draft.youtubeTitle),
    youtubeDescription: safeString(draft.youtubeDescription),
    youtubePrivacy: privacy,
    youtubeCategoryId: safeString(draft.youtubeCategoryId, "22"),
    youtubeTags: safeStringArray(draft.youtubeTags),
    audienceMadeForKids: Boolean(draft.audienceMadeForKids),
    lastPublishError: safeString(draft.lastPublishError),
  };
}

function isDraftReady(draft: PortfolioDraft) {
  return Boolean(
    draft.title.trim() &&
      draft.price &&
      draft.price > 0 &&
      draft.deliveryTime.trim() &&
      draft.category.trim() &&
      draft.summary.trim() &&
      draft.description.trim() &&
      draft.tags.length &&
      draft.seoTitle.trim() &&
      draft.seoDescription.trim() &&
      draft.youtubeTitle.trim() &&
      draft.youtubeDescription.trim(),
  );
}

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

async function fetchDrafts() {
  const response = await fetch("/api/portfolio/drafts", { cache: "no-store" });
  return (await response.json().catch(() => ({}))) as { ok?: boolean; drafts?: PortfolioDraft[]; error?: string };
}

async function fetchFreelancerConversations() {
  const response = await fetch("/api/conversations?audience=freelancer", { cache: "no-store" });
  return (await response.json().catch(() => ({}))) as { ok?: boolean; conversations?: DummyConversationView[]; error?: string };
}

async function fetchYouTubeConnection() {
  const response = await fetch("/api/admin/youtube", { cache: "no-store" });
  return (await response.json().catch(() => ({}))) as { ok?: boolean; connection?: PlatformYouTubeConnectionView | null };
}

export function PortfolioDraftWorkspace({ audience, focusDraftId }: PortfolioDraftWorkspaceProps) {
  const [drafts, setDrafts] = useState<PortfolioDraft[]>([]);
  const [conversations, setConversations] = useState<DummyConversationView[]>([]);
  const [connection, setConnection] = useState<PlatformYouTubeConnectionView | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadConversationId, setUploadConversationId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isFreelancer = audience === "freelancer";

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const [draftPayload, connectionPayload, conversationsPayload] = await Promise.all([
        fetchDrafts(),
        fetchYouTubeConnection(),
        isFreelancer ? fetchFreelancerConversations() : Promise.resolve({ conversations: [] }),
      ]);

      if (draftPayload.ok === false) {
        setStatus(draftPayload.error ?? "Unable to load portfolio drafts.");
        setDrafts([]);
      } else {
        setDrafts((draftPayload.drafts ?? []).map(normalizePortfolioDraft));
      }

      setConnection(connectionPayload.connection ?? null);
      setConversations(conversationsPayload.conversations ?? []);
      if (!uploadConversationId && (conversationsPayload.conversations?.length ?? 0) > 0) {
        setUploadConversationId(conversationsPayload.conversations?.[0]?.id ?? "");
      }
    } catch {
      setStatus("Unable to load portfolio drafts.");
    } finally {
      setLoading(false);
    }
  }, [isFreelancer, uploadConversationId]);

  useEffect(() => {
    loadDrafts().catch(() => undefined);
  }, [loadDrafts]);

  const visibleDrafts = useMemo(
    () => (focusDraftId ? drafts.filter((draft) => draft.id === focusDraftId) : drafts),
    [drafts, focusDraftId],
  );

  function updateLocalDraft(draftId: string, updater: (draft: PortfolioDraft) => PortfolioDraft) {
    setDrafts((current) => current.map((draft) => (draft.id === draftId ? updater(draft) : draft)));
  }

  async function saveDraft(draft: PortfolioDraft) {
    const response = await fetch("/api/portfolio/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draft.id,
        title: draft.title,
        price: draft.price,
        deliveryTime: draft.deliveryTime,
        category: draft.category,
        summary: draft.summary,
        description: draft.description,
        tags: draft.tags,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        showcasePlacement: draft.showcasePlacement,
        youtubeTitle: draft.youtubeTitle,
        youtubeDescription: draft.youtubeDescription,
        youtubePrivacy: draft.youtubePrivacy,
        youtubeCategoryId: draft.youtubeCategoryId,
        youtubeTags: draft.youtubeTags,
        audienceMadeForKids: draft.audienceMadeForKids,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to update the publish draft.");
      return;
    }

    setStatus("Publish draft saved.");
    await loadDrafts();
  }

  async function publishDraft(draft: PortfolioDraft, mode: "publish" | "retry") {
    const response = await fetch(`/api/portfolio/drafts/${draft.id}/${mode === "publish" ? "publish" : "retry"}`, {
      method: "POST",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to publish this video right now.");
      await loadDrafts();
      return;
    }

    setStatus(draft.sourceVideoId ? "Video publish metadata updated successfully." : "Video published successfully.");
    await loadDrafts();
  }

  async function uploadDeliveryVideo() {
    if (!uploadConversationId.trim() || !uploadFile) {
      setStatus("Choose a conversation and delivery video first.");
      return;
    }

    const formData = new FormData();
    formData.set("conversationId", uploadConversationId);
    formData.set("title", uploadTitle);
    formData.set("note", uploadNote);
    formData.set("file", uploadFile);

    setIsUploading(true);
    const response = await fetch("/api/delivery/assets", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setIsUploading(false);

    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to upload the delivery video.");
      return;
    }

    setUploadTitle("");
    setUploadNote("");
    setUploadFile(null);
    setStatus("Delivery video uploaded. The agency can now approve showcase use from delivery review.");
    await loadDrafts();
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Publish workflow</p>
      <h2 className="section-heading">
        {isFreelancer
          ? "Upload the final video, wait for agency approval, then complete pricing, SEO, and publishing details before making it live."
          : "Monitor freelancer publish drafts, agency approval state, and publish output from one place."}
      </h2>

      {isFreelancer ? (
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Upload final video</p>
              <h2>Create the delivery asset that starts the showcase and publish flow.</h2>
            </div>
          </div>

          <div className="freelancer-form-grid">
            <label className="freelancer-field">
              <span>Conversation</span>
              <select onChange={(event) => setUploadConversationId(event.target.value)} value={uploadConversationId}>
                <option value="">Select a conversation</option>
                {conversations.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.customerDisplayName} - {conversation.serviceTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="freelancer-field">
              <span>Upload title</span>
              <input onChange={(event) => setUploadTitle(event.target.value)} placeholder="Final approved cut" value={uploadTitle} />
            </label>
            <label className="freelancer-field">
              <span>Delivery video</span>
              <input accept="video/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} type="file" />
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Note</span>
              <textarea onChange={(event) => setUploadNote(event.target.value)} placeholder="What should the agency know before approving showcase use?" value={uploadNote} />
            </label>
          </div>

          <div className="freelancer-action-grid">
            <button className="freelancer-primary-button" disabled={isUploading} onClick={() => uploadDeliveryVideo().catch(() => undefined)} type="button">
              {isUploading ? "Uploading video..." : "Upload final video"}
            </button>
            <button className="freelancer-secondary-button" onClick={() => loadDrafts().catch(() => undefined)} type="button">
              Refresh workflow
            </button>
          </div>
        </section>
      ) : null}

      {status ? <p className="helper-text">{status}</p> : null}

      <div className="board-list">
        {loading ? <p className="muted-copy">Loading publish drafts...</p> : null}
        {!loading && !visibleDrafts.length ? (
          <div className="brief-card">
            <span className="meta-pill">No drafts</span>
            <strong>No uploaded delivery has created a publish draft yet.</strong>
              <p className="muted-copy">Once a freelancer uploads a final delivery video, the draft will stay here through agency approval and publishing.</p>
          </div>
        ) : null}

        {visibleDrafts.map((draft) => {
          const metadataReady = isDraftReady(draft);
          const approvalReady = draft.agencyApprovalStatus === "APPROVED";
          const publishDisabled = !approvalReady || !metadataReady || !connection?.canPublish;

          return (
            <article className="lead-row" key={draft.id}>
              <div className="status-row">
                <span className="meta-pill">{draft.status}</span>
                <span className="meta-pill">{draft.agencyApprovalStatus}</span>
                <span className="meta-pill">{metadataReady ? "Metadata ready" : "Metadata incomplete"}</span>
              </div>
              <h3>{draft.title || "Untitled publish draft"}</h3>
              <p>
                <strong>Freelancer:</strong> {draft.freelancerName ?? "Not assigned"} - <strong>Placement:</strong> {draft.showcasePlacement}
              </p>
              <p>
                <strong>Agency approval:</strong> {draft.agencyApprovalNote || "Waiting for agency decision."}
              </p>
              <p>
                <strong>Source video:</strong>{" "}
                <a href={draft.sourceDownloadUrl} rel="noreferrer" target="_blank">
                  {draft.sourceFileName}
                </a>
              </p>
              {draft.sourceVideoUrl ? (
                <p>
                  <strong>Video:</strong>{" "}
                  <a href={draft.sourceVideoUrl} rel="noreferrer" target="_blank">
                    Open published video
                  </a>
                </p>
              ) : null}
              <p>
                <strong>Published:</strong> {formatDate(draft.publishedAt)} - <strong>Last publish request:</strong> {formatDate(draft.publishRequestedAt)}
              </p>
              {draft.lastPublishError ? (
                <p>
                  <strong>Last publish error:</strong> {draft.lastPublishError}
                </p>
              ) : null}

              {isFreelancer ? (
                <>
                  <div className="freelancer-form-grid">
                    <label className="freelancer-field">
                      <span>Public title</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, title: event.target.value }))}
                        value={draft.title}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>Price</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) =>
                          updateLocalDraft(draft.id, (current) => ({
                            ...current,
                            price: event.target.value.trim() ? Number(event.target.value) : null,
                          }))
                        }
                        type="number"
                        value={draft.price ?? ""}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>Delivery time</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, deliveryTime: event.target.value }))}
                        value={draft.deliveryTime}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>Category</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, category: event.target.value }))}
                        value={draft.category}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>Showcase placement</span>
                      <select
                        disabled={!approvalReady}
                        onChange={(event) =>
                          updateLocalDraft(draft.id, (current) => ({
                            ...current,
                            showcasePlacement: event.target.value as ShowcasePlacement,
                          }))
                        }
                        value={draft.showcasePlacement}
                      >
                        {showcaseOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>Portfolio summary</span>
                      <textarea
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, summary: event.target.value }))}
                        value={draft.summary}
                      />
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>Description</span>
                      <textarea
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, description: event.target.value }))}
                        value={draft.description}
                      />
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>SEO tags</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) =>
                          updateLocalDraft(draft.id, (current) => ({
                            ...current,
                            tags: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          }))
                        }
                        value={draft.tags.join(", ")}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>SEO title</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, seoTitle: event.target.value }))}
                        value={draft.seoTitle}
                      />
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>SEO description</span>
                      <textarea
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, seoDescription: event.target.value }))}
                        value={draft.seoDescription}
                      />
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>Publish title</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, youtubeTitle: event.target.value }))}
                        value={draft.youtubeTitle}
                      />
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>Publish description</span>
                      <textarea
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, youtubeDescription: event.target.value }))}
                        value={draft.youtubeDescription}
                      />
                    </label>
                    <label className="freelancer-field">
                      <span>Publish privacy</span>
                      <select
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, youtubePrivacy: event.target.value as PortfolioDraft["youtubePrivacy"] }))}
                        value={draft.youtubePrivacy}
                      >
                        <option value="private">private</option>
                        <option value="unlisted">unlisted</option>
                        <option value="public">public</option>
                      </select>
                    </label>
                    <label className="freelancer-field">
                      <span>Video category</span>
                      <select
                        disabled={!approvalReady}
                        onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, youtubeCategoryId: event.target.value }))}
                        value={draft.youtubeCategoryId}
                      >
                        {youtubeCategoryOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="freelancer-field freelancer-field-full">
                      <span>Publish tags</span>
                      <input
                        disabled={!approvalReady}
                        onChange={(event) =>
                          updateLocalDraft(draft.id, (current) => ({
                            ...current,
                            youtubeTags: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          }))
                        }
                        value={draft.youtubeTags.join(", ")}
                      />
                    </label>
                    <label className="freelancer-field package-checkbox-field">
                      <span>Audience</span>
                      <label className="package-checkbox-row">
                        <input
                          checked={draft.audienceMadeForKids}
                          disabled={!approvalReady}
                          onChange={(event) => updateLocalDraft(draft.id, (current) => ({ ...current, audienceMadeForKids: event.target.checked }))}
                          type="checkbox"
                        />
                        <span>Made for kids</span>
                      </label>
                    </label>
                  </div>

                  <div className="freelancer-action-grid">
                    <button className="freelancer-secondary-button" disabled={!approvalReady} onClick={() => saveDraft(draft).catch(() => undefined)} type="button">
                      Save metadata
                    </button>
                    <button className="freelancer-primary-button" disabled={publishDisabled} onClick={() => publishDraft(draft, draft.status === "FAILED" ? "retry" : "publish").catch(() => undefined)} type="button">
                      {draft.status === "FAILED" ? "Retry publish" : draft.sourceVideoId ? "Update published metadata" : "Publish to shared channel"}
                    </button>
                  </div>

                  {!approvalReady ? <p className="muted-copy">Agency approval is still pending. Metadata editing unlocks after the agency approves showcase use.</p> : null}
                  {approvalReady && !connection?.canPublish ? (
                    <p className="muted-copy">
                      Shared publish channel is not ready yet.
                      {connection?.status === "ENV_MISSING" ? ` Missing env: ${connection.missingEnv.join(", ")}.` : ""}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="brief-grid two-up">
                  <div className="brief-card">
                    <span className="meta-pill">Public metadata</span>
                    <strong>{draft.price ? `INR ${draft.price.toLocaleString("en-IN")}` : "Price pending"}</strong>
                    <p className="muted-copy">{draft.summary || "No portfolio summary yet."}</p>
                    <p className="muted-copy">Delivery time: {draft.deliveryTime || "Not set"}</p>
                  </div>
                  <div className="brief-card">
                    <span className="meta-pill">Publish metadata</span>
                    <strong>{draft.youtubeTitle || "Title pending"}</strong>
                    <p className="muted-copy">{draft.youtubePrivacy} - category {draft.youtubeCategoryId}</p>
                    <p className="muted-copy">Tags: {draft.youtubeTags.length ? draft.youtubeTags.join(", ") : "No publish tags yet."}</p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
