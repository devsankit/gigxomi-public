"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeIndianRupee, ChevronRight, ExternalLink, Play, Save, Send, Sparkles, TimerReset } from "lucide-react";

import { ServiceDetailView, ServiceCtaButton } from "@/components/services/service-ui";
import { EmptyStateGuidance } from "@/components/onboarding/empty-state-guidance";
import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";
import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { getVideoEmbedUrl, getVideoPresentation } from "@/lib/gigxomi/media";
import type { PublishingDraftRecord } from "@/lib/publishing/types";

type ServiceFormState = {
  title: string;
  summary: string;
  category: "Video Editing" | "Graphic Design";
  specialty: string;
  description: string;
  targetAudience: string;
  deliveryTime: string;
  revisions: string;
  basePrice: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  deliverables: string;
  faq: string;
  sampleMediaUrl: string;
};

type ServiceSeoSuggestion = {
  title: string;
  description: string;
  keywords: string[];
  summary: string;
  schema: {
    serviceType: string;
    areaServed: string;
    offerCategory: string;
  };
};

const defaultFormState: ServiceFormState = {
  title: "",
  summary: "",
  category: "Video Editing",
  specialty: "",
  description: "",
  targetAudience: "",
  deliveryTime: "2 Days",
  revisions: "2 revisions included",
  basePrice: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  deliverables: "",
  faq: "What is included in the base price? | Core delivery is included as listed above.",
  sampleMediaUrl: "",
};

function resolveServiceSampleEmbedUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const youtubeEmbed = getVideoEmbedUrl(trimmed);
  if (youtubeEmbed) {
    return youtubeEmbed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "drive.google.com") {
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
      const fileId = pathMatch?.[1] || url.searchParams.get("id") || "";
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : "";
    }

    if (host === "instagram.com" || host === "m.instagram.com") {
      const segments = url.pathname.split("/").filter(Boolean);
      const type = segments[0];
      const id = segments[1];
      if ((type === "reel" || type === "p") && id) {
        return `https://www.instagram.com/${type}/${id}/embed/`;
      }
    }
  } catch {
    return "";
  }

  return "";
}

function toLivePreviewService(formState: ServiceFormState): DummyService {
  const sampleUrl = formState.sampleMediaUrl.trim();
  const embedUrl = resolveServiceSampleEmbedUrl(sampleUrl);

  return {
    id: "preview-service",
    slug: "preview-service",
    ownerId: "preview-owner",
    ownerName: "You",
    ownerAlias: "your-service",
    title: formState.title.trim() || "Untitled service",
    summary: formState.summary.trim() || "Add a one-line summary to help buyers understand this service.",
    category: "Video Editing",
    specialty: formState.specialty.trim() || "Video editing",
    description: formState.description.trim() || "Add a buyer-facing description to explain process, quality, and outcomes.",
    targetAudience: formState.targetAudience.trim() || "Creators and brands",
    deliveryTime: formState.deliveryTime.trim() || "2 Days",
    revisions: formState.revisions.trim() || "2 revisions included",
    basePrice: Number(formState.basePrice || 0),
    currency: "INR",
    tags: formState.tags.split(",").map((item) => item.trim()).filter(Boolean),
    seoTitle: formState.seoTitle.trim() || formState.title.trim() || "Service title",
    seoDescription: formState.seoDescription.trim() || "Meta description preview will appear here.",
    seoKeywords: formState.seoKeywords.split(",").map((item) => item.trim()).filter(Boolean),
    deliverables: formState.deliverables.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    faq: formState.faq
      .split(/\r?\n/)
      .map((line) => {
        const [question, answer] = line.split("|").map((part) => part.trim());
        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is { question: string; answer: string } => Boolean(item)),
    media: [
      {
        id: "sample-media",
        kind: "video",
        title: "Live preview",
        accent: "var(--color-surface-soft)",
        sourceUrl: sampleUrl || undefined,
        embedUrl: embedUrl || undefined,
      },
    ],
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function toFormPayload(formState: ServiceFormState) {
  return {
    title: formState.title,
    summary: formState.summary,
    category: "Video Editing",
    specialty: formState.specialty,
    description: formState.description,
    targetAudience: formState.targetAudience,
    deliveryTime: formState.deliveryTime,
    revisions: formState.revisions,
    basePrice: Number(formState.basePrice || 0),
    tags: formState.tags,
    seoTitle: formState.seoTitle,
    seoDescription: formState.seoDescription,
    seoKeywords: formState.seoKeywords,
    deliverables: formState.deliverables,
    faq: formState.faq,
    sampleVideoUrl: formState.sampleMediaUrl,
    sampleVideoEmbedUrl: resolveServiceSampleEmbedUrl(formState.sampleMediaUrl),
  };
}

function buildTitleBestPracticeSuggestions(title: string, category: ServiceFormState["category"]) {
  const normalized = title.trim();
  if (!normalized) {
    return [
      `Use a clear promise first. Example: ${category === "Graphic Design" ? "Poster and thumbnail design for coaches" : "Short-form video editing for creators"}`,
      "Keep title length between 45 and 70 characters for cleaner search snippets.",
    ];
  }

  const notes: string[] = [];
  if (normalized.length < 30) {
    notes.push("Title is short; add outcome or niche so buyers understand the value fast.");
  }
  if (normalized.length > 72) {
    notes.push("Title is long; trim filler words for a stronger search result.");
  }
  if (!/\b(for|with)\b/i.test(normalized)) {
    notes.push("Add a context phrase like 'for creators' or 'with subtitles' to improve intent matching.");
  }
  if (!/\b(edit|design|thumbnail|reel|video|branding|motion)\b/i.test(normalized)) {
    notes.push("Include a service keyword (editing/design/reel/thumbnail) for stronger SEO relevance.");
  }

  return notes.length ? notes : ["Title quality looks good. You can still test one niche keyword variant below."];
}

async function fetchFreelancerServices() {
  const response = await fetch("/api/freelancer/services", { cache: "no-store" });
  const payload = await response.json();
  return (payload.services ?? []) as DummyService[];
}

async function fetchServicePublishingDrafts() {
  const response = await fetch("/api/publishing/drafts?mode=service", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  return (payload.drafts ?? []) as PublishingDraftRecord[];
}

async function fetchSeoSuggestions(serviceId: string, input: Pick<ServiceFormState, "title" | "description" | "category" | "specialty" | "summary" | "tags" | "targetAudience">) {
  const response = await fetch(`/api/freelancer/services/${serviceId}/seo-suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      category: input.category,
      niche: input.specialty,
      summary: input.summary,
      tags: input.tags,
      targetAudience: input.targetAudience,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to generate SEO suggestions.");
  }

  return (payload as { seo?: ServiceSeoSuggestion }).seo ?? null;
}

export function FreelancerDynamicServicesSection() {
  const [services, setServices] = useState<DummyService[]>([]);
  const [drafts, setDrafts] = useState<PublishingDraftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchFreelancerServices(), fetchServicePublishingDrafts()])
      .then(([nextServices, nextDrafts]) => {
        setServices(nextServices);
        setDrafts(nextDrafts);
      })
      .catch(() => {
        setServices([]);
        setDrafts([]);
        setNotice("Your services could not be loaded right now.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handlePublish(serviceId: string) {
    setNotice(null);

    try {
      const response = await fetch(`/api/freelancer/services/${serviceId}/submit`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to publish this service right now.");
      }

      const [refreshedServices, refreshedDrafts] = await Promise.all([fetchFreelancerServices(), fetchServicePublishingDrafts()]);
      setServices(refreshedServices);
      setDrafts(refreshedDrafts);
      setNotice("Service published successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to publish this service right now.");
    }
  }

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">My Services</p>
            <h2>Drafts, pending reviews, and approved public listings now come from one dummy publishing flow.</h2>
          </div>
          <Link className="freelancer-primary-button" href="/freelancer/add-service">
            Create Service
          </Link>
        </div>

        {notice ? <p className="muted-copy">{notice}</p> : null}

        <div className="freelancer-service-list">
          {isLoading ? <p className="muted-copy">Loading your services...</p> : null}
          {!isLoading &&
            drafts.map((draft) => (
              <article className="freelancer-service-card" key={`draft-${draft.id}`}>
                <div className="freelancer-service-card-top">
                  <span className="meta-pill">{draft.status.replaceAll("_", " ")}</span>
                  <span className="meta-pill">Draft listing</span>
                </div>
                <h3>{draft.payload.service.title || "Untitled draft service"}</h3>
                <div className="freelancer-service-meta">
                  <div>
                    <span>Price</span>
                    <strong>{draft.payload.service.basePrice ? `INR ${Number(draft.payload.service.basePrice).toLocaleString("en-IN")}` : "Not set"}</strong>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <strong>{draft.payload.service.deliveryTime || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Progress</span>
                    <strong>{Math.max(0, 15 - draft.missingFields.length)}/15</strong>
                  </div>
                </div>
                <p>{draft.payload.service.summary || "Continue this draft to finish the service card and publish it."}</p>
                <div className="freelancer-action-grid">
                  <Link className="freelancer-secondary-button" href={`/freelancer/add-service?draft=${draft.id}`}>
                    Continue Editing
                  </Link>
                  <Link className="freelancer-primary-button" href={`/freelancer/add-service?draft=${draft.id}`}>
                    Open to Publish
                  </Link>
                </div>
              </article>
            ))}
          {services.map((service) => (
            <article className="freelancer-service-card" key={service.id}>
              <div className="freelancer-service-card-top">
                <span className="meta-pill">{service.status}</span>
                <span className="meta-pill">{service.category}</span>
              </div>
              <h3>{service.title}</h3>
              <div className="freelancer-service-meta">
                <div>
                  <span>Price</span>
                  <strong>INR {service.basePrice.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>{service.deliveryTime}</strong>
                </div>
                <div>
                  <span>SEO</span>
                  <strong>{service.seoTitle}</strong>
                </div>
              </div>
              <p>{service.reviewNote ?? service.summary}</p>
              <div className="freelancer-action-grid">
                <Link className="freelancer-secondary-button" href={`/freelancer/services/${service.id}/preview`}>
                  Preview
                </Link>
                {service.status === "Approved" ? (
                  <Link className="freelancer-primary-button" href={`/services/${service.slug}`}>
                    Open Public Page
                  </Link>
                ) : service.status === "Draft" ? (
                  <button className="freelancer-primary-button" onClick={() => void handlePublish(service.id)} type="button">
                    Publish Service
                  </button>
                ) : (
                  <Link className="freelancer-primary-button" href="/freelancer/add-service">
                    Add another service
                  </Link>
                )}
              </div>
            </article>
          ))}
          {!isLoading && !services.length && !drafts.length ? (
            <EmptyStateGuidance
              ctaHref="/freelancer/add-service"
              ctaLabel="Create your first service"
              description="Create a service draft, submit it for approval, and it will appear here once it is ready."
              title="No services yet"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function FreelancerDynamicAddServiceSection() {
  const router = useRouter();
  const [formState, setFormState] = useState<ServiceFormState>(defaultFormState);
  const [savedServiceId, setSavedServiceId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSeoPending, setIsSeoPending] = useState(false);
  const [seoSuggestion, setSeoSuggestion] = useState<ServiceSeoSuggestion | null>(null);

  const seoFallbackTitle = useMemo(() => formState.seoTitle || formState.title, [formState.seoTitle, formState.title]);
  const titleBestPractice = useMemo(() => buildTitleBestPracticeSuggestions(formState.title, "Video Editing"), [formState.title]);
  const livePreviewService = useMemo(() => toLivePreviewService(formState), [formState]);
  const samplePresentation = useMemo(
    () => (formState.sampleMediaUrl.trim() ? getVideoPresentation(formState.sampleMediaUrl.trim()) : null),
    [formState.sampleMediaUrl],
  );

  function updateField<Key extends keyof ServiceFormState>(key: Key, value: ServiceFormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function saveDraft() {
    setIsPending(true);
    setStatus(null);
    try {
      const method = savedServiceId ? "PATCH" : "POST";
      const endpoint = savedServiceId ? `/api/freelancer/services/${savedServiceId}` : "/api/freelancer/services";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFormPayload(formState)),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to save service draft.");
      }
      setSavedServiceId(payload.service?.id ?? savedServiceId);
      setStatus("Draft saved. You can preview it before submitting for review.");
      return payload.service as DummyService;
    } finally {
      setIsPending(false);
    }
  }

  async function handleGenerateSeoSuggestions() {
    setIsSeoPending(true);
    setStatus(null);
    try {
      const service = await saveDraft();
      const serviceId = service?.id ?? savedServiceId;
      if (!serviceId) {
        throw new Error("Save the draft once before generating SEO suggestions.");
      }
      const nextSeo = await fetchSeoSuggestions(serviceId, {
        title: formState.title,
        description: formState.description,
        category: "Video Editing",
        specialty: formState.specialty,
        summary: formState.summary,
        tags: formState.tags,
        targetAudience: formState.targetAudience,
      });
      if (!nextSeo) {
        throw new Error("No SEO guidance was returned.");
      }
      setSeoSuggestion(nextSeo);
      setFormState((current) => ({
        ...current,
        seoTitle: nextSeo.title || current.seoTitle,
        seoDescription: nextSeo.description || current.seoDescription,
        seoKeywords: nextSeo.keywords.length ? nextSeo.keywords.join(", ") : current.seoKeywords,
      }));
      setStatus("SEO suggestions generated and applied.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to generate SEO suggestions.");
    } finally {
      setIsSeoPending(false);
    }
  }

  async function handleSubmitForReview() {
    setIsPending(true);
    setStatus(null);

    try {
      const service = await saveDraft();
      if (!service?.id) {
        setStatus("Save the draft once before sending it for review.");
        return;
      }

      const response = await fetch(`/api/freelancer/services/${service.id}/submit`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to submit service for review.");
      }
      setSavedServiceId(payload.service?.id ?? service.id);
      setStatus(payload.service?.reviewNote ?? "Sent for review. Your service is now waiting for approval.");
      router.push("/freelancer/services");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">Add Service</p>
            <h2>Fill the service details, save draft, and send for review when ready.</h2>
          </div>
          {status ? <span className="meta-pill">{status}</span> : null}
        </div>

        <div className="freelancer-inline-list">
          <div className="freelancer-inline-row">
            <Sparkles size={15} strokeWidth={1.8} />
            <span>Category locked: Video Editing</span>
          </div>
        </div>

        <div className="freelancer-service-editor-layout">
          <div className="freelancer-service-editor-form">
            <div className="freelancer-form-grid">
              <label className="freelancer-field">
                <span>Service title</span>
                <input onChange={(event) => updateField("title", event.target.value)} placeholder="Service title" value={formState.title} />
              </label>
              <label className="freelancer-field">
                <span>Summary</span>
                <input onChange={(event) => updateField("summary", event.target.value)} placeholder="One-line buyer summary" value={formState.summary} />
              </label>
              <label className="freelancer-field">
                <span>Specialty lane</span>
                <input onChange={(event) => updateField("specialty", event.target.value)} placeholder="Podcast editing / wedding teaser / thumbnails" value={formState.specialty} />
              </label>
              <label className="freelancer-field">
                <span>Target audience</span>
                <input onChange={(event) => updateField("targetAudience", event.target.value)} placeholder="Who is this best for?" value={formState.targetAudience} />
              </label>
              <label className="freelancer-field">
                <span>Delivery time</span>
                <input onChange={(event) => updateField("deliveryTime", event.target.value)} placeholder="2 Days" value={formState.deliveryTime} />
              </label>
              <label className="freelancer-field">
                <span>Revisions</span>
                <input onChange={(event) => updateField("revisions", event.target.value)} placeholder="2 revisions included" value={formState.revisions} />
              </label>
              <label className="freelancer-field">
                <span>Base price</span>
                <input onChange={(event) => updateField("basePrice", event.target.value)} placeholder="2200" value={formState.basePrice} />
              </label>
              <label className="freelancer-field">
                <span>Tags</span>
                <input onChange={(event) => updateField("tags", event.target.value)} placeholder="coach, youtube, podcast" value={formState.tags} />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>Sample link (YouTube / Instagram / Google Drive)</span>
                <input onChange={(event) => updateField("sampleMediaUrl", event.target.value)} placeholder="Paste one public link for live preview" value={formState.sampleMediaUrl} />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>Description</span>
                <textarea onChange={(event) => updateField("description", event.target.value)} placeholder="Full buyer-facing description" value={formState.description} />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>Deliverables</span>
                <textarea onChange={(event) => updateField("deliverables", event.target.value)} placeholder="One item per line" value={formState.deliverables} />
              </label>
              <label className="freelancer-field">
                <span>SEO title</span>
                <input onChange={(event) => updateField("seoTitle", event.target.value)} placeholder="SEO title" value={formState.seoTitle} />
              </label>
              <label className="freelancer-field">
                <span>SEO keywords</span>
                <input onChange={(event) => updateField("seoKeywords", event.target.value)} placeholder="seo keywords separated by commas" value={formState.seoKeywords} />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>SEO description</span>
                <textarea onChange={(event) => updateField("seoDescription", event.target.value)} placeholder="Meta description" value={formState.seoDescription} />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>FAQ</span>
                <textarea onChange={(event) => updateField("faq", event.target.value)} placeholder="One per line: Question | Answer" value={formState.faq} />
              </label>
            </div>
            <div className="freelancer-inline-list">
              {titleBestPractice.map((note) => (
                <div className="freelancer-inline-row" key={note}>
                  <Sparkles size={15} strokeWidth={1.8} />
                  <span>{note}</span>
                </div>
              ))}
              <div className="freelancer-inline-row">
                <ChevronRight size={15} strokeWidth={1.8} />
                <span>SEO preview title: {seoFallbackTitle || "Fill service title or SEO title"}</span>
              </div>
              {seoSuggestion ? (
                <div className="freelancer-inline-row">
                  <Sparkles size={15} strokeWidth={1.8} />
                  <span>
                    Schema focus: {seoSuggestion.schema.serviceType} | {seoSuggestion.schema.areaServed} | {seoSuggestion.schema.offerCategory}
                  </span>
                </div>
              ) : null}
              <div className="freelancer-inline-row">
                <ChevronRight size={15} strokeWidth={1.8} />
                <span>Draft stays private until you send it for review and it gets approved.</span>
              </div>
            </div>

            <div className="freelancer-action-grid freelancer-action-grid-compact">
              <button className="freelancer-secondary-button" disabled={isPending || isSeoPending} onClick={() => void handleGenerateSeoSuggestions()} type="button">
                <Sparkles size={15} strokeWidth={1.8} />
                {isSeoPending ? "Generating SEO..." : "Generate SEO"}
              </button>
              <button className="freelancer-secondary-button" disabled={isPending} onClick={saveDraft} type="button">
                <Save size={15} strokeWidth={1.8} />
                Save Draft
              </button>
              <button className="freelancer-primary-button" disabled={isPending} onClick={handleSubmitForReview} type="button">
                <Send size={15} strokeWidth={1.8} />
                Send for Review
              </button>
            </div>
          </div>

          <div className="freelancer-service-editor-preview">
            <div className="freelancer-section-head freelancer-section-head-preview">
              <div>
                <p className="section-label">Live Preview</p>
                <h2>Buyer-facing service card.</h2>
              </div>
            </div>

            <div className="freelancer-service-live-preview-card">
              <article className="marketplace-discovery-card">
                <div className="marketplace-discovery-media marketplace-discovery-media-portrait" style={{ background: livePreviewService.media[0]?.accent }}>
                  {samplePresentation?.thumbnail ? (
                    <Image
                      alt={livePreviewService.title}
                      className="marketplace-discovery-image"
                      fill
                      sizes="(max-width: 1200px) 100vw, 420px"
                      src={samplePresentation.thumbnail}
                    />
                  ) : null}
                  <div className="marketplace-discovery-overlay">
                    <div className="service-signal-row">
                      <span className="meta-pill">{livePreviewService.category}</span>
                      <span className="meta-pill">{livePreviewService.specialty || "Priority monthly retainer"}</span>
                    </div>
                    <button className="marketplace-discovery-watch" type="button">
                      <span className="marketplace-discovery-watch-icon">
                        <Play fill="currentColor" size={14} strokeWidth={1.8} />
                      </span>
                      Watch sample
                    </button>
                  </div>
                </div>

                <div className="marketplace-discovery-body">
                  <div className="marketplace-discovery-head">
                    <span className="marketplace-discovery-kicker">{livePreviewService.ownerAlias.toUpperCase()}</span>
                    <h3>{livePreviewService.ownerName.toUpperCase()}</h3>
                  </div>
                  <div className="marketplace-discovery-metrics">
                    <div>
                      <span>
                        <BadgeIndianRupee size={13} strokeWidth={1.8} />
                        Price
                      </span>
                      <strong>{`From INR ${Math.max(200, livePreviewService.basePrice || 0).toLocaleString("en-IN")}`}</strong>
                    </div>
                    <div>
                      <span>
                        <TimerReset size={13} strokeWidth={1.8} />
                        Delivery
                      </span>
                      <strong>{livePreviewService.deliveryTime || "1 Day"}</strong>
                    </div>
                  </div>
                  <div className="marketplace-discovery-actions">
                    <button className="primary-button" type="button">
                      Connect on WhatsApp
                    </button>
                  </div>
                </div>
              </article>
              {formState.sampleMediaUrl.trim() && !samplePresentation?.thumbnail && !getVideoEmbedUrl(formState.sampleMediaUrl.trim()) ? (
                <p className="muted-copy">Sample link saved. Add a YouTube link to show thumbnail preview.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function FreelancerServicePreviewSection({ service }: { service: DummyService }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submitForReview() {
    setIsPending(true);
    const response = await fetch(`/api/freelancer/services/${service.id}/submit`, {
      method: "POST",
    });
    const payload = await response.json();
    setStatus(payload.service?.reviewNote ?? "Submitted for review.");
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">Service Preview</p>
            <h2>This is the same buyer-facing service page layout that opens from Discover once the listing is approved.</h2>
          </div>
          <div className="freelancer-action-grid">
            <Link className="freelancer-secondary-button" href="/freelancer/services">
              Back to services
            </Link>
            <button className="freelancer-primary-button" disabled={isPending || service.status === "Pending Review"} onClick={submitForReview} type="button">
              {service.status === "Pending Review" ? "Awaiting review" : "Submit for Review"}
            </button>
          </div>
        </div>

        {status ? <p className="helper-text">{status}</p> : null}

        <ServiceDetailView
          actions={
            <div className="service-detail-action-stack">
              <ServiceCtaButton href={buildServiceInquiryHref(service)} label="Preview WhatsApp CTA" />
              {service.status === "Approved" ? (
                <Link className="secondary-button" href={`/services/${service.slug}`}>
                  Open Public Page
                  <ExternalLink size={14} strokeWidth={1.8} />
                </Link>
              ) : null}
            </div>
          }
          mode="preview"
          service={service}
        />
      </section>
    </div>
  );
}

