"use client";

type ServiceChipsProps = {
  className?: string;
  items: Array<{
    id: string;
    label: string;
    onClick?: () => void;
  }>;
  itemClassName?: string;
};

export function ServiceChips({ className, items, itemClassName }: ServiceChipsProps) {
  return (
    <div
      className={[
        "-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_proximity] [overscroll-behavior-x:contain] [touch-action:pan-x_pan-y_pinch-zoom] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <button
          className={[
            "inline-flex shrink-0 snap-start items-center rounded-full border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-white/84 transition hover:border-[color:var(--gx-primary-border)] hover:text-white",
            itemClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          key={item.id}
          onClick={item.onClick}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
