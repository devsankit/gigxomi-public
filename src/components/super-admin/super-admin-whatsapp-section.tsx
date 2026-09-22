import Link from "next/link";

import { AdminWhatsAppConnectionCard, AdminWhatsAppSetupPanel } from "@/components/admin/admin-dummy-controls";
import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";
import { getPublicAuthIntentOverview } from "@/lib/auth/public-auth-intent-store";
import { getPublicAuthOtpChannelInfo } from "@/lib/auth/public-whatsapp";
import { agencyTenants } from "@/lib/gigxomi/agency-network-data";
import { getWhatsAppConnectionStateFromFile } from "@/lib/gigxomi/dummy-platform-file-store";

export async function SuperAdminWhatsAppSection() {
  const [overview, otpChannel, tenantConnection] = await Promise.all([
    getPublicAuthIntentOverview(),
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
      <h2 className="section-heading">Connect an agency number, confirm its live status, or open the shared Super Admin inbox.</h2>

      <div className="metric-grid">
        <div className="brief-card">
          <div className="plugin-card-heading">
            <PluginBrandMark brand="whatsapp" size="sm" />
            <div>
              <span className="meta-pill">Public OTP line</span>
              <strong>{otpChannel.isConfigured ? otpChannel.label : "Needs connection"}</strong>
            </div>
          </div>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Connection</span>
          <strong>{tenantConnection?.status ?? "Not started"}</strong>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Pending OTP</span>
          <strong>{String(overview.PENDING_WHATSAPP)}</strong>
        </div>
        <div className="brief-card">
          <span className="meta-pill">OTP issued</span>
          <strong>{String(overview.OTP_ISSUED)}</strong>
        </div>
      </div>

      <div className="brief-grid two-up">
        <AdminWhatsAppConnectionCard
          fallbackPhoneNumber={agencyTenants[0]?.whatsappNumber}
          initialConnection={tenantConnection}
          linkHref={null}
          tenantId="tenant-gigxomi"
          title="Connected agency phone"
        />
        <article className="brief-card">
          <span className="meta-pill">Super Admin inbox</span>
          <strong>Gigxomi WhatsApp conversations</strong>
          <p className="muted-copy">This inbox is isolated to the official Gigxomi line. Other agency tenants keep separate chat histories.</p>
          <div className="freelancer-action-grid">
            <Link className="freelancer-primary-button" href="/super-admin/whatsapp-control">Open WhatsApp controls</Link>
            <Link className="secondary-button" href="/super-admin/platform-settings">App settings</Link>
          </div>
        </article>
      </div>

      <AdminWhatsAppSetupPanel
        initialConnection={tenantConnection}
        settingsHref="/super-admin/platform-settings"
        tenantOptions={whatsappTenantOptions}
        variant="compact"
      />
    </div>
  );
}
