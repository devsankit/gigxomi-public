"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  Gauge,
  Handshake,
  GraduationCap,
  Instagram,
  KanbanSquare,
  Library,
  LayoutList,
  Link2,
  MessageSquare,
  MessageCircle,
  Mic2,
  Network,
  Plus,
  Play,
  PhoneCall,
  RefreshCw,
  Rocket,
  Tv,
  Trophy,
  Upload,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { AdminWhatsAppSetupPanel } from "@/components/admin/admin-dummy-controls";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { SuperAdminInstagramPluginCard, type InstagramPluginConnectionView, type InstagramSetupUrls } from "@/components/super-admin/super-admin-instagram-plugin-card";
import { SuperAdminWhatsAppFlowBuilder } from "@/components/super-admin/super-admin-whatsapp-flow-builder";
import { InternalAppShell } from "@/components/ui/internal-app-shell";
import { MetaLeadQualification } from "@/components/sales/meta-lead-qualification";
import type { AgencyTenant } from "@/lib/gigxomi/agency-network-data";
import type { DummyWhatsAppConnectionState } from "@/lib/gigxomi/dummy-platform-store";
import type { SalesOperatingSnapshot } from "@/lib/gigxomi/sales-operating-system-store";
import type { SalesDashboardSnapshot, SalesDealStatus, SalesLeadStage } from "@/lib/gigxomi/sales-store";
import type { SuperAdminWhatsAppFlow, SuperAdminWhatsAppFlowRun } from "@/lib/gigxomi/super-admin-whatsapp-flow-store";

const HOMEPAGE_WEBINAR_ID = "agency-growth-webinar";

type SalesTab = "queue" | "crm" | "calls" | "conversations" | "whatsapp-api" | "instagram-inbox" | "chatbot-builder" | "deals" | "webinars" | "gapp" | "lms" | "practice" | "learning" | "referrals" | "scoreboard" | "team" | "earnings" | "payouts" | "messages" | "profile";
type CrmView = "kanban" | "list";
type SalesDrawer = "lead-create" | "lead-import" | "deal-create" | null;

type SalesOperationsPayload = {
  tenantId: string;
  whatsAppConnection: DummyWhatsAppConnectionState | null;
  whatsAppTenantOptions: Array<{ id: string; name: string; phoneNumber: string }>;
  instagramConnection: InstagramPluginConnectionView;
  instagramSetupUrls: InstagramSetupUrls;
  chatbotFlows: SuperAdminWhatsAppFlow[];
  chatbotRuns: SuperAdminWhatsAppFlowRun[];
  chatbotAgencies: AgencyTenant[];
};

type GappRegistration = {
  createdAt: string;
  currentMonthlyProjects: string;
  email: string;
  fullName: string;
  id: string;
  participantType: string;
  paymentStatus: string;
  status: string;
  whatsappNumber: string;
};

type SalesCouponCampaign = {
  id: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number | string;
  eligiblePackageIds: string[];
  expiresAt: string | null;
};

type SalesCouponCode = {
  id: string;
  code: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
};

const tabs: Array<{ id: SalesTab; label: string; icon: typeof Users }> = [
  { id: "queue", label: "Lead Queue", icon: Rocket },
  { id: "crm", label: "CRM Pipeline", icon: KanbanSquare },
  { id: "calls", label: "Call History", icon: PhoneCall },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "whatsapp-api", label: "WhatsApp API", icon: MessageCircle },
  { id: "instagram-inbox", label: "Instagram Inbox", icon: Instagram },
  { id: "chatbot-builder", label: "Chatbot Builder", icon: Bot },
  { id: "deals", label: "Deals / Orders", icon: BriefcaseBusiness },
  { id: "webinars", label: "Webinars", icon: Tv },
  { id: "gapp", label: "GAPP Webinar", icon: CalendarClock },
  { id: "lms", label: "LMS Training", icon: GraduationCap },
  { id: "practice", label: "AI Practice", icon: Mic2 },
  { id: "learning", label: "Learning Wall", icon: Library },
  { id: "referrals", label: "Referral Links", icon: Link2 },
  { id: "scoreboard", label: "Scoreboard", icon: Trophy },
  { id: "team", label: "Team / Subagents", icon: Network },
  { id: "earnings", label: "Earnings", icon: Coins },
  { id: "payouts", label: "Payouts", icon: WalletCards },
  { id: "messages", label: "Messages / Support", icon: MessageSquare },
  { id: "profile", label: "Profile", icon: UserRound },
];

const leadStages: SalesLeadStage[] = ["NEW", "ASSIGNED", "CONTACTED", "INTERESTED", "WEBINAR_INVITED", "WEBINAR_ATTENDED", "FOLLOW_UP", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST", "NOT_REACHABLE", "RECYCLED"];
const dealStatuses: SalesDealStatus[] = ["DRAFT", "PAYMENT_PENDING", "PAID", "HANDOFF", "CLOSED", "CANCELLED", "REFUNDED"];
const tabsWithoutCommandStrip = new Set<SalesTab>([
  "crm",
  "calls",
  "conversations",
  "whatsapp-api",
  "instagram-inbox",
  "chatbot-builder",
  "webinars",
  "gapp",
  "lms",
  "practice",
  "learning",
]);
const ladderPreviewSteps = ["Onboarded", "LMS", "Mock call", "Manager review", "10 leads", "Verified", "Team path"];

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function label(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "Not set";
}

const SALES_WEBINAR_TIME_ZONE = "Asia/Kolkata";

function formatWebinarDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: SALES_WEBINAR_TIME_ZONE,
  }).format(new Date(value));
}

function webinarInputParts(value: Date | string = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: SALES_WEBINAR_TIME_ZONE,
    year: "numeric",
  }).formatToParts(new Date(value));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour") === "24" ? "00" : read("hour")}:${read("minute")}`,
  };
}

type WebinarDraft = {
  date: string;
  description: string;
  id: string;
  registrationLink: string;
  time: string;
  title: string;
};

function emptyWebinarDraft(): WebinarDraft {
  return {
    date: "",
    description: "",
    id: "",
    registrationLink: "/webinar",
    time: "19:00",
    title: "Agency Growth Webinar",
  };
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

function flashWindow(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "30s flash";
  const elapsed = Math.max(0, Math.floor((Date.now() - created) / 1000));
  const left = Math.max(0, 30 - elapsed);
  return left ? `${left}s flash` : "priority flash";
}

function agentName(snapshot: SalesDashboardSnapshot, agentId: string | null | undefined) {
  if (!agentId) return "Unassigned";
  return snapshot.agents.find((agent) => agent.id === agentId)?.displayName ?? "Unassigned";
}

function stageTone(stage: SalesLeadStage) {
  if (["PAID", "HANDOFF", "CLOSED", "CLOSED_WON", "WEBINAR_ATTENDED"].includes(stage)) return "success";
  if (["LOST", "CLOSED_LOST", "NOT_REACHABLE"].includes(stage)) return "danger";
  if (["QUOTE_SENT", "PAYMENT_PENDING", "WEBINAR_INVITED", "NEGOTIATION"].includes(stage)) return "warning";
  return "neutral";
}

function audioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function CallRecordingPlayer({ callId, expectedDurationSeconds = 0, labelText = "recording" }: { callId: string; expectedDurationSeconds?: number; labelText?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(expectedDurationSeconds);
  const [playerError, setPlayerError] = useState("");

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setPlayerError("");
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        setPlayerError("Audio could not be played.");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="sales-recording-player" title={playerError || labelText}>
      <audio
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setPlaying(false);
          setPlayerError("Recording is empty or uses an unsupported audio format.");
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
        src={`/api/sales/mobile/calls/${callId}/recording`}
      />
      <button aria-label={`${playing ? "Pause" : "Play"} ${labelText}`} className="sales-recording-toggle" onClick={toggle} type="button">
        {playing ? <span aria-hidden="true" className="sales-pause-icon" /> : <Play size={14} />} {playing ? "Pause" : "Play"}
      </button>
      <input
        aria-label={`Seek ${labelText}`}
        className="sales-recording-seek"
        disabled={Boolean(playerError) || duration <= 0}
        max={Math.max(duration, 1)}
        min="0"
        onChange={(event) => {
          const nextTime = Number(event.target.value);
          if (audioRef.current) audioRef.current.currentTime = nextTime;
          setCurrentTime(nextTime);
        }}
        step="0.1"
        type="range"
        value={Math.min(currentTime, Math.max(duration, 1))}
      />
      <span className={playerError ? "sales-recording-time error" : "sales-recording-time"}>{playerError ? "Audio error" : `${audioTime(currentTime)} / ${audioTime(duration)}`}</span>
    </div>
  );
}

export function SalesDashboard({ salesOperations, snapshot: initialSnapshot }: { salesOperations: SalesOperationsPayload; snapshot: SalesDashboardSnapshot }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [operating, setOperating] = useState<SalesOperatingSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<SalesTab>("queue");
  const [crmView, setCrmView] = useState<CrmView>("list");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [drawer, setDrawer] = useState<SalesDrawer>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [gappRegistrations, setGappRegistrations] = useState<GappRegistration[]>([]);
  const [gappLoaded, setGappLoaded] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; duplicate: number; invalid: number; errors?: Array<{ row: number; reason: string }> } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSchedulingWebinar, setIsSchedulingWebinar] = useState(false);
  const [webinarDraft, setWebinarDraft] = useState<WebinarDraft>(emptyWebinarDraft);
  const [couponCampaigns, setCouponCampaigns] = useState<SalesCouponCampaign[]>([]);
  const [couponCodes, setCouponCodes] = useState<SalesCouponCode[]>([]);
  const [couponBusyId, setCouponBusyId] = useState("");
  const restoredNavigation = useRef(false);
  const currentAgent = snapshot.currentAgent;
  const myReferral = snapshot.referrals.find((referral) => referral.agentId === currentAgent?.id);
  const pageTitle = tabs.find((tab) => tab.id === activeTab)?.label ?? "Sales";

  const queueLeads = useMemo(
    () => snapshot.visibleLeadPool.filter((lead) => lead.status === "OPEN").sort((left, right) => (left.priority === "hot" ? -1 : 0) - (right.priority === "hot" ? -1 : 0)),
    [snapshot.visibleLeadPool],
  );
  const segments = useMemo(
    () => Array.from(new Set(snapshot.visibleLeads.map((lead) => lead.segment).filter(Boolean))).sort(),
    [snapshot.visibleLeads],
  );
  const filteredLeads = useMemo(
    () => snapshot.visibleLeads.filter((lead) => segmentFilter === "all" || lead.segment === segmentFilter),
    [segmentFilter, snapshot.visibleLeads],
  );
  const listLeads = useMemo(
    () => [...filteredLeads].sort((left, right) => {
      const leftCall = snapshot.mobileCalls.find((call) => call.assignmentId === left.id)?.startedAt;
      const rightCall = snapshot.mobileCalls.find((call) => call.assignmentId === right.id)?.startedAt;
      return new Date(rightCall ?? right.updatedAt).getTime() - new Date(leftCall ?? left.updatedAt).getTime();
    }),
    [filteredLeads, snapshot.mobileCalls],
  );
  const latestCallByLead = useMemo(() => {
    const calls = new Map<string, SalesDashboardSnapshot["mobileCalls"][number]>();
    for (const call of snapshot.mobileCalls) {
      if (!calls.has(call.assignmentId)) calls.set(call.assignmentId, call);
    }
    return calls;
  }, [snapshot.mobileCalls]);
  const selectedLead = selectedLeadId ? snapshot.visibleLeads.find((lead) => lead.id === selectedLeadId) ?? null : null;
  const selectedDeal = selectedDealId ? snapshot.visibleDeals.find((deal) => deal.id === selectedDealId) ?? null : null;
  const topGoal = snapshot.goals[0];
  const completedLessonIds = new Set((operating?.progress ?? []).filter((item) => item.status === "COMPLETED" && item.lessonId).map((item) => item.lessonId));
  const showCommandStrip = !tabsWithoutCommandStrip.has(activeTab);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedTab = params.get("tab") ?? window.sessionStorage.getItem("gigxomi-sales-tab");
    const savedView = params.get("view");
    const timer = window.setTimeout(() => {
      if (tabs.some((tab) => tab.id === savedTab)) setActiveTab(savedTab as SalesTab);
      if (savedView === "kanban" || savedView === "list") setCrmView(savedView);
      restoredNavigation.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!restoredNavigation.current) return;
    window.sessionStorage.setItem("gigxomi-sales-tab", activeTab);
    window.sessionStorage.setItem("gigxomi-sales-crm-view", crmView);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    if (activeTab === "crm") url.searchParams.set("view", crmView);
    else url.searchParams.delete("view");
    window.history.replaceState({}, "", url);
  }, [activeTab, crmView]);

  useEffect(() => {
    if (activeTab !== "referrals") return;
    void fetch("/api/sales/referrals", { cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => null) }))
      .then(({ response, payload }) => {
        if (!response.ok || !payload?.ok) {
          setStatus(payload?.error ?? "Unable to load sales coupons.");
          return;
        }
        setCouponCampaigns(payload.campaigns ?? []);
        setCouponCodes(payload.referrals ?? []);
      })
      .catch(() => setStatus("Unable to load sales coupons."));
  }, [activeTab]);

  async function refresh() {
    const response = await fetch("/api/sales/dashboard", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (payload?.ok) setSnapshot(payload.snapshot);
  }

  async function submitJson(url: string, body: Record<string, unknown>, success: string) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null);
    const ok = Boolean(response.ok && payload?.ok);
    setStatus(ok ? success : payload?.error ?? "Action failed.");
    await refresh();
    return ok;
  }

  async function refreshOperating() {
    const response = await fetch("/api/sales/lms/courses", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (payload?.ok) {
      const [ladder, webinars, learning, conversations] = await Promise.all([
        fetch("/api/sales/training-ladder", { cache: "no-store" }).then((item) => item.json()).catch(() => null),
        fetch("/api/sales/webinars", { cache: "no-store" }).then((item) => item.json()).catch(() => null),
        fetch("/api/sales/learning-wall", { cache: "no-store" }).then((item) => item.json()).catch(() => null),
        fetch("/api/sales/conversations", { cache: "no-store" }).then((item) => item.json()).catch(() => null),
      ]);
      setOperating((current) => ({
        courses: payload.courses ?? current?.courses ?? [],
        modules: payload.modules ?? current?.modules ?? [],
        lessons: payload.lessons ?? current?.lessons ?? [],
        progress: ladder?.progress ?? payload.progress ?? current?.progress ?? [],
        unlockRules: ladder?.unlockRules ?? current?.unlockRules ?? [],
        agentLevel: ladder?.agentLevel ?? current?.agentLevel ?? null,
        mockCalls: ladder?.mockCalls ?? current?.mockCalls ?? [],
        webinars: webinars?.webinars ?? current?.webinars ?? [],
        webinarInvites: webinars?.invites ?? current?.webinarInvites ?? [],
        learningPosts: learning?.posts ?? current?.learningPosts ?? [],
        timeline: conversations?.timeline ?? current?.timeline ?? [],
        roundRobinRules: current?.roundRobinRules ?? [],
      }));
    }
  }

  async function submitOperating(url: string, body: Record<string, unknown>, success: string) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null);
    const ok = Boolean(response.ok && payload?.ok);
    setStatus(ok ? success : payload?.error ?? "Action failed.");
    await refreshOperating();
    return ok;
  }

  async function copyText(value: string, message = "Copied.") {
    await navigator.clipboard.writeText(value);
    setStatus(message);
  }

  async function loadSalesCoupons() {
    const response = await fetch("/api/sales/referrals", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setStatus(payload?.error ?? "Unable to load sales coupons.");
      return;
    }
    setCouponCampaigns(payload.campaigns ?? []);
    setCouponCodes(payload.referrals ?? []);
  }

  async function createSalesCoupon(campaignId: string) {
    setCouponBusyId(campaignId);
    setStatus("");
    try {
      const response = await fetch("/api/sales/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setStatus(payload?.error ?? "Unable to create coupon code.");
        return;
      }
      setStatus(`Coupon ${payload.code.code} created. You can copy and share it now.`);
      await Promise.all([loadSalesCoupons(), refresh()]);
    } finally {
      setCouponBusyId("");
    }
  }

  async function loadGappRegistrations() {
    setStatus("Loading GAPP webinar registrations...");
    const response = await fetch("/api/sales/gapp-webinar-registrations", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setStatus(payload?.error ?? "Unable to load GAPP registrations.");
      return;
    }
    setGappRegistrations(payload.registrations ?? []);
    setGappLoaded(true);
    setStatus("GAPP registrations loaded.");
  }

  async function claimLead(poolItemId: string) {
    await submitJson("/api/sales/leads", { action: "claim", poolItemId }, "Lead grabbed and moved into CRM.");
    setActiveTab("crm");
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await submitJson(
      "/api/sales/leads",
      {
        customerName: String(form.get("customerName") ?? ""),
        customerPhone: String(form.get("customerPhone") ?? ""),
        customerEmail: String(form.get("customerEmail") ?? ""),
        serviceInterest: "Agency services",
        segment: "agency",
        notes: String(form.get("notes") ?? ""),
      },
      "Lead added to your CRM.",
    );
    if (ok) {
      formElement.reset();
      setDrawer(null);
    }
  }

  async function importContacts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setIsImporting(true);
    setStatus("Importing contacts...");
    try {
      const response = await fetch("/api/sales/leads/import", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setStatus(payload?.error ?? "Contact import failed.");
        return;
      }
      const result = {
        imported: Number(payload.imported ?? 0),
        skipped: Number(payload.skipped ?? 0),
        duplicate: Number(payload.duplicate ?? 0),
        invalid: Number(payload.invalid ?? 0),
        errors: payload.errors ?? [],
      };
      setImportResult(result);
      setStatus(`${result.imported} contacts imported into your CRM.`);
      formElement.reset();
      await refresh();
    } catch {
      setStatus("Contact import could not reach the server. Try again.");
    } finally {
      setIsImporting(false);
    }
  }

  async function updateLeadStage(leadId: string, stage: SalesLeadStage) {
    await submitJson("/api/sales/leads", { action: "stage", leadId, stage }, "Lead stage updated.");
  }

  async function moveLeadStage(leadId: string, stage: SalesLeadStage) {
    const previous = snapshot;
    const target = snapshot.visibleLeads.find((lead) => lead.id === leadId);
    if (!target || target.stage === stage) return;
    setSnapshot((current) => ({
      ...current,
      visibleLeads: current.visibleLeads.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    }));
    const response = await fetch("/api/sales/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stage", leadId, stage }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setSnapshot(previous);
      setStatus(payload?.error ?? "Lead stage update failed.");
      return;
    }
    setStatus("Lead stage updated.");
    await refresh();
  }

  function handleLeadDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const overStage = event.over?.data.current?.stage as SalesLeadStage | undefined;
    if (overStage) moveLeadStage(leadId, overStage).catch(() => setStatus("Lead stage update failed."));
  }

  async function updateLeadBasics(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson(
      "/api/sales/leads",
      {
        action: "update",
        leadId,
        customerName: String(form.get("customerName") ?? ""),
        customerPhone: String(form.get("customerPhone") ?? ""),
        customerEmail: String(form.get("customerEmail") ?? ""),
        serviceInterest: String(form.get("serviceInterest") ?? ""),
        segment: String(form.get("segment") ?? ""),
        priority: String(form.get("priority") ?? "normal"),
        tags: String(form.get("tags") ?? ""),
        budgetAmount: Number(form.get("budgetAmount") ?? 0),
        followUpAt: String(form.get("followUpAt") ?? ""),
        notes: String(form.get("notes") ?? ""),
      },
      "Lead CRM details saved.",
    );
  }

  async function sendLeadWhatsApp(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/sales/whatsapp",
      {
        leadId,
        message: String(form.get("message") ?? ""),
      },
      "WhatsApp message sent from the shared Gigxomi inbox.",
    );
    if (ok) event.currentTarget.reset();
  }

  async function openLeadChat(leadId: string) {
    setStatus("Opening WhatsApp chat...");
    try {
      const response = await fetch(`/api/sales/conversations/${leadId}`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload.conversationId) {
        setStatus(payload?.error ?? "Unable to open WhatsApp chat.");
        return;
      }
      setSelectedLeadId(null);
      setActiveTab("conversations");
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "conversations");
      url.searchParams.set("conversationId", String(payload.conversationId));
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
      setStatus("WhatsApp chat ready.");
    } catch {
      setStatus("WhatsApp chat could not reach the server. Try again.");
    }
  }

  async function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitJson(
      "/api/sales/deals",
      {
        assignmentId: String(form.get("assignmentId") ?? ""),
        title: String(form.get("title") ?? ""),
        packageId: String(form.get("packageId") ?? "") || null,
        agreedAmount: Number(form.get("agreedAmount") ?? 0),
        paidAmount: Number(form.get("paidAmount") ?? 0),
        status: String(form.get("status") ?? "DRAFT"),
        paymentReference: String(form.get("paymentReference") ?? ""),
        handoffNotes: String(form.get("handoffNotes") ?? ""),
      },
      "Deal saved.",
    );
    if (ok) {
      event.currentTarget.reset();
      setDrawer(null);
    }
  }

  async function addLeadNote(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitOperating(`/api/sales/conversations/${leadId}/note`, { body: String(form.get("body") ?? ""), type: String(form.get("type") ?? "NOTE") }, "Conversation note saved.");
    if (ok) event.currentTarget.reset();
  }

  async function inviteLeadToWebinar(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitOperating("/api/sales/webinars/invite", { leadId, webinarId: String(form.get("webinarId") ?? ""), notes: String(form.get("notes") ?? "") }, "Webinar invite recorded.");
    if (ok) {
      await updateLeadStage(leadId, "WEBINAR_INVITED");
      event.currentTarget.reset();
    }
  }

  async function scheduleWebinar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!webinarDraft.date || !webinarDraft.time) {
      setStatus("Choose both a webinar date and time.");
      return;
    }

    const startsAt = new Date(`${webinarDraft.date}T${webinarDraft.time}:00+05:30`);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() < Date.now() + 5 * 60 * 1000) {
      setStatus("Choose a webinar time at least 5 minutes in the future.");
      return;
    }

    setIsSchedulingWebinar(true);
    try {
      const ok = await submitOperating(
        "/api/sales/webinars",
        {
          id: webinarDraft.id || undefined,
          title: webinarDraft.title,
          description: webinarDraft.description,
          startsAt: startsAt.toISOString(),
          registrationLink: webinarDraft.registrationLink,
          isActive: true,
        },
        webinarDraft.id === HOMEPAGE_WEBINAR_ID || webinarDraft.registrationLink.trim().startsWith("/webinar")
          ? "Homepage webinar schedule updated."
          : webinarDraft.id
            ? "Webinar rescheduled."
            : "Webinar scheduled and published.",
      );
      if (ok) setWebinarDraft(emptyWebinarDraft());
    } finally {
      setIsSchedulingWebinar(false);
    }
  }

  function editWebinarSchedule(webinar: SalesOperatingSnapshot["webinars"][number]) {
    const input = webinarInputParts(webinar.startsAt);
    setWebinarDraft({
      date: input.date,
      description: webinar.description ?? "",
      id: webinar.id,
      registrationLink: webinar.registrationLink ?? "/webinar",
      time: input.time,
      title: webinar.title,
    });
    setStatus("Webinar loaded into the scheduler. Choose the new date or time and save.");
    document.getElementById("sales-webinar-scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function completeLesson(courseId: string, lessonId: string) {
    await submitOperating("/api/sales/lms/progress", { courseId, lessonId }, "Lesson marked complete.");
  }

  async function submitMockCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitOperating("/api/sales/lms/mock-call", { scenario: String(form.get("scenario") ?? ""), transcript: String(form.get("transcript") ?? "") }, "Mock call submitted for review.");
    if (ok) event.currentTarget.reset();
  }

  async function markHelpful(postId: string) {
    await submitOperating(`/api/sales/learning-wall/${postId}/helpful`, {}, "Learning post marked helpful.");
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson("/api/sales/payouts", { amount: Number(form.get("amount") ?? 0), note: String(form.get("note") ?? "") }, "Payout requested.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson("/api/sales/messages", { subject: String(form.get("subject") ?? ""), body: String(form.get("body") ?? "") }, "Message sent.");
    event.currentTarget.reset();
  }

  async function createSubagent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson(
      "/api/sales/team",
      {
        displayName: String(form.get("displayName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      "Subagent request created for approval.",
    );
    event.currentTarget.reset();
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson(
      "/api/sales/profile",
      {
        method: String(form.get("method") ?? "upi"),
        upiId: String(form.get("upiId") ?? ""),
        accountName: String(form.get("accountName") ?? ""),
        accountNumber: String(form.get("accountNumber") ?? ""),
        ifsc: String(form.get("ifsc") ?? ""),
        notes: String(form.get("notes") ?? ""),
      },
      "Payout profile saved.",
    );
  }

  const headerPills = [
    `Wallet ${money(snapshot.reports.availableBalance)}`,
    `${snapshot.reports.referralSignups} referral signups`,
    `${snapshot.reports.conversionRate}% conversion`,
  ];
  function navigateSales(section: string) {
    const nextTab = section as SalesTab;
    setActiveTab(nextTab);
    setStatus("");
    if (nextTab === "gapp" && !gappLoaded) void loadGappRegistrations();
    if (!operating && ["conversations", "webinars", "lms", "practice", "learning"].includes(nextTab)) {
      refreshOperating().catch(() => setStatus("Unable to load sales operating system data."));
    }
  }
  const salesThemeStyle = {
    "--accent": snapshot.settings.dashboardPrimaryColor,
    "--color-primary": snapshot.settings.dashboardPrimaryColor,
    "--gx-primary": snapshot.settings.dashboardPrimaryColor,
    "--color-surface": snapshot.settings.dashboardAccentColor,
    "--gx-surface": snapshot.settings.dashboardAccentColor,
    "--panel": snapshot.settings.dashboardAccentColor,
  } as CSSProperties;
  const isConversationTab = activeTab === "conversations";

  return (
    <InternalAppShell
      activeSection={activeTab}
      appLabel="Gigxomi Sales"
      contentClassName={isConversationTab ? "sales-internal-content sales-internal-content-chat internal-content-chat" : "sales-internal-content"}
      headerPills={headerPills}
      homeHref="/"
      navItems={tabs}
      onNavigate={navigateSales}
      profileMeta={currentAgent?.agentCode ?? "Sales agent"}
      profileName={currentAgent?.displayName ?? "Sales workspace"}
      showNotifications
      showTopbarLabel
      title={pageTitle}
    >
      <div className={isConversationTab ? "sales-theme-scope sales-theme-scope-chat" : "sales-theme-scope"} style={salesThemeStyle}>
      {showCommandStrip ? <section className="sales-command-strip">
        <WalletStat icon={Handshake} label="In negotiation" value={money(snapshot.reports.walletBreakdown.inNegotiation)} detail="Active pitch value" />
        <WalletStat icon={Clock3} label="Pending validation" value={money(snapshot.reports.walletBreakdown.pendingValidation)} detail="Admin proof review" />
        <WalletStat icon={WalletCards} label="Pending vesting" value={money(snapshot.reports.walletBreakdown.pendingVesting)} detail="7-day safety hold" />
        <WalletStat icon={Coins} label="Available wallet" value={money(snapshot.reports.walletBreakdown.availableForPayout)} detail={`Payout min ${money(snapshot.settings.payoutMinimum)}`} />
        <WalletStat icon={Gauge} label="Goal progress" value={topGoal ? `${topGoal.progressPercent}%` : `${snapshot.reports.conversionRate}%`} detail={topGoal?.name ?? "Conversion rate"} />
      </section> : null}

      {activeTab === "queue" ? (
        <section className="sales-page-grid">
          <Panel title="Round-robin lead queue" icon={Rocket} action={`${queueLeads.length} open`}>
            <div className="sales-lead-queue">
              {queueLeads.map((lead) => (
                <article className="sales-lead-card" key={lead.id}>
                  <div className="sales-lead-card-head">
                    <div>
                      <span className={`sales-chip ${lead.priority === "hot" ? "warning" : "neutral"}`}>{lead.priority}</span>
                      <h3>{lead.customerName}</h3>
                    </div>
                    <strong>{flashWindow(lead.createdAt)}</strong>
                  </div>
                  <p>{lead.serviceInterest || "Editor deal"}</p>
                  <div className="sales-lead-meta">
                    <span>{lead.segment || "general"}</span>
                    <span>{lead.source}</span>
                    <span>{money(lead.budgetAmount)}</span>
                  </div>
                  <div className="sales-button-row">
                    <span className="sales-muted-inline">Contact unlocks after grab</span>
                    <button className="sales-primary-button" onClick={() => claimLead(lead.id)} type="button">
                      <Plus size={15} /> Grab lead
                    </button>
                  </div>
                </article>
              ))}
              {!queueLeads.length ? <Empty text="No open queue leads right now. Your CRM and referrals stay active below." /> : null}
            </div>
          </Panel>
          <Panel title="Pinned goals and rewards" icon={Trophy}>
            {snapshot.goals.slice(0, 4).map((goal) => (
              <ProgressRow key={goal.id} label={goal.name} value={`${goal.currentValue} / ${goal.target}`} percent={goal.progressPercent} detail={goal.rewardText || label(goal.metric)} />
            ))}
            {snapshot.rewards.slice(0, 3).map((reward) => (
              <InfoRow key={reward.id} title={reward.title} meta={reward.body} right={reward.isPinned ? "Pinned" : ""} />
            ))}
            {!snapshot.goals.length && !snapshot.rewards.length ? <Empty text="No active sales goals are pinned yet." /> : null}
          </Panel>
          <Panel title="Revenue pulse" icon={BarChart3}>
            <RevenueTrend series={snapshot.reports.earningsSeries} />
          </Panel>
          <Panel title="Training ladder" icon={GraduationCap}>
            <TrainingLadderGraphic currentStep={currentAgent?.canClaimLeads ? 4 : 1} steps={ladderPreviewSteps} />
          </Panel>
          <Panel title="Live funnel" icon={BarChart3} full>
            <div className="sales-script-card">
              <strong>Primary pitch</strong>
              <span>Move editors from cheap one-off work into the Gigxomi agency system. If they do not buy today, route them into the free editor pool instead of losing the relationship.</span>
            </div>
            <FunnelGraph funnel={snapshot.reports.funnel} />
            <div className="sales-funnel-grid">
              {snapshot.reports.funnel.map((stage) => (
                <div className="sales-funnel-cell" key={stage.stage}>
                  <span>{label(stage.stage)}</span>
                  <strong>{stage.count}</strong>
                  <small>{money(stage.value)}</small>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      ) : null}

      {activeTab === "crm" ? (
        <section className="sales-crm-workspace">
            <div className="sales-toolbar sales-crm-toolbar">
              <button className={crmView === "list" ? "sales-icon-button active" : "sales-icon-button"} onClick={() => setCrmView("list")} type="button" title="List view">
                <LayoutList size={16} />
              </button>
              <button className={crmView === "kanban" ? "sales-icon-button active" : "sales-icon-button"} onClick={() => setCrmView("kanban")} type="button" title="Kanban view">
                <KanbanSquare size={16} />
              </button>
              <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
                <option value="all">All segments</option>
                {segments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
              </select>
              <button className="sales-primary-button compact" onClick={() => setDrawer("lead-create")} type="button">
                <Plus size={15} /> Add lead
              </button>
              <button className="sales-secondary-button compact" onClick={() => setDrawer("lead-import")} type="button">
                <Upload size={15} /> Import contacts
              </button>
              <span className="sales-crm-count">{filteredLeads.length} leads</span>
            </div>

          <div className="sales-crm-surface">
            {crmView === "kanban" ? (
              <DndContext onDragEnd={handleLeadDragEnd}>
                <div className="sales-kanban">
                  {leadStages.map((stage) => {
                    const stageLeads = filteredLeads.filter((lead) => lead.stage === stage);
                    return (
                      <LeadKanbanColumn calls={latestCallByLead} key={stage} leads={stageLeads} onOpen={setSelectedLeadId} snapshot={snapshot} stage={stage} />
                    );
                  })}
                </div>
              </DndContext>
            ) : (
              <div className="sales-table">
                <div className="sales-crm-list-header" aria-hidden="true">
                  <span>Lead</span>
                  <span>Latest call</span>
                  <span>Stage</span>
                  <span>Recording</span>
                </div>
                {listLeads.map((lead) => {
                  const call = latestCallByLead.get(lead.id);
                  return <article className="sales-crm-list-row" key={lead.id}>
                    <button className="sales-crm-list-main" onClick={() => setSelectedLeadId(lead.id)} type="button">
                      <strong>{lead.customerName}</strong>
                      <span>{lead.customerPhone || lead.customerEmail || "No contact"} - {lead.serviceInterest || "Agency services"}</span>
                      <small>{lead.notes || call?.note || "No phone note yet"}</small>
                    </button>
                    <div className="sales-crm-call-summary">
                      <strong>{call ? `${formatDateTime(call.startedAt)} - ${call.durationSeconds}s` : "No calls yet"}</strong>
                      <span>{call?.outcome ? label(call.outcome) : "Outcome pending"}</span>
                      <small>Follow-up {formatDate(lead.followUpAt)}</small>
                    </div>
                    <select onClick={(event) => event.stopPropagation()} onChange={(event) => updateLeadStage(lead.id, event.target.value as SalesLeadStage)} value={lead.stage}>
                      {leadStages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
                    </select>
                    {call?.recordingStatus === "UPLOADED" ? <CallRecordingPlayer callId={call.id} expectedDurationSeconds={call.durationSeconds} labelText={`${lead.customerName} recording`} /> : <span className={`sales-chip ${call?.recordingStatus === "FAILED" ? "danger" : "warning"}`}>{call ? label(call.recordingStatus) : "No recording"}</span>}
                  </article>;
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "calls" ? (
        <section className="sales-page-grid">
          <Panel title="CRM call history" icon={PhoneCall} full>
            <div className="sales-table">
              {snapshot.mobileCalls.map((call) => (
                <div className="sales-table-row sales-table-row-rich" key={call.id}>
                  <div>
                    <strong>{call.customerName}</strong>
                    <span>{call.phoneNumber} - {label(call.status)} - {call.durationSeconds}s</span>
                    <small>{formatDateTime(call.startedAt)} - {call.outcome ? label(call.outcome) : "Outcome pending"}</small>
                    <small>{call.note || "Mandatory call notes pending"}</small>
                    {call.recordingError ? <small>Recording issue: {call.recordingError}</small> : null}
                  </div>
                  <span className={`sales-chip ${call.recordingStatus === "UPLOADED" ? "success" : call.recordingStatus === "FAILED" ? "danger" : "warning"}`}>
                    {label(call.recordingStatus)}
                  </span>
                  {call.recordingStatus === "UPLOADED" ? <CallRecordingPlayer callId={call.id} expectedDurationSeconds={call.durationSeconds} labelText={`${call.customerName} recording`} /> : <span />}
                </div>
              ))}
              {!snapshot.mobileCalls.length ? <p className="muted-copy">No CRM calls have synced yet.</p> : null}
            </div>
          </Panel>
        </section>
      ) : null}

      {activeTab === "deals" ? (
        <section className="sales-page-grid">
          <Panel title="Deals / orders" icon={BriefcaseBusiness} full>
            <div className="sales-toolbar">
              <button className="sales-primary-button compact" onClick={() => setDrawer("deal-create")} type="button">
                <Plus size={15} /> Create deal
              </button>
            </div>
            <div className="sales-deal-table">
              {snapshot.visibleDeals.map((deal) => {
                const lead = snapshot.visibleLeads.find((item) => item.id === deal.assignmentId);
                return (
                  <button className="sales-table-row sales-table-row-rich sales-row-button" key={deal.id} onClick={() => setSelectedDealId(deal.id)} type="button">
                    <div>
                      <strong>{deal.title}</strong>
                      <span>{lead?.customerName ?? "Manual customer"} - {deal.packageName ?? "Manual deal"}</span>
                      <small>{agentName(snapshot, deal.agentId)} - Ref {deal.paymentReference || "not set"}</small>
                    </div>
                    <span>{label(deal.status)}</span>
                    <span>{money(deal.paidAmount || deal.agreedAmount)}</span>
                  </button>
                );
              })}
            </div>
            {!snapshot.visibleDeals.length ? <Empty text="Paid referral transactions and manual deals will appear here." /> : null}
          </Panel>
        </section>
      ) : null}

      {activeTab === "referrals" ? (
        <Panel title="Referral links and dynamic packages" icon={Link2} full>
          <div className="sales-toolbar">
            <div>
              <strong>Create customer coupon</strong>
              <p>Choose an active Super Admin campaign. Gigxomi generates a unique coupon under your Sales account.</p>
            </div>
          </div>
          <div className="sales-package-grid">
            {couponCampaigns.map((campaign) => (
              <article className="sales-package-card" key={campaign.id}>
                <div className="sales-package-card-head">
                  <div>
                    <span className="sales-chip neutral">Coupon campaign</span>
                    <h3>{campaign.name}</h3>
                    <p>{campaign.discountType === "PERCENTAGE" ? `${Number(campaign.discountValue)}% off` : `${money(Number(campaign.discountValue))} off`}{campaign.expiresAt ? ` · expires ${formatDate(campaign.expiresAt)}` : ""}</p>
                  </div>
                </div>
                <button className="sales-primary-button" disabled={couponBusyId === campaign.id} onClick={() => void createSalesCoupon(campaign.id)} type="button">
                  <Plus size={15} /> {couponBusyId === campaign.id ? "Creating…" : "Create coupon code"}
                </button>
              </article>
            ))}
          </div>
          {!couponCampaigns.length ? <Empty text="No active coupon campaign is available. Ask Super Admin to publish one first." /> : null}
          {couponCodes.length ? (
            <div className="sales-referral-strip">
              <InfoRow title="Latest coupon" meta={couponCodes[0].code} right={couponCodes[0].label || "Sales coupon"} />
              <button className="sales-secondary-button" onClick={() => copyText(couponCodes[0].code, "Coupon code copied.")} type="button">
                <Copy size={15} /> Copy coupon
              </button>
            </div>
          ) : null}
          {myReferral ? (
            <>
              <div className="sales-referral-strip">
                <InfoRow title="Agent code" meta={myReferral.code} right={`${snapshot.reports.referralViews} views`} />
                <button className="sales-secondary-button" onClick={() => copyText(myReferral.registrationUrl, "Registration referral link copied.")} type="button">
                  <Copy size={15} /> Signup link
                </button>
                <button className="sales-secondary-button" onClick={() => copyText(myReferral.pricingUrl, "Pricing referral link copied.")} type="button">
                  <Copy size={15} /> Pricing link
                </button>
              </div>
              <div className="sales-package-grid">
                {snapshot.packages.map((pkg) => {
                  const url = `${myReferral.pricingUrl}${myReferral.pricingUrl.includes("?") ? "&" : "?"}packageId=${encodeURIComponent(pkg.id)}`;
                  return (
                    <article className={pkg.isRecommended ? "sales-package-card recommended" : "sales-package-card"} key={pkg.id}>
                      <div className="sales-package-card-head">
                        <div>
                          <span className="sales-chip neutral">{pkg.audience.toLowerCase()}</span>
                          <h3>{pkg.name}</h3>
                          <p>{pkg.shortSubtitle || pkg.description || "Gigxomi package"}</p>
                        </div>
                        <strong>{pkg.priceLabel}</strong>
                      </div>
                      <div className="sales-feature-list">
                        {(pkg.featureBullets.length ? pkg.featureBullets : pkg.compareHighlights).slice(0, 6).map((feature) => (
                          <span key={feature}><CheckCircle2 size={14} /> {feature}</span>
                        ))}
                      </div>
                      <div className="sales-button-row">
                        <button className="sales-secondary-button" onClick={() => copyText(url, `${pkg.name} referral link copied.`)} type="button">
                          <Copy size={15} /> Copy package URL
                        </button>
                        <a className="sales-primary-button" href={url} target="_blank" rel="noreferrer">Open</a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty text="No active referral code is assigned to this account yet." />
          )}
        </Panel>
      ) : null}

      {activeTab === "scoreboard" ? (
        <section className="sales-page-grid">
          <Panel title="Team leaderboard" icon={Trophy}>
            {snapshot.reports.leaderboard.map((row, index) => (
              <ProgressRow key={row.agentId} label={`${index + 1}. ${row.name}`} value={`${row.score} pts`} percent={Math.min(100, Math.round(row.score / 20))} detail={`${money(row.paidRevenue)} revenue - ${row.closedDeals} deals - ${row.conversionRate}%`} />
            ))}
          </Panel>
          <Panel title="Earnings chart" icon={BarChart3}>
            <div className="sales-bar-chart">
              {(snapshot.reports.earningsSeries.length ? snapshot.reports.earningsSeries : [{ label: "Now", amount: 0 }]).map((point) => {
                const max = Math.max(...snapshot.reports.earningsSeries.map((item) => item.amount), 1);
                return (
                  <div className="sales-bar-row" key={point.label}>
                    <span>{point.label}</span>
                    <div><i style={{ width: `${Math.max(6, (point.amount / max) * 100)}%` }} /></div>
                    <strong>{money(point.amount)}</strong>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>
      ) : null}

      {activeTab === "team" ? (
        <section className="sales-page-grid">
          <Panel title="Team / hierarchy" icon={Network}>
            {snapshot.visibleAgents.map((agent) => (
              <InfoRow key={agent.id} title={agent.displayName} meta={`${agent.agentCode} - ${agent.email || agent.phone}`} right={`${label(agent.status)} - ${agent.canCreateSubAgents ? "Can add subagents" : "No subagents"}`} />
            ))}
          </Panel>
          {currentAgent?.canCreateSubAgents ? (
            <form className="sales-panel sales-form-grid" onSubmit={createSubagent}>
              <PanelTitle icon={Plus} title="Request subagent" />
              <input name="displayName" placeholder="Subagent name" required />
              <input name="email" placeholder="subagent@gigxomi.com" required type="email" />
              <input name="phone" placeholder="+91..." required />
              <input minLength={8} name="password" placeholder="Temporary password" required type="password" />
              <button className="sales-primary-button" type="submit">Create pending subagent</button>
            </form>
          ) : (
            <Panel title="Subagent permission" icon={UserRound}>
              <Empty text="Super-admin has not enabled subagent creation for this account yet." />
            </Panel>
          )}
        </section>
      ) : null}

      {activeTab === "earnings" ? (
        <Panel title="Earnings ledger" icon={Coins} full>
          {snapshot.visibleEarnings.map((earning) => (
            <InfoRow key={earning.id} title={money(earning.amount)} meta={`Deal ${earning.dealId} - ${label(earning.status)}`} right={earning.payoutId ? "In payout" : "Available"} />
          ))}
          {!snapshot.visibleEarnings.length ? <Empty text="Approved commissions from paid deals will appear here." /> : null}
        </Panel>
      ) : null}

      {activeTab === "payouts" ? (
        <section className="sales-page-grid">
          <form className="sales-panel sales-form-grid" onSubmit={requestPayout}>
            <PanelTitle icon={WalletCards} title="Request payout" />
            <p className="muted-copy">Available wallet: {money(snapshot.reports.availableBalance)}</p>
            <input defaultValue={snapshot.reports.availableBalance || ""} max={snapshot.reports.availableBalance || undefined} min={snapshot.settings.payoutMinimum} name="amount" placeholder="Amount" required type="number" />
            <textarea name="note" placeholder="Payout note" />
            <button className="sales-primary-button" disabled={!snapshot.reports.availableBalance} type="submit">Request payout</button>
          </form>
          <Panel title="Payout history" icon={BarChart3}>
            {snapshot.visiblePayouts.map((payout) => (
              <InfoRow key={payout.id} title={money(payout.amount)} meta={payout.note || formatDate(payout.requestedAt)} right={label(payout.status)} />
            ))}
          </Panel>
        </section>
      ) : null}

      {activeTab === "messages" ? (
        <section className="sales-page-grid">
          <form className="sales-panel sales-form-grid" onSubmit={sendMessage}>
            <PanelTitle icon={MessageSquare} title="Message super-admin" />
            <input name="subject" placeholder="Subject" required />
            <textarea name="body" placeholder="Message" required />
            <button className="sales-primary-button" type="submit">Send message</button>
          </form>
          <Panel title="Sales inbox" icon={MessageSquare}>
            {snapshot.messages.filter((thread) => !thread.agentId || thread.agentId === currentAgent?.id).map((thread) => (
              <InfoRow key={thread.id} title={thread.subject} meta={thread.messages.at(-1)?.body ?? "No messages"} right={label(thread.status)} />
            ))}
          </Panel>
        </section>
      ) : null}

      {activeTab === "profile" ? (
        <section className="sales-page-grid">
          <Panel title="Sales profile" icon={UserRound}>
            {currentAgent ? (
              <>
                <InfoRow title={currentAgent.displayName} meta={currentAgent.email || currentAgent.phone} right={label(currentAgent.status)} />
                <InfoRow title="Agent code" meta={currentAgent.agentCode} right={snapshot.groups.find((group) => group.id === currentAgent.groupId)?.name ?? "No group"} />
                <InfoRow title="Permissions" meta={currentAgent.canClaimLeads ? "Can claim queue leads" : "Queue disabled"} right={currentAgent.canCreateSubAgents ? "Subagents on" : "Subagents off"} />
              </>
            ) : null}
          </Panel>
          <form className="sales-panel sales-form-grid" onSubmit={saveProfile}>
            <PanelTitle icon={WalletCards} title="Payout method" />
            <select defaultValue={String(currentAgent?.payoutInfo?.method ?? "upi")} name="method">
              <option value="upi">UPI</option>
              <option value="bank">Bank transfer</option>
            </select>
            <input defaultValue={String(currentAgent?.payoutInfo?.upiId ?? "")} name="upiId" placeholder="UPI ID" />
            <input defaultValue={String(currentAgent?.payoutInfo?.accountName ?? "")} name="accountName" placeholder="Account holder name" />
            <input defaultValue={String(currentAgent?.payoutInfo?.accountNumber ?? "")} name="accountNumber" placeholder="Account number / IBAN" />
            <input defaultValue={String(currentAgent?.payoutInfo?.ifsc ?? "")} name="ifsc" placeholder="IFSC / routing code" />
            <textarea defaultValue={String(currentAgent?.payoutInfo?.notes ?? "")} name="notes" placeholder="Payout notes" />
            <button className="sales-primary-button" type="submit">Save payout method</button>
          </form>
        </section>
      ) : null}

      {drawer === "lead-create" ? (
        <SalesSideDrawer onClose={() => setDrawer(null)} title="Add CRM lead">
          <LeadForm onSubmit={createLead} />
        </SalesSideDrawer>
      ) : null}

      {drawer === "lead-import" ? (
        <SalesSideDrawer onClose={() => setDrawer(null)} title="Import contacts">
          <LeadImportForm importResult={importResult} isImporting={isImporting} onSubmit={importContacts} />
        </SalesSideDrawer>
      ) : null}

      {activeTab === "conversations" ? (
        <section className="sales-tool-workspace sales-chat-workspace">
          <ChatWorkspace
            audience="sales"
            listLabel="Sales social inbox"
            listTitle="WhatsApp and Instagram"
            mode="inbox"
            tenantId={salesOperations.tenantId}
          />
        </section>
      ) : null}

      {activeTab === "whatsapp-api" ? (
        <section className="sales-tool-workspace sales-whatsapp-setup-workspace">
          <AdminWhatsAppSetupPanel
            fallbackPhoneNumber={salesOperations.whatsAppConnection?.phoneNumber}
            initialConnection={salesOperations.whatsAppConnection}
            settingsHref={null}
            tenantId={salesOperations.tenantId}
            tenantOptions={salesOperations.whatsAppTenantOptions}
            variant="compact"
          />
        </section>
      ) : null}

      {activeTab === "instagram-inbox" ? (
        <section className="sales-tool-workspace sales-instagram-workspace">
          <SuperAdminInstagramPluginCard initialConnection={salesOperations.instagramConnection} setupUrls={salesOperations.instagramSetupUrls} variant="sales" />
        </section>
      ) : null}

      {activeTab === "chatbot-builder" ? (
        <section className="sales-tool-workspace sales-chatbot-workspace">
          <SuperAdminWhatsAppFlowBuilder
            agencies={salesOperations.chatbotAgencies}
            apiPath="/api/sales/whatsapp-flows"
            fullViewBasePath={null}
            flows={salesOperations.chatbotFlows}
            runs={salesOperations.chatbotRuns}
          />
        </section>
      ) : null}

      {activeTab === "webinars" ? (
        <section className="sales-page-grid sales-webinar-workspace">
          <form className="sales-panel sales-full-span sales-form-grid sales-crm-webinar-scheduler" id="sales-webinar-scheduler" onSubmit={scheduleWebinar}>
            <div className="sales-webinar-scheduler-head">
              <div className="sales-panel-title">
                <span><CalendarClock size={18} /></span>
                <strong>{webinarDraft.id ? "Reschedule webinar" : "Schedule a webinar"}</strong>
              </div>
              <span className="sales-webinar-timezone">IST · Asia/Kolkata</span>
            </div>
            <div className="sales-webinar-scheduler-copy">
              <strong>Pick the live date and time from the calendar.</strong>
              <span>The webinar is published to the Sales CRM immediately, ready for lead invitations and registration follow-up.</span>
            </div>
            <div className="sales-webinar-scheduler-fields">
              <label className="sales-webinar-title-field">
                Webinar title
                <input maxLength={160} onChange={(event) => setWebinarDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Agency Growth Webinar" required type="text" value={webinarDraft.title} />
              </label>
              <label>
                Date
                <input min={webinarInputParts().date} onChange={(event) => setWebinarDraft((current) => ({ ...current, date: event.target.value }))} required type="date" value={webinarDraft.date} />
              </label>
              <label>
                Time
                <input onChange={(event) => setWebinarDraft((current) => ({ ...current, time: event.target.value }))} required step={300} type="time" value={webinarDraft.time} />
              </label>
              <label className="sales-webinar-link-field">
                Registration page
                <input onChange={(event) => setWebinarDraft((current) => ({ ...current, registrationLink: event.target.value }))} placeholder="/webinar or https://..." type="text" value={webinarDraft.registrationLink} />
              </label>
              <label className="sales-webinar-description-field">
                Webinar details
                <textarea maxLength={1200} onChange={(event) => setWebinarDraft((current) => ({ ...current, description: event.target.value }))} placeholder="What will attendees learn in this session?" value={webinarDraft.description} />
              </label>
            </div>
            <div className="sales-webinar-scheduler-footer">
              <div className="sales-webinar-schedule-preview">
                <CalendarClock size={18} />
                <span>{webinarDraft.date && webinarDraft.time ? formatWebinarDateTime(new Date(`${webinarDraft.date}T${webinarDraft.time}:00+05:30`).toISOString()) : "Select a date and time to preview the schedule"}</span>
              </div>
              <div className="sales-button-row">
                {webinarDraft.id ? (
                  <button className="sales-secondary-button" onClick={() => setWebinarDraft(emptyWebinarDraft())} type="button">
                    Cancel edit
                  </button>
                ) : null}
                <button className="sales-primary-button" disabled={isSchedulingWebinar} type="submit">
                  <CalendarClock size={16} /> {isSchedulingWebinar ? "Saving schedule..." : webinarDraft.id ? "Update schedule" : "Schedule webinar"}
                </button>
              </div>
            </div>
          </form>

          <Panel title="Scheduled webinars" icon={Tv}>
            {(operating?.webinars ?? []).map((webinar) => {
              const hasPassed = new Date(webinar.startsAt).getTime() < Date.now();
              const isHomepageWebinar = webinar.id === HOMEPAGE_WEBINAR_ID;
              const canReschedule = isHomepageWebinar || webinar.hostId === currentAgent?.id;
              return (
                <div className="sales-table-row sales-webinar-row" key={webinar.id}>
                  <div>
                    <strong>{webinar.title}</strong>
                    {isHomepageWebinar ? <span className="sales-webinar-homepage-label">Homepage webinar</span> : null}
                    <span>{webinar.description ?? "Sales webinar"}</span>
                  </div>
                  <div className="sales-webinar-row-actions">
                    <span>{formatWebinarDateTime(webinar.startsAt)}</span>
                    {hasPassed ? <span className="sales-webinar-reschedule">Reschedule required</span> : null}
                    {webinar.registrationLink ? (
                      <a className="sales-small-button" href={webinar.registrationLink} rel="noreferrer" target="_blank">
                        Open registration
                      </a>
                    ) : null}
                    {canReschedule ? (
                      <button className="sales-small-button" onClick={() => editWebinarSchedule(webinar)} type="button">
                        <CalendarClock size={14} /> Reschedule
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!(operating?.webinars ?? []).length ? <Empty text="No active webinars are published yet." /> : null}
          </Panel>
          <Panel title="My webinar invites" icon={MessageSquare}>
            {(operating?.webinarInvites ?? []).map((invite) => {
              const lead = snapshot.visibleLeads.find((item) => item.id === invite.leadId);
              const webinar = operating?.webinars.find((item) => item.id === invite.webinarId);
              return <InfoRow key={invite.id} title={lead?.customerName ?? "Lead"} meta={webinar?.title ?? "Webinar"} right={label(invite.status)} />;
            })}
            {!(operating?.webinarInvites ?? []).length ? <Empty text="Invite a lead from the lead drawer to start webinar tracking." /> : null}
          </Panel>
        </section>
      ) : null}

      {activeTab === "gapp" ? (
        <section className="sales-page-grid">
          <Panel title="GAPP Webinar Registrations" icon={CalendarClock} full>
            <p>Use this list for webinar reminders, payment follow-up, remarketing, and post-webinar outreach.</p>
            <div className="sales-button-row">
              <button className="sales-secondary-button" onClick={loadGappRegistrations} type="button">
                <RefreshCw size={16} /> Refresh GAPP data
              </button>
            </div>
            <div className="sales-table-list">
              {gappRegistrations.length ? (
                gappRegistrations.map((registration) => (
                  <div className="sales-table-row" key={registration.id}>
                    <div>
                      <strong>{registration.fullName}</strong>
                      <span>{registration.email} | {registration.whatsappNumber}</span>
                      <small>{registration.participantType} | {registration.currentMonthlyProjects} projects/month</small>
                    </div>
                    <span className={`sales-chip ${registration.paymentStatus === "SUCCESS" || registration.status === "PAYMENT_SUCCESS" ? "success" : registration.paymentStatus === "PENDING" || registration.status === "PAYMENT_PENDING" ? "warning" : "neutral"}`}>
                      {registration.paymentStatus || registration.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="sales-os-empty">{gappLoaded ? "No GAPP webinar registrations yet." : "Open this tab to load GAPP registrations."}</p>
              )}
            </div>
          </Panel>
        </section>
      ) : null}

      {activeTab === "lms" ? (
        <section className="sales-page-grid">
          <Panel title="Training ladder" icon={GraduationCap}>
            <TrainingLadderGraphic
              currentStep={Math.max(1, (operating?.unlockRules ?? []).findIndex((rule) => rule.stepKey === operating?.agentLevel?.currentStep) + 1)}
              steps={(operating?.unlockRules ?? []).map((rule) => rule.title)}
            />
            {(operating?.unlockRules ?? []).map((rule) => (
              <InfoRow key={rule.id} title={rule.title} meta={rule.requirement ?? "Training step"} right={rule.stepKey === operating?.agentLevel?.currentStep ? "Current" : rule.reward ?? ""} />
            ))}
            {!operating ? <Empty text="Loading training ladder..." /> : null}
          </Panel>
          <Panel title="Course lessons" icon={Library}>
            {(operating?.courses ?? []).map((course) => (
              <div className="sales-course-block" key={course.id}>
                <strong>{course.title}</strong>
                <span>{course.description ?? "Sales course"}</span>
                {(operating?.lessons ?? []).filter((lesson) => lesson.courseId === course.id).map((lesson) => (
                  <button className="sales-table-row sales-row-button" key={lesson.id} onClick={() => completeLesson(course.id, lesson.id)} type="button">
                    <div>
                      <strong>{lesson.title}</strong>
                      <span>{lesson.description ?? lesson.content ?? "Training lesson"}</span>
                    </div>
                    <span>{completedLessonIds.has(lesson.id) ? "Complete" : "Mark done"}</span>
                  </button>
                ))}
              </div>
            ))}
            {!(operating?.courses ?? []).length ? <Empty text="No LMS course is published yet." /> : null}
          </Panel>
        </section>
      ) : null}

      {activeTab === "practice" ? (
        <section className="sales-page-grid">
          <form className="sales-panel sales-form-grid" onSubmit={submitMockCall}>
            <PanelTitle icon={Mic2} title="AI mock call practice" />
            <select name="scenario">
              <option value="cold_lead">Cold lead</option>
              <option value="price_objection">Price objection</option>
              <option value="webinar_followup">Webinar follow-up</option>
              <option value="closing_call">Closing call</option>
            </select>
            <textarea name="transcript" placeholder="Paste or write your call script / transcript for manager review" required />
            <button className="sales-primary-button" type="submit">Submit mock call</button>
          </form>
          <Panel title="Practice history" icon={Trophy}>
            {(operating?.mockCalls ?? []).map((call) => (
              <InfoRow key={call.id} title={label(call.scenario)} meta={call.feedback ?? call.transcript.slice(0, 120)} right={label(call.status)} />
            ))}
            {!(operating?.mockCalls ?? []).length ? <Empty text="No mock call attempts yet." /> : null}
          </Panel>
        </section>
      ) : null}

      {activeTab === "learning" ? (
        <Panel title="Learning wall" icon={Library} full>
          <div className="sales-learning-list">
            {(operating?.learningPosts ?? []).map((post) => (
              <article className="sales-learning-post" key={post.id}>
                <span className="sales-chip neutral">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
                <div className="sales-button-row">
                  {post.linkUrl ? <a className="sales-secondary-button compact" href={post.linkUrl} rel="noreferrer" target="_blank">Open link</a> : null}
                  <button className="sales-secondary-button compact" onClick={() => markHelpful(post.id)} type="button">Helpful</button>
                </div>
              </article>
            ))}
          </div>
          {!(operating?.learningPosts ?? []).length ? <Empty text="No learning wall posts are published yet." /> : null}
        </Panel>
      ) : null}

      {drawer === "deal-create" ? (
        <SalesSideDrawer onClose={() => setDrawer(null)} title="Create deal / order">
          <DealForm leads={snapshot.visibleLeads} onSubmit={createDeal} packages={snapshot.packages} />
        </SalesSideDrawer>
      ) : null}

      {selectedLead ? (
        <SalesSideDrawer onClose={() => setSelectedLeadId(null)} title={selectedLead.customerName}>
          <LeadDetailForm lead={selectedLead} onNote={addLeadNote} onOpenChat={openLeadChat} onSave={updateLeadBasics} onStage={updateLeadStage} onWebinarInvite={inviteLeadToWebinar} onWhatsApp={sendLeadWhatsApp} operating={operating} snapshot={snapshot} />
        </SalesSideDrawer>
      ) : null}

      {selectedDeal ? (
        <SalesSideDrawer onClose={() => setSelectedDealId(null)} title={selectedDeal.title}>
          <DealDetail deal={selectedDeal} lead={snapshot.visibleLeads.find((lead) => lead.id === selectedDeal.assignmentId)} snapshot={snapshot} />
        </SalesSideDrawer>
      ) : null}

      {status ? <p className="sales-floating-status">{status}</p> : null}
      </div>
    </InternalAppShell>
  );
}

function FunnelGraph({ funnel }: { funnel: SalesDashboardSnapshot["reports"]["funnel"] }) {
  const stages = funnel.length ? funnel : [{ stage: "NEW" as SalesLeadStage, count: 0, value: 0 }];
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="sales-funnel-visual" aria-label="Sales funnel visual">
      {stages.map((stage, index) => {
        const width = Math.max(22, Math.round((stage.count / maxCount) * 100));
        const glow = Math.max(8, Math.round((stage.value / maxValue) * 100));
        return (
          <div className="sales-funnel-step" key={stage.stage}>
            <div>
              <span>{index + 1}</span>
              <strong>{label(stage.stage)}</strong>
              <small>{stage.count} leads - {money(stage.value)}</small>
            </div>
            <i style={{ width: `${width}%`, boxShadow: `0 0 ${glow / 2}px rgba(215, 255, 47, 0.2)` }} />
          </div>
        );
      })}
    </div>
  );
}

function RevenueTrend({ series }: { series: SalesDashboardSnapshot["reports"]["earningsSeries"] }) {
  const points = series.length ? series : [{ label: "Now", amount: 0 }];
  const max = Math.max(...points.map((point) => point.amount), 1);

  return (
    <div className="sales-revenue-visual" aria-label="Revenue trend">
      <div className="sales-revenue-bars">
        {points.map((point) => (
          <div className="sales-revenue-bar" key={point.label}>
            <i style={{ height: `${Math.max(10, (point.amount / max) * 100)}%` }} />
            <span>{point.label}</span>
          </div>
        ))}
      </div>
      <div className="sales-revenue-total">
        <span>Total closed value</span>
        <strong>{money(points.reduce((sum, point) => sum + point.amount, 0))}</strong>
      </div>
    </div>
  );
}

function TrainingLadderGraphic({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  const visibleSteps = steps.length ? steps.slice(0, 7) : ladderPreviewSteps;
  const activeStep = Math.min(Math.max(currentStep, 1), visibleSteps.length);

  return (
    <div className="sales-ladder-visual" aria-label="Sales training ladder">
      {visibleSteps.map((step, index) => {
        const position = index + 1;
        const state = position < activeStep ? "done" : position === activeStep ? "active" : "locked";
        return (
          <div className={`sales-ladder-step ${state}`} key={`${step}-${position}`}>
            <span>{position}</span>
            <strong>{step}</strong>
          </div>
        );
      })}
    </div>
  );
}

function WalletStat({ detail, icon: Icon, label: title, value }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return (
    <article className="sales-wallet-card">
      <Icon size={18} />
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Panel({ action, children, full = false, icon: Icon, title }: { action?: string; children: ReactNode; full?: boolean; icon: typeof Users; title: string }) {
  return (
    <article className={full ? "sales-panel sales-full-span" : "sales-panel"}>
      <div className="sales-panel-title">
        <span><Icon size={18} /></span>
        <strong>{title}</strong>
        {action ? <em>{action}</em> : null}
      </div>
      {children}
    </article>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: typeof Users; title: string }) {
  return (
    <div className="sales-panel-title">
      <span><Icon size={18} /></span>
      <strong>{title}</strong>
    </div>
  );
}

function SalesSideDrawer({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="sales-drawer-backdrop" role="presentation">
      <aside aria-modal="true" className="sales-side-drawer" role="dialog">
        <div className="sales-drawer-head">
          <div>
            <span>Gigxomi Sales</span>
            <strong>{title}</strong>
          </div>
          <button aria-label="Close drawer" className="sales-icon-button" onClick={onClose} type="button">
            <X size={17} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function LeadForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="sales-form-grid" onSubmit={onSubmit}>
      <input name="customerName" placeholder="Customer name" required />
      <input name="customerPhone" placeholder="WhatsApp number" required />
      <input name="customerEmail" placeholder="Email" type="email" />
      <textarea name="notes" placeholder="Lead notes" />
      <button className="sales-primary-button" type="submit">Create CRM lead</button>
    </form>
  );
}

function LeadImportForm({
  importResult,
  isImporting,
  onSubmit,
}: {
  importResult: { imported: number; skipped: number; duplicate: number; invalid: number; errors?: Array<{ row: number; reason: string }> } | null;
  isImporting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="sales-form-grid" onSubmit={onSubmit}>
      <label>
        <span>Excel or CSV file</span>
        <input accept=".csv,.tsv,.xls,.xlsx" name="file" type="file" />
      </label>
      <div className="sales-import-divider"><span>or</span></div>
      <label>
        <span>Google Sheets link</span>
        <input name="googleSheetUrl" placeholder="https://docs.google.com/spreadsheets/d/..." type="url" />
      </label>
      <p className="muted-copy">Upload one file or paste a Google Sheet shared as “Anyone with the link”. Contacts are added only to your CRM and duplicates are skipped.</p>
      <p className="muted-copy">Headers: name, phone/WhatsApp, email, source, segment, service/package, budget, priority, tags, notes.</p>
      <button className="sales-primary-button" disabled={isImporting} type="submit">
        <Upload size={15} /> {isImporting ? "Importing..." : "Import contacts"}
      </button>
      {importResult ? (
        <div className="sales-import-result">
          <strong>{importResult.imported} imported</strong>
          <span>{importResult.duplicate} duplicates</span>
          <span>{importResult.skipped} skipped</span>
          <span>{importResult.invalid} invalid</span>
          {importResult.errors?.length ? <small>{importResult.errors.slice(0, 4).map((error) => `Row ${error.row}: ${error.reason}`).join(" | ")}</small> : null}
        </div>
      ) : null}
    </form>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not set";
}

function DealForm({
  leads,
  onSubmit,
  packages,
}: {
  leads: SalesDashboardSnapshot["visibleLeads"];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  packages: SalesDashboardSnapshot["packages"];
}) {
  return (
    <form className="sales-form-grid" onSubmit={onSubmit}>
      <select name="assignmentId" required>
        <option value="">Choose lead</option>
        {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.customerName}</option>)}
      </select>
      <input name="title" placeholder="Deal title" required />
      <select name="packageId">
        <option value="">Manual deal</option>
        {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
      </select>
      <div className="sales-form-two">
        <input name="agreedAmount" placeholder="Agreed amount" required type="number" />
        <input name="paidAmount" placeholder="Paid amount" type="number" />
      </div>
      <select name="status">{dealStatuses.map((statusOption) => <option key={statusOption} value={statusOption}>{label(statusOption)}</option>)}</select>
      <input name="paymentReference" placeholder="Payment reference" />
      <textarea name="handoffNotes" placeholder="Handoff notes for operations" />
      <button className="sales-primary-button" type="submit">Save deal</button>
    </form>
  );
}

function LeadKanbanColumn({
  calls,
  leads,
  onOpen,
  snapshot,
  stage,
}: {
  calls: Map<string, SalesDashboardSnapshot["mobileCalls"][number]>;
  leads: SalesDashboardSnapshot["visibleLeads"];
  onOpen: (leadId: string) => void;
  snapshot: SalesDashboardSnapshot;
  stage: SalesLeadStage;
}) {
  const { setNodeRef } = useDroppable({ id: `stage:${stage}`, data: { stage } });
  return (
    <section className="sales-kanban-column" ref={setNodeRef}>
      <header>
        <span>{label(stage)}</span>
        <strong>{leads.length}</strong>
      </header>
      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        {leads.map((lead) => <LeadCrmCard call={calls.get(lead.id)} key={lead.id} lead={lead} onOpen={onOpen} snapshot={snapshot} />)}
      </SortableContext>
      {!leads.length ? <p className="sales-kanban-empty">Drop leads here</p> : null}
    </section>
  );
}

function LeadCrmCard({
  call,
  lead,
  onOpen,
  snapshot,
}: {
  call?: SalesDashboardSnapshot["mobileCalls"][number];
  lead: SalesDashboardSnapshot["visibleLeads"][number];
  onOpen: (leadId: string) => void;
  snapshot: SalesDashboardSnapshot;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { stage: lead.stage } });
  const style = {
    opacity: isDragging ? 0.72 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <article className="sales-crm-card compact" ref={setNodeRef} style={style}>
      <button className="sales-crm-drag-handle" type="button" {...attributes} {...listeners}>Drag</button>
      <button className="sales-crm-card-main" onClick={() => onOpen(lead.id)} type="button">
        <div className="sales-crm-card-head">
          <strong>{lead.customerName}</strong>
          <span className={`sales-chip ${stageTone(lead.stage)}`}>{label(lead.stage)}</span>
        </div>
        <p>{lead.notes || call?.note || "No phone note yet"}</p>
        <small>{call ? `${formatDateTime(call.startedAt)} - ${call.durationSeconds}s - ${call.outcome ? label(call.outcome) : "Outcome pending"}` : `Follow-up ${formatDate(lead.followUpAt)}`}</small>
        <div className="sales-lead-meta">
          <span>{lead.segment || "general"}</span>
          <span>{lead.priority}</span>
          <span>{agentName(snapshot, lead.assignedAgentId)}</span>
        </div>
      </button>
      {call?.recordingStatus === "UPLOADED" ? <CallRecordingPlayer callId={call.id} expectedDurationSeconds={call.durationSeconds} labelText={`${lead.customerName} recording`} /> : null}
      {lead.customerPhone ? (
        <a className="sales-secondary-button compact" href={`https://wa.me/${cleanPhone(lead.customerPhone)}`} rel="noreferrer" target="_blank">WhatsApp</a>
      ) : null}
    </article>
  );
}

function LeadDetailForm({
  lead,
  onNote,
  onOpenChat,
  onSave,
  onStage,
  onWebinarInvite,
  onWhatsApp,
  operating,
  snapshot,
}: {
  lead: SalesDashboardSnapshot["visibleLeads"][number];
  onNote: (event: FormEvent<HTMLFormElement>, leadId: string) => void;
  onOpenChat: (leadId: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>, leadId: string) => void;
  onStage: (leadId: string, stage: SalesLeadStage) => void;
  onWebinarInvite: (event: FormEvent<HTMLFormElement>, leadId: string) => void;
  onWhatsApp: (event: FormEvent<HTMLFormElement>, leadId: string) => void;
  operating: SalesOperatingSnapshot | null;
  snapshot: SalesDashboardSnapshot;
}) {
  const leadTimeline = (operating?.timeline ?? []).filter((entry) => entry.leadId === lead.id);
  return (
    <div className="sales-drawer-stack">
      <MetaLeadQualification key={lead.id} leadId={lead.id} />
      <form className="sales-form-grid" onSubmit={(event) => onSave(event, lead.id)}>
        <input defaultValue={lead.customerName} name="customerName" placeholder="Customer name" required />
        <div className="sales-form-two">
          <input defaultValue={lead.customerPhone} name="customerPhone" placeholder="WhatsApp number" />
          <input defaultValue={lead.customerEmail} name="customerEmail" placeholder="Email" type="email" />
        </div>
        <input defaultValue={lead.serviceInterest} name="serviceInterest" placeholder="Service interest" />
        <div className="sales-form-two">
        <input defaultValue={lead.segment} name="segment" placeholder="Segment" />
        <select defaultValue={lead.priority} name="priority">
          <option value="normal">Normal</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
        </select>
        </div>
        <div className="sales-form-two">
          <input defaultValue={lead.budgetAmount || ""} name="budgetAmount" placeholder="Budget" type="number" />
          <input defaultValue={lead.followUpAt ? lead.followUpAt.slice(0, 10) : ""} name="followUpAt" type="date" />
        </div>
        <input defaultValue={lead.tags.join(", ")} name="tags" placeholder="Tags" />
        <textarea defaultValue={lead.notes} name="notes" placeholder="Notes" />
        <button className="sales-primary-button" type="submit">Save lead</button>
      </form>
      <div className="sales-panel nested">
        <PanelTitle icon={KanbanSquare} title="Stage and activity" />
        <select onChange={(event) => onStage(lead.id, event.target.value as SalesLeadStage)} value={lead.stage}>
          {leadStages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
        </select>
        <InfoRow title="Assigned agent" meta={agentName(snapshot, lead.assignedAgentId)} right={lead.priority} />
        <InfoRow title="Last contacted" meta={formatDate(lead.lastContactedAt)} right={money(lead.budgetAmount)} />
        <div className="sales-button-row">
          <button className="sales-secondary-button compact" onClick={() => onStage(lead.id, "CONTACTED")} type="button">Mark contacted</button>
          <button className="sales-secondary-button compact" onClick={() => onStage(lead.id, "FOLLOW_UP")} type="button">Mark follow-up</button>
          <button className="sales-secondary-button compact" onClick={() => onStage(lead.id, "CLOSED_WON")} type="button">Mark won</button>
          <button className="sales-secondary-button compact" onClick={() => onStage(lead.id, "CLOSED_LOST")} type="button">Mark lost</button>
        </div>
      </div>
      <form className="sales-form-grid" onSubmit={(event) => onNote(event, lead.id)}>
        <select name="type">
          <option value="NOTE">Conversation note</option>
          <option value="CALL">Call update</option>
          <option value="OBJECTION">Objection</option>
          <option value="FOLLOW_UP">Follow-up</option>
        </select>
        <textarea name="body" placeholder="Add call notes, objection, promise, or next move" required />
        <button className="sales-secondary-button" type="submit">Save timeline note</button>
      </form>
      <form className="sales-form-grid" onSubmit={(event) => onWebinarInvite(event, lead.id)}>
        <select name="webinarId" required>
          <option value="">Choose webinar</option>
          {(operating?.webinars ?? []).map((webinar) => <option key={webinar.id} value={webinar.id}>{webinar.title}</option>)}
        </select>
        <input name="notes" placeholder="Invite note" />
        <button className="sales-secondary-button" type="submit">Invite to webinar</button>
      </form>
      <div className="sales-panel nested">
        <PanelTitle icon={MessageSquare} title="Conversation timeline" />
        {leadTimeline.map((entry) => <InfoRow key={entry.id} title={label(entry.type)} meta={entry.body} right={formatDate(entry.createdAt)} />)}
        {!leadTimeline.length ? <Empty text="No conversation timeline entries yet." /> : null}
      </div>
      {lead.customerPhone ? (
        <form className="sales-form-grid" onSubmit={(event) => onWhatsApp(event, lead.id)}>
          <textarea name="message" placeholder="Message customer through shared WhatsApp inbox" required />
          <div className="sales-button-row">
            <button className="sales-primary-button" type="submit">Send WhatsApp</button>
            <button className="sales-secondary-button" onClick={() => onOpenChat(lead.id)} type="button">Open full chat</button>
            <a className="sales-secondary-button" href={`https://wa.me/${cleanPhone(lead.customerPhone)}`} rel="noreferrer" target="_blank">Open customer</a>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function DealDetail({
  deal,
  lead,
  snapshot,
}: {
  deal: SalesDashboardSnapshot["visibleDeals"][number];
  lead?: SalesDashboardSnapshot["visibleLeads"][number];
  snapshot: SalesDashboardSnapshot;
}) {
  return (
    <div className="sales-drawer-stack">
      <InfoRow title="Customer" meta={lead?.customerName ?? "Manual customer"} right={label(deal.status)} />
      <InfoRow title="Agent" meta={agentName(snapshot, deal.agentId)} right={money(deal.paidAmount || deal.agreedAmount)} />
      <InfoRow title="Package" meta={deal.packageName ?? "Manual deal"} right={formatDate(deal.closedAt)} />
      <InfoRow title="Payment reference" meta={deal.paymentReference || "Not set"} />
      <div className="sales-panel nested">
        <PanelTitle icon={BriefcaseBusiness} title="Handoff notes" />
        <p className="muted-copy">{deal.handoffNotes || "No handoff notes yet."}</p>
      </div>
      {lead?.customerPhone ? (
        <a className="sales-primary-button" href={`https://wa.me/${cleanPhone(lead.customerPhone)}`} rel="noreferrer" target="_blank">Open WhatsApp</a>
      ) : null}
    </div>
  );
}

function InfoRow({ meta, right, title }: { title: string; meta: string; right?: string }) {
  return (
    <div className="sales-table-row">
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      {right ? <span>{right}</span> : null}
    </div>
  );
}

function ProgressRow({ detail, label: title, percent, value }: { label: string; value: string; percent: number; detail: string }) {
  return (
    <div className="sales-progress-row">
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <em>{value}</em>
      <i><b style={{ width: `${Math.max(4, Math.min(percent, 100))}%` }} /></i>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="muted-copy">{text}</p>;
}
