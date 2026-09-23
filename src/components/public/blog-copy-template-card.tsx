"use client";

import { useState } from "react";

type BlogCopyTemplateCardProps = {
  title: string;
  badge?: string;
  templateText: string;
  tips?: string[];
};

export function BlogCopyTemplateCard({
  title,
  badge = "READY-TO-USE TEMPLATE",
  templateText,
  tips = [],
}: BlogCopyTemplateCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(templateText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

  return (
    <div className="gx-template-card">
      <div className="gx-template-header">
        <div className="gx-template-badge-row">
          <span className="gx-template-pill">{badge}</span>
          <h4 className="gx-template-title">{title}</h4>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`gx-template-copy-btn ${copied ? "is-copied" : ""}`}
          aria-label="Copy template to clipboard"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy Template</span>
            </>
          )}
        </button>
      </div>

      <pre className="gx-template-code">
        <code>{templateText}</code>
      </pre>

      {tips.length > 0 && (
        <div className="gx-template-tips">
          <strong className="gx-tips-heading">PRO CONVERSION TIPS:</strong>
          <ul>
            {tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
