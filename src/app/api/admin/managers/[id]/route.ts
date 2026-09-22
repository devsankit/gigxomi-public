import { randomBytes, scryptSync } from "node:crypto";

import { NextResponse } from "next/server";

import { resolveSessionTenantId } from "@/lib/api/resolve-session-tenant";
import { requireSessionRole } from "@/lib/api/require-session-role";
import { normalizePhone } from "@/lib/auth/normalize";
import { prisma } from "@/lib/prisma";
import type { DummyManagerAccount, DummyManagerPermissionKey, DummyManagerPermissionSet } from "@/lib/gigxomi/dummy-platform-store";

const MANAGER_QUEUE_PREFIX = "manager_queue:";
const MANAGER_PERMISSION_PREFIX = "manager_permission:";
const managerPermissionKeys: DummyManagerPermissionKey[] = [
  "chatInbox",
  "assignedChats",
  "quoteReview",
  "deliveryReview",
  "walletReview",
  "escalations",
  "allContacts",
];

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function encodeManagerQueue(queue: string) {
  return `${MANAGER_QUEUE_PREFIX}${encodeURIComponent(queue.trim() || "General operations")}`;
}

function decodeManagerQueue(permissions: string[]) {
  const rawQueue = permissions.find((permission) => permission.startsWith(MANAGER_QUEUE_PREFIX))?.slice(MANAGER_QUEUE_PREFIX.length) ?? "";
  if (!rawQueue) {
    return "General operations";
  }

  try {
    return decodeURIComponent(rawQueue) || "General operations";
  } catch {
    return rawQueue || "General operations";
  }
}

function getDefaultManagerPermissions(): DummyManagerPermissionSet {
  return {
    chatInbox: true,
    assignedChats: true,
    quoteReview: false,
    deliveryReview: true,
    walletReview: false,
    escalations: true,
    allContacts: false,
  };
}

function decodeManagerPermissions(permissions: string[]) {
  const defaults = getDefaultManagerPermissions();
  const explicitPermissionEntries = permissions.filter((permission) => permission.startsWith(MANAGER_PERMISSION_PREFIX));
  if (!explicitPermissionEntries.length) {
    return defaults;
  }

  return managerPermissionKeys.reduce((nextPermissions, key) => {
    nextPermissions[key] = explicitPermissionEntries.includes(`${MANAGER_PERMISSION_PREFIX}${key}`);
    return nextPermissions;
  }, {} as DummyManagerPermissionSet);
}

function encodeManagerPermissions(permissions: DummyManagerPermissionSet) {
  return managerPermissionKeys
    .filter((key) => Boolean(permissions[key]))
    .map((key) => `${MANAGER_PERMISSION_PREFIX}${key}`);
}

function buildManagerPermissionPayload(input: {
  existingPermissions: string[];
  queue: string;
  permissions: DummyManagerPermissionSet;
}) {
  const preservedEntries = input.existingPermissions.filter(
    (permission) =>
      !permission.startsWith(MANAGER_QUEUE_PREFIX) &&
      !permission.startsWith(MANAGER_PERMISSION_PREFIX),
  );

  return Array.from(
    new Set([
      ...preservedEntries,
      "manager",
      encodeManagerQueue(input.queue),
      ...encodeManagerPermissions(input.permissions),
    ]),
  );
}

function toManagerAccount(user: {
  id: string;
  tenantId: string | null;
  displayName: string;
  email: string | null;
  phone: string;
  permissions: string[];
}): DummyManagerAccount {
  return {
    id: user.id,
    tenantId: user.tenantId ?? "",
    authUserId: user.id,
    name: user.displayName,
    email: user.email ?? "",
    phone: user.phone,
    queue: decodeManagerQueue(user.permissions ?? []),
    active: true,
    permissions: decodeManagerPermissions(user.permissions ?? []),
  };
}

async function listManagersFromDb(tenantId?: string) {
  const users = await prisma.appAuthUser.findMany({
    where: {
      role: "MANAGER",
      ...(tenantId?.trim() ? { tenantId: tenantId.trim() } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map(toManagerAccount) satisfies DummyManagerAccount[];
}

async function findScopedManager(id: string, tenantId?: string) {
  return prisma.appAuthUser.findFirst({
    where: {
      id,
      role: "MANAGER",
      ...(tenantId?.trim() ? { tenantId: tenantId.trim() } : {}),
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await context.params;
  const tenantId =
    authorization.session.role === "SUPER_ADMIN"
      ? undefined
      : resolveSessionTenantId(authorization.session);
  const existing = await findScopedManager(id, tenantId);

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Manager not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name ?? existing.displayName).trim();
  const email = String(body.email ?? existing.email ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(body.phone ?? existing.phone).trim());
  const password = String(body.password ?? "").trim();
  const queue = String(body.queue ?? decodeManagerQueue(existing.permissions ?? [])).trim();
  const currentPermissions = decodeManagerPermissions(existing.permissions ?? []);
  const nextPermissions = {
    ...currentPermissions,
    ...((body.permissions ?? {}) as Partial<DummyManagerPermissionSet>),
  };

  if (!name) {
    return NextResponse.json({ ok: false, error: "Manager name is required." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid manager email." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Enter a valid manager WhatsApp number." }, { status: 400 });
  }
  if (password && !/^\d{6}$/.test(password)) {
    return NextResponse.json({ ok: false, error: "New manager PIN must be exactly 6 digits." }, { status: 400 });
  }

  const duplicate = await prisma.appAuthUser.findFirst({
    where: {
      id: { not: existing.id },
      OR: [{ email }, { phone }, { loginPhoneAliases: { has: phone } }],
    },
  });
  if (duplicate) {
    return NextResponse.json({ ok: false, error: "Another account already uses that email or WhatsApp number." }, { status: 409 });
  }

  const passwordUpdate = password
    ? (() => {
        const salt = randomBytes(16).toString("hex");
        return {
          passwordSalt: salt,
          passwordHash: hashPassword(password, salt),
        };
      })()
    : {};

  const updated = await prisma.appAuthUser.update({
    where: { id: existing.id },
    data: {
      displayName: name,
      email,
      phone,
      loginPhoneAliases: [phone],
      permissions: buildManagerPermissionPayload({
        existingPermissions: existing.permissions ?? [],
        queue,
        permissions: nextPermissions,
      }),
      ...passwordUpdate,
    },
  });

  const managers = await listManagersFromDb(tenantId);

  return NextResponse.json({
    ok: true,
    manager: toManagerAccount(updated),
    managers,
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await context.params;
  const tenantId =
    authorization.session.role === "SUPER_ADMIN"
      ? undefined
      : resolveSessionTenantId(authorization.session);
  const existing = await findScopedManager(id, tenantId);

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Manager not found." }, { status: 404 });
  }

  await prisma.appAuthUser.delete({
    where: { id: existing.id },
  });

  const managers = await listManagersFromDb(tenantId);

  return NextResponse.json({
    ok: true,
    deletedManagerId: existing.id,
    managers,
  });
}
