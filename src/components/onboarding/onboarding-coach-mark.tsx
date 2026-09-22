"use client";

export function OnboardingCoachMark({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="gx-onboarding-coachmark"
      style={{ left: targetRect.left - 8, top: targetRect.top - 8, width: targetRect.width + 16, height: targetRect.height + 16 }}
    />
  );
}
