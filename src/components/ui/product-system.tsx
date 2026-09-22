import type { ReactNode } from "react";

type Tone = "success" | "warning" | "error" | "info" | "neutral" | "accent";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  backAction?: ReactNode;
  className?: string;
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  status?: ReactNode;
  statusTone?: Tone;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

type DashboardSignalCardProps = {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  status?: ReactNode;
  statusTone?: Tone;
  interpretation?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

type SmartInsightCardProps = {
  title: string;
  impact: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  tone?: Tone;
  className?: string;
};

type AlertItem = {
  id: string;
  title: string;
  impact: ReactNode;
  affectedEntity?: ReactNode;
  reason?: ReactNode;
  urgency?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  tone?: Extract<Tone, "warning" | "error" | "info">;
};

type AlertStackProps = {
  title?: string;
  items: AlertItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

type QuickActionProps = {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
};

type QuickActionGridProps = {
  actions: QuickActionProps[];
  className?: string;
};

type DataWidgetCardProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type EmptyStateProps = {
  title: string;
  description: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  dataSourceLabel?: string;
  className?: string;
};

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

type DetailDrawerSection = {
  title: string;
  children: ReactNode;
};

type DetailDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  status?: ReactNode;
  onClose: () => void;
  sections: DetailDrawerSection[];
  footer?: ReactNode;
  className?: string;
};

type ManagementTableColumn<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T, index: number) => ReactNode;
};

type ManagementTableProps<T> = {
  columns: Array<ManagementTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  utilityBar?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingRows?: number;
  className?: string;
};

type IntegrationCardProps = {
  name: string;
  description: ReactNode;
  status: ReactNode;
  statusTone?: Tone;
  health?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
};

type ProgressIndicatorProps = {
  label?: string;
  value: number;
  max?: number;
  helper?: ReactNode;
  tone?: Tone;
  className?: string;
};

type SectionTabItem = {
  id: string;
  label: ReactNode;
  count?: ReactNode;
  disabled?: boolean;
};

type SectionTabsProps = {
  tabs: SectionTabItem[];
  activeTab: string;
  onTabChange?: (id: string) => void;
  className?: string;
};

type UsageLimitMeterProps = {
  label: string;
  used: number;
  limit: number;
  helper?: ReactNode;
  tone?: Tone;
  className?: string;
};

type MoneyAmountProps = {
  amount: number;
  currency?: string;
  locale?: string;
  compact?: boolean;
  className?: string;
};

type PermissionGateProps = {
  allowed: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

type LockedFeatureCardProps = {
  title: string;
  description: ReactNode;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
};

type MetricSparklineProps = {
  values: number[];
  label: string;
  tone?: Tone;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getColumnMobileLabel(header: ReactNode, key: string) {
  return typeof header === "string" || typeof header === "number" ? String(header) : key;
}

function actionElement({ label, href, onClick, disabled, className }: { label: string; href?: string; onClick?: () => void; disabled?: boolean; className?: string }) {
  if (href && !disabled) {
    return (
      <a className={cx("gx-button gx-button-secondary gx-system-action", className)} href={href}>
        {label}
      </a>
    );
  }

  return (
    <button className={cx("gx-button gx-button-secondary gx-system-action", className)} disabled={disabled} onClick={onClick} type="button">
      {label}
    </button>
  );
}
export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return <span className={cx("gx-badge", `gx-status-${tone}`, className)}>{children}</span>;
}

export function PageHeader({ title, subtitle, badge, primaryAction, secondaryActions, backAction, className }: PageHeaderProps) {
  return (
    <header className={cx("gx-page-header", className)}>
      <div className="gx-page-header-copy">
        {backAction ? <div className="gx-page-header-back">{backAction}</div> : null}
        <div className="gx-page-header-title-row">
          <h1>{title}</h1>
          {badge ? <div className="gx-page-header-badge">{badge}</div> : null}
        </div>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {primaryAction || secondaryActions ? (
        <div className="gx-page-header-actions">
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </header>
  );
}

export function MetricCard({ label, value, trend, status, statusTone = "neutral", description, icon, action, className }: MetricCardProps) {
  return (
    <article className={cx("gx-card gx-card-hover gx-metric-card", className)}>
      <div className="gx-metric-card-header">
        <span className="gx-signal-label">{label}</span>
        {icon ? <span className="gx-metric-card-icon">{icon}</span> : null}
      </div>
      <div className="gx-metric-card-value-row">
        <strong className="gx-signal-value">{value}</strong>
        {status ? <StatusBadge tone={statusTone}>{status}</StatusBadge> : null}
      </div>
      {trend ? <span className="gx-signal-trend">{trend}</span> : null}
      {description ? <p className="gx-signal-interpretation">{description}</p> : null}
      {action ? <div className="gx-metric-card-action">{action}</div> : null}
    </article>
  );
}

export function DashboardSignalCard({
  label,
  value,
  trend,
  status,
  statusTone = "neutral",
  interpretation,
  footer,
  className,
}: DashboardSignalCardProps) {
  return (
    <article className={cx("gx-card gx-card-hover gx-signal-card", className)}>
      <div className="gx-signal-card-top">
        <span className="gx-signal-label">{label}</span>
        {status ? <StatusBadge tone={statusTone}>{status}</StatusBadge> : null}
      </div>
      <strong className="gx-signal-value">{value}</strong>
      {trend ? <span className="gx-signal-trend">{trend}</span> : null}
      {interpretation ? <p className="gx-signal-interpretation">{interpretation}</p> : null}
      {footer ? <div className="gx-signal-footer">{footer}</div> : null}
    </article>
  );
}

export function SmartInsightCard({ title, impact, actionLabel, onAction, href, tone = "accent", className }: SmartInsightCardProps) {
  return (
    <article className={cx("gx-card gx-smart-insight", `gx-smart-insight-${tone}`, className)}>
      <div>
        <StatusBadge tone={tone}>Insight</StatusBadge>
        <h3>{title}</h3>
        <p>{impact}</p>
      </div>
      {actionLabel ? actionElement({ label: actionLabel, href, onClick: onAction, className: "gx-smart-insight-action" }) : null}
    </article>
  );
}

export function AlertStack({ title = "Critical alerts", items, emptyTitle = "No critical alerts", emptyDescription = "Nothing needs immediate attention.", className }: AlertStackProps) {
  return (
    <section className={cx("gx-card gx-alert-stack", className)}>
      <div className="gx-widget-header">
        <div>
          <span className="gx-widget-eyebrow">Attention</span>
          <h2>{title}</h2>
        </div>
        <StatusBadge tone={items.length ? "warning" : "success"}>{items.length ? `${items.length} open` : "Clear"}</StatusBadge>
      </div>
      {items.length ? (
        <div className="gx-alert-list">
          {items.map((item) => (
            <article className={cx("gx-alert-item", `gx-alert-${item.tone ?? "warning"}`)} key={item.id}>
              <div className="gx-alert-main">
                <div className="gx-alert-heading">
                  <h3>{item.title}</h3>
                  {item.urgency ? <StatusBadge tone={item.tone ?? "warning"}>{item.urgency}</StatusBadge> : null}
                </div>
                <p>{item.impact}</p>
                {item.affectedEntity || item.reason ? (
                  <dl>
                    {item.affectedEntity ? (
                      <>
                        <dt>Affected</dt>
                        <dd>{item.affectedEntity}</dd>
                      </>
                    ) : null}
                    {item.reason ? (
                      <>
                        <dt>Reason</dt>
                        <dd>{item.reason}</dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
              </div>
              {item.actionLabel ? actionElement({ label: item.actionLabel, href: item.href, onClick: item.onAction, className: "gx-alert-action" }) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}

export function QuickAction({ label, description, icon, onClick, href, disabled = false, className }: QuickActionProps) {
  const content = (
    <>
      {icon ? <span className="gx-quick-action-icon">{icon}</span> : null}
      <strong>{label}</strong>
      {description ? <span>{description}</span> : null}
    </>
  );

  if (href && !disabled) {
    return (
      <a className={cx("gx-quick-action", className)} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={cx("gx-quick-action", className)} disabled={disabled} onClick={onClick} type="button">
      {content}
    </button>
  );
}

export function QuickActionGrid({ actions, className }: QuickActionGridProps) {
  return (
    <div className={cx("gx-quick-action-grid", className)}>
      {actions.map((action) => (
        <QuickAction {...action} key={action.label} />
      ))}
    </div>
  );
}

export function DataWidgetCard({ eyebrow, title, description, action, children, className }: DataWidgetCardProps) {
  return (
    <section className={cx("gx-card gx-data-widget", className)}>
      <div className="gx-widget-header">
        <div>
          {eyebrow ? <span className="gx-widget-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="gx-widget-action">{action}</div> : null}
      </div>
      <div className="gx-widget-body">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, href, dataSourceLabel, className }: EmptyStateProps) {
  return (
    <div className={cx("gx-empty-state gx-system-empty-state", className)}>
      {dataSourceLabel ? <StatusBadge tone="info">{dataSourceLabel}</StatusBadge> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? actionElement({ label: actionLabel, href, onClick: onAction }) : null}
    </div>
  );
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cx("gx-card gx-form-section", className)}>
      <div className="gx-form-section-header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="gx-form-section-body">{children}</div>
    </section>
  );
}

export function DetailDrawer({ open, title, subtitle, status, onClose, sections, footer, className }: DetailDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="gx-drawer-shell" role="presentation">
      <button aria-label="Close detail panel" className="gx-drawer-backdrop" onClick={onClose} type="button" />
      <aside aria-label={title} className={cx("gx-modal gx-detail-drawer", className)}>
        <header className="gx-detail-drawer-header">
          <div>
            {status ? <div className="gx-detail-drawer-status">{status}</div> : null}
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="gx-button gx-button-ghost gx-detail-close" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="gx-detail-drawer-body">
          {sections.map((section) => (
            <section className="gx-detail-section" key={section.title}>
              <h3>{section.title}</h3>
              <div>{section.children}</div>
            </section>
          ))}
        </div>
        {footer ? <footer className="gx-detail-drawer-footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function ManagementTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  utilityBar,
  emptyState,
  loading = false,
  loadingRows = 5,
  className,
}: ManagementTableProps<T>) {
  const skeletonRows = Array.from({ length: loadingRows }, (_, index) => index);

  return (
    <section className={cx("gx-card gx-management-table-shell", className)}>
      {utilityBar ? <div className="gx-table-utility-bar">{utilityBar}</div> : null}
      <div className="gx-table-scroll">
        <table className="gx-table gx-management-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th className={column.className} key={column.key} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? skeletonRows.map((row) => (
                  <tr key={`loading-${row}`}>
                    {columns.map((column) => (
                      <td className={column.className} data-label={getColumnMobileLabel(column.header, column.key)} key={column.key}>
                        <span className="gx-skeleton gx-table-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => (
                  <tr className={onRowClick ? "gx-table-clickable-row" : undefined} key={getRowKey(row, index)} onClick={onRowClick ? () => onRowClick(row, index) : undefined}>
                    {columns.map((column) => (
                      <td className={column.className} data-label={getColumnMobileLabel(column.header, column.key)} key={column.key}>
                        {column.render(row, index)}
                      </td>
                    ))}
                  </tr>
                ))}
            {!loading && !rows.length ? (
              <tr>
                <td className="gx-table-empty-cell" colSpan={columns.length}>
                  {emptyState ?? <EmptyState title="No records found" description="Try changing filters or add the first record when the workflow is ready." />}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DataTable<T>(props: ManagementTableProps<T>) {
  return <ManagementTable {...props} />;
}

export function IntegrationCard({ name, description, status, statusTone = "neutral", health, actionLabel, onAction, href, className }: IntegrationCardProps) {
  return (
    <article className={cx("gx-card gx-card-hover gx-integration-card", className)}>
      <div className="gx-integration-card-header">
        <h3>{name}</h3>
        <StatusBadge tone={statusTone}>{status}</StatusBadge>
      </div>
      <p>{description}</p>
      {health ? <div className="gx-integration-health">{health}</div> : null}
      {actionLabel ? actionElement({ label: actionLabel, href, onClick: onAction, className: "gx-integration-action" }) : null}
    </article>
  );
}

export function ProgressIndicator({ label, value, max = 100, helper, tone = "accent", className }: ProgressIndicatorProps) {
  const percentage = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));

  return (
    <div className={cx("gx-progress", `gx-progress-${tone}`, className)}>
      {label || helper ? (
        <div className="gx-progress-meta">
          {label ? <span>{label}</span> : null}
          {helper ? <strong>{helper}</strong> : null}
        </div>
      ) : null}
      <div className="gx-progress-track" aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} role="progressbar">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function SectionTabs({ tabs, activeTab, onTabChange, className }: SectionTabsProps) {
  return (
    <div className={cx("gx-section-tabs", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            aria-selected={isActive}
            className={cx("gx-section-tab", isActive && "gx-section-tab-active")}
            disabled={tab.disabled}
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            role="tab"
            type="button"
          >
            <span>{tab.label}</span>
            {tab.count ? <strong>{tab.count}</strong> : null}
          </button>
        );
      })}
    </div>
  );
}

export function UsageLimitMeter({ label, used, limit, helper, tone = "accent", className }: UsageLimitMeterProps) {
  const safeLimit = Math.max(limit, 0);
  const displayHelper = helper ?? `${used}/${safeLimit || "unlimited"} used`;
  return <ProgressIndicator className={className} helper={displayHelper} label={label} max={safeLimit || Math.max(used, 1)} tone={tone} value={used} />;
}

export function MoneyAmount({ amount, currency = "INR", locale = "en-IN", compact = false, className }: MoneyAmountProps) {
  const formatted = new Intl.NumberFormat(locale, {
    compactDisplay: compact ? "short" : undefined,
    currency,
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
    style: "currency",
  }).format(amount);

  return <span className={cx("gx-money-amount", className)}>{formatted}</span>;
}

export function PermissionGate({ allowed, fallback = null, children }: PermissionGateProps) {
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function LockedFeatureCard({ title, description, actionLabel, href, onAction, className }: LockedFeatureCardProps) {
  return (
    <article className={cx("gx-card gx-locked-feature-card", className)}>
      <StatusBadge tone="warning">Locked</StatusBadge>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? actionElement({ label: actionLabel, href, onClick: onAction }) : null}
    </article>
  );
}

export function MetricSparkline({ values, label, tone = "accent", className }: MetricSparklineProps) {
  const width = 120;
  const height = 34;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg aria-label={label} className={cx("gx-sparkline", `gx-sparkline-${tone}`, className)} role="img" viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" points={points} />
    </svg>
  );
}
