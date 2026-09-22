import type { LucideIcon } from "lucide-react";

type DashboardTone = "lime" | "neutral" | "warning";

type DashboardShowcaseMetric = {
  label: string;
  value: string;
};

type DashboardShowcaseIcon = {
  icon: LucideIcon;
  label: string;
  tone?: DashboardTone;
};

type DashboardShowcaseCardProps = {
  eyebrow: string;
  title: string;
  copy: string;
  metrics: DashboardShowcaseMetric[];
  icons: DashboardShowcaseIcon[];
};

type DashboardKpiVisualCardProps = {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  tone?: DashboardTone;
};

const normalizeDashboardTone = (tone?: DashboardTone): DashboardTone => {
  void tone;
  return "lime";
};

export function DashboardShowcaseCard({
  eyebrow,
  title,
  copy,
  metrics,
  icons,
}: DashboardShowcaseCardProps) {
  return (
    <section className="dashboard-showcase-card">
      <div className="dashboard-showcase-copy">
        <p className="section-label">{eyebrow}</p>
        <h3 className="dashboard-showcase-title">{title}</h3>
        <p className="dashboard-showcase-description">{copy}</p>

        <div className="dashboard-showcase-metrics">
          {metrics.map((metric) => (
            <div className="dashboard-showcase-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-showcase-visual" aria-hidden="true">
        <div className="dashboard-showcase-badges">
          {icons.slice(0, 3).map((item, index) => {
            const Icon = item.icon;
            const tone = normalizeDashboardTone(item.tone);
            return (
              <div className={`dashboard-showcase-badge dashboard-tone-${tone}`} key={`${item.label}-${index}`}>
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="dashboard-showcase-summary-list">
          {metrics.map((metric) => (
            <div className="dashboard-showcase-summary-row" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardKpiVisualCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "lime",
}: DashboardKpiVisualCardProps) {
  const visualTone = normalizeDashboardTone(tone);

  return (
    <article className={`dashboard-kpi-visual dashboard-tone-${visualTone}`}>
      <div className="dashboard-kpi-top">
        <span className="dashboard-kpi-icon">
          <Icon size={18} strokeWidth={1.9} />
        </span>
        <span className="dashboard-kpi-label">{label}</span>
      </div>
      <strong>{value}</strong>
      {note ? <p>{note}</p> : null}
      <div className="dashboard-kpi-meter" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}
