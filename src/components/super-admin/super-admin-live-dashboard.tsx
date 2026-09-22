"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StatusTone = "Healthy" | "Watch" | "Critical";

type ExecutiveSignal = {
  key: string;
  label: string;
  value: string;
  trend: string;
  status: StatusTone;
  interpretation: string;
  isPlaceholder: boolean;
};

type SmartInsight = {
  title: string;
  impact: string;
  action: string;
  severity: "Watch" | "Critical";
};

type CriticalAlert = {
  label: string;
  impactAmount: string;
  reason: string;
  urgency: "Watch" | "Critical";
  action: string;
};

type Metric = {
  label: string;
  value: string;
  status: StatusTone;
  note: string;
};

type RowRecord = Record<string, string | number>;

type IntelligencePayload = {
  executiveSignals: ExecutiveSignal[];
  smartInsights: SmartInsight[];
  criticalAlerts: CriticalAlert[];
  collectedRevenueThisMonth: string;
  revenueIntelligence: { metrics: Metric[]; packageRows: RowRecord[] };
  subscriptionIntelligence: { metrics: Metric[]; packageRows: RowRecord[] };
  agencyHealth: { metrics: Metric[]; rows: RowRecord[] };
  marketplaceDemand: { metrics: Metric[]; rows: RowRecord[] };
  searchQuality: { metrics: Metric[]; rows: RowRecord[] };
  editorSupply: { metrics: Metric[]; rows: RowRecord[] };
  marketingSeo: { metrics: Metric[] };
  automationIntelligence: { metrics: Metric[] };
  financialRisk: { metrics: Metric[] };
  quickActions: Array<{ label: string; target: string; reason: string }>;
};

type SuperAdminDashboardApiResponse = {
  ok: boolean;
  intelligence?: IntelligencePayload;
};

const emptyPayload: IntelligencePayload = {
  executiveSignals: [],
  smartInsights: [],
  criticalAlerts: [],
  collectedRevenueThisMonth: "Data source needed",
  revenueIntelligence: { metrics: [], packageRows: [] },
  subscriptionIntelligence: { metrics: [], packageRows: [] },
  agencyHealth: { metrics: [], rows: [] },
  marketplaceDemand: { metrics: [], rows: [] },
  searchQuality: { metrics: [], rows: [] },
  editorSupply: { metrics: [], rows: [] },
  marketingSeo: { metrics: [] },
  automationIntelligence: { metrics: [] },
  financialRisk: { metrics: [] },
  quickActions: [],
};

function toneClass(status: StatusTone | "Watch" | "Critical") {
  if (status === "Healthy") return "gx-badge-success";
  if (status === "Critical") return "gx-badge-error";
  return "gx-badge-warning";
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <h2 className="app-section-title">{title}</h2>
      {note ? <p className="gx-muted-text">{note}</p> : null}
    </div>
  );
}

function MetricMatrix({ metrics, limit }: { metrics: Metric[]; limit?: number }) {
  const visibleMetrics = typeof limit === "number" ? metrics.slice(0, limit) : metrics;

  if (!visibleMetrics.length) {
    return (
      <div className="gx-empty-state">
        <strong>Data source needed</strong>
        <p className="gx-muted-text">This module is ready for metrics once the backend source is connected.</p>
      </div>
    );
  }

  return (
    <div className="super-admin-intelligence-matrix">
      {visibleMetrics.map((metric) => (
        <article className="gx-card" key={`${metric.label}-${metric.value}`}>
          <p className="gx-muted-text">{metric.label}</p>
          <strong className="app-metric-text">{metric.value}</strong>
          <div className="status-row super-admin-intelligence-card-gap">
            <span className={`gx-badge ${toneClass(metric.status)}`}>{metric.status}</span>
          </div>
          <p className="gx-muted-text super-admin-intelligence-card-gap">
            {metric.note}
          </p>
        </article>
      ))}
    </div>
  );
}

function DataTable({ rows, columns }: { rows: RowRecord[]; columns: string[] }) {
  if (!rows.length) {
    return (
      <div className="gx-empty-state">
        <strong>No rows yet</strong>
        <p className="gx-muted-text">The source is empty or not connected.</p>
      </div>
    );
  }

  return (
    <div className="super-admin-intelligence-table-scroll">
      <table className="gx-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${columns[0]}-${index}`}>
              {columns.map((column) => (
                <td key={`${column}-${index}`}>{String(row[column] ?? row[column.toLowerCase()] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModuleBlock({
  title,
  note,
  metrics,
  rows,
  columns,
}: {
  title: string;
  note: string;
  metrics: Metric[];
  rows?: RowRecord[];
  columns?: string[];
}) {
  return (
    <section className="gx-section">
      <SectionHeader title={title} note={note} />
      <MetricMatrix metrics={metrics} />
      {rows && columns ? <DataTable columns={columns} rows={rows} /> : null}
    </section>
  );
}

export function SuperAdminLiveDashboard() {
  const [data, setData] = useState<IntelligencePayload>(emptyPayload);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/super-admin/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as SuperAdminDashboardApiResponse;
        if (!response.ok || !payload?.ok || !payload.intelligence) {
          throw new Error("Super admin intelligence data could not load.");
        }

        if (active) {
          setData(payload.intelligence);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("Intelligence data is still syncing. Modules with missing sources stay explicitly marked.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="gx-page super-admin-intelligence-page">
      <header className="gx-section">
        <div>
          <h1 className="agency-access-title">Super Admin Intelligence Center</h1>
          <p className="gx-muted-text">Founder command layer for revenue, risk, growth, supply, demand, and automation.</p>
        </div>
        {loadError ? <p className="gx-muted-text">{loadError}</p> : null}
      </header>

      <section className="gx-section">
        <SectionHeader title="Executive Signal Bar" note="Maximum 8 founder-level signals. Every card includes value, status, trend context, and interpretation." />
        <div className="super-admin-intelligence-matrix super-admin-intelligence-signal-bar">
          {data.executiveSignals.slice(0, 8).map((signal) => (
            <article className="gx-card" key={signal.key}>
              <p className="gx-muted-text">{signal.label}</p>
              <strong className="app-metric-text">{signal.value}</strong>
              <div className="status-row super-admin-intelligence-card-gap">
                <span className={`gx-badge ${toneClass(signal.status)}`}>{signal.status}</span>
                {signal.isPlaceholder ? <span className="gx-badge gx-badge-neutral">Data source needed</span> : null}
              </div>
              <p className="gx-muted-text super-admin-intelligence-card-gap">
                {signal.trend}
              </p>
              <p className="gx-muted-text">{signal.interpretation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gx-section">
        <SectionHeader title="Smart Insights" note="Only the highest-impact actions appear here. No filler." />
        {data.smartInsights.length ? (
          <div className="super-admin-intelligence-matrix">
            {data.smartInsights.slice(0, 3).map((insight) => (
              <article className="gx-card" key={insight.title}>
                <span className={`gx-badge ${toneClass(insight.severity)}`}>{insight.severity}</span>
                <h3 className="app-card-title super-admin-intelligence-card-gap">
                  {insight.title}
                </h3>
                <p className="gx-muted-text">Impact: {insight.impact}</p>
                <p className="gx-muted-text">Action: {insight.action}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="gx-empty-state">
            <strong>No strong insight yet</strong>
            <p className="gx-muted-text">Insights appear when risk or opportunity crosses threshold.</p>
          </div>
        )}
      </section>

      <div className="super-admin-intelligence-main-grid">
        <div>
          <ModuleBlock
            columns={["name", "agencies", "mrr", "utilization", "status"]}
            metrics={data.revenueIntelligence.metrics}
            note="Answers what is growing, what is leaking, and which package drives money."
            rows={data.revenueIntelligence.packageRows}
            title="Revenue Intelligence"
          />
          <ModuleBlock
            columns={["name", "agencies", "mrr", "utilization", "status"]}
            metrics={data.subscriptionIntelligence.metrics}
            note="Package, renewal, and utilization layer for SaaS growth decisions."
            rows={data.subscriptionIntelligence.packageRows}
            title="Subscription & Package Intelligence"
          />
          <ModuleBlock
            columns={["agency", "package", "status", "health", "reason"]}
            metrics={data.agencyHealth.metrics}
            note="Shows who to contact, upsell, unblock, or save from churn."
            rows={data.agencyHealth.rows}
            title="Agency Health Intelligence"
          />
        </div>

        <aside>
          <section className="gx-section">
            <SectionHeader title="Financial Risk & Leakage" note="Every risk should show impact and action." />
            <MetricMatrix metrics={data.financialRisk.metrics} />
          </section>
          <section className="gx-section">
            <SectionHeader title="Critical Alerts" />
            {data.criticalAlerts.length ? (
              <DataTable columns={["label", "impactAmount", "urgency", "reason", "action"]} rows={data.criticalAlerts} />
            ) : (
              <div className="gx-empty-state">
                <strong>No critical alerts</strong>
                <p className="gx-muted-text">No active financial or renewal breaches detected.</p>
              </div>
            )}
          </section>
          <section className="gx-section">
            <SectionHeader title="Quick Actions" />
            <div className="super-admin-intelligence-actions">
              {data.quickActions.map((action) => (
                <Link className="gx-button gx-button-secondary" href={action.target} key={action.label}>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <ModuleBlock
        columns={["label", "demand", "gap", "action"]}
        metrics={data.marketplaceDemand.metrics}
        note="Internal Google Search Console for marketplace demand. Placeholder rows stay visible until prompt/search tracking lands."
        rows={data.marketplaceDemand.rows}
        title="Marketplace Demand Intelligence"
      />
      <ModuleBlock
        columns={["keyword", "issue", "action"]}
        metrics={data.searchQuality.metrics}
        note="Recommendation quality, no-result searches, and keyword-to-editor fit."
        rows={data.searchQuality.rows}
        title="Search Result Quality"
      />
      <ModuleBlock
        columns={["editor", "status", "activeWork", "readiness", "package"]}
        metrics={data.editorSupply.metrics}
        note="Supply health, idle editors, approval readiness, and demand gap dependency."
        rows={data.editorSupply.rows}
        title="Editor / Freelancer Supply Intelligence"
      />
      <ModuleBlock
        metrics={data.marketingSeo.metrics}
        note="Connector-aware marketing state. GA/GSC metrics stay marked until integrations ingest real data."
        title="Marketing & SEO Intelligence"
      />
      <ModuleBlock
        metrics={data.automationIntelligence.metrics}
        note="WhatsApp, bot, handoff, missed-chat, and value-saved layer."
        title="Automation / Bot Intelligence"
      />
    </div>
  );
}
