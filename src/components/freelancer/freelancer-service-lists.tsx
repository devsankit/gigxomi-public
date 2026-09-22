"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FilePenLine, Send, Sparkles } from "lucide-react";

import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";
import type { PublishingDraftRecord } from "@/lib/publishing/types";

async function fetchFreelancerServices() {
  const response = await fetch("/api/freelancer/services", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to load services.");
  }

  return (payload.services ?? []) as DummyService[];
}

async function fetchServicePublishingDrafts() {
  const response = await fetch("/api/publishing/drafts?mode=service", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to load service drafts.");
  }

  return (payload.drafts ?? []) as PublishingDraftRecord[];
}

async function updateServiceVisibility(serviceId: string, input: { listingEnabled?: boolean; availability?: "ACTIVE" | "PAUSED" }) {
  const response = await fetch(`/api/freelancer/services/${serviceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to update service visibility.");
  }

  return (payload as { service?: DummyService }).service ?? null;
}

function formatMoney(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : value ?? 0;
  if (!amount || Number.isNaN(amount)) {
    return "Not set";
  }

  return `INR ${amount.toLocaleString("en-IN")}`;
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) {
    return "Not updated yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not updated yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDraftCompletion(draft: PublishingDraftRecord) {
  const totalFields = 15;
  const completed = Math.max(0, totalFields - draft.missingFields.length);
  const percent = Math.max(10, Math.round((completed / totalFields) * 100));

  return {
    label: `${completed}/${totalFields}`,
    percent,
  };
}

function isListableDraft(draft: PublishingDraftRecord, filter: "all" | "drafts" | "review" = "drafts") {
  if (draft.mode !== "service") return false;
  if (filter === "review") {
    return draft.status === "PENDING_REVIEW";
  }
  if (filter === "drafts") {
    return draft.status === "IN_PROGRESS" || draft.status === "DRAFT" || draft.status === "REJECTED";
  }
  return true;
}

function stopRowNavigation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

type DraftServicesSectionProps = {
  title?: string;
  description?: string;
  filter?: "all" | "drafts" | "review";
};

type UnifiedDraftItem = {
  id: string;
  title: string;
  summary: string;
  basePrice: number | string | null;
  deliveryTime: string | null;
  updatedAt: string;
  status: string;
  reviewNote?: string | null;
  completionPercent?: number;
  completionLabel?: string;
  editHref: string;
  publishHref?: string;
  isPublishingDraft: boolean;
};

export function DraftServicesSection({
  title,
  description,
  filter = "drafts",
}: DraftServicesSectionProps) {
  const router = useRouter();
  const [items, setItems] = useState<UnifiedDraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultTitle = filter === "review" ? "Services in Review" : "Draft Services";
  const defaultDescription =
    filter === "review"
      ? "Services submitted for Super Admin review. Our platform team verifies deliverables and pricing before marketplace activation."
      : "Every unfinished service draft lives here. Open any draft in Add Service, continue the chat, and publish only from there.";

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchServicePublishingDrafts().catch(() => []),
      fetchFreelancerServices().catch(() => []),
    ])
      .then(([publishingDrafts, freelancerServices]) => {
        if (!active) return;

        const unifiedList: UnifiedDraftItem[] = [];

        // 1. Publishing drafts
        for (const draft of publishingDrafts) {
          if (!isListableDraft(draft, filter)) continue;
          const completion = getDraftCompletion(draft);
          const editHref = `/freelancer/services?tab=add&draft=${draft.id}`;
          const publishHref = `${editHref}&intent=publish`;

          unifiedList.push({
            id: draft.id,
            title: draft.payload.service.title || "Untitled draft service",
            summary:
              draft.payload.service.summary ||
              "Open this draft in Add Service to continue the listing chat and finish publishing.",
            basePrice: draft.payload.service.basePrice,
            deliveryTime: draft.payload.service.deliveryTime || "Not set",
            updatedAt: draft.updatedAt,
            status: draft.status === "PENDING_REVIEW" ? "Pending Review" : draft.status,
            completionPercent: completion.percent,
            completionLabel: completion.label,
            editHref,
            publishHref,
            isPublishingDraft: true,
          });
        }

        // 2. Freelancer services from marketplace store
        for (const service of freelancerServices) {
          const status = service.status || "Draft";
          const isPending = status === "Pending Review";
          const isDraftLike = status === "Draft" || status === "Rejected";

          if (filter === "review" && !isPending) continue;
          if (filter === "drafts" && !isDraftLike) continue;

          // Check if already represented by draft ID
          if (unifiedList.some((item) => item.id === service.id)) continue;

          const editHref = `/freelancer/services?tab=add&draft=${service.id}`;
          unifiedList.push({
            id: service.id,
            title: service.title || "Untitled service",
            summary: service.summary || service.description || "Video editing marketplace service.",
            basePrice: service.basePrice,
            deliveryTime: service.deliveryTime || "Not set",
            updatedAt: service.updatedAt,
            status: isPending ? "Pending Review" : status,
            reviewNote: service.reviewNote,
            completionPercent: isPending ? 100 : 70,
            completionLabel: isPending ? "Submitted" : "7/10",
            editHref,
            publishHref: `${editHref}&intent=publish`,
            isPublishingDraft: false,
          });
        }

        setItems(unifiedList);
      })
      .catch((error) => {
        if (!active) return;
        setItems([]);
        setNotice(error instanceof Error ? error.message : "Unable to load services.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter]);

  const orderedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [items],
  );

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">{filter === "review" ? "Admin Review" : "Draft Services"}</p>
            <h2>{title ?? defaultTitle}</h2>
            <p className="muted-copy">{description ?? defaultDescription}</p>
          </div>
          <Link className="freelancer-primary-button" href="/freelancer/services?tab=add">
            + Add New Service
          </Link>
        </div>

        {notice ? <p className="muted-copy">{notice}</p> : null}

        <div className="freelancer-service-table">
          <div className="freelancer-service-table-head">
            <span>Listing</span>
            <span>Price</span>
            <span>Delivery</span>
            <span>Updated</span>
            <span>{filter === "review" ? "Review Status" : "Progress"}</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <p className="muted-copy">
              {filter === "review" ? "Loading services in review..." : "Loading your draft services..."}
            </p>
          ) : null}

          {!isLoading &&
            orderedItems.map((item) => {
              const isReviewItem = item.status === "Pending Review" || item.status === "SUBMITTED" || item.status === "UNDER_REVIEW";

              return (
                <article
                  className="freelancer-service-table-row"
                  key={item.id}
                  onClick={() => router.push(item.editHref)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(item.editHref);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="freelancer-service-table-primary">
                    <strong>{item.title}</strong>
                    <p>{item.reviewNote ? `Admin note: ${item.reviewNote}` : item.summary}</p>
                  </div>
                  <div className="freelancer-service-table-cell" data-label="Price">
                    <span>{formatMoney(item.basePrice)}</span>
                  </div>
                  <div className="freelancer-service-table-cell" data-label="Delivery">
                    <span>{item.deliveryTime || "Not set"}</span>
                  </div>
                  <div className="freelancer-service-table-cell" data-label="Updated">
                    <span>{formatUpdatedAt(item.updatedAt)}</span>
                  </div>
                  <div className="freelancer-service-table-cell" data-label={filter === "review" ? "Status" : "Progress"}>
                    {isReviewItem ? (
                      <span className="meta-pill review">Pending Review</span>
                    ) : (
                      <>
                        <span>{item.completionLabel ?? "In progress"}</span>
                        {item.completionPercent !== undefined && <small>{item.completionPercent}% complete</small>}
                      </>
                    )}
                  </div>
                  <div className="freelancer-service-table-actions">
                    <Link className="freelancer-secondary-button" href={item.editHref} onClick={stopRowNavigation}>
                      <FilePenLine size={15} strokeWidth={1.8} />
                      {isReviewItem ? "View Details" : "Edit"}
                    </Link>
                    {!isReviewItem && item.publishHref && (
                      <Link className="freelancer-primary-button" href={item.publishHref} onClick={stopRowNavigation}>
                        <Send size={15} strokeWidth={1.8} />
                        Submit
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}

          {!isLoading && !orderedItems.length ? (
            <article className="freelancer-service-empty">
              <div>
                <span className="meta-pill">{filter === "review" ? "No services in review" : "No draft listings"}</span>
                <h3>{filter === "review" ? "No listings currently awaiting review" : "Your service drafts will show here"}</h3>
                <p>
                  {filter === "review"
                    ? "When you finish a draft and send it for review from Add Service, it will appear here while our Super Admin team verifies details."
                    : "Start in Add Service, answer the listing questions, and every unfinished service will appear in this draft list automatically."}
                </p>
              </div>
              <Link className="freelancer-primary-button" href="/freelancer/services?tab=add">
                Create Service
              </Link>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type PublishedServicesSectionProps = {
  title?: string;
  description?: string;
};

export function PublishedServicesSection({
  title = "Published Services",
  description = "Approved live services appear here. Drafts stay in the draft list until you open them in Add Service and publish from there.",
}: PublishedServicesSectionProps) {
  const [services, setServices] = useState<DummyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchFreelancerServices()
      .then((rows) => {
        if (!active) {
          return;
        }

        setServices(rows.filter((service) => service.status === "Approved" || service.status === "Paused"));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setServices([]);
        setNotice(error instanceof Error ? error.message : "Unable to load published services.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const orderedServices = useMemo(
    () =>
      [...services].sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [services],
  );

  async function toggleServicePause(service: DummyService) {
    const currentlyPaused = (service.availability ?? (service.status === "Paused" ? "PAUSED" : "ACTIVE")) === "PAUSED";
    setPendingServiceId(service.id);
    setNotice(null);
    try {
      const updated = await updateServiceVisibility(service.id, {
        availability: currentlyPaused ? "ACTIVE" : "PAUSED",
      });
      if (updated) {
        setServices((current) => current.map((item) => (item.id === service.id ? updated : item)));
      }
      setNotice(currentlyPaused ? "Service resumed and available for discovery." : "Service paused.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update service visibility.");
    } finally {
      setPendingServiceId(null);
    }
  }

  async function toggleServiceListing(service: DummyService) {
    const enabled = service.listingEnabled !== false;
    setPendingServiceId(service.id);
    setNotice(null);
    try {
      const updated = await updateServiceVisibility(service.id, {
        listingEnabled: !enabled,
      });
      if (updated) {
        setServices((current) => current.map((item) => (item.id === service.id ? updated : item)));
      }
      setNotice(!enabled ? "Service is now visible in discovery." : "Service hidden from discovery.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update service visibility.");
    } finally {
      setPendingServiceId(null);
    }
  }

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">Published Services</p>
            <h2>{title}</h2>
            <p className="muted-copy">{description}</p>
          </div>
          <Link className="freelancer-primary-button" href="/freelancer/services?tab=add">
            Create Another Service
          </Link>
        </div>

        {notice ? <p className="muted-copy">{notice}</p> : null}

        <div className="freelancer-service-table">
          <div className="freelancer-service-table-head">
            <span>Listing</span>
            <span>Price</span>
            <span>Delivery</span>
            <span>Updated</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {isLoading ? <p className="muted-copy">Loading your published services...</p> : null}

          {!isLoading &&
            orderedServices.map((service) => (
              <article className="freelancer-service-table-row is-static" key={service.id}>
                <div className="freelancer-service-table-primary">
                  <strong>{service.title}</strong>
                  <p>{service.summary}</p>
                </div>
                <div className="freelancer-service-table-cell" data-label="Price">
                  <span>{formatMoney(service.basePrice)}</span>
                </div>
                <div className="freelancer-service-table-cell" data-label="Delivery">
                  <span>{service.deliveryTime || "Not set"}</span>
                </div>
                <div className="freelancer-service-table-cell" data-label="Updated">
                  <span>{formatUpdatedAt(service.updatedAt)}</span>
                </div>
                <div className="freelancer-service-table-cell" data-label="Status">
                  <span>{service.status}</span>
                  <small>{service.category}</small>
                </div>
                <div className="freelancer-service-table-actions">
                  <Link className="freelancer-secondary-button" href={`/freelancer/services/${service.id}/preview`}>
                    <Sparkles size={15} strokeWidth={1.8} />
                    Preview
                  </Link>
                  <Link className="freelancer-primary-button" href={`/services/${service.slug}`}>
                    <ExternalLink size={15} strokeWidth={1.8} />
                    Open Public Page
                  </Link>
                  <button
                    className="freelancer-secondary-button"
                    disabled={pendingServiceId === service.id}
                    onClick={() => void toggleServicePause(service)}
                    type="button"
                  >
                    {(service.availability ?? (service.status === "Paused" ? "PAUSED" : "ACTIVE")) === "PAUSED" ? "Resume" : "Pause"}
                  </button>
                  <button
                    className="freelancer-secondary-button"
                    disabled={pendingServiceId === service.id}
                    onClick={() => void toggleServiceListing(service)}
                    type="button"
                  >
                    {service.listingEnabled === false ? "Turn On" : "Turn Off"}
                  </button>
                </div>
              </article>
            ))}

          {!isLoading && !orderedServices.length ? (
            <article className="freelancer-service-empty">
              <div>
                <span className="meta-pill">Nothing published yet</span>
                <h3>Your live services will appear here</h3>
                <p>Publish a draft from Add Service and it will move into this published list automatically.</p>
              </div>
              <Link className="freelancer-primary-button" href="/freelancer/services?tab=drafts">
                Open Draft Services
              </Link>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
