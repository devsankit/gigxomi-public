import { NextResponse } from "next/server";

import { resolveConversationAudienceForSession } from "@/lib/api/conversation-access";
import { requireSessionRole } from "@/lib/api/require-session-role";
import { resolveWhatsAppSetupTenantId } from "@/lib/api/resolve-session-tenant";
import type { ManagedAuthUser } from "@/lib/auth/types";
import type { WorkloadBand } from "@/lib/gigxomi/business-ecosystem-data";
import { listConversationsForAudienceFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { findConfirmedAgencyEditorForManagedUser } from "@/lib/gigxomi/agency-editor-eligibility";
import { getManagedAuthUsers } from "@/lib/auth/store";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function workloadBand(value: unknown): WorkloadBand {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("near") || normalized.includes("full")) return "Near Capacity";
  if (normalized.includes("busy") || normalized.includes("heavy")) return "Busy";
  if (normalized.includes("low") || normalized.includes("light") || normalized.includes("available")) return "Low";
  return "Moderate";
}

export async function GET(request: Request) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER", "FREELANCER", "SALES_AGENT"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { searchParams } = new URL(request.url);
  const requestedAudience = searchParams.get("audience");
  const includeSupportData = searchParams.get("includeSupportData") === "1";
  const lightweight = searchParams.get("lightweight") !== "0";
  const serviceId = searchParams.get("serviceId")?.trim() || undefined;

  if (requestedAudience === "customer") {
    return NextResponse.json({ ok: false, error: "The in-app customer route has been retired. Use WhatsApp-first intake instead." }, { status: 410 });
  }

  if (requestedAudience && requestedAudience !== "manager" && requestedAudience !== "admin" && requestedAudience !== "freelancer" && requestedAudience !== "sales") {
    return NextResponse.json({ ok: false, error: "Unsupported conversation audience." }, { status: 400 });
  }

  const scope = resolveConversationAudienceForSession(authorization.session, requestedAudience);
  const sessionTenant = authorization.session.tenantId?.trim();
  const effectiveTenant = sessionTenant && sessionTenant !== "tenant-gigxomi" ? sessionTenant : "tenant-agency-408de269";
  const tenantId =
    authorization.session.role === "SALES_AGENT"
      ? resolveWhatsAppSetupTenantId(authorization.session)
      : effectiveTenant;
  if ((scope.audience === "admin" || scope.audience === "manager") && authorization.session.role !== "SUPER_ADMIN" && !tenantId) {
    return NextResponse.json({ ok: false, error: "This account is not attached to an agency workspace yet." }, { status: 403 });
  }
  const payload = await listConversationsForAudienceFromFile(scope.audience, {
    freelancerId: scope.freelancerId,
    freelancerIds: scope.freelancerIds,
    freelancerNames: scope.freelancerNames,
    activeAgencyIds: scope.activeAgencyIds,
    tenantId,
    includeSupportData,
    serviceId,
    lightweight,
  });

  let assignableEditors = payload.assignableEditors;
  if (includeSupportData && (scope.audience === "admin" || scope.audience === "manager")) {
    const [managedUsers, legacyMemberships, appMemberships, freelancerProfiles, freelancerServices] = await Promise.all([
      getManagedAuthUsers(),
      tenantId
        ? prisma.teamMembership.findMany({
            where: { tenantId, status: "ACTIVE", assignmentEligible: true },
            include: { editorProfile: { include: { user: true } } },
          })
        : Promise.resolve([]),
      tenantId
        ? prisma.appTeamMembership.findMany({ where: { tenantId, status: "ACTIVE" } })
        : Promise.resolve([]),
      prisma.appAuthUser.findMany({
        where: { OR: [{ role: "FREELANCER" }, { assignedRole: "FREELANCER" }] },
        select: { id: true, lastLoginAt: true, freelancerWorkspace: { select: { profile: true, verification: true } } },
      }),
      prisma.appFreelancerService.findMany({
        where: { status: { in: ["APPROVED", "PUBLISHED"] } },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    const confirmedEditors = [
      ...legacyMemberships.map((membership) => ({
        editorProfileId: membership.editorProfileId,
        displayName: membership.editorProfile.user.displayName,
        email: membership.editorProfile.user.email,
        phone: membership.editorProfile.user.phone,
        title: membership.editorProfile.title,
        category: membership.editorProfile.category,
        karmaScore: membership.editorProfile.karmaScore,
      })),
      ...appMemberships.map((membership) => ({
        editorProfileId: membership.freelancerId,
        displayName: membership.freelancerName,
        title: membership.roleType || "Freelance editor",
        category: membership.roleType || "Creative services",
        karmaScore: 0,
      })),
    ];

    const profilesByUserId = new Map(freelancerProfiles.map((profile) => [profile.id, profile]));
    const servicesByUserId = new Map<string, typeof freelancerServices>();
    for (const service of freelancerServices) {
      const current = servicesByUserId.get(service.ownerId) ?? [];
      current.push(service);
      servicesByUserId.set(service.ownerId, current);
    }

    assignableEditors = managedUsers
      .map((user: ManagedAuthUser) => ({ user, editor: findConfirmedAgencyEditorForManagedUser(user, confirmedEditors) }))
      .filter(
        ({ user, editor }) =>
          Boolean(editor) || (user.packageStatus !== "PAUSED" && user.packageStatus !== "EXPIRED"),
      )
      .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.user.id === entry.user.id) === index)
      .map(({ user, editor }) => {
        const profileRecord = profilesByUserId.get(user.id);
        const profile = record(profileRecord?.freelancerWorkspace?.profile);
        const verification = record(profileRecord?.freelancerWorkspace?.verification);
        const services = (servicesByUserId.get(user.id) ?? []).slice(0, 4).map((service) => {
          const payload = record(service.payload);
          return {
            id: service.id,
            slug: service.slug,
            title: text(payload.title) || "Editing service",
            category: text(payload.category) || text(payload.specialty) || null,
            price: number(payload.basePrice),
            deliveryTime: text(payload.deliveryTime) || null,
          };
        });
        const servicePrices = services.map((service) => service.price).filter((price): price is number => price !== null && price > 0);
        const portfolioLinks = Array.from(new Set([
          ...list(profile.socialLinks),
          ...services.map((service) => `/services/${service.slug}`),
        ]));
        const isOnline = Boolean(profileRecord?.lastLoginAt && profileRecord.lastLoginAt.getTime() >= Date.now() - 15 * 60 * 1000);
        return {
          id: user.id,
          name: text(profile.displayName) || user.displayName,
          specialties: Array.from(new Set([
            ...list(profile.skills),
            editor?.category,
            editor?.title,
            ...services.map((service) => service.category),
            "Creative services",
          ].map((value) => String(value ?? "").trim()).filter(Boolean))),
          workloadBand: workloadBand(profile.workloadBand || profile.availability),
          karmaScore: number(profile.karmaScore) ?? editor?.karmaScore ?? 0,
          onlineStatus: isOnline ? "online" as const : "offline" as const,
          lastOnlineAt: profileRecord?.lastLoginAt?.toISOString(),
          acceptingProjects: true,
          isTeamMember: Boolean(editor),
          offerEligible: Boolean(editor) || (user.packageStatus !== "PAUSED" && user.packageStatus !== "EXPIRED"),
          directAssignmentEligible: Boolean(editor),
          verificationStatus: text(verification.status) || "DRAFT",
          startingPrice: number(profile.startingPrice) ?? (servicePrices.length ? Math.min(...servicePrices) : null),
          portfolioLinks,
          services,
        };
      });
  }

  return NextResponse.json({
    ok: true,
    ...payload,
    assignableEditors: includeSupportData ? assignableEditors : [],
    leadStatuses: includeSupportData ? payload.leadStatuses : [],
    templates: includeSupportData ? payload.templates : [],
    supportDataIncluded: includeSupportData,
  });
}

export async function POST(request: Request) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  await request.json().catch(() => null);

  return NextResponse.json(
    {
      ok: false,
      error: "Direct in-app customer conversation creation has been retired. Use WhatsApp webhook intake or the internal manual conversation API.",
    },
    { status: 410 },
  );
}
