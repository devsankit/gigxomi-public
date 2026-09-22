"use client";

import React, { useState } from "react";
import { FaqItem } from "@/lib/seo/public-faqs";
import { MarketingPageType, trackFaqOpened } from "@/lib/analytics/funnel";
import styles from "./marketing-faq.module.css";

export interface MarketingFaqProps {
  items: FaqItem[];
  page: MarketingPageType;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function MarketingFaq({
  items,
  page,
  eyebrow = "Clear Answers",
  title = "Frequently Asked Questions",
  subtitle = "Everything you need to know about Gigxomi workflows, channel connections, and workspace roles.",
  className,
}: MarketingFaqProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (item: FaqItem) => {
    const isCurrentlyOpen = openId === item.id;
    if (isCurrentlyOpen) {
      setOpenId(null);
    } else {
      setOpenId(item.id);
      trackFaqOpened({
        faqId: item.id,
        question: item.question,
        page,
      });
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section
      className={`${styles.faqSection} ${className || ""}`}
      aria-label={title}
      id="faq-section"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className={styles.header}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.accordionList} role="presentation">
        {items.map((item) => {
          const isOpen = openId === item.id;
          const triggerId = `faq-trigger-${item.id}`;
          const panelId = `faq-panel-${item.id}`;

          return (
            <div
              key={item.id}
              className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
            >
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => handleToggle(item)}
                >
                  <span className={styles.question}>{item.question}</span>
                  <span
                    className={`${styles.icon} ${isOpen ? styles.iconRotated : ""}`}
                    aria-hidden="true"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 1V13M1 7H13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className={styles.region}
                hidden={!isOpen}
              >
                <p className={styles.answer}>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
