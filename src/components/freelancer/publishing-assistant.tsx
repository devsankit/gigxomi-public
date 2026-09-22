"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  LoaderCircle,
  Mic,
  Play,
  Save,
  Send,
  Sparkles,
  TimerReset,
} from "lucide-react";

import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";
import type { PortfolioDraft } from "@/lib/gigxomi/delivery-portfolio-types";
import type { PublishingDraftRecord, PublishingFieldKey, PublishingMode } from "@/lib/publishing/types";

type SuggestionPayload = {
  assistantMessage: string;
  fieldSuggestions: string[];
  marketHints: string[];
  missingFields: PublishingFieldKey[];
  currentStep: PublishingFieldKey | null;
  nextStep: PublishingFieldKey | null;
  validation: { ok: boolean; message: string } | null;
};

type PublishingAssistantProps = {
  mode: PublishingMode;
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeKeywordSeed(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildComposerSuggestionChips(
  input: string,
  record: PublishingDraftRecord | null,
  suggestion: SuggestionPayload | null,
  currentStep: PublishingFieldKey | null,
) {
  const draft = record?.payload.service;
  const seed =
    normalizeKeywordSeed(input) ||
    normalizeKeywordSeed(draft?.title ?? "") ||
    normalizeKeywordSeed(draft?.specialty ?? "") ||
    normalizeKeywordSeed(draft?.category ?? "video editing");

  const audience = normalizeKeywordSeed(draft?.targetAudience ?? "creators");
  const baseSuggestions =
    currentStep === "title" || currentStep === "seoTitle"
      ? [
          `${titleCase(seed || "video editing")} for ${audience || "creators"}`,
          `Premium ${seed || "video editing"} service for ${audience || "brands"}`,
          `${titleCase(seed || "video editing")} with fast delivery`,
        ]
      : currentStep === "summary" || currentStep === "seoDescription"
        ? [
            `Premium ${seed || "video editing"} for ${audience || "creators"} with clear turnaround.`,
            `Fast, conversion-focused ${seed || "video editing"} for brands and agencies.`,
            `Reliable ${seed || "video editing"} built for creators who need consistent output.`,
          ]
        : currentStep === "tags" || currentStep === "seoKeywords"
          ? [
              `${seed || "video editing"}`,
              `${seed || "video editing"} service`,
              `${seed || "video editing"} for ${audience || "creators"}`,
            ]
          : currentStep === "basePrice"
            ? ["INR 1500", "INR 2500", "INR 4500"]
            : currentStep === "deliveryTime"
              ? ["1 Day", "2 Days", "3 Days"]
              : currentStep === "sampleVideoUrl"
                ? ["Paste a YouTube watch link", "Paste an Instagram reel URL", "Paste a Vimeo video URL"]
                : [];

  return Array.from(new Set([...(suggestion?.fieldSuggestions ?? []), ...baseSuggestions].map((item) => item.trim()).filter(Boolean))).slice(0, 6);
}

function buildLiveTypingPreview(input: string, currentStep: PublishingFieldKey | null) {
  const value = input.trim();
  if (!value) {
    return null;
  }

  const step = currentStep ?? "title";
  const labels: Record<string, string> = {
    title: "Live title typing",
    sampleVideoUrl: "Live video URL typing",
    summary: "Live summary typing",
    category: "Live category typing",
    specialty: "Live specialty typing",
    targetAudience: "Live audience typing",
    basePrice: "Live price typing",
    deliveryTime: "Live delivery typing",
    tags: "Live keyword typing",
    seoTitle: "Live SEO title typing",
    seoDescription: "Live SEO summary typing",
    seoKeywords: "Live SEO keyword typing",
  };

  return {
    label: labels[step] ?? "Live typing",
    value,
  };
}

function buildPreviewService(record: PublishingDraftRecord | null, liveInput = "", currentStepOverride: PublishingFieldKey | null = null): DummyService {
  const draft = record?.payload.service;
  const liveValue = liveInput.trim();
  const currentStep = currentStepOverride ?? record?.currentStep ?? null;
  const basePrice = Number(currentStep === "basePrice" && liveValue ? liveValue.replace(/[^\d]/g, "") : draft?.basePrice || 0);
  const liveCategory =
    currentStep === "category" && liveValue ? (/design/i.test(liveValue) ? "Graphic Design" : "Video Editing") : draft?.category ?? "Video Editing";
  const liveTitle = currentStep === "title" && liveValue ? liveValue : draft?.title?.trim() || "Your service title";
  const liveSampleVideoUrl = currentStep === "sampleVideoUrl" && liveValue ? liveValue : draft?.sampleVideoUrl?.trim() || "";
  const liveSampleVideoEmbedUrl = currentStep === "sampleVideoUrl" && liveValue ? liveValue : draft?.sampleVideoEmbedUrl?.trim() || "";
  const liveSummary =
    currentStep === "summary" && liveValue ? liveValue : draft?.summary?.trim() || "A short one-line summary will appear here as you answer the questions.";
  const liveSpecialty =
    currentStep === "specialty" && liveValue ? liveValue : draft?.specialty?.trim() || (liveCategory === "Graphic Design" ? "Design" : "Short-Form edit");
  const liveAudience = currentStep === "targetAudience" && liveValue ? liveValue : draft?.targetAudience?.trim() || "Creators, brands, coaches, and agencies";
  const liveDelivery = currentStep === "deliveryTime" && liveValue ? liveValue : draft?.deliveryTime?.trim() || "Add delivery";
  const liveTagsSource = currentStep === "tags" && liveValue ? liveValue : draft?.tags ?? "";

  return {
    id: record?.linkedEntityId ?? "preview-service",
    slug: "preview-service",
    ownerId: record?.ownerId ?? "preview-owner",
    ownerName: record?.ownerDisplayName?.trim() || "Your name",
    ownerAlias: record?.ownerDisplayName?.trim().toLowerCase().replace(/\s+/g, "") || "yourhandle",
    title: liveTitle,
    summary: liveSummary,
    category: liveCategory,
    specialty: liveSpecialty,
    description: draft?.description?.trim() || "Describe the result, your process, and why this service is valuable.",
    targetAudience: liveAudience,
    deliveryTime: liveDelivery,
    revisions: draft?.revisions?.trim() || "Add revisions",
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    currency: "INR",
    tags: splitCsv(liveTagsSource).length ? splitCsv(liveTagsSource) : ["short-form", "premium"],
    seoTitle: draft?.seoTitle?.trim() || draft?.title?.trim() || "SEO title preview",
    seoDescription: draft?.seoDescription?.trim() || draft?.summary?.trim() || "SEO description preview",
    seoKeywords: splitCsv(draft?.seoKeywords ?? "").length ? splitCsv(draft?.seoKeywords ?? "") : ["seo keyword"],
    deliverables: splitLines(draft?.deliverables ?? "").length ? splitLines(draft?.deliverables ?? "") : ["Final export", "Platform-ready version"],
    faq: [
      {
        question: "What is included in the base price?",
        answer: "Your deliverables will show here.",
      },
    ],
    media: [
      {
        id: "preview-media",
        kind: liveSampleVideoUrl ? "video" : "image",
        title: "Preview slot",
        accent: "",
        sourceUrl: liveSampleVideoUrl || undefined,
        embedUrl: liveSampleVideoEmbedUrl || undefined,
      },
    ],
    status: record?.status === "PENDING_REVIEW" ? "Pending Review" : "Draft",
    reviewNote: undefined,
    createdAt: record?.createdAt ?? new Date().toISOString(),
    updatedAt: record?.updatedAt ?? new Date().toISOString(),
  };
}

async function fetchAssistantDraft(mode: PublishingMode) {
  const response = await fetch("/api/publishing/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to create publishing draft.");
  }

  return payload.draft as PublishingDraftRecord;
}

async function fetchAssistantDraftById(draftId: string) {
  const response = await fetch(`/api/publishing/drafts/${draftId}`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Unable to open this draft.");
  }

  return payload.draft as PublishingDraftRecord;
}

async function fetchSuggestion(draftId: string) {
  const response = await fetch(`/api/publishing/drafts/${draftId}/suggest`, {
    method: "POST",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    draft?: PublishingDraftRecord;
    suggestion?: SuggestionPayload;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load publishing suggestions.");
  }

  return payload;
}

function formatFieldLabel(value: string) {
  return value.replaceAll(/([A-Z])/g, " $1").trim();
}

const SERVICE_EDITABLE_FIELDS: Array<{
  key: PublishingFieldKey;
  label: string;
  prompt: string;
  placeholder: string;
  helper: string;
}> = [
  {
    key: "title",
    label: "Edit title",
    prompt: "What title should buyers see first?",
    placeholder: "Type only the service title. Example: Short-form video editing for coaches",
    helper: "Only the title will update while this edit mode is active.",
  },
  {
    key: "sampleVideoUrl",
    label: "Edit video",
    prompt: "Paste your best public sample video URL so buyers can watch your work.",
    placeholder: "Paste only the public sample video URL.",
    helper: "Only the sample video link will update while this edit mode is active.",
  },
  {
    key: "summary",
    label: "Edit summary",
    prompt: "Give me one short buyer-facing summary line.",
    placeholder: "Type only the buyer-facing summary.",
    helper: "Only the summary will update while this edit mode is active.",
  },
  {
    key: "basePrice",
    label: "Edit price",
    prompt: "What starting price should Gigxomi show?",
    placeholder: "Type only the starting price. Example: 3500",
    helper: "Only the starting price will update while this edit mode is active.",
  },
  {
    key: "deliveryTime",
    label: "Edit delivery",
    prompt: "What delivery time should we promise?",
    placeholder: "Type only the delivery time. Example: 2 Days",
    helper: "Only the delivery time will update while this edit mode is active.",
  },
  {
    key: "tags",
    label: "Edit keywords",
    prompt: "Which tags or keywords should help buyers discover this?",
    placeholder: "Type only keywords. Example: short form, reels, coach content",
    helper: "Only the keyword tags will update while this edit mode is active.",
  },
];

function getServiceEditableField(fieldKey: PublishingFieldKey | null) {
  return SERVICE_EDITABLE_FIELDS.find((item) => item.key === fieldKey) ?? null;
}

export function PublishingAssistant({ mode }: PublishingAssistantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<PublishingDraftRecord | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionPayload | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lockedField, setLockedField] = useState<PublishingFieldKey | null>(null);
  const [isSwitchingField, setIsSwitchingField] = useState(false);
  const [linkedPortfolioDraft, setLinkedPortfolioDraft] = useState<PortfolioDraft | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const activeStep = mode === "service" ? lockedField ?? draft?.currentStep ?? null : draft?.currentStep ?? null;
  const activeServiceField = useMemo(() => getServiceEditableField(activeStep), [activeStep]);
  const servicePreview = useMemo(() => buildPreviewService(draft, input, activeStep), [activeStep, draft, input]);
  const portfolioDraft = draft?.payload.portfolio ?? null;
  const composerSuggestions = useMemo(
    () => (mode === "service" ? buildComposerSuggestionChips(input, draft, suggestion, activeStep) : suggestion?.fieldSuggestions ?? []),
    [activeStep, input, draft, mode, suggestion],
  );
  const liveTypingPreview = useMemo(() => buildLiveTypingPreview(input, activeStep), [activeStep, input]);
  const visibleMessages = useMemo(() => {
    if (draft?.rawMessages.length) {
      return draft.rawMessages;
    }

    return [
      {
        id: "seed-message",
        role: "assistant" as const,
        content:
          suggestion?.assistantMessage ??
          (mode === "service"
            ? "What are you offering first? Tell me the exact service you want to list on Gigxomi."
            : "What do you want to publish first? Start with the portfolio type or the public video URL."),
        createdAt: draft?.updatedAt ?? new Date().toISOString(),
        fieldKey: draft?.currentStep ?? undefined,
      },
    ];
  }, [draft, mode, suggestion]);

  const latestQuestion = visibleMessages.filter((message) => message.role === "assistant").at(-1)?.content ?? "";
  const visibleQuestion = (isSwitchingField && activeServiceField ? activeServiceField.prompt : latestQuestion) || activeServiceField?.prompt || "";
  const currentQuestionLabel =
    lockedField && activeServiceField ? `Editing ${activeServiceField.label.replace(/^Edit\s+/i, "").toLowerCase()}` : "Current question";
  const completionPercent = useMemo(() => {
    const total = mode === "service" ? 15 : 12;
    const missing = suggestion?.missingFields?.length ?? total;
    return Math.max(10, Math.round(((total - missing) / total) * 100));
  }, [mode, suggestion?.missingFields?.length]);
  const nextFields = useMemo(
    () => (suggestion?.missingFields ?? []).slice(0, 4).map((item) => formatFieldLabel(item)),
    [suggestion],
  );

  useEffect(() => {
    let active = true;
    const requestedDraftId = searchParams.get("draft");
    const requestedIntent = searchParams.get("intent");
    setLockedField(null);
    setIsSwitchingField(false);
    setInput("");

    async function load() {
      try {
        const nextDraft = requestedDraftId ? await fetchAssistantDraftById(requestedDraftId) : await fetchAssistantDraft(mode);
        const nextSuggestion = await fetchSuggestion(nextDraft.id);
        if (!active) {
          return;
        }

        setDraft(nextSuggestion.draft ?? nextDraft);
        setSuggestion(nextSuggestion.suggestion ?? null);
        if (requestedIntent === "publish" && mode === "service" && active) {
          setStatus("This draft is ready for a final check. Complete any missing details, then submit it for review.");
        }

        if (mode === "portfolio" && nextSuggestion.draft?.linkedEntityId) {
          const response = await fetch("/api/portfolio/drafts", { cache: "no-store" });
          const payload = await response.json().catch(() => ({}));
          if (!active) {
            return;
          }
          const linked = ((payload.drafts ?? []) as PortfolioDraft[]).find((item) => item.id === nextSuggestion.draft?.linkedEntityId) ?? null;
          setLinkedPortfolioDraft(linked);
        }
      } catch (error) {
        if (active) {
          setStatus(error instanceof Error ? error.message : "Unable to load the publishing assistant right now.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [mode, searchParams]);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [visibleMessages.length]);

  async function ensureDraft() {
    if (draft) {
      return draft;
    }

    const createdDraft = await fetchAssistantDraft(mode);
    setDraft(createdDraft);
    const nextSuggestion = await fetchSuggestion(createdDraft.id).catch(() => null);
    if (nextSuggestion?.draft) {
      setDraft(nextSuggestion.draft);
    }
    if (nextSuggestion?.suggestion) {
      setSuggestion(nextSuggestion.suggestion);
    }

    return nextSuggestion?.draft ?? createdDraft;
  }

  async function patchDraft(updates: Partial<PublishingDraftRecord>, draftIdOverride?: string) {
    const draftId = draftIdOverride ?? draft?.id;
    if (!draftId) {
      return null;
    }

    const response = await fetch(`/api/publishing/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error ?? "Unable to update publishing draft.");
    }

    const nextDraft = payload.draft as PublishingDraftRecord | undefined;
    if (nextDraft) {
      setDraft(nextDraft);
    }
    return nextDraft ?? null;
  }

  async function jumpToStep(step: PublishingFieldKey, options?: { lock?: boolean }) {
    const shouldLock = Boolean(options?.lock && mode === "service");
    const previousLockedField = lockedField;
    setInput("");
    setLockedField(shouldLock ? step : null);
    setIsSwitchingField(true);
    setStatus(shouldLock ? `Switching to ${formatFieldLabel(step).toLowerCase()}...` : "Updating the edit focus...");

    try {
      const ensuredDraft = await ensureDraft();
      const nextDraft = await patchDraft({ currentStep: step }, ensuredDraft.id);
      const nextSuggestion = await fetchSuggestion((nextDraft ?? ensuredDraft).id);
      if (nextSuggestion.draft) {
        setDraft(nextSuggestion.draft);
      }
      if (nextSuggestion.suggestion) {
        setSuggestion(nextSuggestion.suggestion);
      }
      setStatus(shouldLock ? `Editing ${formatFieldLabel(step).toLowerCase()}.` : "Editing focus updated.");
    } catch (error) {
      setLockedField(previousLockedField);
      setStatus(error instanceof Error ? error.message : "Unable to update the edit focus right now.");
    } finally {
      setIsSwitchingField(false);
    }
  }

  async function resumeGuidedFlow() {
    if (!draft || mode !== "service") {
      return;
    }

    setInput("");
    setLockedField(null);
    setIsSwitchingField(true);
    setStatus("Resuming guided setup...");

    try {
      const nextDraft = await patchDraft({ currentStep: null }, draft.id);
      const nextSuggestion = await fetchSuggestion((nextDraft ?? draft).id);
      if (nextSuggestion.draft) {
        setDraft(nextSuggestion.draft);
      }
      if (nextSuggestion.suggestion) {
        setSuggestion(nextSuggestion.suggestion);
      }
      setStatus("Back to guided setup.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to resume the guided setup right now.");
    } finally {
      setIsSwitchingField(false);
    }
  }

  async function sendReply(value: string) {
    if (!value.trim() || isSwitchingField) {
      return;
    }

    setIsSending(true);
    setStatus("Autosaving your reply...");

    try {
      const ensuredDraft = await ensureDraft();
      const response = await fetch(`/api/publishing/drafts/${ensuredDraft.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: value,
          fieldKey: lockedField ?? undefined,
          lockField: Boolean(lockedField),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to save your reply right now.");
      }

      if (payload.draft) {
        setDraft(payload.draft);
      }
      if (payload.suggestion) {
        setSuggestion(payload.suggestion);
        setStatus(payload.suggestion.validation?.message ?? "Reply saved.");
      } else {
        setStatus("Reply saved.");
      }

      setInput("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save your reply right now.");
    } finally {
      setIsSending(false);
    }
  }

  async function saveServiceDraft(publishNow: boolean) {
    setIsSaving(true);

    try {
      let ensuredDraft = await ensureDraft();
      const body = ensuredDraft.payload.service;
      let linkedServiceId = ensuredDraft.linkedEntityId;

      if (linkedServiceId) {
        const ownershipCheck = await fetch(`/api/freelancer/services/${linkedServiceId}`, {
          cache: "no-store",
        });

        if (!ownershipCheck.ok) {
          linkedServiceId = null;
          const repairedDraft = await patchDraft({ linkedEntityId: null, status: "IN_PROGRESS" }, ensuredDraft.id);
          ensuredDraft = repairedDraft ?? ensuredDraft;
        }
      }

      const endpoint = linkedServiceId ? `/api/freelancer/services/${linkedServiceId}` : "/api/freelancer/services";
      const method = linkedServiceId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          basePrice: Number(body.basePrice || 0),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to save the service draft.");
      }

      const serviceId = payload.service?.id ?? ensuredDraft.linkedEntityId;
      if (serviceId) {
        await patchDraft(
          {
            linkedEntityId: serviceId,
            status: "DRAFT",
          },
          ensuredDraft.id,
        );
      }

      if (publishNow && serviceId) {
        const submitResponse = await fetch(`/api/freelancer/services/${serviceId}/submit`, { method: "POST" });
        const submitPayload = await submitResponse.json().catch(() => ({}));
        if (!submitResponse.ok) {
          throw new Error((submitPayload as { error?: string }).error ?? "Service saved, but it could not be submitted for review.");
        }
        await patchDraft({ status: "PENDING_REVIEW" }, ensuredDraft.id);
        setStatus("Service submitted for manager or admin review.");
        router.push("/freelancer/services");
        router.refresh();
      } else {
        setStatus("Service draft saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save the service draft.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePortfolioDraft() {
    if (!draft || !portfolioDraft) {
      return null;
    }

    const ensureId = async () => {
      if (draft.linkedEntityId) {
        return draft.linkedEntityId;
      }

      const create = await fetch("/api/portfolio/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workScope: portfolioDraft.workScope,
          conversationId: portfolioDraft.conversationId,
        }),
      });
      const createPayload = await create.json().catch(() => ({}));
      const createdId = createPayload.draft?.id as string | undefined;
      if (createdId) {
        await patchDraft({ linkedEntityId: createdId }, draft.id);
      }
      return createdId ?? null;
    };

    const draftId = await ensureId();
    if (!draftId) {
      return null;
    }

    const response = await fetch("/api/portfolio/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId,
        workScope: portfolioDraft.workScope,
        conversationId: portfolioDraft.conversationId,
        title: portfolioDraft.title,
        price: Number(portfolioDraft.price || 0),
        deliveryTime: portfolioDraft.deliveryTime,
        category: portfolioDraft.category,
        summary: portfolioDraft.summary,
        description: portfolioDraft.description,
        tags: splitCsv(portfolioDraft.tags),
        seoTitle: portfolioDraft.seoTitle,
        seoDescription: portfolioDraft.seoDescription,
        showcasePlacement: portfolioDraft.showcasePlacement,
        youtubeTitle: portfolioDraft.title,
        youtubeDescription: portfolioDraft.description,
        youtubePrivacy: "unlisted",
        youtubeCategoryId: "22",
        youtubeTags: splitCsv(portfolioDraft.tags),
        sourceVideoPlatform: portfolioDraft.sourcePlatform,
        sourceVideoUrl: portfolioDraft.sourceUrl,
        sourceVideoEmbedUrl: portfolioDraft.sourceEmbedUrl || null,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error ?? "Unable to save the portfolio draft.");
    }

    setLinkedPortfolioDraft(payload.draft ?? null);
    await patchDraft({ linkedEntityId: draftId, status: "DRAFT" }, draft.id);
    return draftId;
  }

  async function handlePortfolioAction() {
    if (!draft || !portfolioDraft) {
      return;
    }

    setIsSaving(true);

    try {
      if (portfolioDraft.workScope === "CLIENT_WORK" && linkedPortfolioDraft?.agencyApprovalStatus !== "APPROVED") {
        await savePortfolioDraft();
        await patchDraft({ status: "PENDING_REVIEW" }, draft.id);
        setStatus("Portfolio saved. Waiting for admin or manager approval.");
        return;
      }

      const draftId = await savePortfolioDraft();
      if (!draftId) {
        throw new Error("Unable to create the portfolio draft.");
      }

      const response = await fetch(`/api/portfolio/drafts/${draftId}/publish`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to publish the portfolio right now.");
      }

      await patchDraft({ status: "PUBLISHED" }, draft.id);
      setStatus("Portfolio published successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to publish the portfolio right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="freelancer-app-content">
      <section className="freelancer-app-panel publishing-studio-shell">
        <div className="publishing-studio-layout">
          <section className="publishing-chat-studio">
            <header className="publishing-chat-header">
              <p className="section-label">{mode === "service" ? "Service Assistant" : "Portfolio Assistant"}</p>
              <h2>{mode === "service" ? "Build your service in chat" : "Build your portfolio in chat"}</h2>
              <p>
                {mode === "service"
                  ? "Answer one question at a time. Every reply autosaves and the public card updates beside you."
                  : "Answer one question at a time. Gigxomi validates the video link, saves your draft, and updates the preview live."}
              </p>
            </header>

            <div className="publishing-chat-scroll" ref={chatScrollRef}>
              {isLoading ? (
                <div className="publishing-thread-loading">
                  <LoaderCircle className="publishing-assistant-spinner" size={18} strokeWidth={1.8} />
                  <span>Loading your assistant...</span>
                </div>
              ) : (
                <>
                  {visibleMessages.map((message) => (
                    <article className={message.role === "assistant" ? "publishing-chat-bubble assistant" : "publishing-chat-bubble freelancer"} key={message.id}>
                      <span className="publishing-bubble-label">{message.role === "assistant" ? "Gigxomi" : "You"}</span>
                      <p>{message.content}</p>
                    </article>
                  ))}

                  {suggestion?.fieldSuggestions?.length ? (
                    <div className="publishing-chat-suggestions">
                      {suggestion.fieldSuggestions.map((item) => (
                        <button
                          className="publishing-suggestion-chip"
                          disabled={isSending || isSwitchingField}
                          key={item}
                          onClick={() => void sendReply(item)}
                          type="button"
                        >
                          <Sparkles size={14} strokeWidth={1.8} />
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="publishing-chat-footer">
              <div className="publishing-current-question">
                <div className="publishing-current-question-top">
                  <span className="meta-pill">{currentQuestionLabel}</span>
                  {lockedField && activeServiceField ? (
                    <button className="publishing-inline-edit publishing-resume-button" disabled={isSwitchingField} onClick={() => void resumeGuidedFlow()} type="button">
                      Resume setup
                    </button>
                  ) : null}
                </div>
                <p>{visibleQuestion}</p>
                {lockedField && activeServiceField ? <span className="publishing-field-helper">{activeServiceField.helper}</span> : null}
              </div>

              <div className="composer-surface compact publishing-composer-surface">
                <div className="composer-input-card publishing-composer-card">
                  <textarea
                    className="composer-textarea publishing-home-textarea"
                    disabled={isSwitchingField}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || isSwitchingField || isSending) {
                        return;
                      }

                      event.preventDefault();
                      void sendReply(input);
                    }}
                    placeholder={
                      mode === "service"
                        ? activeServiceField?.placeholder ?? "Reply here. Example: Premium short-form video editing for coaches and agencies."
                        : "Reply here or paste the public video URL."
                    }
                    value={input}
                  />
                  <div className="composer-controls">
                    <button className="composer-icon-button" disabled type="button">
                      <Mic size={16} strokeWidth={1.8} />
                    </button>
                    <button
                      className="composer-submit composer-search-pill-compact"
                      disabled={isSending || isSwitchingField || !input.trim()}
                      onClick={() => void sendReply(input)}
                      type="button"
                    >
                      <ArrowRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>

              {composerSuggestions.length ? (
                <div className="publishing-seo-suggestions">
                  <div className="publishing-seo-copy">
                    <span className="publishing-seo-label">
                      {lockedField && activeServiceField ? `Suggestions for ${activeServiceField.label.replace(/^Edit\s+/i, "").toLowerCase()}` : "Suggestions"}
                    </span>
                    <p>
                      {mode === "service" && activeServiceField
                        ? activeServiceField.helper
                        : "AI reads your draft and chat context, then gives short answer options you can click into the chat bar."}
                    </p>
                  </div>
                  <div className="publishing-seo-chip-row">
                    {composerSuggestions.map((item) => (
                      <button
                        className="publishing-suggestion-chip publishing-suggestion-chip-seo"
                        disabled={isSwitchingField}
                        key={item}
                        onClick={() => setInput(item)}
                        type="button"
                      >
                        <Sparkles size={14} strokeWidth={1.8} />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="publishing-composer-hint">
                {mode === "service"
                  ? lockedField && activeServiceField
                    ? `${activeServiceField.helper} Press Enter to send.`
                    : "Press Enter to send. Shift + Enter adds a new line."
                  : "Paste the direct public video URL, not a Canva editor link or Google Drive folder."}
              </p>
              {status ? <p className="publishing-status-line">{status}</p> : null}
            </div>
          </section>

          <aside className="publishing-preview-side">
            <div className="publishing-preview-header">
              <p className="section-label">Public Preview</p>
              <h2>{mode === "service" ? "This is the card you are building" : "This is the portfolio card you are building"}</h2>
            </div>

            {mode === "service" ? (
              <>
                <article className="marketplace-discovery-card publishing-preview-card">
                  <div className="marketplace-discovery-media marketplace-discovery-media-portrait publishing-preview-media">
                    {servicePreview.media[0]?.kind === "video" && (servicePreview.media[0]?.embedUrl || servicePreview.media[0]?.sourceUrl) ? (
                      <iframe
                        className="publishing-preview-video-frame"
                        src={servicePreview.media[0]?.embedUrl || servicePreview.media[0]?.sourceUrl}
                        title={servicePreview.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : null}
                    <div className="marketplace-discovery-overlay">
                      <div className="service-signal-row">
                        <span className="meta-pill">{servicePreview.category === "Graphic Design" ? "Design" : servicePreview.category}</span>
                        <span className="meta-pill">{servicePreview.basePrice >= 4000 ? "Premium" : "Starter"}</span>
                      </div>
                      {liveTypingPreview ? (
                        <div className="publishing-preview-live-typing">
                          <span>{liveTypingPreview.label}</span>
                          <strong>{liveTypingPreview.value}</strong>
                        </div>
                      ) : (
                        <div className="publishing-preview-live-typing is-placeholder">
                          <span>Live preview</span>
                          <strong>Your typed answer appears here before you send it.</strong>
                        </div>
                      )}
                      {servicePreview.media[0]?.sourceUrl ? (
                        <a
                          className="marketplace-discovery-watch publishing-preview-watch-link"
                          href={servicePreview.media[0]?.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="marketplace-discovery-watch-icon">
                            <Play fill="currentColor" size={14} strokeWidth={1.8} />
                          </span>
                          Open video
                        </a>
                      ) : (
                        <button className="marketplace-discovery-watch" disabled type="button">
                          <span className="marketplace-discovery-watch-icon">
                            <Play fill="currentColor" size={14} strokeWidth={1.8} />
                          </span>
                          Add sample video
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="marketplace-discovery-body">
                    <div className="marketplace-discovery-head">
                      <span className="marketplace-discovery-kicker">{servicePreview.specialty}</span>
                      <h3>{servicePreview.title}</h3>
                      <div className="publishing-preview-edit-row">
                        <button
                          className={`publishing-inline-edit${lockedField === "title" ? " is-active" : ""}`}
                          disabled={isSwitchingField}
                          onClick={() => void jumpToStep("title", { lock: true })}
                          type="button"
                        >
                          Edit title
                        </button>
                        <button
                          className={`publishing-inline-edit${lockedField === "summary" ? " is-active" : ""}`}
                          disabled={isSwitchingField}
                          onClick={() => void jumpToStep("summary", { lock: true })}
                          type="button"
                        >
                          Edit summary
                        </button>
                        <button
                          className={`publishing-inline-edit${lockedField === "sampleVideoUrl" ? " is-active" : ""}`}
                          disabled={isSwitchingField}
                          onClick={() => void jumpToStep("sampleVideoUrl", { lock: true })}
                          type="button"
                        >
                          Edit video
                        </button>
                      </div>
                      <p className="marketplace-discovery-owner">{servicePreview.ownerName.toLowerCase()}</p>
                      <p className="marketplace-discovery-owner-meta">@{servicePreview.ownerAlias.replace(/\s+/g, "")}</p>
                      <p className="publishing-preview-live-summary">{servicePreview.summary}</p>
                      <div className="chat-result-rating">
                        <span className="chat-result-rating-dot" />
                        <span>Ratings appear after completed projects</span>
                      </div>
                    </div>

                    <div className="marketplace-discovery-metrics">
                      <div>
                        <span>
                          <BadgeIndianRupee size={13} strokeWidth={1.8} />
                          Starting at
                        </span>
                        <strong>{servicePreview.basePrice > 0 ? `INR ${servicePreview.basePrice.toLocaleString("en-IN")}` : "Add price"}</strong>
                        <button
                          className={`publishing-metric-edit${lockedField === "basePrice" ? " is-active" : ""}`}
                          disabled={isSwitchingField}
                          onClick={() => void jumpToStep("basePrice", { lock: true })}
                          type="button"
                        >
                          Change price
                        </button>
                      </div>
                      <div>
                        <span>
                          <TimerReset size={13} strokeWidth={1.8} />
                          Delivery
                        </span>
                        <strong>{servicePreview.deliveryTime}</strong>
                        <button
                          className={`publishing-metric-edit${lockedField === "deliveryTime" ? " is-active" : ""}`}
                          disabled={isSwitchingField}
                          onClick={() => void jumpToStep("deliveryTime", { lock: true })}
                          type="button"
                        >
                          Change delivery
                        </button>
                      </div>
                    </div>

                    <div className="marketplace-discovery-actions">
                      <button className="primary-button" disabled type="button">
                        Connect on WhatsApp
                      </button>
                      <button className="ghost-button" disabled type="button">
                        View Service
                      </button>
                    </div>
                  </div>
                </article>

                <div className="publishing-preview-todo">
                  <div className="publishing-preview-edit-shortcuts">
                    {SERVICE_EDITABLE_FIELDS.map((item) => (
                      <button
                        className={`publishing-suggestion-chip publishing-suggestion-chip-seo${lockedField === item.key ? " is-active" : ""}`}
                        disabled={isSwitchingField}
                        key={item.label}
                        onClick={() => void jumpToStep(item.key, { lock: true })}
                        type="button"
                      >
                        <Sparkles size={14} strokeWidth={1.8} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="publishing-preview-progress-row">
                    <span>Listing completion</span>
                    <strong>{completionPercent}%</strong>
                  </div>
                  <div className="publishing-preview-progress-track" aria-hidden="true">
                    <span style={{ width: `${completionPercent}%` }} />
                  </div>
                  <div className="publishing-preview-checklist">
                    {nextFields.length ? (
                      nextFields.map((item) => (
                        <div className="publishing-preview-check" key={item}>
                          <CheckCircle2 size={15} strokeWidth={1.8} />
                          <span>Add {item.toLowerCase()} to make this card feel ready for buyers.</span>
                        </div>
                      ))
                    ) : (
                      <div className="publishing-preview-check">
                        <CheckCircle2 size={15} strokeWidth={1.8} />
                        <span>This card looks complete. Save it as a draft or submit it for review.</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <article className="publishing-portfolio-card">
                <div className="status-row">
                  <span className="meta-pill">{portfolioDraft?.workScope.replaceAll("_", " ") ?? "SELF SAMPLE"}</span>
                  <span className="meta-pill">{portfolioDraft?.sourcePlatform ?? "UNKNOWN"}</span>
                </div>
                <h3>{portfolioDraft?.title || "Your portfolio title"}</h3>
                <p>{portfolioDraft?.summary || "Your portfolio summary will appear here."}</p>
                <p>
                  <strong>Price:</strong> {portfolioDraft?.price ? `INR ${Number(portfolioDraft.price).toLocaleString("en-IN")}` : "Add price"}
                </p>
                <p>
                  <strong>Delivery:</strong> {portfolioDraft?.deliveryTime || "Add delivery time"}
                </p>
                <p>
                  <strong>Source:</strong> {portfolioDraft?.sourceUrl || "Add public video URL"}
                </p>
                {linkedPortfolioDraft?.agencyApprovalStatus ? (
                  <p>
                    <strong>Approval:</strong> {linkedPortfolioDraft.agencyApprovalStatus}
                  </p>
                ) : null}
              </article>
            )}

            <div className="publishing-action-row">
              {mode === "service" ? (
                <>
                  <button className="freelancer-secondary-button" disabled={isSaving} onClick={() => void saveServiceDraft(false)} type="button">
                    <Save size={15} strokeWidth={1.8} />
                    Save Draft
                  </button>
                  <button className="freelancer-primary-button" disabled={isSaving} onClick={() => void saveServiceDraft(true)} type="button">
                    <Send size={15} strokeWidth={1.8} />
                    Submit for Review
                  </button>
                </>
              ) : (
                <>
                  <button className="freelancer-secondary-button" disabled={isSaving || !draft} onClick={() => void savePortfolioDraft()} type="button">
                    <Save size={15} strokeWidth={1.8} />
                    Save Draft
                  </button>
                  <button className="freelancer-primary-button" disabled={isSaving || !draft} onClick={() => void handlePortfolioAction()} type="button">
                    <Send size={15} strokeWidth={1.8} />
                    {portfolioDraft?.workScope === "CLIENT_WORK" && linkedPortfolioDraft?.agencyApprovalStatus !== "APPROVED" ? "Request Approval" : "Publish Portfolio"}
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
