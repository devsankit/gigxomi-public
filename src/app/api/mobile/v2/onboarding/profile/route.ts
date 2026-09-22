import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { requireSessionRole } from "@/lib/api/require-session-role";
import { prisma } from "@/lib/prisma";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonObject(value: unknown): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

export async function GET() {
  const authorization = await requireSessionRole(["ADMIN", "FREELANCER"]);
  if (!authorization.ok) return authorization.response;
  const state = await prisma.connectedOnboardingState.findUnique({ where: { userId: authorization.session.userId } });
  return NextResponse.json({ ok: true, onboarding: state });
}

export async function POST(request: Request) {
  const authorization = await requireSessionRole(["ADMIN", "FREELANCER"]);
  if (!authorization.ok) return authorization.response;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const organizationName = text(body?.organizationName);
  const logoUrl = text(body?.logoUrl);
  if (authorization.session.role === "ADMIN" && (!organizationName || !logoUrl)) {
    return NextResponse.json({ ok: false, code: "AGENCY_PROFILE_INCOMPLETE", error: "Organization name and logo are required." }, { status: 400 });
  }
  if (logoUrl) {
    try {
      if (!logoUrl.startsWith("/uploads/")) {
        const parsed = new URL(logoUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Logo must be a valid uploaded image URL." }, { status: 400 });
    }
  }
  const services = Array.isArray(body?.services) ? body.services.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
  const answers = body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers) ? body.answers as Record<string, unknown> : {};
  const identityDocumentType = text(body?.identityDocumentType);
  if (authorization.session.role === "FREELANCER" && (!services.length || !Object.keys(answers).length || !identityDocumentType)) {
    return NextResponse.json({ ok: false, error: "Add a service, answer the onboarding questions, and submit an identity document type." }, { status: 400 });
  }
  try {
    const current = await prisma.connectedOnboardingState.findUnique({ where: { userId: authorization.session.userId } });
    const previous = current?.payload && typeof current.payload === "object" && !Array.isArray(current.payload) ? current.payload as Record<string, unknown> : {};
    const next = await prisma.$transaction(async (tx) => {
    if (authorization.session.role === "FREELANCER") {
      await tx.appFreelancerOnboarding.upsert({
        where: { userId: authorization.session.userId },
        create: { userId: authorization.session.userId, status: "COMPLETE", currentStep: 4, primaryCategory: services[0], secondaryCategories: services.slice(1), serviceDraft: jsonObject({ services }), profileDraft: jsonObject({ answers }), serviceSubmittedAt: new Date(), profileCompletedAt: new Date(), identityChoiceAt: new Date(), completedAt: new Date() },
        update: { status: "COMPLETE", currentStep: 4, primaryCategory: services[0], secondaryCategories: services.slice(1), serviceDraft: jsonObject({ services }), profileDraft: jsonObject({ answers }), serviceSubmittedAt: new Date(), profileCompletedAt: new Date(), identityChoiceAt: new Date(), completedAt: new Date() },
      });
      await tx.appFreelancerAssessment.upsert({
        where: { userId: authorization.session.userId },
        create: { id: randomUUID(), userId: authorization.session.userId, primaryCategory: services[0], questionIds: Object.keys(answers), answers: jsonObject(answers), submittedAt: new Date() },
        update: { primaryCategory: services[0], questionIds: Object.keys(answers), answers: jsonObject(answers), submittedAt: new Date() },
      });
      await tx.appFreelancerIdentity.upsert({
        where: { userId: authorization.session.userId },
        create: { userId: authorization.session.userId, provider: "MANUAL", status: "PENDING", requestedDocumentType: identityDocumentType, documentType: identityDocumentType, consentedAt: new Date() },
        update: { provider: "MANUAL", status: "PENDING", requestedDocumentType: identityDocumentType, documentType: identityDocumentType, consentedAt: new Date(), lastError: null },
      });
    }
    return tx.connectedOnboardingState.upsert({
      where: { userId: authorization.session.userId },
      create: {
        userId: authorization.session.userId,
        audience: authorization.session.role === "ADMIN" ? "AGENCY" : "FREELANCER",
        stage: "INSTAGRAM",
        profileDoneAt: new Date(), completedAt: null,
        payload: jsonObject({ ...previous, ...body, organizationName, logoUrl, ...(authorization.session.role === "FREELANCER" ? { identityStatus: "PENDING" } : {}) }),
      },
      update: {
        stage: "INSTAGRAM",
        profileDoneAt: new Date(), completedAt: null,
        payload: jsonObject({ ...previous, ...body, organizationName, logoUrl, ...(authorization.session.role === "FREELANCER" ? { identityStatus: "PENDING" } : {}) }),
      },
    });
    });
    return NextResponse.json({ ok: true, onboarding: next });
  } catch (error) {
    console.error("[mobile-onboarding-profile] save failed", {
      userId: authorization.session.userId,
      role: authorization.session.role,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, code: "ONBOARDING_SAVE_UNAVAILABLE", error: "We could not save your setup right now. Your form is still on this device—please retry in a moment." },
      { status: 503 },
    );
  }
}
