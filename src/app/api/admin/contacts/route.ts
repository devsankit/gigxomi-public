import { NextResponse } from "next/server";

import { resolveSessionTenantId } from "@/lib/api/resolve-session-tenant";
import { requireSessionRole } from "@/lib/api/require-session-role";
import { listContactsFromFile, listLeadStatusesFromFile, listManagersFromFile, updateContactFromFile } from "@/lib/gigxomi/dummy-platform-file-store";

export async function GET() {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const audience = authorization.session.role === "MANAGER" ? "manager" : "admin";
  const tenantId =
    authorization.session.role === "SUPER_ADMIN"
      ? undefined
      : resolveSessionTenantId(authorization.session);

  return NextResponse.json({
    ok: true,
    contacts: await listContactsFromFile(audience, tenantId),
    statuses: await listLeadStatusesFromFile(),
    managers: await listManagersFromFile(tenantId),
  });
}

export async function POST(request: Request) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const audience = authorization.session.role === "MANAGER" ? "manager" : "admin";
  const tenantId =
    authorization.session.role === "SUPER_ADMIN"
      ? undefined
      : resolveSessionTenantId(authorization.session);

  const body = await request.json();
  const contact = await updateContactFromFile(body.contactId ?? "", {
    tags: Array.isArray(body.tags) ? body.tags : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    latestStatusId: typeof body.latestStatusId === "string" ? body.latestStatusId : undefined,
    assignedUserId: typeof body.assignedUserId === "string" ? body.assignedUserId : undefined,
  }, tenantId);

  if (!contact) {
    return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    contact,
    contacts: await listContactsFromFile(audience, tenantId),
    managers: await listManagersFromFile(tenantId),
  });
}
