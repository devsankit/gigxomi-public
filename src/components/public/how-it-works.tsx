"use client";

import { Send, Sparkles, SquarePen } from "lucide-react";

const stepIcons = [SquarePen, Sparkles, Send] as const;

type HowItWorksProps = {
  className?: string;
  steps: Array<{
    description: string;
    id: string;
    title: string;
  }>;
};

export function HowItWorks({ className, steps }: HowItWorksProps) {
  return (
    <div className={["how-it-works-grid grid gap-4 md:grid-cols-3 md:gap-6", className].filter(Boolean).join(" ")}>
      {steps.map((step, index) => {
        const Icon = stepIcons[index] ?? Sparkles;
        return (
          <div className="how-it-works-item flex items-start gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-4 md:border-0 md:bg-transparent md:px-0" key={step.id}>
            <span className="how-it-works-icon inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--gx-primary-border)] bg-[color:var(--gx-primary-soft)] text-[color:var(--gx-primary)]">
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <div className="how-it-works-copy space-y-1.5">
              <p className="how-it-works-title text-sm font-medium text-white">{step.title}</p>
              <p className="how-it-works-description text-sm leading-6 text-white/62">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
