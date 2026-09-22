"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Bot,
  Building2,
  CreditCard,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import styles from "./knowledge-base.module.css";

type Role = "FREELANCER" | "AGENCY" | "PLATFORM";

type Category = {
  id: string;
  role: Role;
  slug: string;
  title: string;
  description: string;
  iconKey: string;
};

type Media = {
  id: string;
  alt: string;
  title: string;
  url: string;
};

type Article = {
  id: string;
  role: Role;
  categoryId: string | null;
  href: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  filterGroups: string[];
  readingMinutes: number;
  updatedAt: string;
};

type HomeData = {
  articles: Article[];
  categories: Category[];
  media: Media[];
  popularArticles: Article[];
  recentlyUpdated: Article[];
  topSearched: Article[];
};

type SearchResult = {
  article: Article;
  matchedTerms: string[];
  score: number;
};

const iconMap = {
  analytics: BookOpen,
  "applying-for-work": Send,
  "chat-system": MessageSquareText,
  "payment-withdrawals": WalletCards,
  "posting-work": Building2,
  "profile-setup": UserRound,
  "account-verification": ShieldCheck,
  "finding-editors": UsersRound,
};

function roleLabel(role: Role) {
  if (role === "FREELANCER") return "Freelancer";
  if (role === "AGENCY") return "Agency";
  return "Platform";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function mediaSrc(url: string) {
  if (!url.startsWith("/knowledge-base/media/")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=20260517`;
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link className={styles.articleCard} href={article.href}>
      <div className={styles.metaRow}>
        <span>{roleLabel(article.role)}</span>
        <span>{article.readingMinutes} min read</span>
      </div>
      <div>
        <strong className={styles.cardTitle}>{article.title}</strong>
        <p className={styles.muted}>{article.summary}</p>
      </div>
      <div className={styles.chipRow}>
        {article.filterGroups.slice(0, 3).map((filter) => (
          <span className={styles.chip} key={filter}>
            {filter}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function KnowledgeBaseHome({ data }: { data: HomeData }) {
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState<Role | "ALL">("ALL");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("gigxomiKbRecentSearches") ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({ q: trimmed });
      if (activeRole !== "ALL") params.set("role", activeRole);
      if (activeFilter !== "All") params.append("filters", activeFilter);
      fetch(`/api/knowledge-base/search?${params.toString()}`, { cache: "no-store" })
        .then((response) => response.json())
        .then((payload: { results?: SearchResult[] }) => setSearchResults(payload.results ?? []))
        .catch(() => setSearchResults([]));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [activeFilter, activeRole, query]);

  function rememberSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 5);
    setRecentSearches(next);
    window.localStorage.setItem("gigxomiKbRecentSearches", JSON.stringify(next));
  }

  const filters = useMemo(() => ["All", "Freelancer", "Agency", "Payments", "Chat", "Projects"], []);
  const visibleArticles = useMemo(() => {
    return data.articles.filter((article) => {
      const roleMatches = activeRole === "ALL" || article.role === activeRole;
      const filterMatches = activeFilter === "All" || article.filterGroups.includes(activeFilter) || article.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
      return roleMatches && filterMatches;
    });
  }, [activeFilter, activeRole, data.articles]);

  const categoryGroups = useMemo(() => {
    return {
      freelancer: data.categories.filter((category) => category.role === "FREELANCER"),
      agency: data.categories.filter((category) => category.role === "AGENCY"),
    };
  }, [data.categories]);

  const tutorialMedia = data.media.slice(0, 6);
  const visibleSearchResults = query.trim() ? searchResults : [];
  const openSupportBot = () => {
    window.dispatchEvent(
      new CustomEvent("gigxomi:open-support-bot", {
        detail: {
          role: activeRole === "ALL" ? "" : activeRole,
        },
      }),
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.stickySearch}>
        <div className={styles.searchHeader}>
          <div className={styles.searchBox}>
            <Search size={20} strokeWidth={2} />
            <input
              onBlur={() => {
                window.setTimeout(() => setIsSearchOpen(false), 150);
                rememberSearch(query);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search booking a service, chats, payments, hiring, profile setup..."
              value={query}
            />
            {isSearchOpen ? (
              <div className={styles.searchPanel}>
                {query.trim() ? (
                  visibleSearchResults.length ? (
                    visibleSearchResults.map((result) => (
                      <Link className={styles.searchItem} href={result.article.href} key={result.article.id} onClick={() => rememberSearch(query)}>
                        <strong>{result.article.title}</strong>
                        <span>{result.article.summary}</span>
                      </Link>
                    ))
                  ) : (
                    <div className={styles.emptyState}>No results found. Try booking, payments, chat, apply, hiring, or profile setup.</div>
                  )
                ) : recentSearches.length ? (
                  recentSearches.map((item) => (
                    <button className={styles.searchItem} key={item} onMouseDown={() => setQuery(item)} type="button">
                      <strong>{item}</strong>
                      <span>Recent search</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.emptyState}>Start typing to search articles instantly.</div>
                )}
              </div>
            ) : null}
          </div>
          <button className={styles.headerSupportButton} onClick={openSupportBot} type="button">
            <Bot size={16} />
            Support
          </button>
        </div>
        <div className={styles.filterRow}>
          {[
            { label: "All", value: "ALL" },
            { label: "Freelancer", value: "FREELANCER" },
            { label: "Agency", value: "AGENCY" },
            { label: "Platform", value: "PLATFORM" },
          ].map((item) => (
            <button className={activeRole === item.value ? styles.active : ""} key={item.value} onClick={() => setActiveRole(item.value as Role | "ALL")} type="button">
              {item.label}
            </button>
          ))}
          {filters.map((filter) => (
            <button className={activeFilter === filter ? styles.active : ""} key={filter} onClick={() => setActiveFilter(filter)} type="button">
              {filter}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Gigxomi Knowledge Base</span>
          <h1>Everything You Need To Grow On Gigxomi</h1>
          <p>Learn how to use Gigxomi as a freelancer or agency with step-by-step guides, tutorials, screenshots, and workflow explanations.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#freelancer-guides">
              Explore Freelancer Guides
            </a>
            <a className={styles.secondaryButton} href="#agency-guides">
              Explore Agency Guides
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.roleGrid}>
          <article className={styles.roleCard} id="freelancer-guides">
            <div>
              <span className={styles.iconWrap}><UserRound size={22} /></span>
              <h2 className={styles.cardTitle}>Freelancer Knowledge Base</h2>
              <p className={styles.muted}>Learn how to build your profile, apply for work, communicate with agencies, receive payments, and grow your editing career.</p>
            </div>
            <button className={styles.primaryButton} onClick={() => setActiveRole("FREELANCER")} type="button">
              Explore Freelancer Docs
            </button>
          </article>
          <article className={styles.roleCard} id="agency-guides">
            <div>
              <span className={styles.iconWrap}><Building2 size={22} /></span>
              <h2 className={styles.cardTitle}>Agency Knowledge Base</h2>
              <p className={styles.muted}>Learn how to hire editors, manage projects, post work opportunities, track workflows, and scale your editing agency.</p>
            </div>
            <button className={styles.primaryButton} onClick={() => setActiveRole("AGENCY")} type="button">
              Explore Agency Docs
            </button>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Popular help categories</span>
            <h2>Find the workflow you need</h2>
          </div>
          <p className={styles.sectionIntro}>Categories map to real Gigxomi editor-agency operations.</p>
        </div>
        <h3 className={styles.cardTitle}>Freelancer Categories</h3>
        <div className={styles.categoryGrid}>
          {categoryGroups.freelancer.map((category) => {
            const Icon = iconMap[category.slug as keyof typeof iconMap] ?? BookOpen;
            return (
              <button className={styles.categoryCard} key={category.id} onClick={() => { setActiveRole("FREELANCER"); setActiveFilter(category.title.includes("Payment") ? "Payments" : "Freelancer"); }} type="button">
                <span className={styles.iconWrap}><Icon size={20} /></span>
                <strong className={styles.cardTitle}>{category.title}</strong>
                <p className={styles.muted}>{category.description}</p>
              </button>
            );
          })}
        </div>
        <h3 className={styles.cardTitle}>Agency Categories</h3>
        <div className={styles.categoryGrid}>
          {categoryGroups.agency.map((category) => {
            const Icon = iconMap[category.slug as keyof typeof iconMap] ?? Building2;
            return (
              <button className={styles.categoryCard} key={category.id} onClick={() => { setActiveRole("AGENCY"); setActiveFilter(category.title.includes("Chat") ? "Chat" : "Agency"); }} type="button">
                <span className={styles.iconWrap}><Icon size={20} /></span>
                <strong className={styles.cardTitle}>{category.title}</strong>
                <p className={styles.muted}>{category.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section} id="articles">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Step-by-step guides</span>
            <h2>Articles for the selected workflow</h2>
          </div>
          <p className={styles.sectionIntro}>{visibleArticles.length} article{visibleArticles.length === 1 ? "" : "s"} available</p>
        </div>
        {visibleArticles.length ? (
          <div className={styles.articleGrid}>
            {visibleArticles.map((article) => <ArticleCard article={article} key={article.id} />)}
          </div>
        ) : (
          <div className={styles.emptyState}>No articles found for this filter. Try a broader role or keyword.</div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Visual feature tutorials</span>
            <h2>Learn features visually</h2>
          </div>
        </div>
        <div className={styles.tutorialGrid}>
          {tutorialMedia.map((media) => (
            <article className={styles.mediaCard} key={media.id}>
              <Image alt={media.alt} height={240} src={mediaSrc(media.url)} width={420} />
              <strong className={styles.cardTitle}>{media.title}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Popular Articles</span>
            <h2>Most useful starting points</h2>
          </div>
        </div>
        <div className={styles.articleGrid}>
          {data.popularArticles.map((article) => <ArticleCard article={article} key={article.id} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.supportBlock}>
          <div>
            <span className={styles.eyebrow}>Still Need Help?</span>
            <h2 className={styles.cardTitle}>Talk to Gigxomi support with your article context attached.</h2>
            <p className={styles.muted}>Use live chat support, WhatsApp support, email assistance, or contact the support team when the knowledge base does not resolve your question.</p>
            <div className={styles.heroActions}>
              <button className={styles.primaryButton} onClick={openSupportBot} type="button">
                <Bot size={16} />
                Open Live Chat
              </button>
              <Link className={styles.secondaryButton} href="/contact">
                Contact Support
              </Link>
            </div>
          </div>
          <div className={styles.supportIllustration}>
            <MessageSquareText size={82} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Recently Updated</span>
            <h2>Fresh support content</h2>
          </div>
        </div>
        <div className={styles.articleGrid}>
          {data.recentlyUpdated.map((article) => (
            <Link className={styles.articleCard} href={article.href} key={article.id}>
              <div className={styles.metaRow}>
                <span>{roleLabel(article.role)}</span>
                <span>{formatDate(article.updatedAt)}</span>
              </div>
              <strong className={styles.cardTitle}>{article.title}</strong>
              <p className={styles.muted}>{article.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>Top Searched</span>
            <h2>Common questions</h2>
          </div>
        </div>
        <div className={styles.articleGrid}>
          {data.topSearched.map((article) => <ArticleCard article={article} key={article.id} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.supportGrid}>
          <article className={styles.supportCard}>
            <span className={styles.iconWrap}><Bot size={20} /></span>
            <strong className={styles.cardTitle}>Ask Gigxomi AI</strong>
            <p className={styles.muted}>Ask questions like “How do I hire editors?”, “How payment works?”, or “How to apply for projects?” The bot recommends related articles and can hand off to support.</p>
          </article>
          <article className={styles.supportCard}>
            <span className={styles.iconWrap}><CreditCard size={20} /></span>
            <strong className={styles.cardTitle}>Payments</strong>
            <p className={styles.muted}>Use payment and wallet guides to understand transparent requests, payout readiness, and ledger status.</p>
          </article>
          <article className={styles.supportCard}>
            <span className={styles.iconWrap}><Bell size={20} /></span>
            <strong className={styles.cardTitle}>Real-time updates</strong>
            <p className={styles.muted}>Notifications help agencies and editors respond to applications, chats, approvals, and project movement quickly.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
