"use client";

type GuidedTourPopoverProps = {
  title: string;
  body: string;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function GuidedTourPopover({ title, body, index, total, onNext, onBack, onSkip }: GuidedTourPopoverProps) {
  return (
    <div className="gx-tour-popover" role="dialog" aria-live="polite">
      <p className="gx-onboarding-eyebrow">Guided tour</p>
      <h4>{title}</h4>
      <p>{body}</p>
      <div className="gx-tour-meta">
        Step {index + 1}/{total}
      </div>
      <div className="gx-tour-actions">
        <button className="gx-button gx-button-ghost" onClick={onSkip} type="button">
          Skip
        </button>
        <button className="gx-button gx-button-secondary" disabled={index === 0} onClick={onBack} type="button">
          Back
        </button>
        <button className="gx-button gx-button-primary" onClick={onNext} type="button">
          {index + 1 >= total ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
