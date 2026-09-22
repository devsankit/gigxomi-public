"use client";

import Link from "next/link";

import type { OnboardingStep } from "@/lib/gigxomi/onboarding-types";

type ChecklistProps = {
  title: string;
  steps: OnboardingStep[];
  completed: Set<string>;
  skipped: Set<string>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onManualComplete: (stepId: string) => void;
};

export function OnboardingChecklist({ title, steps, completed, skipped, collapsed, onToggleCollapsed, onSkip, onRestart, onManualComplete }: ChecklistProps) {
  const done = steps.filter((step) => completed.has(step.id)).length;
  const percent = Math.round((done / Math.max(1, steps.length)) * 100);

  if (collapsed) {
    return (
      <aside className="gx-onboarding-checklist is-collapsed" aria-label="Guided onboarding">
        <div className="gx-onboarding-compact-copy">
          <p className="gx-onboarding-eyebrow">Setup</p>
          <strong>{title}</strong>
          <span>
            {done}/{steps.length} complete
          </span>
        </div>
        <div className="gx-progress-track gx-onboarding-progress" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="gx-onboarding-compact-actions">
          <button className="gx-button gx-button-secondary" onClick={onToggleCollapsed} type="button">
            Open
          </button>
          <button className="gx-button gx-button-ghost" onClick={onSkip} type="button">
            Close
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="gx-onboarding-checklist">
      <div className="gx-onboarding-header">
        <div>
          <p className="gx-onboarding-eyebrow">Guided onboarding</p>
          <h3>{title}</h3>
          <p>
            {done}/{steps.length} completed
          </p>
        </div>
        <button className="gx-button gx-button-ghost" onClick={onToggleCollapsed} type="button">
          {collapsed ? "Resume" : "Minimize"}
        </button>
      </div>

      <div className="gx-progress-track gx-onboarding-progress">
        <span style={{ width: `${percent}%` }} />
      </div>

      <ol className="gx-onboarding-steps">
        {steps.map((step, index) => {
          const isDone = completed.has(step.id);
          const isSkipped = skipped.has(step.id);
          return (
            <li className={`gx-onboarding-step${isDone ? " is-done" : ""}${isSkipped ? " is-skipped" : ""}`} key={step.id}>
              <div className="gx-onboarding-step-meta">Step {index + 1}</div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <div className="gx-onboarding-step-actions">
                <Link className="gx-button gx-button-secondary" href={step.route}>
                  {step.ctaLabel}
                </Link>
                {!isDone && step.manualCompleteAllowed ? (
                  <button className="gx-button gx-button-ghost" onClick={() => onManualComplete(step.id)} type="button">
                    Mark complete
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="gx-onboarding-footer">
        <button className="gx-button gx-button-ghost" onClick={onSkip} type="button">
          Skip for now
        </button>
        <button className="gx-button gx-button-secondary" onClick={onRestart} type="button">
          Restart
        </button>
      </div>
    </aside>
  );
}
