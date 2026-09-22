"use client";

import type { ReactNode } from "react";
import { Fragment, memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import EmojiPicker, { EmojiStyle, Theme as EmojiPickerTheme, type EmojiClickData } from "emoji-picker-react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BadgeIndianRupee,
  BellRing,
  Check,
  CheckCheck,
  CircleOff,
  CircleEllipsis,
  Edit3,
  FileText,
  Filter,
  Loader2,
  MessageSquareText,
  Mic,
  Pause,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Square,
  Smile,
  Star,
  StickyNote,
  UserRound,
  X,
} from "lucide-react";

import type {
  DummyAssignableEditor,
  DummyConversationAttachment,
  DummyConversationLane,
  DummyConversationListResponse,
  DummyConversationRole,
  DummyConversationSourceChannel,
  DummyConversationView,
  DummyConversationTemplate,
  DummyLeadStatus,
  DummyLeadStatusTone,
  DummyMessageAttachmentInput,
  DummyPaymentProvider,
  DummyPaymentStatus,
} from "@/lib/gigxomi/dummy-platform-store";
import { crmStatuses } from "@/lib/gigxomi/crm-data";
import { broadcastChatWorkspaceSync, subscribeToChatWorkspaceSync } from "@/components/chat/chat-sync";
import {
  startWebPushNotifications,
  type WebPushForegroundHandler,
  type WebPushRegistrationStatus,
} from "@/lib/web-push/client-registration";
import {
  isAutomatedAssignmentOutcomeMessageBody,
  isConversationMessageIncomingForAudience,
  normalizeAutomatedChatMessageBody,
} from "@/lib/gigxomi/chat-message-normalization";

import styles from "./chat-workspace.module.css";

type ChatWorkspaceProps = {
  audience: DummyConversationRole;
  listLabel: string;
  listTitle?: string;
  mode?: "classic" | "inbox";
  customerId?: string;
  serviceIdFilter?: string;
  tenantId?: string;
};

type PendingUploadTarget = "local";
type PendingAttachment = DummyMessageAttachmentInput;
type QuickFilter = "all" | "unread" | "mine" | "waiting";
type AssignedFilter = "all" | "assigned" | "unassigned";
type AgencyFilter = "all" | string;
type ChannelFilter = "all" | "whatsapp" | "instagram";
type ChatNotificationSetupStatus = "idle" | "ready" | "working" | "blocked" | "unsupported" | "missing-config" | "error";
type MicPermissionState = "unknown" | "granted" | "denied" | "prompt" | "unsupported";
type MicErrorInfo = { name: string; message: string };
type MicDiagnostics = {
  origin: string;
  isSecureContext: boolean;
  inIframe: boolean;
  permissionQuery: "granted" | "denied" | "prompt" | "unknown";
  audioInputCount: number | null;
  permissionsPolicyAllowsMicrophone: boolean | null;
  enumerateDevicesError?: string;
};
type Mp3EncoderInstance = {
  encodeBuffer: (left: Int16Array, right?: Int16Array) => Int8Array;
  flush: () => Int8Array;
};
type Mp3EncoderConstructor = new (channels: number, samplerate: number, kbps: number) => Mp3EncoderInstance;

let cachedMp3EncoderConstructor: Mp3EncoderConstructor | null = null;
let mp3EncoderImportPromise: Promise<Mp3EncoderConstructor> | null = null;

type CachedChatData = {
  conversations: DummyConversationView[];
  assignableEditors: DummyAssignableEditor[];
  leadStatuses: DummyLeadStatus[];
  templates: DummyConversationTemplate[];
  timestamp: number;
};

const chatModuleCache = new Map<string, CachedChatData>();

function getChatCacheKey(audience: string, tenantId?: string, customerId?: string, serviceId?: string) {
  return `${audience}:${tenantId || "default"}:${customerId || ""}:${serviceId || ""}`;
}

const TONE_OPTIONS: Array<{ value: DummyLeadStatusTone; label: string }> = [
  { value: "neutral", label: "Neutral" },
  { value: "accent", label: "Accent" },
  { value: "warning", label: "Warning" },
  { value: "success", label: "Success" },
];

const EDITOR_PLAN_LABELS: Record<string, string> = {
  "editor-testingfreelancer": "Standard",
  "editor-nagouri": "Subscription Monthly",
  "editor-jayanta": "Subscription Quarterly",
  "editor-vaseek": "Subscription Yearly",
};

const MAX_CHAT_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const CHAT_MEDIA_ACCEPT = "image/*,video/*";
const CHAT_DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.rar,.7z,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/rtf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function getConversationDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatConversationDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Conversation";

  const today = new Date();
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDifference = Math.round((currentDay.getTime() - messageDay.getTime()) / 86_400_000);

  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatAudioTimestamp(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function normalizeDisplayText(value: string) {
  return value
    .replaceAll("â€¢", "•")
    .replaceAll("â‚¹", "₹")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("â€˜", "'")
    .replaceAll("â€™", "'")
    .replaceAll("â€œ", "\"")
    .replaceAll("â€\u009d", "\"");
}

function formatPresenceAgoLabel(lastActiveMs: number, nowMs: number) {
  if (!Number.isFinite(lastActiveMs) || lastActiveMs <= 0) {
    return "just now";
  }

  const elapsedMs = Math.max(0, nowMs - lastActiveMs);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  if (elapsedMinutes < 1) {
    return "just now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return elapsedDays === 1 ? "yesterday" : `${elapsedDays} days ago`;
}

function formatPaymentGatewayLabel(gateway?: DummyPaymentProvider) {
  if (!gateway) {
    return "";
  }
  if (gateway === "payu") return "PayU";
  if (gateway === "razorpay") return "Razorpay";
  if (gateway === "zaakpay") return "Zaakpay";
  if (gateway === "phonepe") return "PhonePe";
  return gateway;
}

const AUDIO_MIME_PREFERENCES = ["audio/mpeg", "audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg"] as const;
const CHAT_VISIBLE_SYNC_INTERVAL_MS = 2500;
const CHAT_SYNC_BURST_DELAYS_MS = [800, 2000, 4500] as const;
const CHAT_TYPING_STOP_DEBOUNCE_MS = 2400;
const CHAT_TYPING_FRESH_WINDOW_MS = 15000;
const CHAT_ONLINE_WINDOW_MS = 120000;
const CHAT_PRESENCE_TICK_MS = 30000;
const WHATSAPP_TYPING_HEARTBEAT_MS = 9000;
const CHAT_NOTIFICATION_SOUND_URL = "/sounds/chat-notification.mp3";
const CHAT_FOREGROUND_PUSH_DEDUPE_MS = 8000;
const CHAT_PROFILE_PICTURE_VISIBLE_LIMIT = 18;
const CHAT_PROFILE_PICTURE_BATCH_SIZE = 6;
const CHAT_PROFILE_PICTURE_BATCH_DELAY_MS = 120;

function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  for (const mimeType of AUDIO_MIME_PREFERENCES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "";
}

function toInt16(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, input[index]));
    output[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

function extractErrorInfo(error: unknown): MicErrorInfo {
  if (!error) {
    return { name: "", message: "" };
  }
  if (typeof error === "string") {
    return { name: "", message: error };
  }
  if (typeof error === "object") {
    const maybeName = (error as { name?: unknown }).name;
    const maybeMessage = (error as { message?: unknown }).message;
    return {
      name: typeof maybeName === "string" ? maybeName : "",
      message: typeof maybeMessage === "string" ? maybeMessage : "",
    };
  }
  return { name: "", message: "" };
}

async function getMp3EncoderConstructor(): Promise<Mp3EncoderConstructor> {
  if (cachedMp3EncoderConstructor) {
    return cachedMp3EncoderConstructor;
  }
  if (mp3EncoderImportPromise) {
    return mp3EncoderImportPromise;
  }

  mp3EncoderImportPromise = import("lamejs/lame.all.js")
    .then((module) => {
      const resolved = (module as unknown as { default?: unknown }).default ?? module;
      const ctor = (resolved as { Mp3Encoder?: unknown } | null | undefined)?.Mp3Encoder;
      if (typeof ctor !== "function") {
        throw new Error("Mp3Encoder is not available.");
      }
      cachedMp3EncoderConstructor = ctor as Mp3EncoderConstructor;
      return cachedMp3EncoderConstructor;
    })
    .finally(() => {
      mp3EncoderImportPromise = null;
    });

  return mp3EncoderImportPromise;
}

async function resolveAudioDuration(blob: Blob) {
  if (typeof Audio === "undefined") {
    return null;
  }
  return new Promise<number | null>((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    let settled = false;
    const cleanup = (value: number | null) => {
      if (settled) {
        return;
      }
      settled = true;
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
      cleanup(duration);
    };
    audio.onerror = () => cleanup(null);
    audio.src = url;
    audio.load();
  });
}

async function convertToMp3(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const AudioContextImpl = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextImpl) {
    throw new Error("AudioContext is not available.");
  }
  const Mp3Encoder = await getMp3EncoderConstructor();
  const audioContext = new AudioContextImpl();
  try {
    await audioContext.resume();
  } catch {
    // Resume best-effort to avoid decode failures in suspended contexts.
  }
  const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
  const encoder = new Mp3Encoder(1, audioBuffer.sampleRate, 128);
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = 1152;
  const chunks: Uint8Array[] = [];

  for (let index = 0; index < channelData.length; index += blockSize) {
    const chunk = channelData.subarray(index, index + blockSize);
    const mp3buf = encoder.encodeBuffer(toInt16(chunk));
    if (mp3buf.length) {
      chunks.push(new Uint8Array(mp3buf));
    }
  }

  const end = encoder.flush();
  if (end.length) {
    chunks.push(new Uint8Array(end));
  }

  await audioContext.close();
  return {
    blob: new Blob(chunks as unknown as BlobPart[], { type: "audio/mpeg" }),
    duration: audioBuffer.duration,
  };
}

function VoiceNotePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSeekSecondsRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0;
  const current = Number.isFinite(currentSeconds) && currentSeconds > 0 ? currentSeconds : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoadedMetadata = () => {
      setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentSeconds(audio.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSeeking]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        // Ignore autoplay blocks; user can retry.
      }
      return;
    }

    audio.pause();
  };

  const handleSeekPreview = (nextValue: number) => {
    pendingSeekSecondsRef.current = nextValue;
    setIsSeeking(true);
    setCurrentSeconds(nextValue);
  };

  const commitSeek = () => {
    const audio = audioRef.current;
    if (!audio) {
      setIsSeeking(false);
      return;
    }
    const nextTime = pendingSeekSecondsRef.current;
    audio.currentTime = Math.max(0, Math.min(nextTime, duration || nextTime));
    setCurrentSeconds(audio.currentTime);
    setIsSeeking(false);
  };

  const sliderMax = duration || 1;
  const sliderValue = duration ? Math.min(current, duration) : current;

  return (
    <div className="chat-voice-note-player">
      <button
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        className="chat-voice-note-play"
        onClick={() => handleTogglePlay().catch(() => undefined)}
        type="button"
      >
        {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
      </button>
      <input
        aria-label="Voice note progress"
        className="chat-voice-note-progress"
        disabled={!duration}
        max={sliderMax}
        min={0}
        onChange={(event) => handleSeekPreview(Number(event.target.value))}
        onKeyUp={() => commitSeek()}
        onMouseUp={() => commitSeek()}
        onTouchEnd={() => commitSeek()}
        step={0.01}
        type="range"
        value={sliderValue}
      />
      <span className="chat-voice-note-time">{formatAudioTimestamp(current)} / {formatAudioTimestamp(duration)}</span>
      <audio preload="metadata" ref={audioRef} src={src} />
    </div>
  );
}

function getInitials(name?: string | null, fallback = "?") {
  const normalizedName = String(name ?? "").trim();
  if (!normalizedName || normalizedName === "[object Object]") {
    return fallback;
  }
  const initials = normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
}

function normalizeAvatarImageUrl(value?: string | null) {
  const src = value?.trim() ?? "";
  if (!src) {
    return "";
  }
  return /^(https?:\/\/|\/|data:image\/)/i.test(src) ? src : "";
}

function isMetaHostedAvatarUrl(value?: string | null) {
  const src = value?.trim() ?? "";
  if (!src || /^data:image\//i.test(src)) {
    return false;
  }

  try {
    const parsed = new URL(src);
    const host = parsed.hostname.toLowerCase();
    return host === "graph.facebook.com" || host.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

const AVATAR_TONES = [
  "avatar-tone-sky",
  "avatar-tone-emerald",
  "avatar-tone-violet",
  "avatar-tone-amber",
  "avatar-tone-rose",
  "avatar-tone-teal",
  "avatar-tone-indigo",
] as const;

function getAvatarToneClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function ChatAvatar({
  className,
  imageUrl,
  name,
}: {
  className: string;
  imageUrl?: string | null;
  name: string;
}) {
  const safeImageUrl = normalizeAvatarImageUrl(imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const resolvedImageUrl = safeImageUrl && failedImageUrl !== safeImageUrl ? safeImageUrl : "";
  const initials = getInitials(name, "U").slice(0, 2) || "U";
  const toneClass = !resolvedImageUrl ? getAvatarToneClass(name) : "";

  return (
    <div aria-label={`${name} avatar`} className={[className, toneClass].filter(Boolean).join(" ")}>
      {resolvedImageUrl ? (
        <Image
          alt=""
          aria-hidden="true"
          className="chat-avatar-image"
          height={96}
          onError={() => setFailedImageUrl(safeImageUrl)}
          src={resolvedImageUrl}
          unoptimized
          width={96}
        />
      ) : (
        <span className="chat-avatar-initials">{initials}</span>
      )}
    </div>
  );
}

function rolePrefix(role: DummyConversationRole) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "freelancer") return "Editor";
  if (role === "sales") return "Sales";
  return "Customer";
}

function messageLabel(message: DummyConversationView["messages"][number], audience: DummyConversationRole) {
  const senderLabel = message.senderLabel?.trim() || rolePrefix(message.senderRole);
  if (audience !== "customer" && message.senderRole === "freelancer") {
    return /^(freelancer|editor)\b/i.test(senderLabel) ? senderLabel : `Freelancer ${senderLabel}`;
  }
  return senderLabel;
}

function messageSenderIdentity(message: DummyConversationView["messages"][number], audience: DummyConversationRole) {
  const roleLabel = rolePrefix(message.senderRole);
  const senderName = audience === "freelancer" && message.senderRole === "customer" ? "Client" : message.senderLabel?.trim() || roleLabel;
  const isCurrentViewer = message.senderRole === audience && !isAutomatedAssignmentOutcomeMessageBody(message.body);

  if (isCurrentViewer) {
    return {
      primary: "You",
      secondary: senderName.toLowerCase() === roleLabel.toLowerCase() ? roleLabel : `${senderName} · ${roleLabel}`,
    };
  }

  return {
    primary: senderName,
    secondary: senderName.toLowerCase() === roleLabel.toLowerCase() ? "" : roleLabel,
  };
}

const WHATSAPP_UNSUPPORTED_MESSAGE_PLACEHOLDER = "[unsupported message received on WhatsApp]";
const WHATSAPP_UNSUPPORTED_MESSAGE_NOTICE =
  "WhatsApp sent this as an unsupported message type, so Gigxomi did not receive readable text. Ask the sender to resend it as a plain text message.";

function visibleBody(message: DummyConversationView["messages"][number]) {
  if (message.lane === "customer" && message.senderRole !== "customer") {
    const prefixes = [message.senderLabel, rolePrefix(message.senderRole)]
      .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
      .map((value) => `${value}:`);
    for (const prefixed of prefixes) {
      if (message.body.startsWith(prefixed)) {
        return message.body.slice(prefixed.length).trimStart();
      }
    }
  }
  if (message.body.trim().toLowerCase() === WHATSAPP_UNSUPPORTED_MESSAGE_PLACEHOLDER) {
    return WHATSAPP_UNSUPPORTED_MESSAGE_NOTICE;
  }
  return normalizeAutomatedChatMessageBody(message.body);
}

function getInternalDeliveryStatus(
  message: DummyConversationView["messages"][number],
  audience: DummyConversationRole,
  conversation?: DummyConversationView | null,
) {
  if (message.lane !== "internal" || message.senderRole === "customer" || message.senderRole !== audience) {
    return null;
  }

  const counterpartKeys =
    audience === "freelancer"
      ? ["admin:internal", "manager:internal", "admin", "manager"]
      : ["freelancer:internal", "freelancer"];
  const readAt = counterpartKeys
    .map((key) => conversation?.readStateByAudience?.[key as keyof NonNullable<DummyConversationView["readStateByAudience"]>])
    .filter(Boolean)
    .sort()
    .at(-1);
  const readAtMs = readAt ? new Date(readAt).getTime() : 0;
  const messageMs = message.createdAt ? new Date(message.createdAt).getTime() : 0;

  return Number.isFinite(readAtMs) && Number.isFinite(messageMs) && readAtMs >= messageMs ? "read" : "sent";
}

function getOutgoingDeliveryStatus(
  message: DummyConversationView["messages"][number],
  audience: DummyConversationRole,
  conversation?: DummyConversationView | null,
) {
  if (message.senderRole === "customer" || isConversationMessageIncomingForAudience(message, audience)) {
    return null;
  }

  if (message.lane === "internal") {
    return getInternalDeliveryStatus(message, audience, conversation);
  }

  if (message.lane !== "customer") {
    return null;
  }

  return message.deliveryStatus ?? "sent";
}

function summarizeMessagePreview(
  message: DummyConversationView["messages"][number],
  audience: DummyConversationRole,
  options?: { includeLanePrefix?: boolean },
) {
  const body = visibleBody(message).trim();
  const senderPrefix =
    audience !== "customer" && message.senderRole !== "customer"
      ? `${messageLabel(message, audience)}: `
      : "";
  const lanePrefix = options?.includeLanePrefix === false || message.lane !== "internal" ? "" : "Internal: ";

  if (body) {
    return `${lanePrefix}${senderPrefix}${body}`;
  }

  if (message.attachments?.length) {
    if (message.attachments.length === 1) {
      return `${lanePrefix}${senderPrefix}${describeAttachment(message.attachments[0])}`;
    }
    return `${lanePrefix}${senderPrefix}${message.attachments.length} attachments received`;
  }

  return message.lane === "internal" ? "New internal message received" : "New message received";
}

function getDeliveryStatusLabel(status: NonNullable<ReturnType<typeof getOutgoingDeliveryStatus>>) {
  if (status === "failed") {
    return "Not delivered";
  }
  if (status === "read") {
    return "Read";
  }
  if (status === "delivered") {
    return "Delivered";
  }
  return "Sent";
}

function resolveSelectedConversation(preferredId: string, items: DummyConversationView[]) {
  return preferredId && items.some((conversation) => conversation.id === preferredId) ? preferredId : "";
}

function isConversationView(value: unknown): value is DummyConversationView {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DummyConversationView> & {
    assignmentSummary?: unknown;
    laneCapabilities?: unknown;
    visibleLanes?: unknown;
    messages?: unknown;
  };

  return (
    typeof candidate.id === "string" &&
    Array.isArray(candidate.messages) &&
    Array.isArray(candidate.visibleLanes) &&
    typeof candidate.assignmentSummary === "object" &&
    candidate.assignmentSummary !== null &&
    typeof candidate.laneCapabilities === "object" &&
    candidate.laneCapabilities !== null
  );
}

function makeConversationSignature(payload: DummyConversationListResponse) {
  const conversationSignature = (payload.conversations ?? [])
    .map((conversation) => {
      const latestMessage = conversation.messages.at(-1);
      const latestTyping = conversation.typing.at(-1);
      const latestPaymentRequest = conversation.latestPaymentRequest;

      return [
        conversation.id,
        conversation.status,
        conversation.leadStatusId,
        conversation.assignedFreelancerId ?? "",
        conversation.assignedFreelancerName ?? "",
        conversation.assignmentSummary.pendingOfferCount ?? 0,
        conversation.myAssignmentOffer?.status ?? "",
        conversation.myAssignmentOffer?.respondedAt ?? "",
        conversation.ownerName ?? "",
        conversation.ownerRole ?? "",
        conversation.lastCustomerActivityAt,
        conversation.unreadCount,
        conversation.unreadCountByLane.customer,
        conversation.unreadCountByLane.internal,
        conversation.latestMessageLane,
        conversation.preferredLane,
        conversation.businessPhoneDisplay ?? "",
        conversation.messages.length,
        latestMessage?.id ?? "",
        latestMessage?.createdAt ?? "",
        latestMessage?.body.length ?? 0,
        latestMessage?.attachments?.length ?? 0,
        latestMessage?.deliveryStatus ?? "",
        conversation.customerProfileImageUrl ?? "",
        latestTyping?.role ?? "",
        latestTyping?.lane ?? "",
        latestTyping?.active ? "1" : "0",
        latestTyping?.updatedAt ?? "",
        latestPaymentRequest?.id ?? "",
        latestPaymentRequest?.status ?? "",
      ].join("|");
    })
    .join("\n");

  const supportSignature = [
    (payload.assignableEditors ?? []).map((editor) => `${editor.id}:${editor.name}:${editor.karmaScore}`).join("|"),
    (payload.leadStatuses ?? []).map((status) => `${status.id}:${status.label}:${status.tone}`).join("|"),
    (payload.templates ?? []).map((template) => `${template.id}:${template.title}`).join("|"),
  ].join("\n");

  return `${conversationSignature}\n---support---\n${supportSignature}`;
}

function summarizeAttachmentForStatus(attachment: PendingAttachment) {
  if (attachment.uploadTarget === "youtube") {
    return `${attachment.name} routed to YouTube`;
  }
  if (attachment.durationSeconds) {
    return `Voice note recorded (${attachment.durationSeconds}s)`;
  }
  return `${attachment.name} attached`;
}

function describeAttachment(attachment: DummyConversationAttachment) {
  if (attachment.kind === "voice-note") {
    return attachment.durationLabel ? `Voice note - ${attachment.durationLabel}` : "Voice note";
  }
  if (attachment.kind === "youtube-upload") {
    return attachment.collectionName ? `YouTube - ${attachment.collectionName}` : "YouTube upload";
  }
  if (attachment.kind === "payment-request") {
    return attachment.note ?? "Payment request";
  }
  return `${attachment.name} - ${attachment.sizeLabel}`;
}

function attachmentHasInlinePreview(attachment: DummyConversationAttachment) {
  return Boolean(
    attachment.externalUrl &&
      (attachment.kind === "image" ||
        attachment.kind === "video" ||
        attachment.kind === "audio" ||
        attachment.kind === "voice-note" ||
        attachment.mimeType === "application/pdf"),
  );
}

function AttachmentPreview({ attachment }: { attachment: DummyConversationAttachment }) {
  if (!attachment.externalUrl) {
    return null;
  }

  if (attachment.kind === "voice-note") {
    return <VoiceNotePlayer src={attachment.externalUrl} />;
  }

  if (attachment.kind === "image") {
    return (
      <a className="chat-attachment-preview-link" href={attachment.externalUrl} rel="noreferrer" target="_blank">
        <Image
          alt={attachment.name}
          className="chat-attachment-image"
          height={720}
          loading="lazy"
          src={attachment.externalUrl}
          unoptimized
          width={960}
        />
      </a>
    );
  }

  if (attachment.kind === "video") {
    return <video className="chat-attachment-video" controls preload="metadata" src={attachment.externalUrl} />;
  }

  if (attachment.kind === "audio") {
    return <audio className="chat-attachment-audio" controls preload="metadata" src={attachment.externalUrl} />;
  }

  if (attachment.mimeType === "application/pdf") {
    return (
      <div className="chat-attachment-document-preview">
        <span className="chat-attachment-document-icon">
          <FileText size={18} strokeWidth={2} />
        </span>
        <div className="chat-attachment-document-copy">
          <strong>{attachment.name}</strong>
          <span>PDF document ready to open</span>
        </div>
      </div>
    );
  }

  return null;
}

function editorPlanLabel(editorId?: string) {
  return editorId ? EDITOR_PLAN_LABELS[editorId] ?? "Standard" : "Standard";
}

function buildSplitPreview(amount: number, editorId?: string) {
  const planLabel = editorPlanLabel(editorId);
  const platformPercentage = planLabel === "Standard" ? 30 : 5;
  const editorPercentage = 100 - platformPercentage;
  return {
    planLabel,
    platformPercentage,
    editorPercentage,
    editorShare: Math.round((amount * editorPercentage) / 100),
    platformShare: Math.round((amount * platformPercentage) / 100),
  };
}

function toneClassName(tone: DummyLeadStatusTone) {
  return `chat-status-pill tone-${tone}`;
}

function isWaitingConversation(conversation: DummyConversationView) {
  return /review|waiting/i.test(conversation.status) || /new|waiting|payment-pending/.test(conversation.leadStatusId);
}

function getConversationSourceChannel(
  conversation: Pick<DummyConversationView, "serviceId" | "sourceChannel">,
): DummyConversationSourceChannel {
  if (conversation.sourceChannel === "instagram" || conversation.serviceId === "svc-instagram-inbox") {
    return "instagram";
  }
  if (conversation.sourceChannel === "in-app") {
    return "in-app";
  }
  return "whatsapp";
}

function parseChannelFilter(value: string | null): ChannelFilter {
  return value === "instagram" || value === "whatsapp" ? value : "all";
}

function WhatsAppIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.38 0-2.74-.35-3.94-1.06l-.29-.17-3.12.82.83-3.04-.19-.31a8.192 8.192 0 0 1-1.26-4.47c0-4.53 3.7-8.25 8.28-8.25m-3.52 3.66c-.16 0-.43.06-.66.31-.22.25-.85.84-.85 2.04 0 1.2.88 2.35 1 2.51.12.16 1.72 2.64 4.17 3.69.59.25 1.04.4 1.4.52.59.18 1.13.16 1.56.09.48-.07 1.47-.6 1.68-1.18.21-.59.21-1.09.15-1.19-.06-.11-.21-.17-.45-.29s-1.35-.56-1.56-.63c-.2-.08-.35-.12-.49.1-.15.22-.56.69-.69.84-.12.14-.25.16-.48.05-.23-.12-.97-.36-1.85-1.15-.68-.61-1.14-1.36-1.27-1.59-.13-.22-.02-.34.1-.46.11-.11.24-.28.36-.42.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43s-.47-1.13-.65-1.55c-.19-.44-.38-.38-.52-.39-.14-.01-.3-.01-.46-.01" />
    </svg>
  );
}

function InstagramIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function ChatChannelIcon({
  channel,
  size = 13,
  className,
}: {
  channel: DummyConversationSourceChannel | ChannelFilter;
  size?: number;
  className?: string;
}) {
  if (channel === "whatsapp") {
    return <WhatsAppIcon className={cx("whatsapp-icon", className)} size={size} />;
  }
  if (channel === "instagram") {
    return <InstagramIcon className={cx("instagram-icon", className)} size={size} />;
  }
  return <MessageSquareText className={cx("in-app-icon", className)} size={size} strokeWidth={1.8} />;
}

function getConversationShortLabel(
  conversation: Pick<DummyConversationView, "channelConnectionName" | "sourceChannel">,
): string {
  const connectionName = conversation.channelConnectionName?.trim();
  if (connectionName) {
    if (connectionName.toLowerCase().startsWith("gigxomi ")) {
      return connectionName.slice(8).trim();
    }
    return connectionName;
  }
  if (conversation.sourceChannel === "instagram") {
    return "@ig";
  }
  if (conversation.sourceChannel === "whatsapp") {
    return "WA";
  }
  return "In-app";
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function mapWebPushStatus(status: WebPushRegistrationStatus): ChatNotificationSetupStatus {
  if (status === "registered") return "ready";
  if (status === "permission-denied") return "blocked";
  if (status === "missing-config") return "missing-config";
  if (status === "unsupported" || status === "token-unavailable") return "unsupported";
  if (status === "failed") return "error";
  return "idle";
}

function getWebPushStatusMessage(status: WebPushRegistrationStatus) {
  switch (status) {
    case "registered":
      return "Chat alerts are enabled for this browser.";
    case "permission-denied":
      return "Notifications are blocked in this browser. Allow notifications from the address bar, then retry.";
    case "missing-config":
      return "Firebase web push config is missing on the server.";
    case "unsupported":
      return "This browser does not support web push notifications.";
    case "token-unavailable":
      return "The browser did not return a push token. Refresh once and try again.";
    case "failed":
      return "Chat alerts could not be enabled right now.";
    default:
      return "Click Enable alerts to allow chat notifications for this browser.";
  }
}

type ChatSidebarHeaderProps = {
  title: string;
  subtitle: string;
  titleActions?: ReactNode;
  searchValue: string;
  searchPlaceholder: string;
  searchDisabled?: boolean;
  filterRow?: ReactNode;
  extra?: ReactNode;
  onSearchChange?: (value: string) => void;
};

function ChatSidebarHeader({
  title,
  subtitle,
  titleActions,
  searchValue,
  searchPlaceholder,
  searchDisabled = false,
  filterRow,
  extra,
  onSearchChange,
}: ChatSidebarHeaderProps) {
  const normalizedTitle = title.trim();
  const normalizedSubtitle = subtitle.trim();
  const primaryHeading = normalizedTitle || normalizedSubtitle;
  const secondaryHeading = normalizedTitle && normalizedSubtitle ? normalizedSubtitle : "";
  const hasHeading = Boolean(primaryHeading || secondaryHeading);

  return (
    <div className="chat-inbox-sidebar-head">
      {hasHeading || titleActions ? (
        <div className={hasHeading ? "chat-inbox-title-row" : "chat-inbox-title-row actions-only"}>
          {hasHeading ? (
            <div>
              {primaryHeading ? <h2>{primaryHeading}</h2> : null}
              {secondaryHeading ? <p className="muted-copy">{secondaryHeading}</p> : null}
            </div>
          ) : null}
          {titleActions ? (
            <div className="chat-inbox-title-actions">{titleActions}</div>
          ) : null}
        </div>
      ) : null}

      <label className={searchDisabled ? "chat-search-field disabled" : "chat-search-field"}>
        <input
          className="chat-search-input"
          disabled={searchDisabled}
          onChange={
            onSearchChange
              ? (event) => onSearchChange(event.target.value)
              : undefined
          }
          placeholder={searchPlaceholder}
          style={{
            border: "0",
            borderWidth: "0",
            outline: "0",
            background: "transparent",
            backgroundColor: "transparent",
            boxShadow: "none",
            borderRadius: "0",
            padding: "0",
          }}
          value={searchValue}
        />
        <Search size={16} strokeWidth={1.8} />
      </label>

      {filterRow}
      {extra}
    </div>
  );
}

const ChatThreadRow = memo(function ChatThreadRow({
  audience,
  conversation,
  selected,
  onSelect,
}: {
  audience: DummyConversationRole;
  conversation: DummyConversationView;
  selected: boolean;
  onSelect: (conversation: DummyConversationView) => void;
}) {
  const customerName = conversation.customerDisplayName?.trim() || "Unknown customer";
  const latestMessage = conversation.messages.at(-1);
  const latestInternalMessage = [...conversation.messages].reverse().find((message) => message.lane === "internal");
  const hasInternalSignal = conversation.unreadCountByLane.internal > 0 || conversation.latestMessageLane === "internal";
  const hasFreelancerInternalUnreadSignal =
    audience === "admin" &&
    conversation.unreadCountByLane.internal > 0 &&
    latestInternalMessage?.senderRole === "freelancer";
  const agencyLabel = audience === "freelancer" ? conversation.agencyContext?.agencyName?.trim() || "" : "";
  const sourceChannel = getConversationSourceChannel(conversation);
  const baseChannelLabel = sourceChannel === "instagram" ? "Instagram" : sourceChannel === "whatsapp" ? "WhatsApp" : "In-app";
  const sourceChannelLabel = conversation.channelConnectionName
    ? `${baseChannelLabel} · ${conversation.channelConnectionName}`
    : baseChannelLabel;
  const shortConnectionLabel = getConversationShortLabel(conversation);
  const summaryPreview =
    latestMessage
      ? summarizeMessagePreview(latestMessage, audience, { includeLanePrefix: false })
      : conversation.summary?.trim() || "";
  const summaryLabel = summaryPreview || "Open chat";
  const statusLabel = conversation.status === "Manager Review" ? "Review" : conversation.status;

  return (
    <button
      className={selected ? "chat-thread-row active" : "chat-thread-row"}
      onClick={() => onSelect(conversation)}
      type="button"
    >
      <div className="chat-thread-avatar-wrap">
        <ChatAvatar className="chat-thread-avatar" imageUrl={conversation.customerProfileImageUrl} name={customerName} />
        {sourceChannel === "whatsapp" || sourceChannel === "instagram" ? (
          <span
            aria-hidden="true"
            className={`chat-avatar-channel-badge ${sourceChannel}`}
            title={sourceChannel === "whatsapp" ? "WhatsApp" : "Instagram"}
          >
            <ChatChannelIcon channel={sourceChannel} size={10} />
          </span>
        ) : null}
      </div>
      <div className="chat-thread-copy">
        <div className="chat-thread-topline">
          <strong>{customerName}</strong>
        </div>
        <p className={hasInternalSignal ? "chat-thread-preview internal" : "chat-thread-preview"}>{summaryLabel}</p>
        {(agencyLabel || hasInternalSignal) ? (
          <div className="chat-thread-chip-row">
            {agencyLabel ? (
              <span className="chat-thread-agency-chip">
                {agencyLabel}
              </span>
            ) : null}
            {hasInternalSignal ? <span className="chat-thread-lane-badge">Internal</span> : null}
          </div>
        ) : null}
      </div>
      <div className="chat-thread-side">
        <span className={`chat-thread-top-badge ${sourceChannel}`} title={sourceChannelLabel}>
          <ChatChannelIcon channel={sourceChannel} size={11} />
          <span className="chat-thread-top-badge-text">{shortConnectionLabel}</span>
        </span>
        <div className="chat-thread-side-bottom">
          {hasFreelancerInternalUnreadSignal ? <span className="chat-thread-internal-alert">Internal New</span> : null}
          <span className="chat-thread-state" title={conversation.status}>{statusLabel}</span>
          {conversation.unreadCount > 0 ? (
            <span className="chat-thread-tag">{conversation.unreadCount}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
});

function ChatSidebarEmptyState({
  title,
  copy,
  badge,
}: {
  title: string;
  copy: string;
  badge: string;
}) {
  return (
    <div className={styles.sidebarEmpty}>
      <span className={styles.sidebarEmptyBadge}>{badge}</span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function ChatStageEmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.stageEmpty}>
      <div className={styles.stageEmptyInner}>
        <span className={styles.stageEmptyIcon}>
          <MessageSquareText size={22} strokeWidth={1.8} />
        </span>
        <strong>{title}</strong>
        <p>{copy}</p>
        {action}
      </div>
    </div>
  );
}

function ChatDetailsSheet({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.detailsBackdrop}
      onClick={onClose}
      role="presentation"
    >
      <aside
        className={styles.detailsSheet}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleGroup}>
            <p className="section-label">{eyebrow}</p>
            <strong>{title}</strong>
          </div>
          <button className="chat-head-icon" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>
        <div className={styles.detailsScroll}>{children}</div>
      </aside>
    </div>
  );
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

async function fetchConversations(input: {
  audience: DummyConversationRole;
  customerId?: string;
  includeSupportData?: boolean;
  lightweight?: boolean;
  serviceId?: string;
  tenantId?: string;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({ audience: input.audience });
  if (input.customerId) params.set("customerId", input.customerId);
  if (input.includeSupportData) params.set("includeSupportData", "1");
  else params.set("includeSupportData", "0");
  if (input.lightweight !== false) params.set("lightweight", "1");
  else params.set("lightweight", "0");
  if (input.serviceId) params.set("serviceId", input.serviceId);
  if (input.tenantId) params.set("tenantId", input.tenantId);
  const response = await fetch(`/api/conversations?${params.toString()}`, { cache: "no-store", signal: input.signal });
  const payload = (await response.json().catch(() => null)) as ({ ok?: boolean; error?: string; supportDataIncluded?: boolean } & DummyConversationListResponse) | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Chat inbox could not be loaded.");
  }
  return payload as { ok: boolean; supportDataIncluded?: boolean } & DummyConversationListResponse;
}

function buildAgencyDirectPreview(amount: number) {
  const normalizedAmount = Math.max(0, Math.round(Number(amount || 0)));
  return {
    planLabel: "Agency direct",
    platformPercentage: 0,
    editorPercentage: 100,
    editorShare: normalizedAmount,
    platformShare: 0,
  };
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Blob read failed"));
    reader.readAsDataURL(blob);
  });
}

async function fetchFreelancerPaymentDetails() {
  const response = await fetch("/api/freelancer/payment-details", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { paymentDetails?: { upiId?: string; bankAccountName?: string } } | null;
  if (!response.ok) {
    return { upiId: "", payeeName: "" };
  }
  return {
    upiId: payload?.paymentDetails?.upiId?.trim() ?? "",
    payeeName: payload?.paymentDetails?.bankAccountName?.trim() ?? "",
  };
}

async function fetchConversationProfilePicture(conversationId: string, options?: { refresh?: boolean; signal?: AbortSignal }) {
  const params = new URLSearchParams();
  if (options?.refresh) {
    params.set("refresh", "1");
  }
  const url = params.size
    ? `/api/conversations/${conversationId}/whatsapp-profile-picture?${params.toString()}`
    : `/api/conversations/${conversationId}/whatsapp-profile-picture`;
  const response = await fetch(url, { cache: "no-store", signal: options?.signal });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; customerProfileImageUrl?: string } | null;
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error ?? "Profile picture could not be loaded.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload.customerProfileImageUrl?.trim() ?? "";
}

function getLatestIncomingMessage(
  conversation: DummyConversationView,
  audience: DummyConversationRole,
) {
  return [...conversation.messages]
    .reverse()
    .find((message) => isConversationMessageIncomingForAudience(message, audience)) ?? null;
}

function getConversationMessageKey(message: DummyConversationView["messages"][number]) {
  return `${message.id}:${message.createdAt}`;
}

function summarizeIncomingMessage(
  message: DummyConversationView["messages"][number],
  audience: DummyConversationRole,
) {
  return summarizeMessagePreview(message, audience);
}

function getPreferredConversationLane(conversation: DummyConversationView, audience: DummyConversationRole) {
  if (audience === "customer") {
    return "customer" as const;
  }

  const preferredLane = conversation.unreadCountByLane.internal > 0 ? "internal" : conversation.preferredLane ?? "customer";
  return conversation.visibleLanes.includes(preferredLane) ? preferredLane : (conversation.visibleLanes[0] ?? "customer");
}

export function ChatWorkspace({
  audience,
  customerId = "",
  serviceIdFilter = "",
  tenantId = "",
}: ChatWorkspaceProps) {
  const searchParams = useSearchParams();
  const [titleActionHost, setTitleActionHost] = useState<HTMLElement | null>(null);
  const requestedConversationId = searchParams.get("conversationId") ?? "";
  const phonePePaymentStatus = searchParams.get("phonepePaymentStatus") ?? "";
  const phonePePaymentMessage = searchParams.get("phonepePaymentMessage") ?? "";
  const instagramConnected = searchParams.get("instagramConnected") ?? "";
  const instagramError = searchParams.get("instagramError") ?? "";
  const cacheKey = useMemo(
    () => getChatCacheKey(audience, tenantId, customerId, serviceIdFilter),
    [audience, customerId, serviceIdFilter, tenantId],
  );
  const initialCache = chatModuleCache.get(cacheKey);

  const [conversations, setConversations] = useState<DummyConversationView[]>(() => initialCache?.conversations ?? []);
  const [assignableEditors, setAssignableEditors] = useState<DummyAssignableEditor[]>(() => initialCache?.assignableEditors ?? []);
  const [leadStatuses, setLeadStatuses] = useState<DummyLeadStatus[]>(() => initialCache?.leadStatuses ?? []);
  const effectiveLeadStatuses = useMemo<DummyLeadStatus[]>(() => {
    if (leadStatuses && leadStatuses.length > 0) return leadStatuses;
    return crmStatuses.map((s, idx) => ({
      id: s.id,
      label: s.label,
      tone: s.tone as DummyLeadStatusTone,
      order: s.order || idx + 1,
      active: s.active,
    }));
  }, [leadStatuses]);
  const [templates, setTemplates] = useState<DummyConversationTemplate[]>(() => initialCache?.templates ?? []);
  const [selectedConversationId, setSelectedConversationId] = useState(() => {
    if (requestedConversationId) return requestedConversationId;
    return initialCache?.conversations?.[0]?.id ?? "";
  });
  const [isCompactChatLayout, setIsCompactChatLayout] = useState(false);
  const [isMobileThreadViewOpen, setIsMobileThreadViewOpen] = useState(false);
  const [activeLane, setActiveLane] = useState<DummyConversationLane>(audience === "freelancer" ? "customer" : "customer");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>(() => parseChannelFilter(searchParams.get("channel")));
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const [messageDraft, setMessageDraft] = useState("");
  const [hideCustomerMessageFromFreelancer, setHideCustomerMessageFromFreelancer] = useState(false);
  const [assignmentRejectReason, setAssignmentRejectReason] = useState("");
  const [isRejectingAssignment, setIsRejectingAssignment] = useState(false);
  const [composerStatus, setComposerStatus] = useState("");
  const [isEmojiTrayOpen, setIsEmojiTrayOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isConvertingVoice, setIsConvertingVoice] = useState(false);
  const [isMicHelpOpen, setIsMicHelpOpen] = useState(false);
  const [micHelpMessage, setMicHelpMessage] = useState("");
  const [micPermissionState, setMicPermissionState] = useState<MicPermissionState>("unknown");
  const [micLastError, setMicLastError] = useState<MicErrorInfo | null>(null);
  const [micDiagnostics, setMicDiagnostics] = useState<MicDiagnostics | null>(null);

  useEffect(() => {
    setTitleActionHost(document.querySelector<HTMLElement>("[data-chat-title-actions]"));
  }, []);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("all");
  const [paymentPendingOnly, setPaymentPendingOnly] = useState(false);
  const [leadStatusFilterId, setLeadStatusFilterId] = useState("all");
  const [isAssignMenuOpen, setIsAssignMenuOpen] = useState(false);
  const [isSendingAssignmentOffer, setIsSendingAssignmentOffer] = useState(false);
  const [isAssigningDirectly, setIsAssigningDirectly] = useState(false);
  const [isRemovingAssignment, setIsRemovingAssignment] = useState(false);
  const [assignSearchValue, setAssignSearchValue] = useState("");
  const [assignCategoryFilter, setAssignCategoryFilter] = useState("all");
  const [selectedAssignEditorIds, setSelectedAssignEditorIds] = useState<string[]>([]);
  const [assignmentDetailsDraft, setAssignmentDetailsDraft] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"replace" | "viewer">("replace");
  const [isLeadStatusMenuOpen, setIsLeadStatusMenuOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusLabel, setEditingStatusLabel] = useState("");
  const [editingStatusTone, setEditingStatusTone] = useState<DummyLeadStatusTone>("neutral");
  const [editingStatusActive, setEditingStatusActive] = useState(true);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusTone, setNewStatusTone] = useState<DummyLeadStatusTone>("accent");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClientAliasModalOpen, setIsClientAliasModalOpen] = useState(false);
  const [clientAliasValue, setClientAliasValue] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatCustomerName, setNewChatCustomerName] = useState("");
  const [newChatCustomerPhone, setNewChatCustomerPhone] = useState("");
  const [newChatServiceId, setNewChatServiceId] = useState("");
  const [newChatTemplateId, setNewChatTemplateId] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [isSyncingInstagramProfile, setIsSyncingInstagramProfile] = useState(false);
  const [isEditingCustomerName, setIsEditingCustomerName] = useState(false);
  const [editCustomerNameValue, setEditCustomerNameValue] = useState("");
  const syncedInstagramIdsRef = useRef<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTitle, setPaymentTitle] = useState("Project advance");
  const [paymentProjectTitle, setPaymentProjectTitle] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDueLabel, setPaymentDueLabel] = useState("");
  const [freelancerPayeeUpiId, setFreelancerPayeeUpiId] = useState("");
  const [freelancerPayeeName, setFreelancerPayeeName] = useState("");
  const [isFreelancerAccessSaving, setIsFreelancerAccessSaving] = useState(false);
  const [isInboxLoading, setIsInboxLoading] = useState(() => !(initialCache?.conversations?.length));
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isNotificationSetupSaving, setIsNotificationSetupSaving] = useState(false);
  const [notificationSetupStatus, setNotificationSetupStatus] = useState<ChatNotificationSetupStatus>("idle");
  const [hasLoadedSupportData, setHasLoadedSupportData] = useState(() => Boolean(initialCache?.assignableEditors?.length));
  const [isSupportDataLoading, setIsSupportDataLoading] = useState(false);
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now());

  const recordingIntervalRef = useRef<number | null>(null);
  const lastPayloadSignatureRef = useRef("");
  const readRequestRef = useRef("");
  const messageSendLockRef = useRef(false);
  const paymentSubmitLockRef = useRef(false);
  const inboxLoadPromiseRef = useRef<Promise<void> | null>(null);
  const inboxAbortControllerRef = useRef<AbortController | null>(null);
  const supportDataLoadPromiseRef = useRef<Promise<void> | null>(null);
  const syncBurstTimeoutsRef = useRef<number[]>([]);
  const latestConversationsRef = useRef<DummyConversationView[]>([]);
  const profilePictureAbortControllersRef = useRef<Set<AbortController>>(new Set());
  const notificationAudioContextRef = useRef<AudioContext | null>(null);
  const notificationAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const customNotificationSoundUnavailableRef = useRef(false);
  const foregroundPushUnsubscribeRef = useRef<(() => void) | null>(null);
  const recentForegroundPushRef = useRef<{ conversationId: string; at: number } | null>(null);
  const hasInitializedNotificationsRef = useRef(false);
  const lastIncomingMessageKeysRef = useRef<Record<string, string>>({});
  const conversationEventsLastSignatureRef = useRef("");
  const conversationEventsRefreshTimeoutRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );
  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const documentFileInputRef = useRef<HTMLInputElement | null>(null);
  const paymentProofInputRef = useRef<HTMLInputElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const railScrollRef = useRef<HTMLDivElement | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioMuteRef = useRef<GainNode | null>(null);
  const mp3EncoderRef = useRef<Mp3EncoderInstance | null>(null);
  const mp3ChunksRef = useRef<Uint8Array[]>([]);
  const voiceCaptureModeRef = useRef<"media" | "direct">("media");
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingSecondsRef = useRef(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingConversationIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);
  const lastConversationIdRef = useRef<string | null>(null);
  const laneSyncConversationIdRef = useRef<string | null>(null);
  const requestedConversationAppliedRef = useRef("");
  const requestedProfilePictureIdsRef = useRef<Set<string>>(new Set());
  const refreshedProfilePictureIdsRef = useRef<Set<string>>(new Set());
  const failedProfilePictureRetryAtRef = useRef<Map<string, number>>(new Map());
  const typingStopTimeoutRef = useRef<number | null>(null);
  const typingHeartbeatIntervalRef = useRef<number | null>(null);
  const outboundTypingStateRef = useRef<{ conversationId: string; lane: DummyConversationLane; active: boolean } | null>(null);

  const cleanupDirectMp3 = useCallback(() => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.onaudioprocess = null;
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioMuteRef.current) {
      audioMuteRef.current.disconnect();
      audioMuteRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    mp3EncoderRef.current = null;
    mp3ChunksRef.current = [];
  }, []);

  const agencyFilterOptions = useMemo(() => {
    const items = new Map<
      string,
      {
        tenantId: string;
        agencyName: string;
      }
    >();
    conversations.forEach((conversation) => {
      if (conversation.agencyContext?.tenantId) {
        items.set(conversation.agencyContext.tenantId, {
          tenantId: conversation.agencyContext.tenantId,
          agencyName: conversation.agencyContext.agencyName,
        });
      }
    });
    return Array.from(items.values());
  }, [conversations]);

  const filteredAssignableEditors = useMemo(() => {
    const query = assignSearchValue.trim().toLowerCase();
    const category = assignCategoryFilter.trim().toLowerCase();
    return assignableEditors.filter((editor) => {
      const specialties = editor.specialties.map((specialty) => specialty.trim().toLowerCase().replace(/\s+/g, " "));
      if (category !== "all" && !specialties.includes(category)) return false;
      if (!query) return true;
      const haystack = `${editor.name} ${editor.specialties.join(" ")} ${editor.workloadBand} ${editor.karmaScore}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [assignCategoryFilter, assignSearchValue, assignableEditors]);

  const assignCategoryOptions = useMemo(() => {
    const categories = new Map<string, string>();
    assignableEditors.forEach((editor) => {
      editor.specialties.forEach((specialty) => {
        const normalized = specialty.trim().toLowerCase().replace(/\s+/g, " ");
        if (normalized && !categories.has(normalized)) {
          categories.set(normalized, specialty.trim());
        }
      });
    });
    return Array.from(categories.entries()).map(([value, label]) => ({ value, label })).slice(0, 12);
  }, [assignableEditors]);

  const filteredAssignableEditorIds = useMemo(
    () => filteredAssignableEditors.map((editor) => editor.id),
    [filteredAssignableEditors],
  );
  const allFilteredAssignableEditorsSelected =
    filteredAssignableEditorIds.length > 0 && filteredAssignableEditorIds.every((id) => selectedAssignEditorIds.includes(id));

  const filteredConversations = useMemo(() => {
    const query = deferredSearchValue.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const assignmentSummary = conversation.assignmentSummary;
      const sourceChannel = getConversationSourceChannel(conversation);
      const haystack = [
        conversation.customerDisplayName,
        conversation.serviceTitle,
        conversation.summary,
        conversation.leadStatusLabel,
        conversation.channelConnectionName ?? "",
        sourceChannel === "instagram" ? "instagram" : sourceChannel === "whatsapp" ? "whatsapp" : "in app",
        assignmentSummary?.assignedFreelancerName ?? conversation.assignedFreelancerName ?? "",
        conversation.ownerName ?? "",
        conversation.agencyContext?.agencyName ?? "",
        conversation.agencyContext?.location ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (channelFilter !== "all" && sourceChannel !== channelFilter) return false;
      if (agencyFilter !== "all" && conversation.agencyContext?.tenantId !== agencyFilter) return false;
      if (query && !haystack.includes(query)) return false;
      if (activeFilter === "unread" && conversation.unreadCount === 0) return false;
      if (activeFilter === "mine") {
        if (audience !== "freelancer" && conversation.ownerRole !== audience && !conversation.ownerName) return false;
      }
      if (activeFilter === "waiting" && !isWaitingConversation(conversation)) return false;
      if (assignedFilter === "assigned" && !assignmentSummary?.assignedFreelancerId) return false;
      if (assignedFilter === "unassigned" && assignmentSummary?.assignedFreelancerId) return false;
      if (paymentPendingOnly && conversation.leadStatusId !== "payment-pending") return false;
      if (leadStatusFilterId !== "all" && conversation.leadStatusId !== leadStatusFilterId) return false;
      return true;
    });
  }, [activeFilter, agencyFilter, assignedFilter, audience, channelFilter, conversations, deferredSearchValue, leadStatusFilterId, paymentPendingOnly]);

  const [conversationRenderLimit, setConversationRenderLimit] = useState(35);

  const handleRailScroll = useCallback(() => {
    const el = railScrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
      setConversationRenderLimit((prev) => Math.min(filteredConversations.length, prev + 35));
    }
  }, [filteredConversations.length]);

  const renderedConversations = useMemo(() => {
    if (filteredConversations.length <= conversationRenderLimit) {
      return filteredConversations;
    }
    const activeIndex = filteredConversations.findIndex((item) => item.id === selectedConversationId);
    const effectiveLimit = activeIndex >= conversationRenderLimit ? activeIndex + 15 : conversationRenderLimit;
    return filteredConversations.slice(0, effectiveLimit);
  }, [filteredConversations, conversationRenderLimit, selectedConversationId]);

  const activeConversation = selectedConversationId
    ? filteredConversations.find((conversation) => conversation.id === selectedConversationId) ?? null
    : null;
  const activeAssignment = activeConversation?.assignmentSummary ?? null;
  const activeConversationId = activeConversation?.id ?? null;
  const normalizedVisibleLanes = useMemo<DummyConversationLane[]>(() => {
    const activeVisibleLanes = (Array.isArray(activeConversation?.visibleLanes) ? activeConversation.visibleLanes : []).filter(
      (lane): lane is DummyConversationLane => lane === "customer" || lane === "internal",
    );
    return activeVisibleLanes.length > 0 ? activeVisibleLanes : (["customer", "internal"] as DummyConversationLane[]);
  }, [activeConversation?.visibleLanes]);
  const resolvedLane = normalizedVisibleLanes.includes(activeLane) ? activeLane : normalizedVisibleLanes[0] ?? "customer";
  const activeLeadStatus = effectiveLeadStatuses.find((status) => status.id === activeConversation?.leadStatusId) ?? effectiveLeadStatuses[0] ?? null;
  const activeAssignedEditor = assignableEditors.find((editor) => editor.id === activeAssignment?.assignedFreelancerId) ?? null;
  const activeAgencyContext = activeConversation?.agencyContext ?? null;
  const activeFreelancerLanePermission = activeConversation?.freelancerCustomerLanePermission ?? null;
  const activePendingOffer = activeConversation?.myAssignmentOffer ?? activeAssignment?.myOffer ?? null;
  const activeLaneCapabilities = activeConversation?.laneCapabilities ?? null;
  const activeLeadStatusLabel = activeConversation?.leadStatusLabel?.trim() || activeLeadStatus?.label || "New";
  const activeLeadStatusTone = activeConversation?.leadStatusTone ?? activeLeadStatus?.tone ?? "neutral";
  const activeCustomerName = activeConversation?.customerDisplayName?.trim() || "Unknown customer";
  const activeServiceTitle = activeConversation?.serviceTitle?.trim() || "";
  const activeCustomerPhone = normalizeDisplayText(activeConversation?.customerPhoneDisplay?.trim() || "Customer contact hidden");
  const activeCustomerHeaderContact = audience === "freelancer" ? "Customer contact hidden" : activeCustomerPhone;
  const activeBusinessPhone = activeConversation?.businessPhoneDisplay?.trim() || "";
  useEffect(() => {
    if (isClientAliasModalOpen) {
      setClientAliasValue(activeCustomerName);
    }
  }, [activeCustomerName, isClientAliasModalOpen]);
  useEffect(() => {
    if (isPaymentModalOpen) {
      setPaymentProjectTitle(activeServiceTitle || activeConversation?.summary?.trim() || "General project");
    }
  }, [activeConversation?.id, activeConversation?.summary, activeServiceTitle, isPaymentModalOpen]);
  const paymentSplitPreview = useMemo(() => {
    if ((audience === "admin" || audience === "manager") && resolvedLane === "customer") {
      return buildAgencyDirectPreview(Number(paymentAmount || 0));
    }
    return buildSplitPreview(Number(paymentAmount || 0), activeAssignment?.assignedFreelancerId);
  }, [activeAssignment?.assignedFreelancerId, audience, paymentAmount, resolvedLane]);
  const laneMessages = (Array.isArray(activeConversation?.messages) ? activeConversation.messages : []).filter((message) => message.lane === resolvedLane);
  const typingMessage = (Array.isArray(activeConversation?.typing) ? activeConversation.typing : []).find((entry) => {
    if (entry.lane !== resolvedLane || entry.role === audience) {
      return false;
    }
    const updatedMs = Number(new Date(entry.updatedAt).getTime());
    return Number.isFinite(updatedMs) && presenceNowMs - updatedMs <= CHAT_TYPING_FRESH_WINDOW_MS;
  });
  const customerPresenceLabel = useMemo(() => {
    if (!activeConversation || audience === "customer" || resolvedLane !== "customer" || typingMessage) {
      return "";
    }

    let lastActiveMs = Number(new Date(activeConversation.lastCustomerActivityAt).getTime());
    if (!Number.isFinite(lastActiveMs)) {
      lastActiveMs = 0;
    }

    const customerMessage = [...activeConversation.messages]
      .reverse()
      .find((message) => message.lane === "customer" && message.senderRole === "customer");
    if (customerMessage?.createdAt) {
      const messageMs = Number(new Date(customerMessage.createdAt).getTime());
      if (Number.isFinite(messageMs) && messageMs > lastActiveMs) {
        lastActiveMs = messageMs;
      }
    }

    const customerTypingUpdate = [...activeConversation.typing]
      .reverse()
      .find((entry) => entry.lane === "customer" && entry.role === "customer");
    if (customerTypingUpdate?.updatedAt) {
      const typingMs = Number(new Date(customerTypingUpdate.updatedAt).getTime());
      if (Number.isFinite(typingMs) && typingMs > lastActiveMs) {
        lastActiveMs = typingMs;
      }
    }

    if (!lastActiveMs) {
      return "Offline";
    }

  if (presenceNowMs - lastActiveMs <= CHAT_ONLINE_WINDOW_MS) {
    return "Online";
  }

  return `Last reply ${formatPresenceAgoLabel(lastActiveMs, presenceNowMs)}`;
}, [activeConversation, audience, presenceNowMs, resolvedLane, typingMessage]);
  const normalizedDraft = typeof messageDraft === "string" ? messageDraft.trim() : "";
  const hasDraft = normalizedDraft.length > 0;
  const latestPaymentRequest = activeConversation?.latestPaymentRequest;
  const showConversationRail = !isCompactChatLayout || !isMobileThreadViewOpen;
  const showConversationStage = !isCompactChatLayout || isMobileThreadViewOpen;
  const isFreelancerCustomerLane = audience === "freelancer" && resolvedLane === "customer";
  const isFreelancerCustomerLaneReadOnly =
    audience === "freelancer" &&
    (activeConversation?.capabilities
      ? (resolvedLane === "customer" ? !activeConversation.capabilities.canSendCustomerMessage : !activeConversation.capabilities.canSendInternalMessage)
      : !Boolean(activeLaneCapabilities?.[resolvedLane]?.writable));
  const activeLaneReadOnlyReason =
    activeLaneCapabilities?.[resolvedLane]?.reason ||
    (resolvedLane === "customer"
      ? activeFreelancerLanePermission?.transportState === "blocked"
        ? activeFreelancerLanePermission.transportNote
        : "Client messaging is set to read-only by agency. Use the internal team lane to coordinate with your manager."
      : "Only the primary editor can reply in this project lane.");
  const canManageFreelancerCustomerAccess =
    (audience === "admin" || audience === "manager") && Boolean(activeAssignment?.assignedFreelancerId);
  const canManagePayments = audience === "admin" || audience === "manager";
  const canRequestPaymentInternal = audience === "freelancer" && resolvedLane === "internal";
  const showPaymentAction = (canManagePayments && resolvedLane === "customer") || canRequestPaymentInternal;
  const showReviewFlowAction =
    resolvedLane === "customer" &&
    (audience === "admin" || audience === "manager" || (audience === "freelancer" && Boolean(activeFreelancerLanePermission?.enabled)));
  const paymentActionLabel = canRequestPaymentInternal ? "Generate bill" : "Send payment request";

  const micStatusLabel =
    micPermissionState === "denied"
      ? "Blocked"
      : micPermissionState === "granted"
        ? "Allowed"
        : micPermissionState === "prompt"
          ? "Needs permission"
          : micPermissionState === "unsupported"
            ? "Unsupported"
            : "Unknown";

  const shouldHydrateConversationProfilePicture = useCallback((conversation: DummyConversationView) => {
    if (requestedProfilePictureIdsRef.current.has(conversation.id)) {
      return false;
    }

    const retryAt = failedProfilePictureRetryAtRef.current.get(conversation.id) ?? 0;
    if (retryAt > Date.now()) {
      return false;
    }

    const normalizedImageUrl = normalizeAvatarImageUrl(conversation.customerProfileImageUrl);
    return !normalizedImageUrl || isMetaHostedAvatarUrl(normalizedImageUrl);
  }, []);

  const requestConversationProfilePicture = useCallback(
    (conversation: DummyConversationView, options?: { refresh?: boolean }) => {
      if (!isMountedRef.current || !shouldHydrateConversationProfilePicture(conversation)) {
        return;
      }

      requestedProfilePictureIdsRef.current.add(conversation.id);
      const controller = new AbortController();
      profilePictureAbortControllersRef.current.add(controller);

      void fetchConversationProfilePicture(conversation.id, {
        refresh: options?.refresh ?? isMetaHostedAvatarUrl(conversation.customerProfileImageUrl),
        signal: controller.signal,
      })
        .then((customerProfileImageUrl) => {
          if (!isMountedRef.current || controller.signal.aborted) {
            return;
          }

          failedProfilePictureRetryAtRef.current.delete(conversation.id);
          if (!normalizeAvatarImageUrl(customerProfileImageUrl)) {
            return;
          }

          setConversations((current) =>
            current.map((item) =>
              item.id === conversation.id
                ? {
                    ...item,
                    customerProfileImageUrl,
                  }
                : item,
            ),
          );
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : 0;
          failedProfilePictureRetryAtRef.current.set(
            conversation.id,
            Date.now() + (status === 404 ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000),
          );
        })
        .finally(() => {
          profilePictureAbortControllersRef.current.delete(controller);
        });
    },
    [shouldHydrateConversationProfilePicture],
  );

  const abortChatBackgroundWork = useCallback(() => {
    inboxAbortControllerRef.current?.abort();
    inboxAbortControllerRef.current = null;
    profilePictureAbortControllersRef.current.forEach((controller) => controller.abort());
    profilePictureAbortControllersRef.current.clear();
    syncBurstTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    syncBurstTimeoutsRef.current = [];
    if (conversationEventsRefreshTimeoutRef.current) {
      window.clearTimeout(conversationEventsRefreshTimeoutRef.current);
      conversationEventsRefreshTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestConversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const visibleCandidates = [
      activeConversation ?? undefined,
      ...filteredConversations.slice(0, CHAT_PROFILE_PICTURE_VISIBLE_LIMIT),
    ].filter((conversation, index, items): conversation is DummyConversationView => {
      if (!conversation) {
        return false;
      }
      return items.findIndex((item) => item?.id === conversation.id) === index;
    });

    const missingProfilePictures = visibleCandidates
      .filter(shouldHydrateConversationProfilePicture)
      .slice(0, CHAT_PROFILE_PICTURE_BATCH_SIZE);

    if (!missingProfilePictures.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      missingProfilePictures.forEach((conversation) => {
        requestConversationProfilePicture(conversation);
      });
    }, activeConversationId ? 0 : CHAT_PROFILE_PICTURE_BATCH_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [
    activeConversation,
    activeConversationId,
    filteredConversations,
    requestConversationProfilePicture,
    shouldHydrateConversationProfilePicture,
  ]);
  useEffect(() => {
    if (!activeConversationId || refreshedProfilePictureIdsRef.current.has(activeConversationId)) {
      return;
    }

    refreshedProfilePictureIdsRef.current.add(activeConversationId);
    const controller = new AbortController();
    profilePictureAbortControllersRef.current.add(controller);

    void fetchConversationProfilePicture(activeConversationId, { refresh: true, signal: controller.signal })
      .then((customerProfileImageUrl) => {
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        failedProfilePictureRetryAtRef.current.delete(activeConversationId);
        if (!normalizeAvatarImageUrl(customerProfileImageUrl)) {
          refreshedProfilePictureIdsRef.current.delete(activeConversationId);
          return;
        }

        setConversations((current) =>
          current.map((item) =>
            item.id === activeConversationId
              ? {
                  ...item,
                  customerProfileImageUrl,
                }
              : item,
          ),
        );
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return;
        }

        const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : 0;
        if (status === 404) {
          failedProfilePictureRetryAtRef.current.set(activeConversationId, Date.now() + 24 * 60 * 60 * 1000);
          refreshedProfilePictureIdsRef.current.delete(activeConversationId);
          return;
        }
        failedProfilePictureRetryAtRef.current.set(activeConversationId, Date.now() + 5 * 60 * 1000);
        refreshedProfilePictureIdsRef.current.delete(activeConversationId);
      })
      .finally(() => {
        profilePictureAbortControllersRef.current.delete(controller);
      });
  }, [activeConversationId]);

  useEffect(() => {
    if (!isCompactChatLayout || !requestedConversationId) {
      return;
    }

    if (filteredConversations.some((conversation) => conversation.id === requestedConversationId)) {
      setIsMobileThreadViewOpen(true);
    }
  }, [filteredConversations, isCompactChatLayout, requestedConversationId]);

  useEffect(() => {
    if (!isCompactChatLayout || activeConversation) {
      return;
    }

    setIsMobileThreadViewOpen(false);
  }, [activeConversation, isCompactChatLayout]);

  useEffect(() => {
    if (!isCompactChatLayout || typeof window === "undefined") {
      return undefined;
    }

    const syncFromLocation = () => {
      if (window.location.hash === "#chat-thread") {
        setIsMobileThreadViewOpen(true);
        return;
      }
      setIsMobileThreadViewOpen(false);
    };

    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener("hashchange", syncFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener("hashchange", syncFromLocation);
    };
  }, [isCompactChatLayout]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 860px)");
    const syncCompactLayout = (event?: MediaQueryList | MediaQueryListEvent) => {
      const matches = event ? event.matches : mediaQuery.matches;
      setIsCompactChatLayout(matches);
    };

    syncCompactLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncCompactLayout);
      return () => mediaQuery.removeEventListener("change", syncCompactLayout);
    }

    mediaQuery.addListener(syncCompactLayout);
    return () => mediaQuery.removeListener(syncCompactLayout);
  }, []);

  useEffect(() => {
    window.addEventListener("gigxomi:internal-navigation-start", abortChatBackgroundWork);
    return () => window.removeEventListener("gigxomi:internal-navigation-start", abortChatBackgroundWork);
  }, [abortChatBackgroundWork]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortChatBackgroundWork();
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      }
      cleanupDirectMp3();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (notificationAudioContextRef.current) {
        notificationAudioContextRef.current.close().catch(() => undefined);
        notificationAudioContextRef.current = null;
      }
      if (notificationAudioElementRef.current) {
        notificationAudioElementRef.current.pause();
        notificationAudioElementRef.current = null;
      }
      foregroundPushUnsubscribeRef.current?.();
      foregroundPushUnsubscribeRef.current = null;
    };
  }, [abortChatBackgroundWork, cleanupDirectMp3]);

  const playIncomingMessageChime = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!customNotificationSoundUnavailableRef.current) {
      try {
        const audio = notificationAudioElementRef.current ?? new Audio(CHAT_NOTIFICATION_SOUND_URL);
        notificationAudioElementRef.current = audio;
        audio.currentTime = 0;
        audio.volume = 0.82;
        await audio.play();
        return;
      } catch {
        customNotificationSoundUnavailableRef.current = true;
      }
    }

    try {
      const AudioContextImpl =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextImpl) {
        return;
      }

      const context = notificationAudioContextRef.current ?? new AudioContextImpl();
      notificationAudioContextRef.current = context;
      if (context.state === "suspended") {
        await context.resume();
      }

      const now = context.currentTime;
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      masterGain.connect(context.destination);

      const pulse = (startAt: number, fromHz: number, toHz: number, peak = 0.7) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(fromHz, startAt);
        oscillator.frequency.exponentialRampToValueAtTime(toHz, startAt + 0.2);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28);
        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.3);
      };

      pulse(now, 1040, 760, 0.78);
      pulse(now + 0.23, 1320, 920, 0.74);
      pulse(now + 0.5, 1120, 820, 0.68);
    } catch {
      // Browser audio alerts are best-effort only.
    }
  }, []);

  const showChatBrowserNotification = useCallback(
    async ({
      conversation,
      message,
    }: {
      conversation: DummyConversationView;
      message: DummyConversationView["messages"][number];
    }) => {
      if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      const deepLinkUrl = `${window.location.pathname}?conversationId=${encodeURIComponent(conversation.id)}`;
      const notificationOptions: NotificationOptions & { badge?: string; renotify?: boolean } = {
        body: summarizeIncomingMessage(message, audience),
        icon: new URL("/gigxomi-logo.png", window.location.origin).toString(),
        badge: new URL("/gigxomi-logo.png", window.location.origin).toString(),
        tag: `gigxomi-chat-${conversation.id}`,
        renotify: true,
        requireInteraction: true,
        data: {
          type: "CHAT_NEW_MESSAGE",
          conversationId: conversation.id,
          deepLinkUrl,
        },
      };

      try {
        const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/") : null;
        if (registration) {
          await registration.showNotification(conversation.customerDisplayName, notificationOptions);
          return;
        }
      } catch {
        // Fall back to the browser Notification constructor below.
      }

      try {
        const notification = new Notification(conversation.customerDisplayName, notificationOptions);
        notification.onclick = () => {
          window.focus();
          setSelectedConversationId(conversation.id);
          setActiveLane(getPreferredConversationLane(conversation, audience));
          notification.close();
        };
      } catch {
        // Browser notifications are best-effort only.
      }
    },
    [audience],
  );

  const handleForegroundChatPush = useCallback<WebPushForegroundHandler>((payload) => {
    if (payload.data?.type !== "CHAT_NEW_MESSAGE") {
      return;
    }

    const conversationId = payload.data.conversationId?.trim();
    if (conversationId) {
      recentForegroundPushRef.current = { conversationId, at: Date.now() };
    }

    void playIncomingMessageChime();
  }, [playIncomingMessageChime]);

  useEffect(() => {
    if (audience === "customer") {
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotificationSetupStatus("unsupported");
      return;
    }

    notificationPermissionRef.current = Notification.permission;
    if (Notification.permission === "denied") {
      setNotificationSetupStatus("blocked");
      return;
    }

    if (Notification.permission !== "granted") {
      setNotificationSetupStatus("idle");
      return;
    }

    let cancelled = false;
    foregroundPushUnsubscribeRef.current?.();
    foregroundPushUnsubscribeRef.current = null;
    void startWebPushNotifications({
      requestPermission: false,
      showForegroundNotification: true,
      onForegroundMessage: handleForegroundChatPush,
    })
      .then((result) => {
        if (cancelled) {
          result.unsubscribe?.();
          return;
        }

        foregroundPushUnsubscribeRef.current = result.unsubscribe ?? null;
        notificationPermissionRef.current = result.permission ?? Notification.permission;
        setNotificationSetupStatus(result.ok ? "ready" : mapWebPushStatus(result.status));
      })
      .catch(() => {
        if (!cancelled) {
          setNotificationSetupStatus("error");
        }
      });

    return () => {
      cancelled = true;
      foregroundPushUnsubscribeRef.current?.();
      foregroundPushUnsubscribeRef.current = null;
    };
  }, [audience, handleForegroundChatPush]);

  const notifyAboutIncomingMessages = useCallback((items: DummyConversationView[]) => {
    const nextKeys: Record<string, string> = {};
    const notifications: Array<{ conversation: DummyConversationView; message: DummyConversationView["messages"][number] }> = [];
    let shouldPlayChime = false;

    for (const conversation of items) {
      const latestIncoming = getLatestIncomingMessage(conversation, audience);
      if (!latestIncoming) {
        continue;
      }

      const key = getConversationMessageKey(latestIncoming);
      nextKeys[conversation.id] = key;

      if (!hasInitializedNotificationsRef.current) {
        continue;
      }

      const previousKey = lastIncomingMessageKeysRef.current[conversation.id];
      if (previousKey === key) {
        continue;
      }

      const recentForegroundPush = recentForegroundPushRef.current;
      const wasJustHandledByPush =
        recentForegroundPush?.conversationId === conversation.id &&
        Date.now() - recentForegroundPush.at < CHAT_FOREGROUND_PUSH_DEDUPE_MS;

      if (!wasJustHandledByPush) {
        shouldPlayChime = true;
      }

      if (!wasJustHandledByPush && notificationPermissionRef.current === "granted" && typeof window !== "undefined") {
        notifications.push({ conversation, message: latestIncoming });
      }
    }

    lastIncomingMessageKeysRef.current = nextKeys;
    if (!hasInitializedNotificationsRef.current) {
      hasInitializedNotificationsRef.current = true;
      return;
    }

    if (shouldPlayChime) {
      void playIncomingMessageChime();
    }

    notifications.slice(0, 3).forEach(({ conversation, message }) => {
      void showChatBrowserNotification({ conversation, message });
    });
  }, [audience, playIncomingMessageChime, showChatBrowserNotification]);
  const serviceOptions = useMemo(() => {
    const serviceMap = new Map<string, { id: string; title: string }>();
    conversations.forEach((conversation) => {
      if (!serviceMap.has(conversation.serviceId)) {
        serviceMap.set(conversation.serviceId, { id: conversation.serviceId, title: conversation.serviceTitle });
      }
    });
    return Array.from(serviceMap.values());
  }, [conversations]);

  const loadConversations = useCallback((options?: { silent?: boolean; includeSupportData?: boolean }) => {
    if (inboxLoadPromiseRef.current) {
      return inboxLoadPromiseRef.current;
    }

    if (!options?.silent) {
      setIsInboxLoading(true);
    }

    const includeSupportData = options?.includeSupportData ?? false;
    const controller = new AbortController();
    inboxAbortControllerRef.current = controller;
    const request = (async () => {
      try {
        const payload = await fetchConversations({
          audience,
          customerId: audience === "customer" ? customerId : undefined,
          includeSupportData,
          serviceId: serviceIdFilter,
          tenantId,
          signal: controller.signal,
        });
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }
        if (payload.supportDataIncluded !== false) {
          setAssignableEditors(payload.assignableEditors ?? []);
          setLeadStatuses(payload.leadStatuses ?? []);
          setTemplates(payload.templates ?? []);
          setHasLoadedSupportData(true);
        }
        const signature = makeConversationSignature(payload);
        if (signature === lastPayloadSignatureRef.current) {
          return;
        }
        lastPayloadSignatureRef.current = signature;
        const nextConversations = payload.conversations ?? [];
        notifyAboutIncomingMessages(nextConversations);
        chatModuleCache.set(cacheKey, {
          conversations: nextConversations,
          assignableEditors: payload.assignableEditors ?? assignableEditors,
          leadStatuses: payload.leadStatuses ?? leadStatuses,
          templates: payload.templates ?? templates,
          timestamp: Date.now(),
        });
        setConversations((current) => {
          return nextConversations.map((nextConv) => {
            const existing = current.find((c) => c.id === nextConv.id);
            if (!existing) return nextConv;
            // Preserve full message history if existing conversation has more messages than
            // the lightweight (slice(-3)) inbox payload, and append any new incoming messages
            let mergedMessages = nextConv.messages;
            if (existing.messages.length > nextConv.messages.length) {
              const existingIds = new Set(existing.messages.map((m) => m.id));
              const newIncoming = nextConv.messages.filter((m) => !existingIds.has(m.id));
              mergedMessages = [...existing.messages, ...newIncoming];
            }
            const pendingOptimistic = existing.messages.filter(
              (m) =>
                m.id.startsWith("temp-") &&
                !mergedMessages.some(
                  (nm) =>
                    nm.id === m.id ||
                    (nm.body.trim() === m.body.trim() &&
                      Math.abs(new Date(nm.createdAt).getTime() - new Date(m.createdAt).getTime()) < 30000),
                ),
            );
            return {
              ...nextConv,
              messages: pendingOptimistic.length ? [...mergedMessages, ...pendingOptimistic] : mergedMessages,
            };
          });
        });
        setSelectedConversationId((current) => {
          const shouldApplyRequested =
            requestedConversationId &&
            requestedConversationAppliedRef.current !== requestedConversationId &&
            nextConversations.some((conversation) => conversation.id === requestedConversationId);
          if (shouldApplyRequested) {
            requestedConversationAppliedRef.current = requestedConversationId;
            return requestedConversationId;
          }
          return resolveSelectedConversation(current, nextConversations);
        });
      } catch (error: unknown) {
        if (isAbortError(error) || !isMountedRef.current) {
          return;
        }
        if (!options?.silent || !conversations.length) {
          setComposerStatus("We could not refresh the chat inbox right now. Please retry once.");
        }
      } finally {
        if (isMountedRef.current && !options?.silent) {
          setIsInboxLoading(false);
        }
        if (inboxAbortControllerRef.current === controller) {
          inboxAbortControllerRef.current = null;
        }
        inboxLoadPromiseRef.current = null;
      }
    })();

    inboxLoadPromiseRef.current = request;
    return request;
  }, [audience, conversations.length, customerId, notifyAboutIncomingMessages, requestedConversationId, serviceIdFilter, tenantId]);

  const loadSupportData = useCallback(() => {
    if (hasLoadedSupportData) {
      return Promise.resolve();
    }
    if (supportDataLoadPromiseRef.current) {
      return supportDataLoadPromiseRef.current;
    }

    setIsSupportDataLoading(true);
    const request = (async () => {
      if (inboxLoadPromiseRef.current) {
        await inboxLoadPromiseRef.current;
      }
      await loadConversations({ silent: true, includeSupportData: true });
    })().finally(() => {
      supportDataLoadPromiseRef.current = null;
      setIsSupportDataLoading(false);
    });
    supportDataLoadPromiseRef.current = request;
    return request;
  }, [hasLoadedSupportData, loadConversations]);

  const requestChatRefresh = useCallback(() => {
    if (inboxLoadPromiseRef.current) {
      return;
    }
    void loadConversations({ silent: true }).catch(() => undefined);
  }, [loadConversations]);

  const scheduleRealtimeChatRefresh = useCallback(() => {
    if (typeof window === "undefined" || conversationEventsRefreshTimeoutRef.current) {
      return;
    }

    const delay = document.visibilityState === "hidden" ? 250 : 80;
    conversationEventsRefreshTimeoutRef.current = window.setTimeout(() => {
      conversationEventsRefreshTimeoutRef.current = null;
      if (messageSendLockRef.current || inboxLoadPromiseRef.current) {
        return;
      }
      void loadConversations({ silent: true }).catch(() => undefined);
    }, delay);
  }, [loadConversations]);

  const scheduleChatSyncBurst = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    syncBurstTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    syncBurstTimeoutsRef.current = CHAT_SYNC_BURST_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        requestChatRefresh();
      }, delay),
    );
  }, [requestChatRefresh]);

  function patchConversationLocally(conversationId: string, patch: Partial<DummyConversationView>) {
    setConversations((current) => current.map((conversation) => (conversation.id === conversationId ? { ...conversation, ...patch } : conversation)));
  }

  function replaceConversationLocally(nextConversation: DummyConversationView) {
    setConversations((current) => {
      const existingIndex = current.findIndex((conversation) => conversation.id === nextConversation.id);
      if (existingIndex === -1) {
        return [nextConversation, ...current];
      }
      const existing = current[existingIndex];
      const pendingOptimistic = existing.messages.filter(
        (m) =>
          m.id.startsWith("temp-") &&
          !nextConversation.messages.some(
            (nm) =>
              nm.id === m.id ||
              (nm.body.trim() === m.body.trim() &&
                Math.abs(new Date(nm.createdAt).getTime() - new Date(m.createdAt).getTime()) < 30000),
          ),
      );
      const next = [...current];
      next[existingIndex] = pendingOptimistic.length
        ? { ...nextConversation, messages: [...nextConversation.messages, ...pendingOptimistic] }
        : nextConversation;
      return next;
    });
  }

  function removeOptimisticMessageLocally(conversationId: string, optimisticMessageId: string) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.filter((message) => message.id !== optimisticMessageId),
            }
          : conversation,
      ),
    );
  }

  function buildOptimisticOutgoingMessage(
    conversation: DummyConversationView,
    lane: DummyConversationLane,
    body: string,
  ): DummyConversationView["messages"][number] {
    const createdAt = new Date().toISOString();
    const senderLabel =
      audience === "freelancer"
        ? conversation.assignedFreelancerName || "Freelancer"
        : audience === "manager"
          ? conversation.ownerName || "Rahul Manager"
          : audience === "sales"
            ? "Gigxomi Sales"
          : "Gigxomi Studio";

    return {
      id: `temp-${conversation.id}-${createdAt}`,
      lane,
      senderRole: audience,
      senderLabel,
      body,
      deliveryStatus: lane === "customer" && audience !== "customer" ? "sent" : undefined,
      createdAt,
    };
  }

  function syncConversationLocally(
    nextConversation: unknown,
    reason: "assignment" | "permission" | "message" | "payment" | "lead-status" | "new-chat" | "client-alias",
  ) {
    if (!isConversationView(nextConversation)) {
      broadcastChatWorkspaceSync({ reason, conversationId: activeConversationId ?? undefined });
      void loadConversations({ silent: true }).catch(() => undefined);
      return;
    }
    replaceConversationLocally(nextConversation);
    setSelectedConversationId(nextConversation.id);
    broadcastChatWorkspaceSync({ reason, conversationId: nextConversation.id });
  }

  const clearTypingTimers = useCallback(() => {
    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }
    if (typingHeartbeatIntervalRef.current) {
      window.clearInterval(typingHeartbeatIntervalRef.current);
      typingHeartbeatIntervalRef.current = null;
    }
  }, []);

  const postTypingStateUpdate = useCallback(
    async (conversationId: string, lane: DummyConversationLane, active: boolean) => {
      try {
        await fetch(`/api/conversations/${conversationId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: audience, lane, active }),
        });
      } catch {
        // Typing signals are best-effort only.
      }
    },
    [audience],
  );

  const updateOutboundTypingState = useCallback(
    (
      active: boolean,
      options?: {
        conversationId?: string;
        lane?: DummyConversationLane;
        force?: boolean;
      },
    ) => {
      const conversationId = options?.conversationId ?? activeConversationId;
      const lane = options?.lane ?? (audience === "customer" ? "customer" : resolvedLane);
      if (!conversationId) {
        return;
      }

      if (active && audience === "freelancer" && lane === "customer" && isFreelancerCustomerLaneReadOnly) {
        return;
      }

      const current = outboundTypingStateRef.current;
      if (!options?.force && current?.conversationId === conversationId && current.lane === lane && current.active === active) {
        return;
      }

      outboundTypingStateRef.current = { conversationId, lane, active };
      void postTypingStateUpdate(conversationId, lane, active);

      if (!active) {
        if (typingHeartbeatIntervalRef.current) {
          window.clearInterval(typingHeartbeatIntervalRef.current);
          typingHeartbeatIntervalRef.current = null;
        }
        return;
      }

      if (typingHeartbeatIntervalRef.current) {
        window.clearInterval(typingHeartbeatIntervalRef.current);
      }
      typingHeartbeatIntervalRef.current = window.setInterval(() => {
        const latestState = outboundTypingStateRef.current;
        if (!latestState?.active) {
          return;
        }
        void postTypingStateUpdate(latestState.conversationId, latestState.lane, true);
      }, WHATSAPP_TYPING_HEARTBEAT_MS);
    },
    [activeConversationId, audience, isFreelancerCustomerLaneReadOnly, postTypingStateUpdate, resolvedLane],
  );

  const markConversationRead = useCallback(async (conversationId: string) => {
    patchConversationLocally(conversationId, {
      unreadCount: 0,
      unreadCountByLane: {
        customer: 0,
        internal: 0,
      },
    });
    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience }),
      });
      if (!response.ok) {
        throw new Error(`Read sync failed with ${response.status}`);
      }
      scheduleChatSyncBurst();
    } catch {
      setComposerStatus("Read state could not sync, but the thread stays visible.");
      void loadConversations({ silent: true }).catch(() => undefined);
    }
  }, [audience, loadConversations, scheduleChatSyncBurst]);

  useEffect(() => {
    const hasCached = Boolean(chatModuleCache.get(cacheKey)?.conversations?.length);
    const timeout = window.setTimeout(() => {
      loadConversations({ silent: hasCached, includeSupportData: !hasCached }).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [cacheKey, loadConversations]);

  useEffect(() => {
    if (hasLoadedSupportData) {
      return;
    }

    if (!isAssignMenuOpen && !isLeadStatusMenuOpen && !isNewChatOpen && !isPaymentModalOpen) {
      return;
    }

    loadSupportData().catch(() => undefined);
  }, [hasLoadedSupportData, isAssignMenuOpen, isLeadStatusMenuOpen, isNewChatOpen, isPaymentModalOpen, loadSupportData]);

  useEffect(() => {
    if (isLeadStatusMenuOpen && leadStatuses.length === 0) {
      loadConversations({ silent: true, includeSupportData: true }).catch(() => undefined);
    }
  }, [isLeadStatusMenuOpen, leadStatuses.length, loadConversations]);

  useEffect(() => {
    if (instagramConnected === "1") {
      setComposerStatus("Instagram Inbox connected. Replies will now use the connected Instagram permissions.");
      return;
    }

    if (instagramError) {
      setComposerStatus(instagramError);
      return;
    }

    if (!phonePePaymentStatus) {
      return;
    }

    if (phonePePaymentStatus === "success") {
      setComposerStatus("PhonePe payment completed and marked paid.");
      return;
    }

    if (phonePePaymentStatus === "failed") {
      setComposerStatus(phonePePaymentMessage || "PhonePe payment failed or was cancelled.");
      return;
    }

    if (phonePePaymentStatus === "pending") {
      setComposerStatus(phonePePaymentMessage || "PhonePe returned before confirmation. Refresh chat after a few seconds.");
      return;
    }

    setComposerStatus(phonePePaymentMessage || "PhonePe payment status could not be confirmed.");
  }, [instagramConnected, instagramError, phonePePaymentMessage, phonePePaymentStatus]);

  useEffect(() => {
    if (!isPaymentModalOpen || audience !== "freelancer") {
      return;
    }

    if (freelancerPayeeUpiId) {
      return;
    }

    fetchFreelancerPaymentDetails()
      .then((details) => {
        setFreelancerPayeeUpiId(details.upiId);
        setFreelancerPayeeName(details.payeeName);
      })
      .catch(() => {
        setFreelancerPayeeUpiId("");
        setFreelancerPayeeName("");
      });
  }, [audience, freelancerPayeeUpiId, isPaymentModalOpen]);

  useEffect(() => {
    if (!activeConversation || activeConversation.sourceChannel !== "instagram") {
      return;
    }
    const name = (activeConversation.customerDisplayName || "").trim();
    const isGenericName = !name || name === "Instagram Customer" || name.startsWith("Customer ");
    if (isGenericName && !syncedInstagramIdsRef.current.has(activeConversation.id)) {
      syncedInstagramIdsRef.current.add(activeConversation.id);
      void handleSyncInstagramProfile(activeConversation.id);
    }
  }, [activeConversation?.id, activeConversation?.customerDisplayName, activeConversation?.sourceChannel]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !messageSendLockRef.current &&
        !inboxLoadPromiseRef.current
      ) {
        loadConversations({ silent: true }).catch(() => undefined);
      }
    }, CHAT_VISIBLE_SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (audience === "customer" || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const params = new URLSearchParams({ audience });
    if (tenantId) params.set("tenantId", tenantId);
    const source = new EventSource(`/api/conversations/events?${params.toString()}`, {
      withCredentials: true,
    });
    eventSourceRef.current = source;

    source.addEventListener("ready", () => {
      conversationEventsLastSignatureRef.current = "";
    });

    source.addEventListener("sync", (event) => {
      let payload: { signature?: string };
      try {
        payload = JSON.parse(event.data || "{}") as { signature?: string };
      } catch {
        payload = {};
      }
      const signature = payload.signature ?? "";
      if (conversationEventsLastSignatureRef.current && conversationEventsLastSignatureRef.current === signature) {
        return;
      }
      conversationEventsLastSignatureRef.current = signature;
      scheduleRealtimeChatRefresh();
    });

    return () => {
      source.close();
      if (eventSourceRef.current === source) {
        eventSourceRef.current = null;
      }
    };
  }, [audience, scheduleRealtimeChatRefresh, tenantId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPresenceNowMs(Date.now());
    }, CHAT_PRESENCE_TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const expectedLane = audience === "customer" ? "customer" : resolvedLane;
    const outboundTyping = outboundTypingStateRef.current;
    if (!outboundTyping?.active) {
      return;
    }

    if (outboundTyping.conversationId === activeConversationId && outboundTyping.lane === expectedLane) {
      return;
    }

    updateOutboundTypingState(false, {
      conversationId: outboundTyping.conversationId,
      lane: outboundTyping.lane,
      force: true,
    });
  }, [activeConversationId, audience, resolvedLane, updateOutboundTypingState]);

  useEffect(() => {
    if (!activeConversationId || isMessageSending || isFreelancerCustomerLaneReadOnly) {
      clearTypingTimers();
      updateOutboundTypingState(false);
      return;
    }

    if (!normalizedDraft) {
      clearTypingTimers();
      updateOutboundTypingState(false);
      return;
    }

    updateOutboundTypingState(true);
    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = window.setTimeout(() => {
      updateOutboundTypingState(false);
    }, CHAT_TYPING_STOP_DEBOUNCE_MS);
  }, [
    activeConversationId,
    clearTypingTimers,
    isFreelancerCustomerLaneReadOnly,
    isMessageSending,
    normalizedDraft,
    updateOutboundTypingState,
  ]);

  useEffect(() => {
    return () => {
      clearTypingTimers();
      const outboundTyping = outboundTypingStateRef.current;
      if (outboundTyping?.active) {
        void postTypingStateUpdate(outboundTyping.conversationId, outboundTyping.lane, false);
      }
    };
  }, [clearTypingTimers, postTypingStateUpdate]);

  useEffect(() => {
    const refreshVisibleChat = () => {
      requestChatRefresh();
    };
    const refreshAfterVisibilityChange = () => {
      if (document.visibilityState !== "hidden") {
        requestChatRefresh();
      }
    };

    window.addEventListener("focus", refreshVisibleChat);
    document.addEventListener("visibilitychange", refreshAfterVisibilityChange);
    return () => {
      window.removeEventListener("focus", refreshVisibleChat);
      document.removeEventListener("visibilitychange", refreshAfterVisibilityChange);
    };
  }, [requestChatRefresh]);

  useEffect(() => {
    return subscribeToChatWorkspaceSync(() => {
      loadConversations({ silent: true }).catch(() => undefined);
    });
  }, [loadConversations]);

  useEffect(() => {
    if (
      requestedConversationId &&
      requestedConversationAppliedRef.current !== requestedConversationId &&
      conversations.some((conversation) => conversation.id === requestedConversationId)
    ) {
      const timeout = window.setTimeout(() => {
        requestedConversationAppliedRef.current = requestedConversationId;
        setSelectedConversationId(requestedConversationId);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [conversations, requestedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || !filteredConversations.length) {
      return;
    }
    if (!filteredConversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId("");
    }
  }, [filteredConversations, selectedConversationId]);

  useEffect(() => {
    if (!activeConversation) {
      laneSyncConversationIdRef.current = null;
      return;
    }
    const conversationChanged = laneSyncConversationIdRef.current !== activeConversation.id;
    const preferredLane = getPreferredConversationLane(activeConversation, audience);
    if (conversationChanged || !normalizedVisibleLanes.includes(activeLane)) {
      laneSyncConversationIdRef.current = activeConversation.id;
      setActiveLane(preferredLane);
    }
  }, [activeConversation, activeLane, audience, normalizedVisibleLanes]);

  useEffect(() => {
    if (!activeConversation || activeConversation.unreadCount === 0 || readRequestRef.current === activeConversation.id) {
      return;
    }
    readRequestRef.current = activeConversation.id;
    const timeout = window.setTimeout(() => {
      markConversationRead(activeConversation.id).finally(() => {
        if (readRequestRef.current === activeConversation.id) {
          readRequestRef.current = "";
        }
      });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeConversation, markConversationRead]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!composerTextareaRef.current) {
      return;
    }
    composerTextareaRef.current.style.height = "0px";
    composerTextareaRef.current.style.height = `${Math.min(composerTextareaRef.current.scrollHeight, 120)}px`;
  }, [messageDraft]);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messageScrollRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior });
    if (messageEndRef.current) {
      try {
        messageEndRef.current.scrollIntoView({ behavior, block: "end" });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const container = messageScrollRef.current;
    if (!container) {
      return;
    }

    const content = container.firstElementChild;

    const handleScroll = (event?: Event) => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (event && event.isTrusted) {
        shouldAutoScrollRef.current = distanceFromBottom <= 64;
      }
    };

    const keepPinnedToBottom = () => {
      if (!shouldAutoScrollRef.current) {
        return;
      }
      scrollMessagesToBottom("auto");
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      if (shouldAutoScrollRef.current) {
        scrollMessagesToBottom("auto");
      }
    });

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      keepPinnedToBottom();
    }) : null;
    resizeObserver?.observe(container);
    if (content instanceof HTMLElement) {
      resizeObserver?.observe(content);
    }

    scrollMessagesToBottom("auto");
    const t1 = setTimeout(() => scrollMessagesToBottom("auto"), 50);
    const t2 = setTimeout(() => scrollMessagesToBottom("auto"), 200);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeConversation?.id, laneMessages.length, resolvedLane]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }
    const isNewThread = lastConversationIdRef.current !== activeConversationId;
    if (isNewThread) {
      lastConversationIdRef.current = activeConversationId;
      shouldAutoScrollRef.current = true;
      scrollMessagesToBottom("auto");
      const t1 = setTimeout(() => scrollMessagesToBottom("auto"), 50);
      const t2 = setTimeout(() => scrollMessagesToBottom("auto"), 200);
      const t3 = setTimeout(() => scrollMessagesToBottom("auto"), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollMessagesToBottom("smooth")));
    }
  }, [activeConversationId, laneMessages.length, resolvedLane, scrollMessagesToBottom]);

  useEffect(() => {
    if (!isCompactChatLayout || !isMobileThreadViewOpen || !activeConversationId || typeof window === "undefined") {
      return;
    }

    shouldAutoScrollRef.current = true;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollMessagesToBottom("auto");
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
    };
  }, [activeConversationId, isCompactChatLayout, isMobileThreadViewOpen, laneMessages.length, resolvedLane, scrollMessagesToBottom]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    let isCurrent = true;
    const params = new URLSearchParams({ audience });
    fetch(`/api/conversations/${activeConversationId}/messages?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!isCurrent || !payload?.ok || !payload.conversation) {
          return;
        }
        replaceConversationLocally(payload.conversation);
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [activeConversationId, audience]);

  function closeTransientMenus() {
    setIsAttachMenuOpen(false);
    setIsEmojiTrayOpen(false);
    setIsFilterMenuOpen(false);
    setIsAssignMenuOpen(false);
    setIsLeadStatusMenuOpen(false);
  }

  function resetInboxFilters() {
    setSearchValue("");
    setActiveFilter("all");
    setChannelFilter("all");
    setAgencyFilter("all");
    setAssignedFilter("all");
    setPaymentPendingOnly(false);
    setLeadStatusFilterId("all");
    closeTransientMenus();
  }

  function closeMobileThreadView() {
    if (!isCompactChatLayout || typeof window === "undefined") {
      setIsMobileThreadViewOpen(false);
      return;
    }

    if (window.location.hash === "#chat-thread") {
      window.history.back();
      return;
    }

    setIsMobileThreadViewOpen(false);
  }

  const handleSelectConversation = useCallback(
    (conversation: DummyConversationView) => {
      setSelectedConversationId(conversation.id);
      setActiveLane(getPreferredConversationLane(conversation, audience));
      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("conversationId", conversation.id);
        if (requestedConversationId && requestedConversationId !== conversation.id) {
          requestedConversationAppliedRef.current = requestedConversationId;
        } else if (!requestedConversationId) {
          requestedConversationAppliedRef.current = conversation.id;
        }
        if (!isCompactChatLayout) {
          window.history.replaceState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        }
      }
      if (isCompactChatLayout && typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("conversationId", conversation.id);
        nextUrl.hash = "chat-thread";
        if (window.location.hash !== "#chat-thread") {
          window.history.pushState({ mobileChatThread: true }, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        } else {
          window.history.replaceState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        }
        shouldAutoScrollRef.current = true;
        setIsMobileThreadViewOpen(true);
      }
      setIsAttachMenuOpen(false);
      setIsEmojiTrayOpen(false);
      setIsFilterMenuOpen(false);
      setIsAssignMenuOpen(false);
      setIsLeadStatusMenuOpen(false);
      setIsDetailsOpen(false);
      if (conversation.unreadCount > 0) {
        markConversationRead(conversation.id).catch(() => undefined);
      }
    },
    [audience, isCompactChatLayout, markConversationRead, requestedConversationId],
  );

  async function sendMessage(messageInput: { body?: string; attachments?: PendingAttachment[] }) {
    if (!activeConversation || isMessageSending || messageSendLockRef.current) {
      return;
    }
    if (isFreelancerCustomerLaneReadOnly) {
      setComposerStatus(activeLaneReadOnlyReason);
      return;
    }
    const trimmedBody = messageInput.body?.trim() ?? "";
    const attachments = messageInput.attachments ?? [];
    if (!trimmedBody && !attachments.length) {
      return;
    }

    const conversationId = activeConversation.id;
    const lane = audience === "customer" ? "customer" : resolvedLane;
    const previousDraft = messageDraft;
    const previousAttachMenuState = isAttachMenuOpen;
    const previousEmojiTrayState = isEmojiTrayOpen;
    const optimisticMessage =
      trimmedBody && !attachments.length ? buildOptimisticOutgoingMessage(activeConversation, lane, trimmedBody) : null;

    messageSendLockRef.current = true;
    setIsMessageSending(true);
    setComposerStatus("");
    setMessageDraft("");
    updateOutboundTypingState(false);
    setIsAttachMenuOpen(false);
    setIsEmojiTrayOpen(false);

    if (optimisticMessage) {
      replaceConversationLocally({
        ...activeConversation,
        messages: [...activeConversation.messages, optimisticMessage],
        summary: optimisticMessage.body || activeConversation.summary,
      });
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: audience,
          lane,
          body: trimmedBody,
          visibility: (audience === "admin" || audience === "manager") && lane === "customer" && hideCustomerMessageFromFreelancer ? "client_private" : undefined,
          attachments,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (optimisticMessage) {
          removeOptimisticMessageLocally(conversationId, optimisticMessage.id);
        }
        setMessageDraft(previousDraft);
        setIsAttachMenuOpen(previousAttachMenuState);
        setIsEmojiTrayOpen(previousEmojiTrayState);
        setComposerStatus(payload?.error ?? "Message send failed.");
        lastPayloadSignatureRef.current = "";
        return;
      }

      if (payload?.delivery?.mode === "whatsapp-sent") {
        setComposerStatus("");
      } else if (payload?.delivery?.mode === "local-only" && audience !== "customer" && resolvedLane === "customer") {
        setComposerStatus(
          attachments.length
            ? `${attachments.map(summarizeAttachmentForStatus).join(", ")} sent.`
            : payload?.delivery?.error || "Message saved locally. Open WhatsApp setup to finish the Cloud API connection for this line.",
        );
      } else if (payload?.delivery?.mode === "whatsapp-failed") {
        setComposerStatus(payload?.delivery?.error ?? "WhatsApp send failed.");
      } else {
        setComposerStatus("");
      }

      if (payload?.conversation) {
        syncConversationLocally(payload.conversation, "message");
      } else {
        void loadConversations({ silent: true }).catch(() => undefined);
      }
      scheduleChatSyncBurst();
    } finally {
      setIsMessageSending(false);
      messageSendLockRef.current = false;
    }
  }

  async function handleSendMessage() {
    if (isMessageSending || messageSendLockRef.current) {
      return;
    }
    await sendMessage({ body: normalizedDraft });
  }

  function insertEmoji(emoji: string) {
    setMessageDraft((current) => `${current}${emoji}`);
    composerTextareaRef.current?.focus();
  }

  function handleEmojiClick(emojiData: EmojiClickData) {
    insertEmoji(emojiData.emoji);
  }

  async function getMicrophonePermissionState() {
    if (!navigator.permissions?.query) {
      return "unknown" as const;
    }
    try {
      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return status.state as "granted" | "denied" | "prompt";
    } catch {
      return "unknown" as const;
    }
  }

  async function collectMicDiagnostics(): Promise<MicDiagnostics> {
    const permissionQuery = await getMicrophonePermissionState();
    let audioInputCount: number | null = null;
    let enumerateDevicesError: string | undefined;

    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioInputCount = devices.filter((device) => device.kind === "audioinput").length;
      } catch (error) {
        const info = extractErrorInfo(error);
        enumerateDevicesError = info.name ? `${info.name}: ${info.message}` : info.message;
      }
    }

    const policy = (document as unknown as { permissionsPolicy?: unknown; featurePolicy?: unknown }).permissionsPolicy ??
      (document as unknown as { featurePolicy?: unknown }).featurePolicy;
    let permissionsPolicyAllowsMicrophone: boolean | null = null;
    try {
      if (policy && typeof (policy as { allowsFeature?: unknown }).allowsFeature === "function") {
        permissionsPolicyAllowsMicrophone = Boolean((policy as { allowsFeature: (name: string) => boolean }).allowsFeature("microphone"));
      }
    } catch {
      // ignore
    }

    return {
      origin: typeof location !== "undefined" ? location.origin : "",
      isSecureContext: typeof window !== "undefined" ? window.isSecureContext : false,
      inIframe: typeof window !== "undefined" ? window.self !== window.top : false,
      permissionQuery,
      audioInputCount,
      permissionsPolicyAllowsMicrophone,
      enumerateDevicesError,
    };
  }

  function openMicHelp(message: string, state: MicPermissionState, errorInfo?: MicErrorInfo | null) {
    forceStopMicrophone({ silent: true });
    setMicPermissionState(state);
    setMicHelpMessage(message);
    setMicLastError(errorInfo ?? null);
    setMicDiagnostics(null);
    setIsMicHelpOpen(true);

    void (async () => {
      const diagnostics = await collectMicDiagnostics();
      if (!isMountedRef.current) {
        return;
      }
      if (diagnostics.permissionQuery !== "unknown") {
        setMicPermissionState(diagnostics.permissionQuery);
      }
      setMicDiagnostics(diagnostics);
    })();
  }

  function stopActiveStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    voiceCaptureModeRef.current = "media";
  }

  function forceStopMicrophone(options?: { silent?: boolean }) {
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    recordingChunksRef.current = [];
    cleanupDirectMp3();
    stopActiveStream();
    setIsRecording(false);
    setIsConvertingVoice(false);
    recordingSecondsRef.current = 0;
    recordingStartTimeRef.current = null;
    setRecordingSeconds(0);
    if (!options?.silent) {
      setComposerStatus("Microphone stopped.");
    }
  }

  async function finalizeVoiceNote({
    rawBlob,
    rawMimeType,
    allowMp3Conversion,
    defaultNote,
  }: {
    rawBlob: Blob;
    rawMimeType: string;
    allowMp3Conversion: boolean;
    defaultNote: string;
  }) {
    if (!isMountedRef.current) {
      setIsConvertingVoice(false);
      return;
    }

    if (recordingSecondsRef.current <= 0 && recordingStartTimeRef.current !== null) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      recordingSecondsRef.current = Math.max(Math.round((now - recordingStartTimeRef.current) / 1000), 1);
    }

    let durationSeconds = Math.max(recordingSecondsRef.current, 1);
    recordingSecondsRef.current = 0;
    recordingStartTimeRef.current = null;

    let finalBlob = rawBlob;
    let finalMimeType = rawMimeType || rawBlob.type || "audio/webm";
    let finalName = `voice-note-${Date.now()}.${finalMimeType.includes("mpeg") ? "mp3" : "webm"}`;
    let note = defaultNote;
    let convertedDuration: number | null = null;

    if (allowMp3Conversion && finalMimeType !== "audio/mpeg") {
      try {
        const converted = await convertToMp3(rawBlob);
        finalBlob = converted.blob;
        finalMimeType = "audio/mpeg";
        convertedDuration = converted.duration;
        finalName = `voice-note-${Date.now()}.mp3`;
        note = "Voice note recorded in MP3 format.";
      } catch {
        note = defaultNote;
      }
    }

    const resolvedDuration = await resolveAudioDuration(finalBlob);
    if (resolvedDuration && Number.isFinite(resolvedDuration) && resolvedDuration > 0) {
      durationSeconds = Math.max(1, Math.round(resolvedDuration));
    } else if (convertedDuration && Number.isFinite(convertedDuration) && convertedDuration > 0) {
      durationSeconds = Math.max(1, Math.round(convertedDuration));
    }

    if (!activeConversation || activeConversation.id !== recordingConversationIdRef.current) {
      setComposerStatus("Voice note recorded, but the active chat changed before it could be sent.");
      setIsConvertingVoice(false);
      return;
    }

    await sendMessage({
      attachments: [
        {
          name: finalName,
          mimeType: finalMimeType,
          sizeBytes: finalBlob.size,
          durationSeconds,
          uploadTarget: "local",
          externalUrl: await blobToDataUrl(finalBlob),
          note,
        },
      ],
    });

    if (isMountedRef.current) {
      setIsConvertingVoice(false);
      setRecordingSeconds(0);
    }
  }

  async function handleMicRetry() {
    setIsMicHelpOpen(false);
    setMicLastError(null);
    setMicDiagnostics(null);
    await handleVoiceNoteToggle();
  }

  function handleMicAccessError(error: unknown, permissionState: "unknown" | "granted" | "denied" | "prompt") {
    const info = extractErrorInfo(error);
    const errorName = info.name;

    if (errorName === "NotAllowedError" || errorName === "SecurityError") {
      stopActiveStream();
      if (permissionState === "granted") {
        setComposerStatus("Microphone blocked by the OS or device.");
        openMicHelp(
          "Browser permission is allowed, but the OS or device is blocking the microphone. Check Windows privacy settings and the selected input device, then try again.",
          "granted",
          info,
        );
        return;
      }
      if (permissionState === "prompt" || permissionState === "unknown") {
        setComposerStatus("Microphone permission is required.");
        openMicHelp(
          "Microphone permission is required. Click the lock icon near the address bar, allow Microphone, refresh the page, then try again.",
          permissionState === "prompt" ? "prompt" : "unknown",
          info,
        );
        return;
      }
      setComposerStatus("Microphone access denied or unavailable.");
      openMicHelp("Microphone access is blocked for this site. Reset the permission to Ask/Allow, refresh the page, and try again.", "denied", info);
      return;
    }
    if (errorName === "NotFoundError") {
      stopActiveStream();
      setComposerStatus("No microphone was detected.");
      openMicHelp("No microphone device was found. Plug in or enable a microphone, then try again.", "unknown", info);
      return;
    }
    if (errorName === "NotReadableError" || errorName === "AbortError") {
      stopActiveStream();
      setComposerStatus("Microphone is currently unavailable.");
      openMicHelp("The microphone is already in use by another app. Close other apps using the mic and try again.", "unknown", info);
      return;
    }
    if (errorName === "OverconstrainedError") {
      stopActiveStream();
      setComposerStatus("Microphone settings are not supported.");
      openMicHelp("This device/browser cannot satisfy the microphone request. Try another input device, then try again.", "unknown", info);
      return;
    }
    stopActiveStream();
    setComposerStatus("Microphone access denied or unavailable.");
    openMicHelp(
      `We could not access the microphone${errorName ? ` (${errorName})` : ""}. Allow microphone permission for this site and ensure your device is available, then try again.`,
      permissionState === "denied" ? "denied" : "unknown",
      info,
    );
  }

  async function handleVoiceNoteToggle() {
    if (!activeConversation || isConvertingVoice) {
      return;
    }
    if (!isRecording) {
      if (!navigator.mediaDevices?.getUserMedia) {
        setComposerStatus("Voice recording is not supported in this browser.");
        openMicHelp("This browser does not support microphone recording. Try Chrome or Edge, then allow microphone access for this site.", "unsupported");
        return;
      }
      forceStopMicrophone({ silent: true });
      const permissionState = await getMicrophonePermissionState();
      if (permissionState !== "unknown") {
        setMicPermissionState(permissionState);
      }
      setComposerStatus("Requesting microphone access...");
      try {
        stopActiveStream();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioContextImpl = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const canUseMediaRecorder = typeof MediaRecorder !== "undefined";
        const canRecordMp3 = canUseMediaRecorder && MediaRecorder.isTypeSupported("audio/mpeg");
        const canUseDirectMp3 = Boolean(AudioContextImpl);
        const shouldTryDirectMp3 = !canRecordMp3 && canUseDirectMp3;
        let Mp3Encoder: Mp3EncoderConstructor | null = null;
        if (shouldTryDirectMp3) {
          try {
            Mp3Encoder = await getMp3EncoderConstructor();
          } catch {
            Mp3Encoder = null;
          }
        }
        const useDirectMp3 = shouldTryDirectMp3 && Boolean(Mp3Encoder);

        if (!useDirectMp3 && !canUseMediaRecorder) {
          stopActiveStream();
          setComposerStatus("Voice recording is not supported in this browser.");
          openMicHelp("MediaRecorder is not available in this browser. Try Chrome or Edge, then allow microphone access for this site.", "unsupported");
          return;
        }
        recordingConversationIdRef.current = activeConversation.id;

        if (useDirectMp3 && AudioContextImpl && Mp3Encoder) {
          const audioContext = new AudioContextImpl();
          try {
            await audioContext.resume();
          } catch {
            // Best-effort resume.
          }
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          const mute = audioContext.createGain();
          mute.gain.value = 0;
          const encoder = new Mp3Encoder(1, audioContext.sampleRate, 128);

          processor.onaudioprocess = (event) => {
            const channelData = event.inputBuffer.getChannelData(0);
            const mp3buf = encoder.encodeBuffer(toInt16(channelData));
            if (mp3buf.length) {
              mp3ChunksRef.current.push(new Uint8Array(mp3buf));
            }
          };

          source.connect(processor);
          processor.connect(mute);
          mute.connect(audioContext.destination);

          audioContextRef.current = audioContext;
          audioSourceRef.current = source;
          audioProcessorRef.current = processor;
          audioMuteRef.current = mute;
          mp3EncoderRef.current = encoder;
          mp3ChunksRef.current = [];
          voiceCaptureModeRef.current = "direct";
        } else {
          const mimeType = canRecordMp3 ? "audio/mpeg" : getSupportedAudioMimeType();
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          mediaRecorderRef.current = recorder;
          recordingChunksRef.current = [];
          voiceCaptureModeRef.current = "media";

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordingChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = async () => {
            const chunks = recordingChunksRef.current;
            recordingChunksRef.current = [];
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }
            mediaRecorderRef.current = null;

            if (!chunks.length || !isMountedRef.current) {
              setIsConvertingVoice(false);
              return;
            }

            const rawBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            await finalizeVoiceNote({
              rawBlob,
              rawMimeType: recorder.mimeType || rawBlob.type || "audio/webm",
              allowMp3Conversion: recorder.mimeType !== "audio/mpeg",
              defaultNote: "Voice note recorded locally.",
            });
          };

          recorder.start();
        }

        setMicPermissionState("granted");
        setIsRecording(true);
        recordingSecondsRef.current = 0;
        recordingStartTimeRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
        setRecordingSeconds(0);
        if (recordingIntervalRef.current) {
          window.clearInterval(recordingIntervalRef.current);
        }
        recordingIntervalRef.current = window.setInterval(() => {
          setRecordingSeconds((current) => {
            const next = current + 1;
            recordingSecondsRef.current = next;
            return next;
          });
        }, 1000);
        setComposerStatus("Recording voice note... click the stop button to save it in the thread.");
      } catch (error) {
        handleMicAccessError(error, permissionState);
      }
      return;
    }
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (recordingStartTimeRef.current !== null) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const elapsedSeconds = Math.max(Math.round((now - recordingStartTimeRef.current) / 1000), 1);
      recordingSecondsRef.current = elapsedSeconds;
      recordingStartTimeRef.current = null;
    }
    setIsRecording(false);
    setIsConvertingVoice(true);
    setComposerStatus("Processing voice note...");
    if (voiceCaptureModeRef.current === "direct") {
      const encoder = mp3EncoderRef.current;
      if (!encoder) {
        setIsConvertingVoice(false);
        setComposerStatus("Voice recorder is not available.");
        return;
      }
      const end = encoder.flush();
      if (end.length) {
        mp3ChunksRef.current.push(new Uint8Array(end));
      }
      const rawBlob = new Blob(mp3ChunksRef.current as unknown as BlobPart[], { type: "audio/mpeg" });
      cleanupDirectMp3();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      await finalizeVoiceNote({
        rawBlob,
        rawMimeType: "audio/mpeg",
        allowMp3Conversion: false,
        defaultNote: "Voice note recorded in MP3 format.",
      });
      voiceCaptureModeRef.current = "media";
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      stopActiveStream();
      setIsConvertingVoice(false);
      setComposerStatus("Voice recorder is not available.");
      return;
    }
    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopActiveStream();
      setIsConvertingVoice(false);
      setComposerStatus("Voice recorder is already stopped.");
    }
  }

  function validatePickedFiles(files: File[]) {
    const validFiles: File[] = [];
    const rejectedSize: string[] = [];

    for (const file of files) {
      if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
        rejectedSize.push(file.name);
        continue;
      }
      validFiles.push(file);
    }

    return { validFiles, rejectedSize };
  }

  async function handlePickedFiles(target: PendingUploadTarget, fileList: FileList | null) {
    if (!activeConversation || !fileList?.length) {
      return;
    }
    const files = Array.from(fileList);
    const { validFiles, rejectedSize } = validatePickedFiles(files);

    if (rejectedSize.length) {
      const rejectedLabel = rejectedSize.slice(0, 2).join(", ");
      const suffix = rejectedSize.length > 2 ? ` and ${rejectedSize.length - 2} more` : "";
      setComposerStatus(`${rejectedLabel}${suffix} exceed 20 MB and were skipped.`);
    }

    if (!validFiles.length) {
      return;
    }

    const preparedAttachments = await Promise.all(
      validFiles.map(async (file) => ({
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadTarget: target,
        externalUrl: await blobToDataUrl(file),
      })),
    );

    await sendMessage({
      body: messageDraft,
      attachments: preparedAttachments,
    });
  }

  async function handleAssign(editorId: string, strategy: "offer" | "direct" = "offer") {
    if (!activeConversation || isSendingAssignmentOffer || isAssigningDirectly) {
      return;
    }
    const freelancerIds = editorId ? [editorId] : selectedAssignEditorIds;
    if (!freelancerIds.length) {
      setComposerStatus(strategy === "direct" ? "Choose one editor to assign directly." : "Choose at least one editor to send the project offer.");
      return;
    }
    const hasPrimaryEditor = Boolean(activeAssignment?.assignedFreelancerId);
    if (strategy === "direct" && freelancerIds.length !== 1) {
      setComposerStatus("Choose exactly one editor for direct assignment.");
      return;
    }
    if (hasPrimaryEditor && assignmentMode === "replace" && freelancerIds.length !== 1) {
      setComposerStatus("Choose exactly one editor for the primary replacement offer.");
      return;
    }
    const selectedEditor = assignableEditors.find((editor) => editor.id === freelancerIds[0]);
    if (strategy === "direct") {
      const confirmed = window.confirm(
        hasPrimaryEditor
          ? `Assign ${selectedEditor?.name || "this editor"} directly as primary? This skips offer acceptance and moves ${activeAssignment?.assignedFreelancerName || "the current primary editor"} to read-only access.`
          : `Assign ${selectedEditor?.name || "this editor"} directly? This skips the offer and immediately grants primary reply access, even if the editor is offline.`,
      );
      if (!confirmed) {
        return;
      }
    }
    if (strategy === "direct") {
      setIsAssigningDirectly(true);
    } else {
      setIsSendingAssignmentOffer(true);
    }
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerIds,
          projectDetails: assignmentDetailsDraft || activeConversation.internalNotes || activeConversation.summary || activeConversation.serviceTitle,
          assignedBy: audience === "admin" ? "admin" : "manager",
          assignmentMode: strategy === "direct" ? "direct" : hasPrimaryEditor ? assignmentMode : "offer",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setComposerStatus(payload?.error ?? "Unable to assign editor right now.");
        return;
      }
      setIsAssignMenuOpen(false);
      setAssignSearchValue("");
      setSelectedAssignEditorIds([]);
      setAssignmentDetailsDraft("");
      const deliveredCount = Number(payload?.notificationDelivery?.sent ?? 0);
      setComposerStatus(
        payload?.assignmentMode === "direct"
          ? payload?.deduped
            ? `${payload?.assignedFreelancerName || selectedEditor?.name || "This editor"} was already the primary editor.`
            : `${payload?.assignedFreelancerName || selectedEditor?.name || "Editor"} was assigned directly with immediate reply access.${payload?.withdrawnOfferCount ? ` ${payload.withdrawnOfferCount} pending offer${payload.withdrawnOfferCount === 1 ? " was" : "s were"} withdrawn.` : ""}`
          : payload?.assignmentMode === "viewer"
          ? payload?.deduped
            ? "Those editors already have access to this project lane."
            : `${payload?.addedFreelancerIds?.length ?? freelancerIds.length} read-only viewer${(payload?.addedFreelancerIds?.length ?? freelancerIds.length) === 1 ? " was" : "s were"} added. Only the primary editor can reply.`
          : payload?.deduped
          ? "This editor already has an active offer for this project. No duplicate was sent."
          : deliveredCount > 0
            ? `${payload?.assignmentMode === "replace" ? "Replacement offer" : "Project offer"} created and ${deliveredCount} device notification${deliveredCount === 1 ? " was" : "s were"} delivered.`
            : "Project offer created, but no device notification was delivered. Ask the editor to refresh push registration.",
      );
      if (payload?.conversation) {
        syncConversationLocally(payload.conversation, "assignment");
      }
      await loadConversations({ silent: true });
    } catch {
      setComposerStatus(
        strategy === "direct"
          ? "Unable to assign this editor directly right now. Please try again."
          : "Unable to send the project offer right now. Please try again.",
      );
    } finally {
      if (strategy === "direct") {
        setIsAssigningDirectly(false);
      } else {
        setIsSendingAssignmentOffer(false);
      }
    }
  }

  async function handleRemoveEditorAssignment() {
    if (!activeConversation || !activeAssignment?.assignedFreelancerId || isRemovingAssignment) {
      return;
    }

    const editorName = activeAssignment.assignedFreelancerName || "the current editor";
    const confirmed = window.confirm(
      `Remove ${editorName} and set this project to No editor? This also removes read-only viewers and withdraws pending editor offers.`,
    );
    if (!confirmed) {
      return;
    }

    setIsRemovingAssignment(true);
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/assignment`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setComposerStatus(payload?.error ?? "Unable to remove the assigned editor right now.");
        return;
      }

      setIsAssignMenuOpen(false);
      setAssignSearchValue("");
      setSelectedAssignEditorIds([]);
      setAssignmentDetailsDraft("");
      setAssignmentMode("replace");
      setComposerStatus(
        payload?.deduped
          ? "This project was already unassigned."
          : `${editorName} was removed. The project is now set to No editor.`,
      );
      if (payload?.conversation) {
        syncConversationLocally(payload.conversation, "assignment");
      }
      await loadConversations({ silent: true });
    } catch {
      setComposerStatus("Unable to remove the assigned editor right now. Please try again.");
    } finally {
      setIsRemovingAssignment(false);
    }
  }

  async function handleAssignmentResponse(action: "ACCEPT" | "PASS") {
    if (!activeConversation) {
      return;
    }
    const rejectionReason = assignmentRejectReason.trim();
    if (action === "PASS" && !rejectionReason) {
      setIsRejectingAssignment(true);
      setComposerStatus("Please add a rejection reason before rejecting.");
      return;
    }
    const response = await fetch(`/api/conversations/${activeConversation.id}/assignment/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectionReason: action === "PASS" ? rejectionReason : undefined }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Unable to update project offer right now.");
      return;
    }
    if (action === "ACCEPT") {
      setActiveLane("internal");
    }
    setIsRejectingAssignment(false);
    setAssignmentRejectReason("");
    setComposerStatus(action === "ACCEPT" ? "Project accepted. Chat access is active." : "Project rejected with reason.");
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "assignment");
    }
    await loadConversations({ silent: true });
  }

  async function handleApproveProjectIntake() {
    if (!activeConversation) {
      return;
    }
    const response = await fetch(`/api/conversations/${activeConversation.id}/project-intake/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fallbackToCategory: true }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Unable to approve project intake right now.");
      return;
    }
    const deliveredCount = Number(payload?.notificationDelivery?.sent ?? 0);
    setComposerStatus(
      deliveredCount > 0
        ? `Project intake approved and ${deliveredCount} editor notification${deliveredCount === 1 ? " was" : "s were"} delivered.`
        : "Project intake approved, but no editor device notification was delivered.",
    );
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "assignment");
    }
    await loadConversations({ silent: true });
  }

  async function handleFreelancerCustomerAccessToggle(enabled: boolean) {
    if (!activeConversation || !canManageFreelancerCustomerAccess) {
      return;
    }
    setIsFreelancerAccessSaving(true);
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/freelancer-customer-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setComposerStatus(payload?.error ?? "Direct client permission could not be updated.");
        return;
      }
      setComposerStatus(enabled ? "Freelancer can now reply in the customer lane." : "Freelancer is back on internal-only coordination for this thread.");
      if (payload?.conversation) {
        syncConversationLocally(payload.conversation, "permission");
      }
      await loadConversations({ silent: true });
    } finally {
      setIsFreelancerAccessSaving(false);
    }
  }

  async function handleSendReviewFlow() {
    if (!activeConversation) {
      return;
    }
    setComposerStatus("Sending review form...");
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/review-flow`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; conversation?: DummyConversationView; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Review form could not be sent.");
      }
      if (payload.conversation) {
        syncConversationLocally(payload.conversation, "message");
      }
      setComposerStatus("Review form sent to customer.");
    } catch (error) {
      setComposerStatus(error instanceof Error ? error.message : "Review form send failed.");
    }
  }

  async function handleLeadStatusChange(leadStatusId: string) {
    if (!activeConversation) {
      return;
    }
    const response = await fetch(`/api/conversations/${activeConversation.id}/lead-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadStatusId }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Lead status could not be updated.");
      return;
    }
    setComposerStatus("Lead status updated.");
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "lead-status");
    }
    await loadConversations({ silent: true });
  }

  async function handleLeadStatusCrud(action: "create" | "update" | "delete" | "reorder", input?: Partial<DummyLeadStatus> & { statusId?: string; orderedIds?: string[] }) {
    if (!activeConversation) {
      return;
    }
    const response = await fetch(`/api/conversations/${activeConversation.id}/lead-statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        statusId: input?.statusId,
        label: input?.label,
        tone: input?.tone,
        active: input?.active,
        orderedIds: input?.orderedIds,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Could not update lead statuses.");
      return;
    }
    setLeadStatuses(payload?.statuses ?? []);
    setComposerStatus("Lead status settings updated.");
    if (action === "create") {
      setNewStatusLabel("");
      setNewStatusTone("accent");
    }
    if (action === "update" || action === "delete") {
      setEditingStatusId(null);
      setEditingStatusLabel("");
      setEditingStatusTone("neutral");
      setEditingStatusActive(true);
    }
    await loadConversations({ silent: true });
  }

  function startEditingStatus(status: DummyLeadStatus) {
    setEditingStatusId(status.id);
    setEditingStatusLabel(status.label);
    setEditingStatusTone(status.tone);
    setEditingStatusActive(status.active);
  }

  async function moveStatus(statusId: string, direction: "up" | "down") {
    const listToUse = leadStatuses.length > 0 ? leadStatuses : effectiveLeadStatuses;
    const index = listToUse.findIndex((status) => status.id === statusId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= listToUse.length) return;
    const orderedIds = listToUse.map((status) => status.id);
    const [moved] = orderedIds.splice(index, 1);
    orderedIds.splice(targetIndex, 0, moved);
    await handleLeadStatusCrud("reorder", { orderedIds });
  }

  async function handleNewChatSubmit() {
    const response = await fetch("/api/conversations/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: audience === "admin" ? "admin" : "manager",
        customerName: newChatCustomerName,
        customerPhone: newChatCustomerPhone,
        serviceId: newChatServiceId || undefined,
        templateId: newChatTemplateId || undefined,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Could not create the conversation.");
      return;
    }
    setNewChatCustomerName("");
    setNewChatCustomerPhone("");
    setNewChatServiceId("");
    setNewChatTemplateId("");
    setIsNewChatOpen(false);
    setComposerStatus("New chat created from the CRM template flow.");
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "new-chat");
    }
    await loadConversations({ silent: true });
    if (payload?.conversation?.id) {
      setSelectedConversationId(payload.conversation.id);
    }
  }

  async function handlePaymentRequestSubmit() {
    if (!activeConversation || isPaymentSubmitting || paymentSubmitLockRef.current) {
      return;
    }

    const amountValue = Number(paymentAmount || 0);
    if (!amountValue || amountValue <= 0) {
      setComposerStatus("Enter a valid payment amount.");
      return;
    }

    paymentSubmitLockRef.current = true;
    setIsPaymentSubmitting(true);
    try {
      const isFreelancerInternal = audience === "freelancer" && resolvedLane === "internal";
      const payload = {
        role: audience,
        amount: amountValue,
        title: paymentTitle,
        note: paymentNote,
        dueLabel: paymentDueLabel || undefined,
        projectId: activeConversation.serviceId || undefined,
        projectTitle: paymentProjectTitle || activeServiceTitle || activeConversation.summary || "General project",
        lane: isFreelancerInternal ? "internal" : "customer",
        payerRole: isFreelancerInternal ? "agency" : "client",
        payeeRole: isFreelancerInternal ? "freelancer" : "agency",
        payeeUpiId: isFreelancerInternal ? freelancerPayeeUpiId : undefined,
        payeeName: isFreelancerInternal ? freelancerPayeeName : undefined,
      };

      const response = await fetch(`/api/conversations/${activeConversation.id}/payment-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const apiPayload = await response.json().catch(() => null);
      if (!response.ok) {
        setComposerStatus(apiPayload?.error ?? "Could not create the payment request.");
        return;
      }

      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentTitle("Project advance");
      setPaymentProjectTitle("");
      setPaymentNote("");
      setPaymentDueLabel("");
      setComposerStatus(isFreelancerInternal ? "Internal PhonePe payment link generated." : "PhonePe payment request sent to customer lane.");
      if (apiPayload?.conversation) {
        syncConversationLocally(apiPayload.conversation, "payment");
      }
      await loadConversations({ silent: true });
      setIsDetailsOpen(true);
    } catch {
      setComposerStatus("Network error creating payment link. Please try again.");
    } finally {
      paymentSubmitLockRef.current = false;
      setIsPaymentSubmitting(false);
    }
  }

  async function handleSyncInstagramProfile(conversationId?: string) {
    const targetId = conversationId || activeConversation?.id;
    if (!targetId || isSyncingInstagramProfile) {
      return;
    }

    setIsSyncingInstagramProfile(true);
    setComposerStatus("Syncing Instagram handle from Meta API...");
    try {
      const response = await fetch(`/api/conversations/${targetId}/sync-instagram-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok && data.resolvedName) {
        setComposerStatus(`Instagram handle synced: ${data.resolvedName}`);
        if (data.conversation) {
          syncConversationLocally(data.conversation, "client-alias");
        } else {
          setConversations((current) =>
            current.map((item) =>
              item.id === targetId ? { ...item, customerDisplayName: data.resolvedName } : item
            )
          );
        }
        await loadConversations({ silent: true });
      } else {
        setComposerStatus(data?.error || "Could not resolve Instagram handle from Meta.");
      }
    } catch {
      setComposerStatus("Network error syncing Instagram handle.");
    } finally {
      setIsSyncingInstagramProfile(false);
    }
  }

  async function handleSaveCustomCustomerName(nextName: string) {
    if (!activeConversation) return;
    const cleanName = nextName.trim();
    if (!cleanName) return;

    setIsSyncingInstagramProfile(true);
    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/sync-instagram-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customName: cleanName }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok) {
        setIsEditingCustomerName(false);
        setComposerStatus(`Customer name updated to "${cleanName}".`);
        if (data.conversation) {
          syncConversationLocally(data.conversation, "client-alias");
        } else {
          setConversations((current) =>
            current.map((item) =>
              item.id === activeConversation.id ? { ...item, customerDisplayName: cleanName } : item
            )
          );
        }
        await loadConversations({ silent: true });
      } else {
        setComposerStatus(data?.error || "Could not update customer name.");
      }
    } catch {
      setComposerStatus("Failed to update customer name.");
    } finally {
      setIsSyncingInstagramProfile(false);
    }
  }

  async function handleClientAliasSubmit() {
    if (!activeConversation || audience !== "freelancer") {
      return;
    }

    const alias = clientAliasValue.trim();
    if (!alias) {
      setComposerStatus("Client alias is required.");
      return;
    }

    const response = await fetch(`/api/conversations/${activeConversation.id}/client-alias`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Could not update client alias.");
      return;
    }

    setIsClientAliasModalOpen(false);
    setComposerStatus("Client alias updated for your freelancer inbox.");
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "client-alias");
    }
    await loadConversations({ silent: true });
  }

  async function handlePaymentStatusUpdate(status: DummyPaymentStatus) {
    if (!latestPaymentRequest || !activeConversation) {
      return;
    }

    const response = await fetch(`/api/conversations/${activeConversation.id}/payment-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-status", paymentRequestId: latestPaymentRequest.id, status }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Payment status could not be updated.");
      return;
    }

    setComposerStatus(`Payment request marked ${status.toLowerCase()}.`);
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "payment");
    }
    await loadConversations({ silent: true });
  }

  async function handlePaymentProofPicked(files: FileList | null) {
    if (!files?.length || !latestPaymentRequest || !activeConversation) {
      return;
    }

    const attachments = Array.from(files)
      .filter((file) => file.size <= MAX_CHAT_ATTACHMENT_BYTES)
      .map((file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      }));

    if (!attachments.length) {
      setComposerStatus("Proof file must be 20 MB or smaller.");
      return;
    }

    const response = await fetch(`/api/conversations/${activeConversation.id}/payment-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit-proof", paymentRequestId: latestPaymentRequest.id, status: "Viewed", attachments }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setComposerStatus(payload?.error ?? "Payment proof could not be uploaded.");
      return;
    }

    setComposerStatus("Payment proof uploaded.");
    if (payload?.conversation) {
      syncConversationLocally(payload.conversation, "payment");
    }
    await loadConversations({ silent: true });
  }

  function copyPaymentUpiId(upiId: string) {
    const value = upiId.trim();
    if (!value) {
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => setComposerStatus("UPI ID copied."))
      .catch(() => setComposerStatus("Copy failed. Please copy the UPI ID manually."));
  }

  async function handleEnableChatNotifications() {
    if (audience === "customer") {
      return;
    }

    if (isNotificationSetupSaving) {
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotificationSetupStatus("unsupported");
      setComposerStatus("This browser does not support web push notifications.");
      return;
    }

    setIsNotificationSetupSaving(true);
    setNotificationSetupStatus("working");
    setComposerStatus("Enabling chat alerts for this browser...");

    try {
      foregroundPushUnsubscribeRef.current?.();
      foregroundPushUnsubscribeRef.current = null;
      const result = await startWebPushNotifications({
        requestPermission: true,
        showForegroundNotification: true,
        onForegroundMessage: handleForegroundChatPush,
      });

      foregroundPushUnsubscribeRef.current = result.unsubscribe ?? null;
      notificationPermissionRef.current = result.permission ?? Notification.permission;
      setNotificationSetupStatus(result.ok ? "ready" : mapWebPushStatus(result.status));
      setComposerStatus(result.error ? `${getWebPushStatusMessage(result.status)} ${result.error}` : getWebPushStatusMessage(result.status));

      if (result.ok) {
        void playIncomingMessageChime();
      }
    } catch {
      setNotificationSetupStatus("error");
      setComposerStatus("Chat alerts could not be enabled right now.");
    } finally {
      setIsNotificationSetupSaving(false);
    }
  }

  function renderNotificationButton() {
    if (audience === "customer") {
      return null;
    }

    const isReady = notificationSetupStatus === "ready";
    const isBlocked = notificationSetupStatus === "blocked";
    const isWorking = isNotificationSetupSaving || notificationSetupStatus === "working";
    const label = isWorking ? "..." : isReady ? "Alerts on" : isBlocked ? "Blocked" : "Enable alerts";
    const title =
      notificationSetupStatus === "missing-config"
        ? "Firebase web push config is missing on the server"
        : isBlocked
          ? "Notifications are blocked for this browser"
          : isReady
            ? "Chat notifications are enabled"
            : "Enable chat notifications and sound";

    return (
      <button
        aria-label={title}
        className={isReady ? "chat-filter-button chat-notification-button active" : "chat-filter-button chat-notification-button"}
        disabled={isWorking}
        onClick={() => {
          void handleEnableChatNotifications();
        }}
        title={title}
        type="button"
      >
        <BellRing size={14} strokeWidth={1.8} />
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  const titleNotificationAction = titleActionHost ? createPortal(renderNotificationButton(), titleActionHost) : null;

  function renderLeadStatusPopover() {
    if (!isLeadStatusMenuOpen) {
      return null;
    }

    return (
      <div className="chat-control-popover chat-status-manager">
        <div className="chat-popover-section">
          <p className="chat-popover-title">Set lead status</p>
          <div className="chat-status-list">
            {effectiveLeadStatuses
              .filter((status) => status.active !== false)
              .map((status) => (
                <button
                  className={activeConversation && activeConversation.leadStatusId === status.id ? `${toneClassName(status.tone)} active` : toneClassName(status.tone)}
                  key={status.id}
                  onClick={() => handleLeadStatusChange(status.id).catch(() => undefined)}
                  type="button"
                >
                  {status.label}
                </button>
              ))}
          </div>
        </div>

        <div className="chat-popover-section">
          <p className="chat-popover-title">Manage statuses</p>
          <div className="chat-status-admin-list">
            {effectiveLeadStatuses.map((status, index) => (
              <div className="chat-status-admin-item" key={status.id}>
                <button className={toneClassName(status.tone)} onClick={() => startEditingStatus(status)} type="button">
                  {status.label}
                </button>
                <div className="chat-status-admin-actions">
                  <button onClick={() => moveStatus(status.id, "up").catch(() => undefined)} type="button">
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => moveStatus(status.id, "down").catch(() => undefined)} type="button">
                    <ArrowDown size={13} />
                  </button>
                  {index > 0 ? (
                    <button onClick={() => handleLeadStatusCrud("delete", { statusId: status.id }).catch(() => undefined)} type="button">
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {editingStatusId ? (
            <div className="chat-status-editor">
              <input onChange={(event) => setEditingStatusLabel(event.target.value)} placeholder="Rename status" value={editingStatusLabel} />
              <select value={editingStatusTone} onChange={(event) => setEditingStatusTone(event.target.value as DummyLeadStatusTone)}>
                {TONE_OPTIONS.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
              <label className="chat-check-row">
                <input checked={editingStatusActive} onChange={(event) => setEditingStatusActive(event.target.checked)} type="checkbox" />
                <span>Active</span>
              </label>
              <div className="chat-inline-actions">
                <button
                  className="ui-button-secondary"
                  onClick={() =>
                    handleLeadStatusCrud("update", {
                      statusId: editingStatusId,
                      label: editingStatusLabel,
                      tone: editingStatusTone,
                      active: editingStatusActive,
                    }).catch(() => undefined)
                  }
                  type="button"
                >
                  Save
                </button>
                <button
                  className="ui-button-ghost"
                  onClick={() => {
                    setEditingStatusId(null);
                    setEditingStatusLabel("");
                    setEditingStatusTone("neutral");
                    setEditingStatusActive(true);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="chat-status-editor">
            <input onChange={(event) => setNewStatusLabel(event.target.value)} placeholder="Create new status" value={newStatusLabel} />
            <select value={newStatusTone} onChange={(event) => setNewStatusTone(event.target.value as DummyLeadStatusTone)}>
              {TONE_OPTIONS.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
            <button className="ui-button-secondary" onClick={() => handleLeadStatusCrud("create", { label: newStatusLabel, tone: newStatusTone, active: true }).catch(() => undefined)} type="button">
              Add status
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAssignPopover() {
    if (!isAssignMenuOpen) {
      return null;
    }

    const hasPrimaryEditor = Boolean(activeAssignment?.assignedFreelancerId);

    return (
      <div className="chat-control-popover chat-assign-popover">
        {hasPrimaryEditor ? (
          <div className="chat-assignment-decision">
            <p className="section-label">Primary editor</p>
            <strong>{activeAssignment?.assignedFreelancerName}</strong>
            <p>Choose what the selected editor should do. Viewers can read the project lane but cannot reply.</p>
            <div className="chat-assignment-decision-grid">
              <button
                className={assignmentMode === "replace" ? "chat-assignment-decision-option active" : "chat-assignment-decision-option"}
                onClick={() => {
                  setAssignmentMode("replace");
                  setSelectedAssignEditorIds((current) => current.slice(0, 1));
                }}
                type="button"
              >
                <strong>Replace primary</strong>
                <span>Send one editor an offer. If accepted, the current primary becomes read-only.</span>
              </button>
              <button
                className={assignmentMode === "viewer" ? "chat-assignment-decision-option active" : "chat-assignment-decision-option"}
                onClick={() => setAssignmentMode("viewer")}
                type="button"
              >
                <strong>Add lane viewers</strong>
                <span>Add multiple editors immediately with read-only access.</span>
              </button>
            </div>
            <button
              className="chat-assignment-unassign"
              disabled={isRemovingAssignment || isSendingAssignmentOffer || isAssigningDirectly}
              onClick={() => handleRemoveEditorAssignment().catch(() => undefined)}
              type="button"
            >
              <CircleOff size={18} strokeWidth={1.8} />
              <span>
                <strong>{isRemovingAssignment ? "Removing editor..." : "Set to No editor"}</strong>
                <small>Remove the primary editor, lane viewers, and pending offers.</small>
              </span>
            </button>
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block", color: "#f3f4f6" }}>Allow editor to chat with client</strong>
                  <small style={{ color: "#9ca3af", fontSize: "11px", display: "block" }}>
                    {activeFreelancerLanePermission?.enabled
                      ? "Editor can view and reply directly to client messages."
                      : "Editor has read-only access to client messages."}
                  </small>
                </div>
                <button
                  className={activeFreelancerLanePermission?.enabled ? "ui-button-primary" : "ui-button-secondary"}
                  disabled={isFreelancerAccessSaving}
                  onClick={() => handleFreelancerCustomerAccessToggle(!activeFreelancerLanePermission?.enabled).catch(() => undefined)}
                  style={{ fontSize: "12px", padding: "4px 10px", flexShrink: 0 }}
                  type="button"
                >
                  {isFreelancerAccessSaving
                    ? "Updating..."
                    : activeFreelancerLanePermission?.enabled
                      ? "Allowed ✓"
                      : "Read-only 🔒"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <label className="chat-picker-search">
          <Search size={13} strokeWidth={1.8} />
          <input onChange={(event) => setAssignSearchValue(event.target.value)} placeholder="Search editor, skill, workload, karma" value={assignSearchValue} />
        </label>
        {assignCategoryOptions.length ? (
          <div className="chat-assign-filter-block">
            <div className="chat-assign-chip-row">
              <button className={assignCategoryFilter === "all" ? "chat-assign-chip active" : "chat-assign-chip"} onClick={() => setAssignCategoryFilter("all")} type="button">
                All
              </button>
              {assignCategoryOptions.map((category) => (
                <button
                  className={assignCategoryFilter === category.value ? "chat-assign-chip active" : "chat-assign-chip"}
                  key={category.value}
                  onClick={() => setAssignCategoryFilter(category.value)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="chat-assign-bulk-row">
              <button
                className="ui-button-secondary"
                disabled={!filteredAssignableEditorIds.length || (hasPrimaryEditor && assignmentMode === "replace")}
                onClick={() =>
                  setSelectedAssignEditorIds((current) =>
                    allFilteredAssignableEditorsSelected
                      ? current.filter((id) => !filteredAssignableEditorIds.includes(id))
                      : Array.from(new Set([...current, ...filteredAssignableEditorIds])),
                  )
                }
                type="button"
              >
                {hasPrimaryEditor && assignmentMode === "replace"
                  ? "Choose one editor"
                  : allFilteredAssignableEditorsSelected
                    ? "Clear filtered"
                    : "Select all filtered"}
              </button>
              <span>{selectedAssignEditorIds.length} selected</span>
            </div>
          </div>
        ) : null}
        <div className="chat-assign-list">
          {hasLoadedSupportData ? filteredAssignableEditors.map((editor) => (
            <button
              className="chat-assign-item"
              disabled={editor.id === activeAssignment?.assignedFreelancerId}
              key={editor.id}
              onClick={() =>
                setSelectedAssignEditorIds((current) =>
                  current.includes(editor.id)
                    ? current.filter((id) => id !== editor.id)
                    : hasPrimaryEditor && assignmentMode === "replace"
                      ? [editor.id]
                      : [...current, editor.id],
                )
              }
              type="button"
            >
              <div>
                <strong>
                  {editor.id === activeAssignment?.assignedFreelancerId
                    ? "Current primary: "
                    : selectedAssignEditorIds.includes(editor.id)
                      ? "Selected: "
                      : ""}
                  {editor.name}
                </strong>
                <p>{editor.specialties.join(" • ")}</p>
              </div>
              <span>
                {editor.onlineStatus === "offline"
                  ? "Offline"
                  : editor.acceptingProjects === false
                    ? "Offers paused"
                    : editor.onlineStatus === "online"
                      ? "Online"
                      : "Availability unknown"} • {editor.workloadBand} • Karma {editor.karmaScore}
              </span>
            </button>
          )) : null}
          {isSupportDataLoading || !hasLoadedSupportData ? <p className="chat-picker-empty">Loading freelancers...</p> : null}
          {hasLoadedSupportData && !filteredAssignableEditors.length ? (
            <p className="chat-picker-empty">
              {assignableEditors.length
                ? "No confirmed editors matched that search."
                : "No confirmed editors are active in this agency team yet. Invite an editor and complete acceptance first."}
            </p>
          ) : null}
        </div>
        <div className="chat-assign-footer">
          {!hasPrimaryEditor || assignmentMode === "replace" ? (
            <textarea
              className="chat-picker-textarea"
              onChange={(event) => setAssignmentDetailsDraft(event.target.value)}
              placeholder="Project details included with the offer or direct assignment"
              rows={3}
              value={assignmentDetailsDraft}
            />
          ) : null}
          <div className="chat-assign-action-grid">
            {!hasPrimaryEditor || assignmentMode === "replace" ? (
              <button
                className="chat-assign-direct-button"
                disabled={selectedAssignEditorIds.length !== 1 || isSendingAssignmentOffer || isAssigningDirectly || isRemovingAssignment}
                onClick={() => handleAssign("", "direct").catch(() => undefined)}
                type="button"
              >
                {isAssigningDirectly ? "Assigning directly..." : hasPrimaryEditor ? "Replace directly" : "Assign directly"}
              </button>
            ) : null}
            <button
              className="ui-button-primary"
              disabled={!selectedAssignEditorIds.length || isSendingAssignmentOffer || isAssigningDirectly || isRemovingAssignment}
              onClick={() => handleAssign("", "offer").catch(() => undefined)}
              type="button"
            >
              {isSendingAssignmentOffer
                ? assignmentMode === "viewer" && hasPrimaryEditor
                  ? "Adding viewers..."
                  : "Sending offer..."
                : hasPrimaryEditor && assignmentMode === "viewer"
                  ? `Add ${selectedAssignEditorIds.length || 0} read-only viewer${selectedAssignEditorIds.length === 1 ? "" : "s"}`
                  : hasPrimaryEditor
                    ? "Send replacement offer"
                    : `Send offer to ${selectedAssignEditorIds.length || 0} editor${selectedAssignEditorIds.length === 1 ? "" : "s"}`}
            </button>
          </div>
          {!hasPrimaryEditor || assignmentMode === "replace" ? (
            <small className="chat-assign-direct-help">Direct assignment skips the 10-minute offer and grants primary reply access immediately.</small>
          ) : null}
        </div>
      </div>
    );
  }

  if (!activeConversation && filteredConversations.length === 0) {
    const isFilteringInbox =
      Boolean(searchValue.trim()) ||
      activeFilter !== "all" ||
      channelFilter !== "all" ||
      agencyFilter !== "all" ||
      assignedFilter !== "all" ||
      paymentPendingOnly ||
      leadStatusFilterId !== "all";
    const emptySidebarTitle = isInboxLoading
      ? "Loading chats"
      : isFilteringInbox
        ? "No matching threads"
        : "No assigned threads yet";
    const emptySidebarCopy = isInboxLoading
      ? audience === "freelancer"
        ? "Checking your active agency assignments and synced customer threads."
        : "Loading the latest routed WhatsApp, Instagram, and manual intake threads."
      : isFilteringInbox
        ? "Try clearing the current search or filters to bring matching threads back into the rail."
        : audience === "freelancer"
        ? "Assigned chats across your active agencies will start appearing here."
        : "Incoming WhatsApp, Instagram, and manual intake threads will appear here.";
    const emptyMainTitle = isInboxLoading
      ? "Loading chats"
      : composerStatus
        ? "Chat inbox needs a refresh"
        : isFilteringInbox
          ? "No threads matched this view"
          : "No conversations yet";
    const emptyMainCopy = isInboxLoading
      ? audience === "freelancer"
        ? "We are checking the assigned agency threads and lane permissions for your editor account."
        : ""
      : composerStatus
        ? composerStatus
        : isFilteringInbox
          ? "Clear the active search or filters and the full inbox will return here."
        : audience === "freelancer"
          ? "When an agency assigns you a routed client thread, it will show up here with the right lane permissions."
          : "New WhatsApp, Instagram, and internal manual intakes will land here automatically.";

    return (
      <div className={styles.shell}>
        {titleNotificationAction}
        <aside className={cx(styles.rail, isCompactChatLayout ? styles.railFullScreen : undefined)}>
          <ChatSidebarHeader
            extra={
              <>
                {audience === "freelancer" && agencyFilterOptions.length > 1 ? (
                  <div className="chat-agency-filter-row">
                    <button className={agencyFilter === "all" ? "chat-filter-chip active" : "chat-filter-chip"} onClick={() => setAgencyFilter("all")} type="button">
                      All agencies
                    </button>
                    {agencyFilterOptions.map((item) => (
                      <button
                        className={agencyFilter === item.tenantId ? "chat-filter-chip active" : "chat-filter-chip"}
                        key={item.tenantId}
                        onClick={() => setAgencyFilter(item.tenantId)}
                        type="button"
                      >
                        {item.agencyName}
                      </button>
                    ))}
                  </div>
                ) : null}
                {isFilterMenuOpen ? (
                  <div className="chat-filter-popover">
                    {audience === "freelancer" ? (
                      <label className="chat-control-field">
                        <span>Agency</span>
                        <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)}>
                          <option value="all">All active agencies</option>
                          {agencyFilterOptions.map((item) => (
                            <option key={item.tenantId} value={item.tenantId}>
                              {item.agencyName}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="chat-control-field">
                      <span>Lead status</span>
                      <select value={leadStatusFilterId} onChange={(event) => setLeadStatusFilterId(event.target.value)}>
                        <option value="all">All statuses</option>
                        {effectiveLeadStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="chat-control-field">
                      <span>Assignment</span>
                      <select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value as AssignedFilter)}>
                        <option value="all">All threads</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                      </select>
                    </label>
                    <label className="chat-check-row">
                      <input checked={paymentPendingOnly} onChange={(event) => setPaymentPendingOnly(event.target.checked)} type="checkbox" />
                      <span>Payment pending</span>
                    </label>
                  </div>
                ) : null}
              </>
            }
            filterRow={
              <div className="chat-filter-row">
                {(["all", "unread", "waiting"] as const).map((filter) => (
                  <button className={activeFilter === filter ? "chat-filter-chip active" : "chat-filter-chip"} key={filter} onClick={() => setActiveFilter(filter)} type="button">
                    {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Waiting"}
                  </button>
                ))}
                {(["whatsapp", "instagram"] as const).map((filter) => (
                  <button
                    aria-label={`Show ${filter === "whatsapp" ? "WhatsApp" : "Instagram"} chats`}
                    className={channelFilter === filter ? "chat-filter-chip chat-channel-filter-chip active" : "chat-filter-chip chat-channel-filter-chip"}
                    key={filter}
                    onClick={() => setChannelFilter((current) => (current === filter ? "all" : filter))}
                    type="button"
                  >
                    <ChatChannelIcon channel={filter} size={13} />
                    <span>{filter === "whatsapp" ? "WhatsApp" : "Instagram"}</span>
                  </button>
                ))}
                <button
                  className={isFilterMenuOpen ? "chat-filter-button active" : "chat-filter-button"}
                  onClick={() => setIsFilterMenuOpen((current) => !current)}
                  type="button"
                >
                  <Filter size={14} strokeWidth={1.8} />
                </button>
                {(audience === "admin" || audience === "manager") ? (
                  <button className="chat-filter-button" onClick={() => { closeTransientMenus(); setIsNewChatOpen(true); }} type="button">
                    <Plus size={14} strokeWidth={1.8} />
                  </button>
                ) : null}
              </div>
            }
            onSearchChange={setSearchValue}
            searchPlaceholder="Search threads"
            searchValue={searchValue}
            subtitle=""
            title=""
          />

          <div className={cx("chat-inbox-thread-scroll empty", styles.railBody)}>
            <ChatSidebarEmptyState badge={isInboxLoading ? "..." : "0"} copy={emptySidebarCopy} title={emptySidebarTitle} />
          </div>
        </aside>
        {!isCompactChatLayout ? (
          <section className={styles.stage}>
            <ChatStageEmptyState
              action={
                !isInboxLoading ? (
                  <button
                    className="chat-filter-chip active"
                    onClick={() => {
                      if (isFilteringInbox) {
                        resetInboxFilters();
                        return;
                      }
                      loadConversations().catch(() => undefined);
                    }}
                    type="button"
                  >
                    {isFilteringInbox ? "Clear filters" : "Retry inbox"}
                  </button>
                ) : null
              }
              copy={emptyMainCopy}
              title={emptyMainTitle}
            />
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={styles.shell}>
        {titleNotificationAction}
        {showConversationRail ? <aside className={cx(styles.rail, isCompactChatLayout ? styles.railFullScreen : undefined)}>
          <ChatSidebarHeader
            extra={
              <>
                {audience === "freelancer" && agencyFilterOptions.length > 1 ? (
                  <div className="chat-agency-filter-row">
                    <button className={agencyFilter === "all" ? "chat-filter-chip active" : "chat-filter-chip"} onClick={() => setAgencyFilter("all")} type="button">
                      All agencies
                    </button>
                    {agencyFilterOptions.map((item) => (
                      <button
                        className={agencyFilter === item.tenantId ? "chat-filter-chip active" : "chat-filter-chip"}
                        key={item.tenantId}
                        onClick={() => setAgencyFilter(item.tenantId)}
                        type="button"
                      >
                        {item.agencyName}
                      </button>
                    ))}
                  </div>
                ) : null}
                {isFilterMenuOpen ? (
                  <div className="chat-filter-popover">
                    {audience === "freelancer" ? (
                      <label className="chat-control-field">
                        <span>Agency</span>
                        <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)}>
                          <option value="all">All active agencies</option>
                          {agencyFilterOptions.map((item) => (
                            <option key={item.tenantId} value={item.tenantId}>
                              {item.agencyName}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="chat-control-field">
                      <span>Lead status</span>
                      <select value={leadStatusFilterId} onChange={(event) => setLeadStatusFilterId(event.target.value)}>
                        <option value="all">All statuses</option>
                        {effectiveLeadStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="chat-control-field">
                      <span>Assignment</span>
                      <select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value as AssignedFilter)}>
                        <option value="all">All threads</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                      </select>
                    </label>
                    <label className="chat-check-row">
                      <input checked={paymentPendingOnly} onChange={(event) => setPaymentPendingOnly(event.target.checked)} type="checkbox" />
                      <span>Payment pending</span>
                    </label>
                  </div>
                ) : null}
              </>
            }
            filterRow={
              <div className="chat-filter-row">
                {(["all", "unread", "waiting"] as const).map((filter) => (
                  <button className={activeFilter === filter ? "chat-filter-chip active" : "chat-filter-chip"} key={filter} onClick={() => setActiveFilter(filter)} type="button">
                    {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Waiting"}
                  </button>
                ))}
                {(["whatsapp", "instagram"] as const).map((filter) => (
                  <button
                    aria-label={`Show ${filter === "whatsapp" ? "WhatsApp" : "Instagram"} chats`}
                    className={channelFilter === filter ? "chat-filter-chip chat-channel-filter-chip active" : "chat-filter-chip chat-channel-filter-chip"}
                    key={filter}
                    onClick={() => setChannelFilter((current) => (current === filter ? "all" : filter))}
                    type="button"
                  >
                    <ChatChannelIcon channel={filter} size={13} />
                    <span>{filter === "whatsapp" ? "WhatsApp" : "Instagram"}</span>
                  </button>
                ))}
                <button
                  className={isFilterMenuOpen ? "chat-filter-button active" : "chat-filter-button"}
                  onClick={() => setIsFilterMenuOpen((current) => !current)}
                  type="button"
                >
                  <Filter size={14} strokeWidth={1.8} />
                </button>
                {(audience === "admin" || audience === "manager") ? (
                  <button className="chat-filter-button" onClick={() => { closeTransientMenus(); setIsNewChatOpen(true); }} type="button">
                    <Plus size={14} strokeWidth={1.8} />
                  </button>
                ) : null}
              </div>
            }
            onSearchChange={setSearchValue}
            searchPlaceholder="Search or start a new chat"
            searchValue={searchValue}
            subtitle=""
            title=""
          />

          <div className={styles.railScrollFrame}>
            <div
              className={cx("chat-inbox-thread-scroll", styles.railBody)}
              onScroll={handleRailScroll}
              ref={railScrollRef}
            >
              {renderedConversations.map((conversation) => (
                <ChatThreadRow
                  audience={audience}
                  conversation={conversation}
                  key={conversation.id}
                  onSelect={handleSelectConversation}
                  selected={selectedConversationId === conversation.id}
                />
              ))}
            </div>
          </div>
        </aside> : null}

        {showConversationStage && activeConversation ? <section className={cx(styles.stage, isCompactChatLayout ? styles.stageFullScreen : undefined)}>
          <header className={cx("chat-thread-head crm-chat-head", styles.stageHeader, isCompactChatLayout ? styles.compactStageHeader : undefined)}>
            <div className={cx("chat-thread-head-main", isCompactChatLayout ? styles.compactStageHeaderMain : undefined)}>
              {isCompactChatLayout ? (
                <button
                  aria-label="Back to chats"
                  className="chat-head-icon chat-head-back"
                  data-tooltip="Back to chats"
                  onClick={closeMobileThreadView}
                  title="Back to chats"
                  type="button"
                >
                  <ArrowLeft size={16} strokeWidth={1.8} />
                </button>
              ) : null}
              <div className="chat-thread-avatar-wrap head">
                <ChatAvatar className="chat-thread-head-avatar" imageUrl={activeConversation.customerProfileImageUrl} name={activeCustomerName} />
                {activeConversation.sourceChannel === "whatsapp" || activeConversation.sourceChannel === "instagram" ? (
                  <span
                    aria-hidden="true"
                    className={`chat-avatar-channel-badge ${activeConversation.sourceChannel}`}
                    title={activeConversation.sourceChannel === "whatsapp" ? "WhatsApp" : "Instagram"}
                  >
                    <ChatChannelIcon channel={activeConversation.sourceChannel} size={10} />
                  </span>
                ) : null}
              </div>
              <div className="chat-thread-head-copy">
                <div className="chat-thread-head-title">
                  {isEditingCustomerName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveCustomCustomerName(editCustomerNameValue);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <input
                        autoFocus
                        className="chat-edit-name-input"
                        onChange={(e) => setEditCustomerNameValue(e.target.value)}
                        placeholder="Customer name / @handle"
                        style={{
                          background: "#1E293B",
                          border: "1px solid #38BDF8",
                          borderRadius: "4px",
                          color: "#F8FAFC",
                          fontSize: "0.875rem",
                          padding: "2px 8px",
                          outline: "none",
                        }}
                        type="text"
                        value={editCustomerNameValue}
                      />
                      <button
                        className="chat-head-icon"
                        title="Save name"
                        type="submit"
                        style={{ width: "24px", height: "24px", color: "#B9F719" }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="chat-head-icon"
                        onClick={() => setIsEditingCustomerName(false)}
                        title="Cancel"
                        type="button"
                        style={{ width: "24px", height: "24px", color: "#94A3B8" }}
                      >
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <strong title={activeCustomerName}>{activeCustomerName}</strong>
                      {audience !== "freelancer" ? (
                        <button
                          aria-label="Edit customer name"
                          className="chat-head-icon"
                          onClick={() => {
                            setEditCustomerNameValue(activeConversation.customerDisplayName || "");
                            setIsEditingCustomerName(true);
                          }}
                          style={{ width: "22px", height: "22px", marginLeft: "4px", opacity: 0.7 }}
                          title="Edit customer display name"
                          type="button"
                        >
                          <Edit3 size={12} />
                        </button>
                      ) : null}
                    </>
                  )}

                  {activeConversation.sourceChannel === "instagram" ? (
                    <button
                      className="chat-head-sync-btn"
                      disabled={isSyncingInstagramProfile}
                      onClick={() => void handleSyncInstagramProfile(activeConversation.id)}
                      style={{
                        background: "rgba(225, 48, 108, 0.12)",
                        border: "1px solid rgba(225, 48, 108, 0.35)",
                        borderRadius: "6px",
                        color: "#E1306C",
                        cursor: isSyncingInstagramProfile ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "2px 7px",
                        marginLeft: "6px",
                        transition: "all 0.15s ease",
                      }}
                      title="Sync real Instagram @username from Meta Graph API"
                      type="button"
                    >
                      <RefreshCw className={isSyncingInstagramProfile ? "spin-animate" : ""} size={11} />
                      <span>{isSyncingInstagramProfile ? "Syncing..." : "Sync ID"}</span>
                    </button>
                  ) : null}

                  {activeConversation.sourceChannel === "instagram" || activeConversation.sourceChannel === "whatsapp" ? (
                    <span
                      className={`chat-source-chip ${activeConversation.sourceChannel} strong`}
                      title={activeConversation.channelConnectionName ? `${activeConversation.sourceChannel === "instagram" ? "Instagram" : "WhatsApp"} · ${activeConversation.channelConnectionName}` : activeConversation.sourceChannel === "instagram" ? "Instagram" : "WhatsApp"}
                    >
                      <ChatChannelIcon channel={activeConversation.sourceChannel} size={13} />
                      <span className="chat-source-chip-label">
                        {activeConversation.channelConnectionName || (activeConversation.sourceChannel === "instagram" ? "Instagram" : "WhatsApp")}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="chat-thread-head-subtitle">
                  <span className="chat-thread-contact-number" title={activeCustomerHeaderContact}>
                    {audience === "freelancer"
                      ? activeCustomerHeaderContact
                      : activeConversation.sourceChannel === "instagram"
                        ? `Instagram ID: ${activeCustomerHeaderContact}`
                        : activeCustomerHeaderContact.startsWith("+")
                          ? activeCustomerHeaderContact
                          : `Customer ${activeCustomerHeaderContact}`}
                  </span>
                  {activeConversation.sourceChannel === "whatsapp" && (activeBusinessPhone || activeConversation.channelConnectionName) ? (
                    <span className="chat-thread-presence" title={`WhatsApp business line ${activeBusinessPhone || activeConversation.channelConnectionName}`}>
                      {activeBusinessPhone ? `From ${activeBusinessPhone}` : `Via ${activeConversation.channelConnectionName}`}
                    </span>
                  ) : null}
                  {typingMessage ? <span className="chat-thread-presence">{typingMessage.label} is typing...</span> : null}
                  {!typingMessage && customerPresenceLabel ? <span className="chat-thread-presence">{customerPresenceLabel}</span> : null}
                </div>
              </div>
            </div>

            <div className="chat-thread-head-toolbar crm-chat-head-actions">
              <div className="chat-thread-head-action-group">
                {normalizedVisibleLanes.map((lane) => {
                  const laneLabel = lane === "customer" ? "Client lane" : audience === "sales" ? "Sales team" : audience === "freelancer" ? "Agency lane" : "Freelancer lane";
                  return (
                    <button
                      aria-label={laneLabel}
                      className={resolvedLane === lane ? "chat-head-icon active" : "chat-head-icon"}
                      data-tooltip={laneLabel}
                      key={lane}
                      onClick={() => setActiveLane(lane)}
                      title={laneLabel}
                      type="button"
                    >
                      {lane === "customer" ? <MessageSquareText size={16} strokeWidth={1.8} /> : <ShieldCheck size={16} strokeWidth={1.8} />}
                    </button>
                  );
                })}
              </div>

              {(audience === "admin" || audience === "manager" || canManageFreelancerCustomerAccess) ? (
                <div className="chat-thread-head-action-group">
                  {(audience === "admin" || audience === "manager") ? (
                    <div className="chat-control-inline">
                      <button
                        aria-label={`Lead status: ${activeLeadStatus?.label ?? "New"}`}
                        className={isLeadStatusMenuOpen ? "chat-head-icon active" : "chat-head-icon"}
                        onClick={() => {
                          setIsLeadStatusMenuOpen((current) => !current);
                          setIsAssignMenuOpen(false);
                          setIsDetailsOpen(false);
                        }}
                        title={`Lead status: ${activeLeadStatus?.label ?? "New"}`}
                        type="button"
                      >
                        <Filter size={16} strokeWidth={1.8} />
                        <span className={cx("chat-head-icon-dot", `tone-${activeLeadStatusTone}`)} />
                      </button>
                      {renderLeadStatusPopover()}
                    </div>
                  ) : null}

                  {(audience === "admin" || audience === "manager") ? (
                    <div className="chat-control-inline">
                      <button
                        aria-label={`Assign editor: ${activeAssignment?.assignedFreelancerName ?? "Search editor"}`}
                        className={isAssignMenuOpen ? "chat-head-icon active" : "chat-head-icon"}
                        onClick={() => {
                          setIsAssignMenuOpen((current) => !current);
                          setIsLeadStatusMenuOpen(false);
                          setIsDetailsOpen(false);
                        }}
                        title={`Assign editor: ${activeAssignment?.assignedFreelancerName ?? "Search editor"}`}
                        type="button"
                      >
                        <UserRound size={16} strokeWidth={1.8} />
                      </button>
                      {renderAssignPopover()}
                    </div>
                  ) : null}

                  {canManageFreelancerCustomerAccess ? (
                    <button
                      aria-label={activeFreelancerLanePermission?.enabled ? "Allow editor client chat (Currently enabled)" : "Allow editor client chat (Currently disabled)"}
                      className={activeFreelancerLanePermission?.enabled ? "chat-head-icon active" : "chat-head-icon"}
                      disabled={isFreelancerAccessSaving}
                      onClick={() => handleFreelancerCustomerAccessToggle(!activeFreelancerLanePermission?.enabled).catch(() => undefined)}
                      title={activeFreelancerLanePermission?.enabled ? "Editor client chat: Allowed (Click to lock)" : "Editor client chat: Read-only (Click to allow)"}
                      type="button"
                    >
                      {isFreelancerAccessSaving ? <CircleEllipsis size={16} strokeWidth={1.8} /> : activeFreelancerLanePermission?.enabled ? <Check size={16} strokeWidth={1.8} /> : <CircleOff size={16} strokeWidth={1.8} />}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="chat-thread-head-action-group">
                <button
                  aria-label="CRM details"
                  className={isDetailsOpen ? "chat-head-icon active" : "chat-head-icon"}
                  data-tooltip="CRM details"
                  onClick={() => setIsDetailsOpen((current) => !current)}
                  title="CRM details"
                  type="button"
                >
                  <StickyNote size={18} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </header>

          <div className={styles.stageBody}>
            <div className={styles.messageViewportFrame}>
            <div className={cx("chat-message-scroll", styles.messageViewport)} ref={messageScrollRef}>
              <section className="chat-message-group">
              <div className="chat-day-divider">
                <span>{resolvedLane === "customer" ? "Client lane" : audience === "sales" ? "Sales team" : audience === "freelancer" ? "Agency lane" : "Freelancer coordination"}</span>
              </div>
              {laneMessages.map((message, messageIndex) => {
                const isIncoming = isConversationMessageIncomingForAudience(message, audience);
                const body = visibleBody(message).trim();
                const showAvatar = resolvedLane === "internal";
                const senderIdentity = messageSenderIdentity(message, audience);
                const deliveryStatus = getOutgoingDeliveryStatus(message, audience, activeConversation);
                const deliveryError =
                  deliveryStatus === "failed" && typeof message.deliveryError === "string" ? message.deliveryError.trim() : "";
                const previousMessage = messageIndex > 0 ? laneMessages[messageIndex - 1] : null;
                const startsNewDate =
                  !previousMessage || getConversationDateKey(previousMessage.createdAt) !== getConversationDateKey(message.createdAt);
                return (
                  <Fragment key={message.id}>
                  {startsNewDate ? (
                    <div className="chat-day-divider chat-conversation-date-divider" role="separator">
                      <span>{formatConversationDateLabel(message.createdAt)}</span>
                    </div>
                  ) : null}
                  <article className={isIncoming ? "chat-bubble-row incoming" : "chat-bubble-row outgoing"}>
                    {isIncoming && showAvatar ? (
                      <ChatAvatar
                        className="chat-bubble-avatar"
                        imageUrl={message.senderRole === "customer" ? activeConversation.customerProfileImageUrl : undefined}
                        name={messageLabel(message, audience)}
                      />
                    ) : null}
                    <div className="chat-bubble">
                      <p className="message-role" aria-label={`Sent by ${senderIdentity.primary}${senderIdentity.secondary ? `, ${senderIdentity.secondary}` : ""}`}>
                        <span className="message-role-name">{senderIdentity.primary}</span>
                        {senderIdentity.secondary ? <span className="message-role-context">{senderIdentity.secondary}</span> : null}
                      </p>
                      {body ? <p>{body}</p> : null}
                      {message.attachments?.length ? (
                        <div className="chat-attachment-list">
                          {message.attachments.map((attachment) => {
                            const linkedPayment =
                              attachment.kind === "payment-request" && latestPaymentRequest?.id === attachment.paymentRequestId ? latestPaymentRequest : null;
                            const isVoiceNote = attachment.kind === "voice-note";
                            const isImageAttachment = attachment.kind === "image";
                            const isMinimalAttachment = isVoiceNote || isImageAttachment;
                            const hasInlinePreview = attachmentHasInlinePreview(attachment);
                            const attachmentSubtitle = isVoiceNote ? attachment.durationLabel ?? "Voice note" : describeAttachment(attachment);
                            return (
                              <div
                                className={
                                  isVoiceNote
                                    ? "chat-attachment-card voice-note media-clean"
                                    : linkedPayment
                                      ? "chat-attachment-card payment-request-card"
                                      : isImageAttachment
                                        ? "chat-attachment-card media-clean"
                                      : hasInlinePreview
                                        ? "chat-attachment-card has-preview"
                                        : "chat-attachment-card"
                                }
                                key={attachment.id}
                              >
                                {linkedPayment ? (
                                  <div className="chat-payment-layout">
                                    <div className="chat-payment-link-card">
                                      <p className="chat-payment-qr-label">PhonePe checkout</p>
                                      <strong>{formatCurrency(linkedPayment.amount)}</strong>
                                      <span>Secure payment link</span>
                                      {linkedPayment.paymentLink ? (
                                        <a className="chat-bubble-cta chat-payment-link-button" href={linkedPayment.paymentLink} rel="noreferrer" target="_blank">
                                          Pay with PhonePe
                                        </a>
                                      ) : (
                                        <>
                                          <p className="chat-payment-qr-upi">Legacy UPI ID: {linkedPayment.upiId}</p>
                                          <button className="ui-button-secondary chat-payment-qr-copy" onClick={() => copyPaymentUpiId(linkedPayment.upiId)} type="button">
                                            Copy UPI ID
                                          </button>
                                        </>
                                      )}
                                    </div>
                                    <div className="chat-payment-brand-strip">GIGXOMI SECURE PAYMENT</div>
                                    <div className="chat-attachment-body chat-payment-message">
                                      <strong>{linkedPayment.title || "Payment request"}</strong>
                                      <span>{formatCurrency(linkedPayment.amount)} - {linkedPayment.status}</span>
                                      <p>Payer: {linkedPayment.payerRole} - Payee: {linkedPayment.payeeRole}</p>
                                      <p>Method: {linkedPayment.paymentLink ? "PhonePe checkout" : `Legacy UPI ${linkedPayment.upiId}`}</p>
                                      {linkedPayment && audience !== "customer" && !(linkedPayment.lane === "customer" && linkedPayment.payeeRole === "agency") ? (
                                        <p>{linkedPayment.split.platformPercentage}% platform - {linkedPayment.split.editorPercentage}% editor</p>
                                      ) : null}
                                      {linkedPayment.paymentProvider ? <p>Gateway: {formatPaymentGatewayLabel(linkedPayment.paymentProvider)}</p> : null}
                                    </div>
                                  </div>
                                ) : isMinimalAttachment ? null : (
                                  <div className="chat-attachment-body">
                                    <strong>{isVoiceNote ? "Voice note" : attachment.name}</strong>
                                    <span>{attachmentSubtitle}</span>
                                    {attachment.note && !linkedPayment ? <p>{normalizeDisplayText(attachment.note)}</p> : null}
                                  </div>
                                )}
                                <AttachmentPreview attachment={attachment} />
                                {attachment.externalUrl && !isMinimalAttachment ? (
                                  <a className="chat-attachment-link" href={attachment.externalUrl} rel="noreferrer" target="_blank">
                                    {attachment.mimeType === "application/pdf" ? "Open PDF" : attachment.kind === "file" ? "Open file" : "Open"}
                                  </a>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      {deliveryError ? <p className="chat-message-error">{deliveryError}</p> : null}
                      <div className="chat-bubble-meta">
                        <small>{formatTimestamp(message.createdAt)}</small>
                        {deliveryStatus ? (
                          <span
                            aria-label={getDeliveryStatusLabel(deliveryStatus)}
                            className={`chat-message-status ${deliveryStatus}`}
                            title={getDeliveryStatusLabel(deliveryStatus)}
                          >
                            {deliveryStatus === "failed" ? <CircleOff size={15} strokeWidth={2.1} /> : <CheckCheck size={15} strokeWidth={2.1} />}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {!isIncoming && showAvatar ? <ChatAvatar className="chat-bubble-avatar outgoing" name={messageLabel(message, audience)} /> : null}
                  </article>
                  </Fragment>
                );
              })}
                <div aria-hidden="true" className="chat-message-end-anchor" ref={messageEndRef} />
              </section>
            </div>
            </div>

            <div className={cx("chat-composer-shell", styles.composerDock)}>
            <input
              className="sr-only"
              accept={`${CHAT_MEDIA_ACCEPT},${CHAT_DOCUMENT_ACCEPT}`}
              onChange={(event) => {
                handlePickedFiles("local", event.target.files).catch(() => undefined);
                event.currentTarget.value = "";
              }}
              ref={localFileInputRef}
              type="file"
              multiple
            />
            <input
              className="sr-only"
              accept={CHAT_MEDIA_ACCEPT}
              onChange={(event) => {
                handlePickedFiles("local", event.target.files).catch(() => undefined);
                event.currentTarget.value = "";
              }}
              ref={mediaFileInputRef}
              type="file"
              multiple
            />
            <input
              className="sr-only"
              accept={CHAT_DOCUMENT_ACCEPT}
              onChange={(event) => {
                handlePickedFiles("local", event.target.files).catch(() => undefined);
                event.currentTarget.value = "";
              }}
              ref={documentFileInputRef}
              type="file"
              multiple
            />

            {isAttachMenuOpen && !isFreelancerCustomerLane ? (
              <div className="chat-attach-menu">
                <button className="chat-attach-option" onClick={() => { setIsAttachMenuOpen(false); mediaFileInputRef.current?.click(); }} type="button">
                  <Paperclip size={15} strokeWidth={1.8} />
                  <span>Image or video (max 20 MB)</span>
                </button>
                <button className="chat-attach-option" onClick={() => { setIsAttachMenuOpen(false); documentFileInputRef.current?.click(); }} type="button">
                  <FileText size={15} strokeWidth={1.8} />
                  <span>Document (max 20 MB)</span>
                </button>
                <button className="chat-attach-option" onClick={() => { setIsAttachMenuOpen(false); localFileInputRef.current?.click(); }} type="button">
                  <Paperclip size={15} strokeWidth={1.8} />
                  <span>Browse files</span>
                </button>
                {showPaymentAction ? (
                  <button className="chat-attach-option" onClick={() => { setIsPaymentModalOpen(true); setIsAttachMenuOpen(false); }} type="button">
                    <BadgeIndianRupee size={15} strokeWidth={1.8} />
                    <span>{paymentActionLabel}</span>
                  </button>
                ) : null}
                {showReviewFlowAction ? (
                  <button className="chat-attach-option" onClick={() => { setIsAttachMenuOpen(false); handleSendReviewFlow().catch(() => undefined); }} type="button">
                    <Star size={15} strokeWidth={1.8} />
                    <span>Send review form</span>
                  </button>
                ) : null}
              </div>
            ) : null}

            {isEmojiTrayOpen && !isFreelancerCustomerLaneReadOnly ? (
              <div className="chat-emoji-tray">
                <EmojiPicker
                  autoFocusSearch={false}
                  emojiStyle={EmojiStyle.NATIVE}
                  height={360}
                  lazyLoadEmojis
                  onEmojiClick={handleEmojiClick}
                  previewConfig={{ showPreview: false }}
                  searchDisabled={false}
                  skinTonesDisabled
                  theme={EmojiPickerTheme.DARK}
                  width="100%"
                />
              </div>
            ) : null}

              {isRecording ? <p className="chat-composer-status">Recording voice note... {recordingSeconds}s</p> : null}
              {!isMessageSending && composerStatus ? <p className="chat-composer-status">{composerStatus}</p> : null}
              {(audience === "admin" || audience === "manager") && activeConversation?.projectIntake?.opsReviewStatus === "SUBMITTED" ? (
                <div className="chat-context-card">
                  <p className="section-label">Project intake ready for ops review</p>
                  <strong>{activeConversation.projectIntake.projectName || activeConversation.projectIntake.serviceTitle || "Client project"}</strong>
                  <p>{activeConversation.projectIntake.editingNote || "Review the form details in the internal lane, then send the offer."}</p>
                  <div className="chat-thread-head-action-group">
                    <button className="ui-button-primary" onClick={() => handleApproveProjectIntake().catch(() => undefined)} type="button">
                      Approve and offer to editor
                    </button>
                  </div>
                </div>
              ) : null}
              {audience === "freelancer" && resolvedLane === "customer" && isFreelancerCustomerLaneReadOnly ? (
                <div className="chat-context-card">
                  <p className="section-label">Read-only</p>
                  <strong>Client messaging set to read-only</strong>
                  <p>{activeLaneReadOnlyReason || "Client messaging is set to read-only by agency. Use the internal team lane to coordinate with your manager."}</p>
                </div>
              ) : null}
              {audience === "freelancer" && activeLaneCapabilities?.internal.writable === false && !activePendingOffer ? (
                <div className="chat-context-card">
                  <p className="section-label">Read-only project viewer</p>
                  <strong>{activeConversation?.serviceTitle || "Project lane"}</strong>
                  <p>You can review this chat and its project context. Only the primary editor can reply.</p>
                </div>
              ) : null}
              {audience === "freelancer" && activePendingOffer?.status === "PENDING" ? (
                <div className="chat-context-card">
                  <p className="section-label">Project offer</p>
                  <strong>{activeConversation?.serviceTitle || "New project"}</strong>
                  {activePendingOffer.expiresAt ? <p>Accept window closes at {new Date(activePendingOffer.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p> : null}
                  <p>{activePendingOffer.projectDetails}</p>
                  {isRejectingAssignment ? (
                    <textarea
                      className="chat-offer-reject-reason"
                      onChange={(event) => setAssignmentRejectReason(event.target.value)}
                      placeholder="Reason for rejection"
                      rows={3}
                      value={assignmentRejectReason}
                    />
                  ) : null}
                  <div className="chat-thread-head-action-group">
                    <button className="ui-button-primary" onClick={() => handleAssignmentResponse("ACCEPT").catch(() => undefined)} type="button">
                      Accept project
                    </button>
                    <button
                      className="ui-button-secondary"
                      onClick={() => {
                        if (!isRejectingAssignment) {
                          setIsRejectingAssignment(true);
                          return;
                        }
                        handleAssignmentResponse("PASS").catch(() => undefined);
                      }}
                      type="button"
                    >
                      {isRejectingAssignment ? "Send rejection" : "Reject"}
                    </button>
                  </div>
                </div>
              ) : null}
              {audience === "freelancer" && activePendingOffer && activePendingOffer.status !== "PENDING" ? (
                <div className="chat-context-card">
                  <p className="section-label">Project offer update</p>
                  <strong>{activeConversation?.serviceTitle || "Project offer"}</strong>
                  <p>
                    {activePendingOffer.status === "ACCEPTED"
                      ? "You accepted this project. The internal work lane is active."
                      : activePendingOffer.status === "PASSED"
                        ? "You rejected this project offer. It has been kept here as a normal chat update."
                        : activePendingOffer.expiredReason === "accepted_by_other"
                          ? "Another editor accepted this project first. You missed this offer; stay online to receive the next one."
                          : "This project offer expired because it was not accepted within the response window."}
                  </p>
                </div>
              ) : null}
              {(audience === "admin" || audience === "manager") && resolvedLane === "customer" ? (
                <label className="chat-composer-private-toggle">
                  <input
                    checked={hideCustomerMessageFromFreelancer}
                    onChange={(event) => setHideCustomerMessageFromFreelancer(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Hide this customer-lane message from freelancer</span>
                </label>
              ) : null}
              <div className={hasDraft ? "chat-composer-bar has-draft" : "chat-composer-bar"}>
              <button
                aria-label="Open attachment options"
                className="chat-composer-icon"
                onClick={() => {
                  if (isFreelancerCustomerLane) {
                    setComposerStatus("Attachments are available in internal lane only on this thread.");
                    return;
                  }
                  setIsAttachMenuOpen((current) => !current);
                  setIsEmojiTrayOpen(false);
                }}
                type="button"
              >
                <Plus size={18} strokeWidth={1.8} />
              </button>
              <button
                aria-label="Open emoji picker"
                className="chat-composer-icon"
                onClick={() => {
                  if (isFreelancerCustomerLaneReadOnly) {
                    setComposerStatus(activeLaneReadOnlyReason);
                    return;
                  }
                  setIsEmojiTrayOpen((current) => !current);
                  setIsAttachMenuOpen(false);
                }}
                type="button"
              >
                <Smile size={18} strokeWidth={1.8} />
              </button>
              <textarea
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !isMessageSending) {
                    event.preventDefault();
                    handleSendMessage().catch(() => undefined);
                  }
                }}
                disabled={isFreelancerCustomerLaneReadOnly}
                placeholder={
                  isFreelancerCustomerLaneReadOnly
                    ? activeLaneReadOnlyReason
                    : isFreelancerCustomerLane
                      ? `Reply as ${activeAgencyContext?.agencyName ?? "the agency"} in the routed shared customer lane`
                    : resolvedLane === "internal"
                        ? audience === "sales"
                          ? "Share this chat internally with the sales team"
                          : "Talk internally with manager/admin/editor here"
                        : "Reply to the customer in the routed shared thread"
                }
                ref={composerTextareaRef}
                rows={1}
                value={messageDraft}
              />
              {isRecording ? (
                <button className="chat-composer-send chat-composer-recording" disabled={isFreelancerCustomerLane || isConvertingVoice} onClick={() => handleVoiceNoteToggle().catch(() => undefined)} type="button">
                  <Square size={15} strokeWidth={1.8} />
                </button>
              ) : (
                <button
                  aria-label={hasDraft ? "Send message" : "Record voice note"}
                  className={!hasDraft ? "chat-composer-send chat-composer-send-idle" : "chat-composer-send"}
                  disabled={!hasDraft ? isFreelancerCustomerLane || isConvertingVoice || isMessageSending : isFreelancerCustomerLaneReadOnly || isMessageSending}
                  onClick={() => {
                    if (!hasDraft) {
                      handleVoiceNoteToggle().catch(() => undefined);
                      return;
                    }
                    handleSendMessage().catch(() => undefined);
                  }}
                  type="button"
                >
                  {!hasDraft ? <Mic size={18} strokeWidth={1.8} /> : <ArrowUp size={16} strokeWidth={1.8} />}
                </button>
              )}
            </div>
            </div>
          </div>

          {isDetailsOpen ? (
            <ChatDetailsSheet eyebrow="CRM details" onClose={() => setIsDetailsOpen(false)} title={activeCustomerName}>
              <div className={styles.detailsGrid}>
                <div className="chat-context-card"><p className="section-label">Lead</p><strong>{activeLeadStatusLabel}</strong><p>{activeConversation.status}</p></div>
                <div className="chat-context-card">
                  <p className="section-label">Assigned editor</p>
                  <strong>{activeAssignment?.assignedFreelancerName ?? "Not assigned yet"}</strong>
                  <p>{activeAssignedEditor ? activeAssignedEditor.specialties.join(" • ") : "You can still raise a customer payment request without assignment."}</p>
                  {canManageFreelancerCustomerAccess ? (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, display: "block", color: "#f3f4f6" }}>Allow editor to chat with client</span>
                        <small style={{ color: "#9ca3af", fontSize: "11px" }}>
                          {activeFreelancerLanePermission?.enabled ? "Can view and reply to client" : "Read-only access"}
                        </small>
                      </div>
                      <button
                        className={activeFreelancerLanePermission?.enabled ? "ui-button-primary" : "ui-button-secondary"}
                        disabled={isFreelancerAccessSaving}
                        onClick={() => handleFreelancerCustomerAccessToggle(!activeFreelancerLanePermission?.enabled).catch(() => undefined)}
                        style={{ fontSize: "12px", padding: "4px 10px", flexShrink: 0 }}
                        type="button"
                      >
                        {isFreelancerAccessSaving
                          ? "Saving..."
                          : activeFreelancerLanePermission?.enabled
                            ? "Allowed ✓"
                            : "Read-only 🔒"}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="chat-context-card"><p className="section-label">Owner</p><strong>{activeConversation.ownerName ?? "Queue"}</strong><p>{activeConversation.ownerRole ? `${rolePrefix(activeConversation.ownerRole)} owned` : "Unclaimed queue thread"}</p></div>
                <div className="chat-context-card"><p className="section-label">Service</p><strong>{activeServiceTitle || "General support"}</strong><p>{activeConversation.isInAppCustomerThread ? "Legacy in-app intake thread" : "WhatsApp or internal intake thread"}</p></div>
                <div className="chat-context-card"><p className="section-label">Internal note</p><strong>Manager note</strong><p>{activeConversation.internalNotes || "No internal note saved on this lead yet."}</p></div>
                <div className="chat-context-card">
                  <p className="section-label">Customer context</p>
                  <strong>{audience === "freelancer" ? "Masked for editor" : activeCustomerName}</strong>
                  <p>{audience === "freelancer" ? "Customer contact hidden" : activeCustomerPhone}</p>
                  <p>{audience === "freelancer" ? "Direct customer identity stays hidden in freelancer mode." : activeConversation.summary}</p>
                  {audience === "freelancer" ? (
                    <button className="ui-button-secondary" onClick={() => setIsClientAliasModalOpen(true)} type="button">
                      Edit client alias
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="chat-context-card">
                <p className="section-label">Latest payment request</p>
                {latestPaymentRequest ? (
                  <>
                    <strong>{latestPaymentRequest.title}</strong>
                    <p>Status: {latestPaymentRequest.status}</p>
                    <p>Project: {latestPaymentRequest.projectTitle || activeServiceTitle || "General project"}</p>
                    <p>Amount: {formatCurrency(latestPaymentRequest.amount)}</p>
                    <p>Payer: {latestPaymentRequest.payerRole} • Payee: {latestPaymentRequest.payeeRole}</p>
                    <p>Method: {latestPaymentRequest.paymentLink ? "PhonePe checkout" : "Legacy manual UPI"}</p>
                    {latestPaymentRequest.paymentProvider ? (
                      <p>
                        Gateway: {formatPaymentGatewayLabel(latestPaymentRequest.paymentProvider)}
                        {latestPaymentRequest.paymentConfigurationName ? ` • Config: ${latestPaymentRequest.paymentConfigurationName}` : ""}
                      </p>
                    ) : (
                      <p>Legacy UPI ID: {latestPaymentRequest.upiId}</p>
                    )}
                    {latestPaymentRequest.paymentOrderId ? <p>Order ID: {latestPaymentRequest.paymentOrderId}</p> : null}
                    {!(latestPaymentRequest.lane === "customer" && latestPaymentRequest.payeeRole === "agency") ? (
                      <>
                        <p>Platform {formatCurrency(latestPaymentRequest.split.platformAmount)} • Editor {formatCurrency(latestPaymentRequest.split.editorAmount)}</p>
                        <p>{latestPaymentRequest.split.platformPercentage}% platform • {latestPaymentRequest.split.editorPercentage}% editor</p>
                      </>
                    ) : (
                      <p>Agency receives full amount: {formatCurrency(latestPaymentRequest.amount)}</p>
                    )}
                    {latestPaymentRequest.proofSubmittedAt ? <p>Proof submitted: {formatTimestamp(latestPaymentRequest.proofSubmittedAt)}</p> : null}
                    {latestPaymentRequest.paidConfirmedAt ? <p>Paid confirmed: {formatTimestamp(latestPaymentRequest.paidConfirmedAt)} by {latestPaymentRequest.paidConfirmedByName || latestPaymentRequest.paidConfirmedByRole || "team"}</p> : null}
                    <div className="chat-inline-actions">
                      {latestPaymentRequest.paymentLink ? (
                        <a className="ui-button-secondary" href={latestPaymentRequest.paymentLink} rel="noreferrer" target="_blank">
                          Open PhonePe link
                        </a>
                      ) : (
                        <button className="ui-button-secondary" onClick={() => copyPaymentUpiId(latestPaymentRequest.upiId)} type="button">
                          Copy UPI ID
                        </button>
                      )}
                      <button className="ui-button-secondary" onClick={() => paymentProofInputRef.current?.click()} type="button">
                        Upload proof
                      </button>
                      {latestPaymentRequest.status !== "Paid" && ((latestPaymentRequest.payeeRole === "freelancer" && audience === "freelancer") || (latestPaymentRequest.payeeRole === "agency" && (audience === "admin" || audience === "manager"))) ? (
                        <button className="ui-button-primary" onClick={() => handlePaymentStatusUpdate("Paid").catch(() => undefined)} type="button">
                          <Check size={14} />
                          Mark paid
                        </button>
                      ) : null}
                    </div>
                    <input
                      accept={`${CHAT_MEDIA_ACCEPT},${CHAT_DOCUMENT_ACCEPT}`}
                      className="sr-only"
                      onChange={(event) => {
                        handlePaymentProofPicked(event.target.files).catch(() => undefined);
                        event.currentTarget.value = "";
                      }}
                      ref={paymentProofInputRef}
                      type="file"
                      multiple
                    />
                  </>
                ) : (
                  <p>No payment request has been created for this lead yet.</p>
                )}
              </div>
            </ChatDetailsSheet>
          ) : null}
        </section> : !isCompactChatLayout ? (
          <section className={styles.stage}>
            <ChatStageEmptyState
              copy="Choose a thread from the inbox to open it. New messages will keep syncing here without auto-opening the first chat."
              title="Select a conversation"
            />
          </section>
        ) : null}
      </div>

      {isClientAliasModalOpen ? (
        <div className="chat-modal-backdrop">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div>
                <h3>Client alias</h3>
                <p className="muted-copy">Rename the masked client label for your freelancer inbox without exposing or changing the agency customer record.</p>
              </div>
              <button className="chat-head-icon" onClick={() => setIsClientAliasModalOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="chat-modal-grid">
              <label className="chat-control-field chat-control-field-full">
                <span>Alias</span>
                <input maxLength={80} onChange={(event) => setClientAliasValue(event.target.value)} value={clientAliasValue} />
              </label>
              <div className="chat-context-card">
                <p className="section-label">Privacy</p>
                <p>The real customer name and contact remain hidden from freelancer mode. Use a project-safe label such as Finance coach edits.</p>
              </div>
            </div>
            <div className="chat-inline-actions">
              <button className="ui-button-ghost" onClick={() => setIsClientAliasModalOpen(false)} type="button">Cancel</button>
              <button className="ui-button-primary" onClick={() => handleClientAliasSubmit().catch(() => undefined)} type="button">Save alias</button>
            </div>
          </div>
        </div>
      ) : null}

      {isNewChatOpen ? (
        <div className="chat-modal-backdrop">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div>
                <h3>New chat from template</h3>
                <p className="muted-copy">Create a CRM thread and optionally send a starting template immediately.</p>
              </div>
              <button className="chat-head-icon" onClick={() => setIsNewChatOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="chat-modal-grid">
              <label className="chat-control-field"><span>Customer name</span><input value={newChatCustomerName} onChange={(event) => setNewChatCustomerName(event.target.value)} /></label>
              <label className="chat-control-field"><span>Phone</span><input value={newChatCustomerPhone} onChange={(event) => setNewChatCustomerPhone(event.target.value)} /></label>
              <label className="chat-control-field"><span>Linked service</span><select value={newChatServiceId} onChange={(event) => setNewChatServiceId(event.target.value)}><option value="">No linked service</option>{serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select></label>
              <label className="chat-control-field"><span>Template</span><select value={newChatTemplateId} onChange={(event) => setNewChatTemplateId(event.target.value)}><option value="">Start blank</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>
            </div>
            <div className="chat-inline-actions">
              <button className="ui-button-ghost" onClick={() => setIsNewChatOpen(false)} type="button">Cancel</button>
              <button className="ui-button-primary" onClick={() => handleNewChatSubmit().catch(() => undefined)} type="button">Create chat</button>
            </div>
          </div>
        </div>
      ) : null}

      {isPaymentModalOpen ? (
        <div className="chat-modal-backdrop">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div>
                <h3>{canRequestPaymentInternal ? "Request payment" : "Send payment request"}</h3>
                <p className="muted-copy">
                  {canRequestPaymentInternal
                    ? "Generate an internal PhonePe payment link for agency payment to freelancer."
                    : "Create a PhonePe checkout link and push it into the customer lane."}
                </p>
              </div>
              <button className="chat-head-icon" disabled={isPaymentSubmitting} onClick={() => setIsPaymentModalOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="chat-modal-grid">
              <label className="chat-control-field"><span>Amount</span><input disabled={isPaymentSubmitting} min="0" onChange={(event) => setPaymentAmount(event.target.value)} type="number" value={paymentAmount} /></label>
              <label className="chat-control-field"><span>Title / purpose</span><input disabled={isPaymentSubmitting} onChange={(event) => setPaymentTitle(event.target.value)} value={paymentTitle} /></label>
              <label className="chat-control-field"><span>Linked project</span><input disabled={isPaymentSubmitting} onChange={(event) => setPaymentProjectTitle(event.target.value)} value={paymentProjectTitle} /></label>
              <label className="chat-control-field chat-control-field-full"><span>Note</span><textarea disabled={isPaymentSubmitting} onChange={(event) => setPaymentNote(event.target.value)} rows={3} value={paymentNote} /></label>
              <label className="chat-control-field"><span>Due label</span><input disabled={isPaymentSubmitting} onChange={(event) => setPaymentDueLabel(event.target.value)} placeholder="Today, 6 PM" value={paymentDueLabel} /></label>
              <div className="chat-context-card">
                <p className="section-label">Split preview</p>
                <strong>{paymentSplitPreview.planLabel}</strong>
                {canManagePayments && resolvedLane === "customer" ? (
                  <p>Agency receives full amount: {formatCurrency(Number(paymentAmount || 0))}</p>
                ) : (
                  <>
                    <p>Editor {paymentSplitPreview.editorPercentage}% • Platform {paymentSplitPreview.platformPercentage}%</p>
                    <p>Editor {formatCurrency(paymentSplitPreview.editorShare)} • Platform {formatCurrency(paymentSplitPreview.platformShare)}</p>
                  </>
                )}
                {audience === "freelancer" ? <p>Agency pays via PhonePe; payout split is tracked after confirmation.</p> : <p>PhonePe checkout link will be created.</p>}
              </div>
            </div>
            <div className="chat-inline-actions">
              <button className="ui-button-ghost" disabled={isPaymentSubmitting} onClick={() => setIsPaymentModalOpen(false)} type="button">Cancel</button>
              <button
                className="ui-button-primary"
                disabled={isPaymentSubmitting}
                onClick={() => handlePaymentRequestSubmit().catch(() => undefined)}
                style={{
                  opacity: isPaymentSubmitting ? 0.75 : 1,
                  cursor: isPaymentSubmitting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                type="button"
              >
                {isPaymentSubmitting ? (
                  <>
                    <Loader2 className="spin-animate" size={14} />
                    <span>Creating payment link...</span>
                  </>
                ) : (
                  <span>{canRequestPaymentInternal ? "Request payment" : "Send request"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMicHelpOpen ? (
        <div className="chat-modal-backdrop">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <div>
                <h3>Enable microphone</h3>
                <p className="muted-copy">We need microphone access to record voice notes.</p>
              </div>
              <button className="chat-head-icon" onClick={() => setIsMicHelpOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="chat-modal-grid">
              <div className="chat-context-card">
                <p className="section-label">What to do</p>
                <p>{micHelpMessage || "Allow microphone access for this site, then retry the recording."}</p>
                <p>Step 1: Click the lock icon near the address bar and allow Microphone.</p>
                <p>Step 2: Refresh this page and tap the mic button again.</p>
                <p>Step 3: On Windows, enable microphone access for your browser in Settings.</p>
              </div>
              <div className="chat-context-card">
                <p className="section-label">Status</p>
                <strong>{micStatusLabel}</strong>
                <p className="muted-copy">If the status stays blocked, the browser or OS is still denying access.</p>
                {micLastError?.name || micLastError?.message ? (
                  <p className="muted-copy">
                    Last error: {micLastError?.name || "Unknown"}
                    {micLastError?.message ? ` - ${micLastError.message}` : ""}
                  </p>
                ) : null}
                {micDiagnostics ? (
                  <>
                    <p className="muted-copy">
                      Origin: {micDiagnostics.origin || "Unknown"}
                      {micDiagnostics.isSecureContext ? "" : " (not secure)"}
                      {micDiagnostics.inIframe ? " • In iframe" : ""}
                    </p>
                    <p className="muted-copy">
                      Permission query: {micDiagnostics.permissionQuery} • Audio inputs:{" "}
                      {typeof micDiagnostics.audioInputCount === "number" ? micDiagnostics.audioInputCount : "Unknown"}
                    </p>
                    {micDiagnostics.permissionsPolicyAllowsMicrophone !== null ? (
                      <p className="muted-copy">
                        Permissions policy allows mic: {micDiagnostics.permissionsPolicyAllowsMicrophone ? "yes" : "no"}
                      </p>
                    ) : null}
                    {micDiagnostics.enumerateDevicesError ? <p className="muted-copy">Device check error: {micDiagnostics.enumerateDevicesError}</p> : null}
                  </>
                ) : null}
              </div>
            </div>
            <div className="chat-inline-actions">
              <button className="ui-button-ghost" onClick={() => setIsMicHelpOpen(false)} type="button">Close</button>
              <button className="ui-button-ghost" onClick={() => forceStopMicrophone()} type="button">Stop mic</button>
              <button className="ui-button-primary" onClick={() => handleMicRetry().catch(() => undefined)} type="button">
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


































