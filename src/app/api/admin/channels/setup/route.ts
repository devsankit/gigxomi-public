import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { resolveSessionTenantId } from "@/lib/api/resolve-session-tenant";
import {
  ensureWhatsAppConnectionDraftFromFile,
  updateWhatsAppConnectionStateFromFile,
  updateInstagramConnectionStateFromFile,
} from "@/lib/gigxomi/dummy-platform-file-store";
import { updateAgencyListingFromFile } from "@/lib/gigxomi/agency-listing-store";
import { normalizePhone } from "@/lib/auth/normalize";

export async function POST(request: Request) {
  try {
    const session = await getSessionContext();
    if (session.role === "GUEST" || !session.userId) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tenantId = resolveSessionTenantId(session, body?.tenantId);
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Missing tenant context." }, { status: 400 });
    }

    const rawWhatsApp = String(body?.whatsappNumber ?? "").trim();
    const rawInstagram = String(body?.instagramHandle ?? "").trim().replace(/^@/, "");

    const normalizedWhatsApp = rawWhatsApp ? normalizePhone(rawWhatsApp) : "";

    // 1. Setup WhatsApp connection
    if (normalizedWhatsApp) {
      await ensureWhatsAppConnectionDraftFromFile({
        tenantId,
        businessName: session.displayName ?? "Agency",
        displayName: session.displayName ?? "Agency",
        phoneNumber: normalizedWhatsApp,
      });
      await updateWhatsAppConnectionStateFromFile(tenantId, {
        phoneNumber: normalizedWhatsApp,
        businessName: session.displayName ?? "Agency",
        pluginEnabled: true,
        status: "CONNECTED",
      });
      await updateAgencyListingFromFile(tenantId, {
        whatsappNumber: normalizedWhatsApp,
      });
    }

    // 2. Setup Instagram connection
    if (rawInstagram) {
      await updateInstagramConnectionStateFromFile(tenantId, {
        username: rawInstagram,
        displayName: session.displayName ?? rawInstagram,
        pluginEnabled: true,
        status: "ACTIVE",
        note: "Connected during onboarding setup",
      });
    }

    return NextResponse.json({
      ok: true,
      channels: {
        whatsapp: normalizedWhatsApp || null,
        instagram: rawInstagram ? `@${rawInstagram}` : null,
      },
      message: "Agency client channels configured successfully.",
    });
  } catch (error) {
    console.error("[channels/setup] Error setting up channels:", error);
    return NextResponse.json({ ok: false, error: "Failed to configure channels." }, { status: 500 });
  }
}
