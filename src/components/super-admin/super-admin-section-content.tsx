import Link from "next/link";
import { BadgeIndianRupee, ShieldCheck, Users, WalletCards } from "lucide-react";

import { SuperAdminYouTubeChannelPanel } from "@/components/admin/admin-youtube-controls";
import { AdminWhatsAppConnectionCard, AdminWhatsAppSetupPanel } from "@/components/admin/admin-dummy-controls";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { SuperAdminAccessControl } from "@/components/super-admin/super-admin-access-control";
import { SuperAdminInstagramPluginCard, type InstagramPluginConnectionView } from "@/components/super-admin/super-admin-instagram-plugin-card";
import { SuperAdminLiveDashboard } from "@/components/super-admin/super-admin-live-dashboard";
import { SuperAdminManualUpiControl } from "@/components/super-admin/super-admin-manual-upi-control";
import { SuperAdminPhonePeControl } from "@/components/super-admin/super-admin-phonepe-control";
import { SuperAdminServiceReview } from "@/components/super-admin/super-admin-service-review";
import { SuperAdminWhatsAppFlowBuilder } from "@/components/super-admin/super-admin-whatsapp-flow-builder";
import { MetricCard, StatusPill, SurfaceCard } from "@/components/ui/dashboard-primitives";
import { getManualUpiAdminConfig } from "@/lib/billing/manual-upi-config-service";
import { listPendingManualUpiPayments } from "@/lib/billing/manual-upi-payment-service";
import { getPhonePeAdminConfig } from "@/lib/billing/phonepe-admin-config-service";
import { getSubscriptionReminderSettings } from "@/lib/billing/subscription-reminder-settings-service";
import { getManagedAuthUsers } from "@/lib/auth/store";
import { getPublicAuthIntentOverview, listRecentPublicAuthIntents } from "@/lib/auth/public-auth-intent-store";
import { getPublicAuthOtpChannelInfo } from "@/lib/auth/public-whatsapp";
import { agencyTenants } from "@/lib/gigxomi/agency-network-data";
import {
  editorPerformanceProfiles,
  leaderScoreRules,
  superAdminDashboardSnapshot,
} from "@/lib/gigxomi/business-ecosystem-data";
import { getInstagramConnectionStateFromFile, getWhatsAppConnectionStateFromFile, listWhatsAppConnectionStatesFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { buildInstagramMetaSetupUrls } from "@/lib/meta/instagram-routes";
import { listRegistrationPackages } from "@/lib/gigxomi/public-growth-store";
import { getFreelancerAdminProgress } from "@/lib/gigxomi/freelancer-admin-progress";
import { isManagedUserInAudience } from "@/lib/auth/managed-user-utils";
import { forbiddenGigxomiThemeColors, gigxomiThemeTokens } from "@/lib/gigxomi/theme-tokens";
import {
  listSuperAdminWhatsAppFlowRuns,
  listSuperAdminWhatsAppFlows,
} from "@/lib/gigxomi/super-admin-whatsapp-flow-store";

function InsightBars({
  items,
}: {
  items: Array<{ label: string; value: string; percentage: number; note?: string }>;
}) {
  return (
    <div className="insight-list">
      {items.map((item) => (
        <div className="insight-row" key={item.label}>
          <div className="insight-copy">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
          <div className="insight-track" aria-hidden="true">
            <span className="insight-fill" style={{ width: `${item.percentage}%` }} />
          </div>
          {item.note ? <p className="muted-copy">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

function formatIntentTimestamp(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "Unknown number";
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return value.trim().startsWith("+") ? value.trim() : `+${digits}`;
}

export function SuperAdminOverviewSection() {
  return <SuperAdminLiveDashboard />;
}

export async function SuperAdminChatSection() {
  return (
    <ChatWorkspace
      audience="admin"
      listLabel="Official Gigxomi line"
      mode="inbox"
    />
  );
}

export async function SuperAdminAgenciesSection() {
  const [users, packages, whatsappStates] = await Promise.all([
    getManagedAuthUsers(),
    listRegistrationPackages(),
    listWhatsAppConnectionStatesFromFile(),
  ]);

  return (
    <SuperAdminAccessControl
      audience="AGENCY"
      description="Manage agency accounts, packages, WhatsApp readiness, and status."
      packages={packages}
      title="Agencies"
      users={users}
      whatsappStates={whatsappStates}
    />
  );
}

export async function SuperAdminFreelancersSection() {
  const [users, packages, whatsappStates] = await Promise.all([
    getManagedAuthUsers(),
    listRegistrationPackages(),
    listWhatsAppConnectionStatesFromFile(),
  ]);
  const freelancerProgress = await getFreelancerAdminProgress(
    users.filter((user) => isManagedUserInAudience(user, "FREELANCER")).map((user) => user.id),
  );

  return (
    <div className="stack-list">
      <div className="dashboard-shell compact">
        <p className="eyebrow">Freelancers</p>
        <h2 className="section-heading">
          Super admin can control freelancer package access, verification readiness, and workspace status from one place while keeping the hierarchy exactly as it is today.
        </h2>
      </div>

      <SuperAdminAccessControl
        audience="FREELANCER"
        description="Freelancer package control, verification history, and manual access overrides"
        freelancerProgress={freelancerProgress}
        packages={packages}
        title="Freelancers"
        users={users}
        whatsappStates={whatsappStates}
      />
    </div>
  );
}

export function SuperAdminApprovalsSection() {
  return (
    <div className="dashboard-shell compact space-y-8">
      <SuperAdminServiceReview />

      <div>
        <p className="eyebrow">Platform Queues</p>
        <h2 className="section-heading">
          Onboarding, WhatsApp activation, payout trust, and renewal rescue should all stay visible before they turn into operational debt.
        </h2>
        <div className="brief-grid two-up mt-4">
          {superAdminDashboardSnapshot.approvalQueue.map((item) => (
            <div className="brief-card" key={item.label}>
              <span className="meta-pill">{item.status}</span>
              <strong>{item.label}</strong>
              <p className="muted-copy">{item.note}</p>
            </div>
          ))}
          {superAdminDashboardSnapshot.whatsappQueue.map((item) => (
            <div className="brief-card" key={item.agencyName}>
              <span className="meta-pill">{item.status}</span>
              <strong>{item.agencyName}</strong>
              <p className="muted-copy">
                {item.number} • {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function SuperAdminWhatsAppSection() {
  const [overview, recentIntents, otpChannel, tenantConnection] = await Promise.all([
    getPublicAuthIntentOverview(),
    listRecentPublicAuthIntents(10),
    getPublicAuthOtpChannelInfo(),
    getWhatsAppConnectionStateFromFile("tenant-gigxomi"),
  ]);
  const whatsappTenantOptions = agencyTenants.map((agency) => ({
    id: agency.id,
    name: agency.name,
    phoneNumber: agency.whatsappNumber,
  }));

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">WhatsApp control</p>
      <h2 className="section-heading">
        Public login and signup run through the official Gigxomi WhatsApp line already authorized in super admin. Users start on the website first, then send Get OTP from the same number to receive the six-digit code.
      </h2>

      <div className="metric-grid">
        <MetricCard label="Official Gigxomi number" value={otpChannel.isConfigured ? otpChannel.label : "Needs setup"} />
        <MetricCard label="Pending WhatsApp intents" value={String(overview.PENDING_WHATSAPP)} />
        <MetricCard label="OTP issued" value={String(overview.OTP_ISSUED)} />
        <MetricCard label="Pending subscriptions" value={String(overview.PENDING_SUBSCRIPTION)} />
      </div>

      <div className="brief-grid two-up">
        <AdminWhatsAppConnectionCard initialConnection={tenantConnection} linkHref={null} tenantId="tenant-gigxomi" title="Current tenant snapshot" />
        <div className="brief-card">
          <span className="meta-pill">How you get the API</span>
          <strong>Use Meta embedded signup from this page</strong>
          <p className="muted-copy">
            Click <strong>Start WhatsApp Signup</strong> below, finish the Meta onboarding flow, then Gigxomi captures
            the business IDs, phone number ID, and token details needed for the official line.
          </p>
          <p className="muted-copy">
            After Meta returns the setup data, use <strong>Refresh access token</strong> and <strong>Subscribe webhook
            app</strong> here to complete the live Cloud API connection for public OTP and future automations.
          </p>
        </div>
      </div>

      <AdminWhatsAppSetupPanel initialConnection={tenantConnection} tenantId="tenant-gigxomi" tenantOptions={whatsappTenantOptions} />

      <div className="dashboard-grid">
        <SurfaceCard>
          <div className="board-header">
            <div>
              <p className="section-label">OTP channel health</p>
              <h2 className="app-section-title">
                The official authorized Gigxomi line handles public auth requests. It stays inside super admin as the main testing and monitoring area until broader automation is ready.
              </h2>
            </div>
            <StatusPill>{otpChannel.isConfigured ? "Official channel" : "Needs setup"}</StatusPill>
          </div>

          <div className="stack-list">
            <div className="bullet-row">
              <ShieldCheck size={16} strokeWidth={1.8} />
              <p>
                <strong>{otpChannel.isConfigured ? otpChannel.label : "Official number not configured yet"}</strong> is the live Gigxomi line used for public login and signup verification.
              </p>
            </div>
            <div className="bullet-row">
              <ShieldCheck size={16} strokeWidth={1.8} />
              <p>
                OTP is generated only after the same WhatsApp sender sends <strong>Get OTP</strong>.
              </p>
            </div>
            <div className="bullet-row">
              <ShieldCheck size={16} strokeWidth={1.8} />
              <p>
                If the sender uses a different number than the website request, the system tells them to request OTP from their registered number.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">Intent status mix</p>
            <InsightBars
              items={[
                {
                  label: "Pending WhatsApp",
                  value: `${overview.PENDING_WHATSAPP} intents`,
                  percentage: overview.total ? Math.round((overview.PENDING_WHATSAPP / overview.total) * 100) : 0,
                },
                {
                  label: "OTP issued",
                  value: `${overview.OTP_ISSUED} intents`,
                  percentage: overview.total ? Math.round((overview.OTP_ISSUED / overview.total) * 100) : 0,
                },
                {
                  label: "Pending subscription",
                  value: `${overview.PENDING_SUBSCRIPTION} intents`,
                  percentage: overview.total ? Math.round((overview.PENDING_SUBSCRIPTION / overview.total) * 100) : 0,
                },
                {
                  label: "Verified",
                  value: `${overview.VERIFIED} intents`,
                  percentage: overview.total ? Math.round((overview.VERIFIED / overview.total) * 100) : 0,
                },
                {
                  label: "Expired or superseded",
                  value: `${overview.EXPIRED + overview.SUPERSEDED} intents`,
                  percentage:
                    overview.total ? Math.round(((overview.EXPIRED + overview.SUPERSEDED) / overview.total) * 100) : 0,
                },
              ]}
            />
          </SurfaceCard>

          <SurfaceCard>
            <p className="section-label">Public auth flow</p>
            <div className="brief-grid two-up">
              <div className="brief-card">
                <span className="meta-pill">Public login</span>
                <strong>Website first, WhatsApp second</strong>
                <p className="muted-copy">
                  User enters the same WhatsApp number on the login page, opens the official Gigxomi chat, sends Get OTP, then enters the code on the verify page.
                </p>
                <Link className="ghost-button" href="/login">
                  Open login page
                </Link>
              </div>
              <div className="brief-card">
                <span className="meta-pill">Public signup</span>
                <strong>Package selection stays on the web</strong>
                <p className="muted-copy">
                  User fills name, package, and WhatsApp number on signup first, then sends Get OTP from that same number to complete onboarding.
                </p>
                <Link className="ghost-button" href="/signup">
                  Open signup page
                </Link>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>

      <SurfaceCard>
        <div className="board-header">
          <div>
            <p className="section-label">Recent OTP requests</p>
            <h2 className="app-section-title">
              Super admin can audit every OTP request with the real requester identity, contact details, and current status without mixing this system lane into normal freelancer or agency conversations.
            </h2>
          </div>
          <StatusPill>{recentIntents.length} recent</StatusPill>
        </div>

        <div className="otp-request-table-wrap">
          {recentIntents.length ? (
            <table className="otp-request-table">
              <thead>
                <tr>
                  <th>Flow</th>
                  <th>Requester</th>
                  <th>Contact</th>
                  <th>OTP state</th>
                  <th>Timeline</th>
                  <th>Routing</th>
                </tr>
              </thead>
              <tbody>
                {recentIntents.map((intent) => (
                  <tr key={intent.id}>
                    <td>
                      <div className="otp-request-stack">
                        <StatusPill>{intent.status.replace(/_/g, " ")}</StatusPill>
                        <strong>{intent.flow === "SIGNUP" ? "Signup" : "Login"}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="otp-request-stack">
                        <strong>{intent.displayName || "Name not submitted yet"}</strong>
                        <span>{formatPhoneNumber(intent.phone)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="otp-request-stack">
                        <strong>{intent.email || "WhatsApp-only request"}</strong>
                        <span>{intent.packageId ? `Package ${intent.packageId}` : "No package selected"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="otp-request-stack">
                        <strong>{intent.challengeId ? "OTP issued" : "Waiting for Get OTP"}</strong>
                        <span>{intent.challengeIssuedAt ? `Issued ${formatIntentTimestamp(intent.challengeIssuedAt)}` : "No code sent yet"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="otp-request-stack">
                        <strong>Updated {formatIntentTimestamp(intent.updatedAt)}</strong>
                        <span>Created {formatIntentTimestamp(intent.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="otp-request-stack">
                        <strong>{intent.redirectTo || "/"}</strong>
                        <span>{intent.userId ? `Linked user ${intent.userId}` : "No linked user yet"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="brief-card">
              <span className="meta-pill">No activity yet</span>
              <strong>The public OTP channel has no matching intents yet.</strong>
              <p className="muted-copy">Website login or signup must start first, then users send Get OTP from the same WhatsApp number.</p>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

export async function SuperAdminWhatsAppFlowBuilderSection() {
  const [flows, runs] = await Promise.all([listSuperAdminWhatsAppFlows(), listSuperAdminWhatsAppFlowRuns()]);

  return (
    <div className="dashboard-shell compact dashboard-shell-flow-builder">
      <p className="eyebrow">WhatsApp flows</p>
      <h2 className="section-heading">
        Build and test official-line chatbot automations in super admin first. The React Flow canvas opens as the main workspace here, and stable flows can be copied into agency spaces later without changing the current hierarchy.
      </h2>
      <SuperAdminWhatsAppFlowBuilder agencies={agencyTenants.filter((agency) => agency.id !== "tenant-gigxomi")} flows={flows} runs={runs} />
    </div>
  );
}

export async function SuperAdminBillingSection() {
  const [manualUpiConfig, pendingManualPayments, phonePeConfig, reminderSettings] = await Promise.all([
    getManualUpiAdminConfig(),
    listPendingManualUpiPayments(),
    getPhonePeAdminConfig(),
    getSubscriptionReminderSettings(),
  ]);

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Billing control</p>
      <h2 className="section-heading">
        Control package billing, manual UPI checkout, screenshot approvals, and subscription activation from one guarded super-admin lane.
      </h2>
      <SuperAdminPhonePeControl initialConfig={phonePeConfig} />
      <SuperAdminManualUpiControl
        initialConfig={manualUpiConfig}
        initialPayments={pendingManualPayments}
        initialReminderSettings={reminderSettings}
      />
      <div className="dashboard-grid">
        <SurfaceCard>
          <div className="board-header">
            <div>
              <p className="section-label">Revenue mix</p>
              <h2 className="app-section-title">
                Super admin should know which layer is growing faster and where renewal pressure could hit cash flow.
              </h2>
            </div>
            <StatusPill>Finance view</StatusPill>
          </div>
          <InsightBars items={superAdminDashboardSnapshot.revenueSplit} />
        </SurfaceCard>

        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">Plan health</p>
            <InsightBars items={superAdminDashboardSnapshot.subscriptionHealth} />
          </SurfaceCard>
          <SurfaceCard>
            <div className="stack-list">
              <div className="bullet-row">
                <BadgeIndianRupee size={16} strokeWidth={1.8} />
                <p>Only active team editors count toward billed seats. Invited and requested editors stay non-billable until activated.</p>
              </div>
              <div className="bullet-row">
                <WalletCards size={16} strokeWidth={1.8} />
                <p>Payout release should remain platform-governed even when agencies collect money externally.</p>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

export function SuperAdminEditorEconomicsSection() {
  const sortedEditors = editorPerformanceProfiles.slice().sort((left, right) => right.leader.score - left.leader.score);

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Editor economics</p>
      <h2 className="section-heading">
        Editors should earn from marketplace and agency work, while Gigxomi keeps one consistent rulebook for trust, rewards, and payout safety.
      </h2>
      <div className="dashboard-grid">
        <SurfaceCard>
          <div className="board-header">
            <div>
              <p className="section-label">Platform leaderboard</p>
              <h2 className="app-section-title">
                Leader score is the reward engine. It shows who deserves gifts, campaign boosts, and premium agency visibility.
              </h2>
            </div>
            <StatusPill>Rewards</StatusPill>
          </div>
          <div className="board-list">
            {sortedEditors.map((editor) => (
              <article className="lead-row" key={editor.id}>
                <div className="status-row">
                  <StatusPill>{editor.leader.tier}</StatusPill>
                </div>
                <h3>{editor.name}</h3>
                <p>{editor.specialties.join(" • ")}</p>
                <p>
                  <strong>Leader score:</strong> {editor.leader.score} • <strong>Karma:</strong> {editor.karma.score}
                </p>
              </article>
            ))}
          </div>
        </SurfaceCard>
        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">Reward model</p>
            <div className="stack-list">
              {leaderScoreRules.map((rule) => (
                <div className="bullet-row" key={rule.label}>
                  <Users size={16} strokeWidth={1.8} />
                  <p>
                    <strong>{rule.label}</strong> ({rule.weight}%): {rule.note}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className="stack-list">
              <div className="bullet-row">
                <WalletCards size={16} strokeWidth={1.8} />
                <p>Platform-controlled payout trust protects editors whether work comes from Gigxomi leads or outside agencies.</p>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

export async function SuperAdminPlatformSettingsSection() {
  const [instagramConnection, whatsappConnection] = await Promise.all([
    getInstagramConnectionStateFromFile(),
    getWhatsAppConnectionStateFromFile("tenant-gigxomi"),
  ]);
  const instagramSetupUrls = buildInstagramMetaSetupUrls();
  const whatsappTenantOptions = agencyTenants.map((agency) => ({
    id: agency.id,
    name: agency.name,
    phoneNumber: agency.whatsappNumber,
  }));
  const instagramStatus =
    instagramConnection?.status === "Connected" || instagramConnection?.status === "Needs attention"
      ? instagramConnection.status
      : instagramConnection?.pluginEnabled === true
        ? "Needs attention"
        : "Not connected";
  const instagramConnectionView: InstagramPluginConnectionView = instagramConnection
    ? {
        tenantId: instagramConnection.tenantId,
        pluginEnabled: instagramConnection.pluginEnabled === true,
        status: instagramStatus,
        appId: "",
        accountId: instagramConnection.accountId ?? "",
        username: instagramConnection.username,
        accountType: instagramConnection.accountType ?? "",
        scopes: instagramConnection.scopes ?? [],
        expiresAt: instagramConnection.expiresAt ?? null,
        connectedAt: instagramConnection.connectedAt ?? null,
        lastError: instagramConnection.lastError ?? "",
        updatedAt: instagramConnection.updatedAt,
      }
    : null;

  return (
    <div className="stack-list">
      <div className="dashboard-shell compact">
        <p className="eyebrow">Platform settings</p>
        <h2 className="section-heading">
          The super-admin layer should own privacy, payout trust, tenant onboarding, and any rule that can affect cross-agency fairness.
        </h2>
        <div className="brief-grid three-up">
          <div className="brief-card">
            <span className="meta-pill">Privacy</span>
            <strong>Editors stay masked by default</strong>
            <p className="muted-copy">Agency clients should never see Gigxomi, and editors should not see raw client identity unless super admin allows it.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Seat billing</span>
            <strong>Only active editors count</strong>
            <p className="muted-copy">Invites, portfolio requests, and shortlisted applications should remain free until team membership becomes active.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Payout safety</span>
            <strong>Secured-for-editor is mandatory</strong>
            <p className="muted-copy">Assignments can move operationally, but work should not truly begin until the editor-side trust state is green.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Onboarding</span>
            <strong>WhatsApp launch stays reviewed</strong>
            <p className="muted-copy">Agency-owned numbers stay isolated, but template approval and launch health remain platform-supervised.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Agency visibility</span>
            <strong>Public directory remains curated</strong>
            <p className="muted-copy">Home page can showcase agencies, but the actual agency project feed stays relevance-gated inside freelancer space.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">Incentives</span>
            <strong>Leaderboards drive gifts and rewards</strong>
            <p className="muted-copy">Reward systems should reflect consistency, repeat value, and low-dispute operations rather than raw volume alone.</p>
          </div>
        </div>
      </div>

      <section className="dashboard-shell compact">
        <p className="eyebrow">WhatsApp app settings</p>
        <h2 className="section-heading">Advanced Meta IDs, token exchange, phone registration, webhook, and debugging.</h2>
        <AdminWhatsAppSetupPanel
          initialConnection={whatsappConnection}
          settingsHref={null}
          tenantOptions={whatsappTenantOptions}
          variant="full"
        />
      </section>

      <SurfaceCard className="theme-control-card">
        <div className="board-header">
          <div>
            <p className="section-label">Theme control</p>
            <h2 className="app-section-title">
              Central Gigxomi black/lime theme tokens used by web, sales, mobile config, admin dashboards, and public surfaces.
            </h2>
          </div>
          <StatusPill>Black obsidian active</StatusPill>
        </div>

        <div className="theme-token-grid">
          {[
            ["Canvas", gigxomiThemeTokens.canvas],
            ["Card", gigxomiThemeTokens.surface],
            ["Secondary", gigxomiThemeTokens.surfaceSoft],
            ["Elevated", gigxomiThemeTokens.surfaceElevated],
            ["Glass", gigxomiThemeTokens.glass],
            ["Lime", gigxomiThemeTokens.primary],
            ["Hover", gigxomiThemeTokens.hover],
            ["Active", gigxomiThemeTokens.active],
            ["Selected", gigxomiThemeTokens.selected],
            ["Accent border", gigxomiThemeTokens.primaryBorder],
          ].map(([label, value]) => (
            <div className="theme-token-row" key={label}>
              <span className="theme-token-swatch" style={{ background: value }} />
              <div>
                <strong>{label}</strong>
                <code>{value}</code>
              </div>
            </div>
          ))}
        </div>

        <div className="theme-rule-strip">
          <strong>Forbidden dark tones</strong>
          <div>
            {forbiddenGigxomiThemeColors.map((color) => (
              <code key={color}>{color}</code>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <SuperAdminInstagramPluginCard initialConnection={instagramConnectionView} setupUrls={instagramSetupUrls} />

      <SuperAdminYouTubeChannelPanel />
    </div>
  );
}


