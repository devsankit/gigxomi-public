"use client";

import { useEffect, useState } from "react";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

type BlogTableOfContentsProps = {
  headings: HeadingItem[];
};

export function BlogTableOfContents({ headings }: BlogTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    function handleScroll() {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100)));
      }

      const elements = headings
        .map((h) => ({ id: h.id, el: document.getElementById(h.id) }))
        .filter((item): item is { id: string; el: HTMLElement } => item.el !== null);

      const scrollPos = window.scrollY + 160;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].el.offsetTop <= scrollPos) {
          setActiveId(elements[i].id);
          return;
        }
      }
      if (elements.length > 0 && window.scrollY < 200) {
        setActiveId(elements[0].id);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Top Fixed Reading Progress Bar */}
      <div
        className="gx-reading-progress"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />

      <nav className="gx-blog-toc" aria-label="Table of contents">
        <div className="gx-toc-header" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0}>
          <div className="gx-toc-title-row">
            <span className="gx-toc-indicator" />
            <strong>Table of Contents</strong>
          </div>
          <span className="gx-toc-toggle">{isOpen ? "Hide" : "Show"}</span>
        </div>

        {isOpen && (
          <ul className="gx-toc-list">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              return (
                <li
                  key={heading.id}
                  className={`gx-toc-item ${isActive ? "is-active" : ""} ${heading.level === 3 ? "is-sub" : ""}`}
                >
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(heading.id);
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                        history.pushState(null, "", `#${heading.id}`);
                      }
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </>
  );
}
