"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Compass,
  Mic,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import type { HomepageBlogPost } from "@/components/public/homepage-brand-sections";
import type { MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";

type MobileUnifiedSearchProps = {
  blogPosts: HomepageBlogPost[];
  isListening: boolean;
  isMatching: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onToggleListening: () => void;
  promptValue: string;
  services: MarketplaceSurfaceService[];
};

type SearchableEditor = {
  href: string;
  id: string;
  name: string;
  serviceCount: number;
  specialties: string[];
  searchText: string;
};

type ScoredResult<T> = {
  item: T;
  score: number;
};

const searchablePages = [
  {
    href: "/discover?surface=services",
    keywords: "discover browse marketplace video editing graphic design samples",
    label: "Explore all services",
  },
  {
    href: "/discover?surface=agencies",
    keywords: "agency agencies creative delivery partner network verified",
    label: "Find an agency",
  },
  {
    href: "/",
    keywords: "agency growth webinar scale team editors operations",
    label: "Agency workshop home",
  },
  {
    href: "/blog",
    keywords: "blog guides articles learning video editing business",
    label: "Gigxomi Journal",
  },
];

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

function scoreSearchText(searchText: string, query: string) {
  const normalizedText = normalizeSearchValue(searchText);
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
  if (!tokens.length) {
    return normalizedText.includes(normalizedQuery) ? 1 : 0;
  }

  let score = normalizedText.includes(normalizedQuery) ? 36 : 0;
  for (const token of tokens) {
    if (normalizedText.startsWith(token)) score += 12;
    else if (normalizedText.includes(` ${token}`)) score += 8;
    else if (normalizedText.includes(token)) score += 4;
  }

  return tokens.every((token) => normalizedText.includes(token)) ? score + 20 : score;
}

function rankItems<T>(items: T[], query: string, getSearchText: (item: T) => string, limit: number) {
  return items
    .map((item): ScoredResult<T> => ({ item, score: scoreSearchText(getSearchText(item), query) }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((result) => result.item);
}

function buildSearchableEditors(services: MarketplaceSurfaceService[]) {
  const editors = new Map<string, SearchableEditor>();

  for (const service of services) {
    const key = service.ownerId || normalizeSearchValue(service.ownerName || service.ownerAlias);
    const existing = editors.get(key);
    const specialties = Array.from(new Set([...(existing?.specialties ?? []), service.specialty, ...service.tags].filter(Boolean))).slice(0, 4);
    const name = service.ownerName?.trim() || service.ownerAlias?.trim() || "Gigxomi editor";

    editors.set(key, {
      href: existing?.href ?? service.publicHref ?? `/services/${service.slug}`,
      id: key,
      name,
      serviceCount: (existing?.serviceCount ?? 0) + 1,
      specialties,
      searchText: [existing?.searchText, name, service.ownerAlias, service.title, service.specialty, ...service.tags].filter(Boolean).join(" "),
    });
  }

  return Array.from(editors.values());
}

export function MobileUnifiedSearch({
  blogPosts,
  isListening,
  isMatching,
  onPromptChange,
  onSubmit,
  onToggleListening,
  promptValue,
  services,
}: MobileUnifiedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchRootRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = promptValue.trim();
  const searchableEditors = useMemo(() => buildSearchableEditors(services), [services]);
  const serviceResults = useMemo(
    () =>
      rankItems(
        services,
        normalizedQuery,
        (service) =>
          [service.title, service.summary, service.specialty, service.category, service.ownerName, service.ownerAlias, ...service.tags].join(" "),
        4,
      ),
    [normalizedQuery, services],
  );
  const editorResults = useMemo(
    () => rankItems(searchableEditors, normalizedQuery, (editor) => editor.searchText, 3),
    [normalizedQuery, searchableEditors],
  );
  const blogResults = useMemo(
    () => rankItems(blogPosts, normalizedQuery, (post) => `${post.title} ${post.excerpt}`, 4),
    [blogPosts, normalizedQuery],
  );
  const pageResults = useMemo(
    () => rankItems(searchablePages, normalizedQuery, (page) => `${page.label} ${page.keywords}`, 3),
    [normalizedQuery],
  );
  const resultCount = serviceResults.length + editorResults.length + blogResults.length + pageResults.length;

  useEffect(() => {
    const searchRoot = searchRootRef.current;
    if (!searchRoot) return;

    let animationFrame = 0;

    const updateViewportPosition = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const visibleHeight = viewport?.height ?? window.innerHeight;
        const viewportOffsetTop = viewport?.offsetTop ?? 0;
        const overlap = viewport ? Math.max(0, window.innerHeight - visibleHeight - viewportOffsetTop) : 0;
        const keyboardOffset = overlap > 80 ? overlap : 0;

        searchRoot.style.setProperty("--mobile-search-keyboard-offset", `${Math.round(keyboardOffset)}px`);
        searchRoot.style.setProperty("--mobile-search-visible-height", `${Math.round(visibleHeight)}px`);
        searchRoot.dataset.keyboardOpen = keyboardOffset > 0 ? "true" : "false";
      });
    };

    updateViewportPosition();
    window.addEventListener("resize", updateViewportPosition);
    window.addEventListener("orientationchange", updateViewportPosition);
    window.visualViewport?.addEventListener("resize", updateViewportPosition);
    window.visualViewport?.addEventListener("scroll", updateViewportPosition);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateViewportPosition);
      window.removeEventListener("orientationchange", updateViewportPosition);
      window.visualViewport?.removeEventListener("resize", updateViewportPosition);
      window.visualViewport?.removeEventListener("scroll", updateViewportPosition);
    };
  }, []);

  const closeResults = () => {
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const submitSearch = () => {
    if (!normalizedQuery) {
      setIsOpen(true);
      inputRef.current?.focus();
      return;
    }

    onSubmit();
    closeResults();
  };

  return (
    <div className={isOpen ? "mobile-unified-search is-open" : "mobile-unified-search"} ref={searchRootRef}>
      {isOpen ? (
        <section aria-label="Search Gigxomi" aria-live="polite" className="mobile-unified-search-results" id="mobile-unified-search-results">
          <header className="mobile-unified-search-results-head">
            <div>
              <span className="mobile-unified-search-eyebrow">
                <Sparkles size={13} strokeWidth={2} />
                Search all Gigxomi
              </span>
              <strong>{normalizedQuery ? `${resultCount} useful matches` : "What are you looking for?"}</strong>
            </div>
            <button aria-label="Close search results" onClick={closeResults} type="button">
              <X size={17} strokeWidth={2} />
            </button>
          </header>

          {normalizedQuery ? (
            resultCount ? (
              <div className="mobile-unified-search-groups">
                {serviceResults.length ? (
                  <SearchGroup icon={<BriefcaseBusiness size={14} />} label="Services">
                    {serviceResults.map((service) => (
                      <SearchResultLink
                        href={service.publicHref ?? `/services/${service.slug}`}
                        key={`service-${service.id}`}
                        label={service.title}
                        meta={`${service.specialty} · from INR ${service.basePrice.toLocaleString("en-IN")}`}
                        onNavigate={closeResults}
                      />
                    ))}
                  </SearchGroup>
                ) : null}

                {editorResults.length ? (
                  <SearchGroup icon={<UserRound size={14} />} label="Editors">
                    {editorResults.map((editor) => (
                      <SearchResultLink
                        href={editor.href}
                        key={`editor-${editor.id}`}
                        label={editor.name}
                        meta={`${editor.serviceCount} service${editor.serviceCount === 1 ? "" : "s"} · ${editor.specialties.slice(0, 2).join(" · ")}`}
                        onNavigate={closeResults}
                      />
                    ))}
                  </SearchGroup>
                ) : null}

                {blogResults.length ? (
                  <SearchGroup icon={<BookOpen size={14} />} label="Blogs">
                    {blogResults.map((post) => (
                      <SearchResultLink href={post.url} key={`blog-${post.id}`} label={post.title} meta={post.excerpt} onNavigate={closeResults} />
                    ))}
                  </SearchGroup>
                ) : null}

                {pageResults.length ? (
                  <SearchGroup icon={<Compass size={14} />} label="Explore">
                    {pageResults.map((page) => (
                      <SearchResultLink href={page.href} key={`page-${page.href}`} label={page.label} meta="Open this Gigxomi page" onNavigate={closeResults} />
                    ))}
                  </SearchGroup>
                ) : null}
              </div>
            ) : (
              <div className="mobile-unified-search-empty">
                <Search size={22} strokeWidth={1.7} />
                <strong>No exact item found yet</strong>
                <span>Send this as a brief and Gigxomi will rank the closest live services.</span>
                <button onClick={submitSearch} type="button">
                  Match this brief <ArrowRight size={14} />
                </button>
              </div>
            )
          ) : (
            <div className="mobile-unified-search-start">
              <p>Find a service, editor, guide, or page from one search.</p>
              <div>
                {["Reels editor", "Wedding video", "Agency growth", "Editing rates"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      onPromptChange(suggestion);
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      <form
        className="mobile-unified-search-dock"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <span aria-hidden="true" className="mobile-unified-search-mark">
          <Search size={17} strokeWidth={2} />
        </span>
        <input
          aria-controls="mobile-unified-search-results"
          aria-expanded={isOpen}
          aria-label="Search services, editors, blogs, and Gigxomi pages"
          aria-autocomplete="list"
          enterKeyHint="search"
          onChange={(event) => {
            onPromptChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeResults();
            }
          }}
          placeholder="Search services, editors, blogs..."
          ref={inputRef}
          role="combobox"
          type="search"
          value={promptValue}
        />
        {promptValue ? (
          <button
            aria-label="Clear search"
            className="mobile-unified-search-clear"
            onClick={() => {
              onPromptChange("");
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X size={15} strokeWidth={2} />
          </button>
        ) : (
          <button
            aria-label={isListening ? "Stop voice input" : "Use voice input"}
            className={isListening ? "mobile-unified-search-voice is-listening" : "mobile-unified-search-voice"}
            onClick={onToggleListening}
            type="button"
          >
            <Mic size={16} strokeWidth={1.9} />
          </button>
        )}
        <button aria-label="Search Gigxomi" className="mobile-unified-search-submit" disabled={!normalizedQuery || isMatching} type="submit">
          <ArrowRight size={17} strokeWidth={2.1} />
        </button>
      </form>
    </div>
  );
}

function SearchGroup({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <section className="mobile-unified-search-group">
      <h3>
        {icon}
        {label}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function SearchResultLink({ href, label, meta, onNavigate }: { href: string; label: string; meta: string; onNavigate: () => void }) {
  return (
    <Link className="mobile-unified-search-result" href={href} onClick={onNavigate}>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
      <ArrowRight size={14} strokeWidth={1.9} />
    </Link>
  );
}
