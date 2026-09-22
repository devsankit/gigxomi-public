import { NextResponse } from "next/server";

import { rejectMissingMobileSessionUser } from "@/lib/api/mobile-session-user";
import { requireSessionRole } from "@/lib/api/require-session-role";
import { toMobileSession } from "@/lib/auth/mobile-session";
import { createSessionPayload } from "@/lib/auth/session";
import { getManagedUserForSession } from "@/lib/billing/subscription-service";

export async function GET() {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES_AGENT", "FREELANCER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const staleSessionResponse = await rejectMissingMobileSessionUser(authorization.session.userId);
  if (staleSessionResponse) {
    return staleSessionResponse;
  }

  try {
    const dbUser = await getManagedUserForSession(authorization.session.userId);
    const freshSession = createSessionPayload({
      userId: dbUser.id,
      role: dbUser.role,
      assignedRole: dbUser.assignedRole,
      tenantId: dbUser.tenantId,
      displayName: dbUser.displayName,
      email: dbUser.email,
      phone: dbUser.phone,
      packageId: dbUser.packageId,
      packageName: dbUser.packageName,
      packageAudience: dbUser.packageAudience,
      packageStatus: dbUser.packageStatus,
      packageExpiresAt: dbUser.packageExpiresAt,
      workspaceMode: dbUser.workspaceMode,
    });

    return NextResponse.json({
      ok: true,
      session: toMobileSession(freshSession),
    });
  } catch {
    return NextResponse.json({
      ok: true,
      session: toMobileSession(authorization.session),
    });
  }
}
