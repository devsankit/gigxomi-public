"use client";

import { ArrowRight, Mic, Sparkles } from "lucide-react";

type HeroChip = {
  id: string;
  label: string;
  onClick?: () => void;
};

type HeroMatcherProps = {
  chips: HeroChip[];
  isListening: boolean;
  isMatching: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onToggleListening: () => void;
  placeholder: string;
  promptValue: string;
  trustItems: string[];
};

export function HeroMatcher({
  chips,
  isListening,
  isMatching,
  onPromptChange,
  onSubmit,
  onToggleListening,
  placeholder,
  promptValue,
  trustItems,
}: HeroMatcherProps) {
  return (
    <section className="hero-matcher mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-4 overflow-x-clip sm:gap-5 md:gap-6">
      <div className="hero-matcher-copy flex w-full min-w-0 flex-col items-center gap-3 text-center md:gap-4">
        <div className="hero-matcher-badge inline-flex w-full max-w-full items-center justify-center gap-3 px-2 py-1 text-sm font-medium text-white/78 sm:w-auto sm:gap-3">
          <span className="hero-matcher-badge-icon inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--gx-primary-border)] bg-[color:var(--gx-primary-soft)] text-[color:var(--gx-primary)] sm:h-10 sm:w-10">
            <Sparkles size={16} strokeWidth={1.8} />
          </span>
          <span className="hero-matcher-badge-label min-w-0 text-center text-[0.66rem] font-semibold uppercase leading-none tracking-[0.18em] text-white/72 sm:hidden">
            AI service search
          </span>
          <span className="hero-matcher-badge-label-desktop hidden text-[0.74rem] font-semibold tracking-[0.18em] text-white/70 uppercase sm:inline">
            AI-powered service search
          </span>
        </div>
        <div className="hero-matcher-text w-full min-w-0 space-y-2.5 sm:space-y-3">
          <h1 className="hero-matcher-title max-w-4xl text-[clamp(1.5rem,6.8vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white break-words sm:leading-[0.98] sm:tracking-[-0.05em]">
            Find the right <span className="text-[color:var(--gx-primary)]">video editor</span> in seconds.
          </h1>
          <p className="hero-matcher-subtitle max-w-[22rem] text-[0.92rem] leading-5 text-white/68 md:max-w-3xl md:text-[1.05rem] md:leading-7">
            Describe your brief. Get matched fast.
          </p>
        </div>
      </div>

      <form
        className="hero-matcher-form rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.02)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:rounded-[28px] sm:p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="hero-matcher-input-shell flex min-h-[68px] items-center gap-2.5 rounded-[22px] border border-white/8 bg-[rgba(9,12,16,0.94)] px-4 py-3 transition focus-within:border-[color:var(--gx-primary-border)] focus-within:bg-[rgba(11,15,20,0.98)] sm:min-h-[74px] sm:gap-3 sm:rounded-3xl sm:px-5">
          <input
            className="hero-matcher-textarea h-11 min-w-0 flex-1 border-0 bg-transparent px-0 text-[1rem] leading-[1.2] text-white outline-none placeholder:text-white/38 sm:h-12 sm:text-[1.02rem]"
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder}
            type="text"
            value={promptValue}
          />
          <div className="hero-matcher-actions flex shrink-0 items-center gap-2 self-end pb-0.5 sm:pb-1">
            <button
              aria-label={isListening ? "Stop voice input" : "Use voice input"}
              className={`hero-matcher-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border transition sm:h-12 sm:w-12 ${
                isListening
                  ? "border-[color:var(--gx-primary-border)] bg-[color:var(--gx-primary-soft)] text-[color:var(--gx-primary)]"
                  : "border-white/10 bg-white/[0.02] text-white/80 hover:border-[color:var(--gx-primary-border)] hover:bg-white/[0.04]"
              }`}
              onClick={onToggleListening}
              type="button"
            >
              <Mic size={17} strokeWidth={1.9} />
            </button>
            <button
              aria-label="Find matching services"
              className="hero-matcher-submit inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--gx-primary-border)] bg-[rgba(255,255,255,0.02)] text-[color:var(--gx-primary)] transition hover:translate-y-[-1px] hover:border-[color:var(--gx-primary-border)] hover:bg-[color:var(--gx-primary-soft)] disabled:cursor-not-allowed disabled:opacity-45 sm:h-12 sm:w-12"
              disabled={!promptValue.trim() || isMatching}
              type="submit"
            >
              <ArrowRight size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>

      <div className="hero-matcher-chip-rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_proximity] [overscroll-behavior-x:contain] [touch-action:pan-x_pan-y_pinch-zoom] [-webkit-overflow-scrolling:touch] md:justify-center [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            className="hero-matcher-chip inline-flex shrink-0 snap-start items-center rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-[0.95rem] font-medium text-white/88 transition hover:border-[color:var(--gx-primary-border)] hover:text-white sm:px-4 sm:text-sm"
            key={chip.id}
            onClick={chip.onClick}
            type="button"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="hero-matcher-trust-rail -mx-1 flex gap-4 overflow-x-auto px-1 pb-1 text-sm text-white/72 [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_proximity] [overscroll-behavior-x:contain] [touch-action:pan-x_pan-y_pinch-zoom] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:justify-center">
        {trustItems.map((item, index) => (
          <div className="hero-matcher-trust-item flex shrink-0 snap-start items-center gap-4" key={item}>
            {index > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gx-primary)]" /> : null}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
