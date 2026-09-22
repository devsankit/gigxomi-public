"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { GuidedTourPopover } from "@/components/onboarding/guided-tour-popover";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { OnboardingCoachMark } from "@/components/onboarding/onboarding-coach-mark";
import type { OnboardingChecklistDefinition, OnboardingProgressRecord } from "@/lib/gigxomi/onboarding-types";

type Props = { role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "FREELANCER"; canShow: boolean };

const localKey = "gx_onboarding_progress_fallback";

export function OnboardingExperience({ role, canShow }: Props) {
  const pathname = usePathname();
  const storageKey = `${localKey}_${role}`;
  const [checklist, setChecklist] = useState<OnboardingChecklistDefinition | null>(null);
  const [progress, setProgress] = useState<OnboardingProgressRecord | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  const completed = useMemo(() => new Set(progress?.completedSteps ?? []), [progress?.completedSteps]);
  const skipped = useMemo(() => new Set(progress?.skippedSteps ?? []), [progress?.skippedSteps]);

  const persist = useCallback(
    async (next: Partial<OnboardingProgressRecord>) => {
      const merged = {
        ...progress,
        ...next,
        completedSteps: next.completedSteps ?? progress?.completedSteps ?? [],
        skippedSteps: next.skippedSteps ?? progress?.skippedSteps ?? [],
      } as OnboardingProgressRecord;
      setProgress(merged);

      try {
        await fetch("/api/onboarding/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
      } catch {
        localStorage.setItem(storageKey, JSON.stringify({ checklist, progress: merged }));
      }
    },
    [checklist, progress, storageKey],
  );

  const completeStep = useCallback(
    async (stepId: string) => {
      if (!checklist) {
        return;
      }
      const completedSteps = Array.from(new Set([...(progress?.completedSteps ?? []), stepId]));
      const completedAt = completedSteps.length >= checklist.steps.length ? new Date().toISOString() : null;
      await persist({ completedSteps, lastSeenStep: stepId, completedAt });
      void fetch("/api/onboarding/complete-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      }).catch(() => undefined);
    },
    [checklist, persist, progress?.completedSteps],
  );

  useEffect(() => {
    if (!canShow) return;
    fetch("/api/onboarding/progress", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        setChecklist((payload.checklist ?? null) as OnboardingChecklistDefinition | null);
        setProgress((payload.progress ?? null) as OnboardingProgressRecord | null);
      })
      .catch(() => {
        const fallback = localStorage.getItem(storageKey);
        if (fallback) {
          const parsed = JSON.parse(fallback) as { checklist: OnboardingChecklistDefinition | null; progress: OnboardingProgressRecord | null };
          setChecklist(parsed.checklist);
          setProgress(parsed.progress);
        }
      });
  }, [canShow, storageKey]);

  useEffect(() => {
    const listener = () => {
      setTourIndex(0);
      setTourActive(true);
      setCollapsed(false);
    };
    window.addEventListener("gigxomi:onboarding-restart", listener);
    return () => window.removeEventListener("gigxomi:onboarding-restart", listener);
  }, []);

  const targetRect = useMemo(() => {
    if (!tourActive || !checklist) {
      return null;
    }
    const step = checklist.steps[tourIndex];
    if (!step) {
      return null;
    }
    const target = document.querySelector(`a[href='${step.route}']`) as HTMLElement | null;
    return target?.getBoundingClientRect() ?? null;
  }, [tourActive, checklist, tourIndex]);

  if (!canShow || !checklist || progress?.dismissed) return null;

  const shouldShowChecklist = pathname !== "/freelancer/chat" && pathname !== "/admin/chat" && pathname !== "/manager/chat" && pathname !== "/super-admin/chat";

  return (
    <>
      {shouldShowChecklist ? (
        <OnboardingChecklist
          collapsed={collapsed}
          completed={completed}
          onManualComplete={(stepId) => void completeStep(stepId)}
          onRestart={() => {
            void fetch("/api/onboarding/reset", { method: "POST" });
            setProgress(null);
            setTourIndex(0);
            setTourActive(true);
          }}
          onSkip={() => {
            void fetch("/api/onboarding/dismiss", { method: "POST" });
            void persist({ dismissed: true });
          }}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
          skipped={skipped}
          steps={checklist.steps}
          title={checklist.title}
        />
      ) : null}

      {tourActive
        ? createPortal(
            <>
              <div className="gx-tour-backdrop" />
              <OnboardingCoachMark targetRect={targetRect} />
              <div className="gx-tour-anchor">
                <GuidedTourPopover
                  body={checklist.steps[tourIndex]?.description ?? ""}
                  index={tourIndex}
                  onBack={() => setTourIndex((prev) => Math.max(0, prev - 1))}
                  onNext={() => {
                    if (tourIndex + 1 >= checklist.steps.length) {
                      setTourActive(false);
                      return;
                    }
                    setTourIndex((prev) => prev + 1);
                  }}
                  onSkip={() => setTourActive(false)}
                  title={checklist.steps[tourIndex]?.title ?? "Guided tour"}
                  total={checklist.steps.length}
                />
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
