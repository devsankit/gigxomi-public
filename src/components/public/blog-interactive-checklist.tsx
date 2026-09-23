"use client";

import { useState } from "react";

type BlogInteractiveChecklistProps = {
  steps: string[];
  focusKeyword: string;
};

export function BlogInteractiveChecklist({ steps, focusKeyword }: BlogInteractiveChecklistProps) {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  function toggleStep(index: number) {
    setCompleted((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="gx-action-checklist">
      <div className="gx-checklist-header">
        <div>
          <span className="gx-checklist-label">INTERACTIVE EXECUTION PLAN</span>
          <h3 className="gx-checklist-title">Action Steps for {focusKeyword}</h3>
        </div>
        <div className="gx-checklist-progress-box">
          <span className="gx-checklist-count">
            {completedCount}/{steps.length} Done
          </span>
          <div className="gx-checklist-bar-bg">
            <div className="gx-checklist-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <ul className="gx-checklist-items">
        {steps.map((step, index) => {
          const isDone = Boolean(completed[index]);
          return (
            <li
              key={index}
              className={`gx-checklist-row ${isDone ? "is-done" : ""}`}
              onClick={() => toggleStep(index)}
              role="checkbox"
              aria-checked={isDone}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggleStep(index);
                }
              }}
            >
              <div className="gx-checkbox-box">
                {isDone && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0B0F17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="gx-checklist-text">{step}</span>
            </li>
          );
        })}
      </ul>
      <p className="gx-checklist-footer-note">
        Click each checkpoint as you implement it in your studio workflow.
      </p>
    </div>
  );
}
