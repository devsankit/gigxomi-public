import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(relativePath, mocks = {}) {
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const box = { exports: {} };
  new Function("module", "exports", "require", code)(box, box.exports, (id) => {
    if (id in mocks) return mocks[id];
    throw new Error(`Unexpected import ${id}`);
  });
  return box.exports;
}

const managedUserUtils = load("src/lib/auth/managed-user-utils.ts");
const freelancerExport = load("src/lib/auth/freelancer-export.ts", {
  "./managed-user-utils": managedUserUtils,
});

test("admin progress reports profile and latest portfolio completion without mutating onboarding", async () => {
  const progressService = load("src/lib/gigxomi/freelancer-admin-progress.ts", {
    "server-only": {},
    "@/lib/prisma": {
      prisma: {
        appFreelancerOnboarding: {
          findMany: async () => [{
            userId: "freelancer-1",
            profileCompletedAt: new Date(),
            serviceSubmittedAt: new Date(),
            completedAt: null,
            status: "IN_PROGRESS",
          }],
        },
        appFreelancerPortfolioReview: {
          findMany: async () => [
            { freelancerId: "freelancer-1", status: "APPROVED" },
            { freelancerId: "freelancer-1", status: "REJECTED" },
          ],
        },
      },
    },
  });

  const progress = await progressService.getFreelancerAdminProgress(["freelancer-1", "freelancer-2"]);
  assert.deepEqual(progress["freelancer-1"], {
    profileCompleted: true,
    portfolioStatus: "APPROVED",
    onboardingCompleted: false,
  });
  assert.deepEqual(progress["freelancer-2"], {
    profileCompleted: false,
    portfolioStatus: "NOT_STARTED",
    onboardingCompleted: false,
  });
});

function user(overrides = {}) {
  return {
    id: "freelancer-1",
    role: "FREELANCER",
    assignedRole: "FREELANCER",
    tenantId: null,
    displayName: "Ankit Rathore",
    email: "ankit@example.com",
    phone: "9993328124",
    packageId: "freelancer-starter",
    packageName: "Freelancer Starter",
    packageAudience: "FREELANCER",
    packageStatus: "ACTIVE",
    packageExpiresAt: "2026-10-01T00:00:00.000Z",
    workspaceMode: "FREELANCER",
    isSeeded: false,
    createdAt: "2026-09-01T05:26:00.000Z",
    createdByUserId: null,
    lastLoginAt: "2026-09-01T06:00:00.000Z",
    ...overrides,
  };
}

function loadRoute({ authorization, users }) {
  return load("src/app/api/super-admin/freelancers/export/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/api/require-session-role": { requireSessionRole: async () => authorization },
    "@/lib/auth/freelancer-export": freelancerExport,
    "@/lib/auth/store": { getManagedAuthUsers: async () => users },
    "@/lib/auth/managed-user-utils": managedUserUtils,
    "@/lib/gigxomi/freelancer-admin-progress": {
      getFreelancerAdminProgress: async (userIds) => Object.fromEntries(
        userIds.map((id) => [id, { profileCompleted: true, portfolioStatus: "APPROVED", onboardingCompleted: true }]),
      ),
    },
  });
}

test("freelancer audience classification excludes agencies and super admins", () => {
  assert.equal(managedUserUtils.isManagedUserInAudience(user(), "FREELANCER"), true);
  assert.equal(
    managedUserUtils.isManagedUserInAudience(
      user({ role: "ADMIN", assignedRole: "ADMIN", packageAudience: "AGENCY", workspaceMode: "AGENCY" }),
      "FREELANCER",
    ),
    false,
  );
  assert.equal(managedUserUtils.isManagedUserInAudience(user({ role: "SUPER_ADMIN" }), "FREELANCER"), false);
});

test("CSV is UTF-8, keeps phones as text, and neutralizes spreadsheet formulas", () => {
  const csv = freelancerExport.buildFreelancerExportCsv([
    user({ displayName: "=HYPERLINK(\"https://bad.test\")", email: "+cmd@example.com" }),
    user({ id: "freelancer-2", displayName: "हर्ष", phone: "", createdAt: null }),
  ]);

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /"'\=HYPERLINK\(""https:\/\/bad\.test""\)"/);
  assert.match(csv, /"'\+cmd@example\.com"/);
  assert.match(csv, /"'\+91 99933 28124"/);
  assert.match(csv, /"हर्ष"/);
  assert.match(csv, /"Not provided"/);
  assert.match(csv, /"Not set"/);
  assert.match(csv, /"Profile status","Portfolio status","Onboarding status"/);
});

test("export endpoint propagates authentication and authorization failures", async () => {
  const request = () => new Request("https://www.gigxomi.com/api/super-admin/freelancers/export", {
    method: "POST",
    body: JSON.stringify({ scope: "all" }),
  });
  const unauthenticated = loadRoute({
    authorization: { ok: false, response: Response.json({ error: "Authentication required." }, { status: 401 }) },
    users: [],
  });
  const forbidden = loadRoute({
    authorization: { ok: false, response: Response.json({ error: "Forbidden." }, { status: 403 }) },
    users: [],
  });

  assert.equal((await unauthenticated.POST(request())).status, 401);
  assert.equal((await forbidden.POST(request())).status, 403);
});

test("all and visible exports re-filter requested IDs against authoritative freelancers", async () => {
  const freelancer = user();
  const secondFreelancer = user({ id: "freelancer-2", displayName: "Neha Editor", email: "neha@example.com" });
  const agency = user({
    id: "agency-1",
    role: "ADMIN",
    assignedRole: "ADMIN",
    displayName: "Private Agency",
    packageAudience: "AGENCY",
    workspaceMode: "AGENCY",
  });
  const superAdmin = user({ id: "owner", role: "SUPER_ADMIN", displayName: "Platform Owner" });
  const route = loadRoute({
    authorization: { ok: true, session: { role: "SUPER_ADMIN" } },
    users: [freelancer, secondFreelancer, agency, superAdmin],
  });

  const allResponse = await route.POST(new Request("https://www.gigxomi.com/api/super-admin/freelancers/export", {
    method: "POST",
    body: JSON.stringify({ scope: "all" }),
  }));
  const allCsv = await allResponse.text();
  assert.equal(allResponse.status, 200);
  assert.match(allResponse.headers.get("content-disposition"), /gigxomi-freelancers-\d{4}-\d{2}-\d{2}\.csv/);
  assert.match(allCsv, /Ankit Rathore/);
  assert.match(allCsv, /Neha Editor/);
  assert.doesNotMatch(allCsv, /Private Agency|Platform Owner/);

  const visibleResponse = await route.POST(new Request("https://www.gigxomi.com/api/super-admin/freelancers/export", {
    method: "POST",
    body: JSON.stringify({ scope: "visible", userIds: [secondFreelancer.id, agency.id, superAdmin.id] }),
  }));
  const visibleCsv = await visibleResponse.text();
  assert.match(visibleCsv, /Neha Editor/);
  assert.doesNotMatch(visibleCsv, /Ankit Rathore|Private Agency|Platform Owner/);
  assert.match(visibleCsv, /"COMPLETE","APPROVED","COMPLETE"/);
});

function loadImpersonationRoute({ authorization, users, sessionToken = "super-admin-session" }) {
  const calls = { session: null, impersonation: null };
  const route = load("src/app/api/super-admin/users/[id]/impersonate/route.ts", {
    "next/headers": { cookies: async () => ({ get: () => ({ value: sessionToken }) }) },
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/api/require-session-role": { requireSessionRole: async () => authorization },
    "@/lib/auth/impersonation": {
      IMPERSONATION_TTL_MS: 60_000,
      applyImpersonationCookies: (_response, input) => { calls.impersonation = input; },
    },
    "@/lib/auth/session": {
      SESSION_COOKIE_NAME: "gx_session",
      applySessionCookie: async (_response, input) => { calls.session = input; },
    },
    "@/lib/auth/store": { getManagedAuthUsers: async () => users },
    "@/lib/auth/managed-user-utils": managedUserUtils,
  });
  return { route, calls };
}

test("super admin can securely enter an active freelancer dashboard and return to its list", async () => {
  const freelancer = user();
  const { route, calls } = loadImpersonationRoute({
    authorization: { ok: true, session: { userId: "owner", role: "SUPER_ADMIN" } },
    users: [freelancer],
  });
  const response = await route.POST(new Request("https://www.gigxomi.com"), {
    params: Promise.resolve({ id: freelancer.id }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).redirectTo, "/freelancer");
  assert.equal(calls.session.role, "FREELANCER");
  assert.equal(calls.session.workspaceMode, "FREELANCER");
  assert.equal(calls.impersonation.targetUserId, freelancer.id);
  assert.equal(calls.impersonation.returnPath, "/super-admin/freelancers");
});

test("impersonation rejects inactive freelancers and non-workspace accounts", async () => {
  const inactive = user({ packageStatus: "PAUSED" });
  const inactiveRoute = loadImpersonationRoute({
    authorization: { ok: true, session: { userId: "owner", role: "SUPER_ADMIN" } },
    users: [inactive],
  }).route;
  const inactiveResponse = await inactiveRoute.POST(new Request("https://www.gigxomi.com"), {
    params: Promise.resolve({ id: inactive.id }),
  });
  assert.equal(inactiveResponse.status, 409);

  const owner = user({ id: "owner", role: "SUPER_ADMIN" });
  const ownerRoute = loadImpersonationRoute({
    authorization: { ok: true, session: { userId: "owner", role: "SUPER_ADMIN" } },
    users: [owner],
  }).route;
  const ownerResponse = await ownerRoute.POST(new Request("https://www.gigxomi.com"), {
    params: Promise.resolve({ id: owner.id }),
  });
  assert.equal(ownerResponse.status, 404);
});
