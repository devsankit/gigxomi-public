"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Copy, MessageSquareText, Share2 } from "lucide-react";

import styles from "./knowledge-base.module.css";

type Role = "FREELANCER" | "AGENCY" | "PLATFORM";

type Block = {
  body: string;
  title: string;
};

type Faq = {
  answer: string;
  question: string;
};

type Media = {
  alt: string;
  id: string;
  title: string;
  url: string;
};

type Article = {
  id: string;
  role: Role;
  href: string;
  slug: string;
  title: string;
  summary: string;
  intro: string;
  bodyBlocks: Block[];
  steps: Block[];
  importantNotes: string[];
  faqs: Faq[];
  filterGroups: string[];
  media: Media[];
  readingMinutes: number;
  tags: string[];
  videoTitle: string | null;
  videoUrl: string | null;
};

function roleLabel(role: Role) {
  if (role === "FREELANCER") return "Freelancer";
  if (role === "AGENCY") return "Agency";
  return "Platform";
}

function mediaSrc(url: string) {
  if (!url.startsWith("/knowledge-base/media/")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=20260517`;
}

export function KnowledgeBaseArticleView({
  article,
  related,
}: {
  article: Article;
  related: Article[];
}) {
  const [feedback, setFeedback] = useState<"yes" | "no" | "">("");
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const bookmarks = JSON.parse(window.localStorage.getItem("gigxomiKbBookmarks") ?? "[]") as string[];
      return bookmarks.includes(article.id);
    } catch {
      return false;
    }
  });

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function toggleBookmark() {
    const bookmarks = JSON.parse(window.localStorage.getItem("gigxomiKbBookmarks") ?? "[]") as string[];
    const next = bookmarked ? bookmarks.filter((id) => id !== article.id) : [article.id, ...bookmarks.filter((id) => id !== article.id)];
    window.localStorage.setItem("gigxomiKbBookmarks", JSON.stringify(next));
    setBookmarked(!bookmarked);
  }

  async function sendFeedback(helpful: boolean) {
    setFeedback(helpful ? "yes" : "no");
    await fetch("/api/knowledge-base/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id, helpful }),
    }).catch(() => undefined);
  }

  function openSupportBot() {
    window.dispatchEvent(
      new CustomEvent("gigxomi:open-support-bot", {
        detail: {
          role: article.role,
        },
      }),
    );
  }

  return (
    <div className={styles.articleLayout}>
      <article className={styles.articleMain}>
        <header className={styles.articleHeader}>
          <span className={styles.eyebrow}>{roleLabel(article.role)} guide</span>
          <h1>{article.title}</h1>
          <p className={styles.muted}>{article.summary}</p>
          <div className={styles.metaRow}>
            <span>{article.readingMinutes} min read</span>
            {article.filterGroups.map((filter) => <span key={filter}>{filter}</span>)}
          </div>
          <div className={styles.articleActions}>
            <button className={styles.secondaryButton} onClick={() => copyLink().catch(() => undefined)} type="button">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button className={styles.secondaryButton} onClick={toggleBookmark} type="button">
              <Bookmark size={15} />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button className={styles.primaryButton} onClick={openSupportBot} type="button">
              <MessageSquareText size={15} />
              Support
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: article.title, url: window.location.href }).catch(() => undefined);
                } else {
                  copyLink().catch(() => undefined);
                }
              }}
              type="button"
            >
              <Share2 size={15} />
              Share
            </button>
          </div>
        </header>

        <section className={styles.articleBody}>
          <div className={styles.contentBlock}>
            <p>{article.intro}</p>
          </div>

          {article.media.length ? (
            <div className={styles.tutorialGrid} id="screenshots">
              {article.media.map((media) => (
                <figure className={styles.mediaCard} key={media.id}>
                  <Image alt={media.alt} height={240} src={mediaSrc(media.url)} width={420} />
                  <figcaption className={styles.muted}>{media.title}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {article.videoUrl ? (
            <div className={styles.mediaCard} id="video">
              <strong className={styles.cardTitle}>{article.videoTitle || "Video tutorial"}</strong>
              <a className={styles.primaryButton} href={article.videoUrl} rel="noreferrer" target="_blank">
                Open video tutorial
              </a>
            </div>
          ) : null}

          {article.bodyBlocks.map((block) => (
            <section className={styles.contentBlock} id={block.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} key={block.title}>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </section>
          ))}

          {article.steps.length ? (
            <section className={styles.contentBlock} id="steps">
              <h2>Step-by-step instructions</h2>
              <ol className={styles.stepList}>
                {article.steps.map((step, index) => (
                  <li className={styles.stepItem} key={`${step.title}-${index}`}>
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {article.importantNotes.length ? (
            <section className={styles.contentBlock} id="notes">
              <h2>Important notes</h2>
              <ul className={styles.noteList}>
                {article.importantNotes.map((note) => (
                  <li className={styles.faqCard} key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {article.faqs.length ? (
            <section className={styles.contentBlock} id="faqs">
              <h2>FAQs</h2>
              <div className={styles.faqList}>
                {article.faqs.map((faq) => (
                  <details className={styles.faqCard} key={faq.question}>
                    <summary className={styles.cardTitle}>{faq.question}</summary>
                    <p className={styles.muted}>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.contentBlock}>
            <h2>Was this helpful?</h2>
            <div className={styles.feedback}>
              <button onClick={() => sendFeedback(true).catch(() => undefined)} type="button">
                {feedback === "yes" ? "Thanks" : "Yes"}
              </button>
              <button onClick={() => sendFeedback(false).catch(() => undefined)} type="button">
                {feedback === "no" ? "Noted" : "No"}
              </button>
            </div>
          </section>

          <section className={styles.supportBlock}>
            <div>
              <span className={styles.eyebrow}>Still Need Help?</span>
              <h2 className={styles.cardTitle}>Ask the support bot or talk to a human.</h2>
              <p className={styles.muted}>The bot can use this article as context, and human handoff sends your question to WhatsApp plus the super-admin chat queue.</p>
              <div className={styles.heroActions}>
                <button className={styles.primaryButton} onClick={openSupportBot} type="button">
                  <MessageSquareText size={15} />
                  Open Live Chat
                </button>
                <Link className={styles.secondaryButton} href="/contact">
                  Contact Support
                </Link>
              </div>
            </div>
            <div className={styles.supportIllustration}>
              <MessageSquareText size={76} strokeWidth={1.4} />
            </div>
          </section>

          {related.length ? (
            <section className={styles.contentBlock} id="related">
              <h2>Related articles</h2>
              <div className={styles.articleGrid}>
                {related.map((item) => (
                  <Link className={styles.articleCard} href={item.href} key={item.id}>
                    <div className={styles.metaRow}>
                      <span>{roleLabel(item.role)}</span>
                      <span>{item.readingMinutes} min read</span>
                    </div>
                    <strong className={styles.cardTitle}>{item.title}</strong>
                    <p className={styles.muted}>{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </article>

      <aside className={styles.toc}>
        <strong className={styles.cardTitle}>On this page</strong>
        <a href="#screenshots">Screenshots</a>
        <a href="#steps">Steps</a>
        <a href="#notes">Important notes</a>
        <a href="#faqs">FAQs</a>
        <a href="#related">Related articles</a>
        <button onClick={openSupportBot} type="button">
          Open support bot
        </button>
      </aside>
    </div>
  );
}
