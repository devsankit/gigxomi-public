"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";

import styles from "./support-bot-widget.module.css";

type BotRole = "" | "FREELANCER" | "AGENCY" | "PLATFORM";

type BotSource = {
  href: string;
  role: string;
  slug: string;
  summary: string;
  title: string;
};

type BotMessage = {
  id: string;
  body: string;
  role: "assistant" | "user";
  sources?: BotSource[];
};

type SupportBotWidgetProps = {
  defaultRole?: BotRole;
  lockRole?: boolean;
};

function makeMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBotRole(value: unknown): BotRole {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "FREELANCER" || normalized === "AGENCY" || normalized === "PLATFORM") {
    return normalized;
  }
  return "";
}

function roleLabel(role: BotRole) {
  if (role === "FREELANCER") return "Freelancer";
  if (role === "AGENCY") return "Agency";
  if (role === "PLATFORM") return "Platform";
  return "All";
}

function getPromptPlaceholder(role: BotRole) {
  if (role === "FREELANCER") return "Ask: How do I apply for work?";
  if (role === "AGENCY") return "Ask: How do I hire editors?";
  if (role === "PLATFORM") return "Ask: How do I book a service?";
  return "Ask: How do I book a service?";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function SupportBotWidget({ defaultRole = "", lockRole = false }: SupportBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      body: "Hello, welcome to Gigxomi. Tell me what you are looking for and I will point you to the right help.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<BotRole>(defaultRole);
  const [isSending, setIsSending] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [handoffName, setHandoffName] = useState("");
  const [handoffPhone, setHandoffPhone] = useState("");
  const [handoffUrl, setHandoffUrl] = useState("");
  const [status, setStatus] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedSessionId = window.localStorage.getItem("gigxomiSupportBotSessionId");
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
    const openBot = (event: Event) => {
      if (!lockRole && event instanceof CustomEvent) {
        setRole(normalizeBotRole(event.detail?.role));
      }
      setIsOpen(true);
    };
    window.addEventListener("gigxomi:open-support-bot", openBot);
    return () => window.removeEventListener("gigxomi:open-support-bot", openBot);
  }, [lockRole]);

  useEffect(() => {
    if (lockRole) {
      setRole(defaultRole);
    }
  }, [defaultRole, lockRole]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const latestUserQuestion = useMemo(() => [...messages].reverse().find((message) => message.role === "user")?.body ?? draft, [draft, messages]);

  async function sendMessage() {
    const message = draft.trim();
    if (!message || isSending) return;

    const userMessage: BotMessage = {
      id: makeMessageId(),
      role: "user",
      body: message,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsSending(true);
    setStatus("Gigxomi support is typing...");

    try {
      const response = await fetch("/api/support-bot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, role: role || undefined, sessionId: sessionId || undefined }),
      });
      const payload = (await response.json().catch(() => null)) as {
        answer?: string;
        error?: string;
        needsHuman?: boolean;
        ok?: boolean;
        sessionId?: string;
        sources?: BotSource[];
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Support bot could not answer right now.");
      }
      if (payload.sessionId) {
        setSessionId(payload.sessionId);
        window.localStorage.setItem("gigxomiSupportBotSessionId", payload.sessionId);
      }
      await wait(450);
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          body: payload.answer ?? "I found a few related Gigxomi articles.",
          sources: payload.sources ?? [],
        },
      ]);
      setShowHandoff(Boolean(payload.needsHuman));
      setStatus(payload.needsHuman ? "A human support handoff is available for this question." : "");
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          body: error instanceof Error ? error.message : "Support bot could not answer right now.",
        },
      ]);
      setShowHandoff(true);
      setStatus("You can still reach Gigxomi support through WhatsApp.");
    } finally {
      setIsSending(false);
    }
  }

  async function submitHandoff() {
    if (!handoffName.trim() || !handoffPhone.trim() || !latestUserQuestion.trim()) {
      setStatus("Add your name, WhatsApp number, and question before handoff.");
      return;
    }
    setIsSending(true);
    setStatus("Creating a support handoff...");
    try {
      const response = await fetch("/api/support-bot/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: handoffName,
          phone: handoffPhone,
          question: latestUserQuestion,
          sessionId: sessionId || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        ok?: boolean;
        sessionId?: string;
        whatsappHref?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Unable to create support handoff.");
      }
      if (payload.sessionId) {
        setSessionId(payload.sessionId);
        window.localStorage.setItem("gigxomiSupportBotSessionId", payload.sessionId);
      }
      setHandoffUrl(payload.whatsappHref ?? "");
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          body: "I created a support handoff with your question and context. Open WhatsApp to continue with a human support member.",
        },
      ]);
      setStatus("Support handoff created.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create support handoff.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <section aria-label="Gigxomi support bot" className={styles.panel}>
          <header className={styles.header}>
            <div className={styles.title}>
              <strong>Gigxomi Support Bot</strong>
              <span>Answers from the knowledge base</span>
            </div>
            <button aria-label="Close support bot" className={styles.iconButton} onClick={() => setIsOpen(false)} type="button">
              <X size={17} strokeWidth={2} />
            </button>
          </header>

          <div className={styles.messages} ref={messagesRef}>
            {messages.map((message) => (
              <article className={`${styles.bubble} ${message.role === "user" ? styles.user : ""}`} key={message.id}>
                <p>{message.body}</p>
                {message.sources?.length ? (
                  <div className={styles.sourceList}>
                    {message.sources.slice(0, 3).map((source) => (
                      <Link className={styles.source} href={source.href} key={`${message.id}-${source.href}`}>
                        <strong>{source.title}</strong>
                        <span>{source.summary}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {isSending ? (
              <article className={`${styles.bubble} ${styles.typingBubble}`}>
                <span className={styles.typingLabel}>Gigxomi support is typing</span>
                <span className={styles.typingDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </article>
            ) : null}
          </div>

          {lockRole ? (
            <div className={styles.roleContext}>
              <span>{roleLabel(role)} help mode</span>
              <strong>Answers stay focused on this knowledge base role.</strong>
            </div>
          ) : (
            <div className={styles.roleTabs} aria-label="Support role filter">
              {[
                { label: "All", value: "" },
                { label: "Freelancer", value: "FREELANCER" },
                { label: "Agency", value: "AGENCY" },
                { label: "Platform", value: "PLATFORM" },
              ].map((item) => (
                <button className={role === item.value ? styles.active : ""} key={item.value || "all"} onClick={() => setRole(item.value as BotRole)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <footer className={styles.composer}>
            <div className={styles.inputRow}>
              <textarea
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage().catch(() => undefined);
                  }
                }}
                placeholder={getPromptPlaceholder(role)}
                rows={2}
                value={draft}
              />
              <button aria-label="Send support question" className={styles.sendButton} disabled={isSending || !draft.trim()} onClick={() => sendMessage().catch(() => undefined)} type="button">
                <Send size={17} strokeWidth={2.1} />
              </button>
            </div>
            <button className={styles.handoffToggle} onClick={() => setShowHandoff((current) => !current)} type="button">
              <MessageCircle size={15} strokeWidth={2} />
              Talk to human
            </button>
            {showHandoff ? (
              <div className={styles.handoff}>
                <input onChange={(event) => setHandoffName(event.target.value)} placeholder="Your name" value={handoffName} />
                <input onChange={(event) => setHandoffPhone(event.target.value)} placeholder="WhatsApp number" value={handoffPhone} />
                <button disabled={isSending} onClick={() => submitHandoff().catch(() => undefined)} type="button">
                  Create handoff
                </button>
                {handoffUrl ? (
                  <a className={styles.whatsappLink} href={handoffUrl} rel="noreferrer" target="_blank">
                    Open WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
            <p className={styles.status}>{status}</p>
          </footer>
        </section>
      ) : null}

      <button aria-label="Open Gigxomi support bot" className={styles.launcher} onClick={() => setIsOpen(true)} type="button">
        <Image alt="" className={styles.launcherLogo} height={42} priority src="/support/gigxomi-bot-icon.png" width={42} />
      </button>
    </>
  );
}
