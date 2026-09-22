/* eslint-disable @typescript-eslint/no-require-imports */

const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { Pool } = require("pg");

const APPLY = process.argv.includes("--apply");
const PLACEHOLDER_EMAIL_SUFFIX = "@gigxomi.user.local";

function loadEnvironment() {
  const externallyConfigured = new Set(Object.keys(process.env));
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || externallyConfigured.has(match[1])) continue;
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function decodePrismaPostgresUrl(databaseUrl) {
  if (!databaseUrl.startsWith("prisma+postgres://")) return databaseUrl;
  const parsed = new URL(databaseUrl);
  const apiKey = parsed.searchParams.get("api_key")?.trim();
  if (!apiKey) throw new Error("DATABASE_URL is missing its Prisma Postgres api_key.");
  const encodedPayload = apiKey.includes(".") ? apiKey.split(".")[1] : apiKey;
  const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (!decoded.databaseUrl?.trim()) throw new Error("DATABASE_URL does not contain a direct database URL.");
  return decoded.databaseUrl.trim();
}

function createPool(databaseUrl) {
  const parsed = new URL(decodePrismaPostgresUrl(databaseUrl));
  return new Pool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: parsed.hostname.includes("pooler.supabase.com") ? { rejectUnauthorized: false } : undefined,
  });
}

function phoneKey(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function usableEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return email && !email.endsWith(PLACEHOLDER_EMAIL_SUFFIX) ? email : "";
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function packageTag(packageName) {
  const slug = String(packageName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `package:${slug}` : null;
}

function serviceTitle(service) {
  const payload = service.payload && typeof service.payload === "object" ? service.payload : {};
  return String(payload.title ?? payload.serviceTitle ?? payload.name ?? "").trim();
}

function registrationNote(user, serviceTitles) {
  const marker = `[Freelancer registration: ${user.id}]`;
  const details = [
    `Registered ${new Date(user.createdAt).toISOString().slice(0, 10)}`,
    user.packageName ? `package ${user.packageName}` : null,
    user.packageStatus ? `status ${user.packageStatus}` : null,
    serviceTitles.length ? `services ${serviceTitles.join(", ")}` : null,
  ].filter(Boolean);
  return `${marker} Previous registered freelancer for sales reconnection. ${details.join("; ")}.`;
}

function findByIdentity(indexes, user) {
  const stableTag = `freelancer-user:${user.id}`;
  const phone = phoneKey(user.phone);
  const email = usableEmail(user.email);
  return indexes.byUserId.get(stableTag) ?? (phone ? indexes.byPhone.get(phone) : null) ?? (email ? indexes.byEmail.get(email) : null) ?? null;
}

function indexRecord(indexes, record, userIdTag) {
  if (userIdTag) indexes.byUserId.set(userIdTag, record);
  const phone = phoneKey(record.customerPhone);
  const email = usableEmail(record.customerEmail);
  if (phone && !indexes.byPhone.has(phone)) indexes.byPhone.set(phone, record);
  if (email && !indexes.byEmail.has(email)) indexes.byEmail.set(email, record);
}

function buildIndexes(records) {
  const indexes = { byUserId: new Map(), byPhone: new Map(), byEmail: new Map() };
  for (const record of records) {
    const userIdTag = (record.tags ?? []).find((tag) => tag.startsWith("freelancer-user:"));
    indexRecord(indexes, record, userIdTag);
  }
  return indexes;
}

function pickAgent(agents, preferredAgentId) {
  const preferred = preferredAgentId ? agents.find((agent) => agent.id === preferredAgentId) : null;
  if (preferred) {
    preferred.leadCount += 1;
    return preferred;
  }
  agents.sort((left, right) => left.leadCount - right.leadCount || left.createdAt.getTime() - right.createdAt.getTime());
  const selected = agents[0];
  selected.leadCount += 1;
  return selected;
}

function mergeAssignment(assignment, user, serviceTitles) {
  const marker = `[Freelancer registration: ${user.id}]`;
  const note = registrationNote(user, serviceTitles);
  return {
    customerName: user.displayName || assignment.customerName,
    customerPhone: String(user.phone ?? "").trim() || assignment.customerPhone || null,
    customerEmail: usableEmail(user.email) || assignment.customerEmail || null,
    source: assignment.source || "freelancer_registration_reconnect",
    serviceInterest: serviceTitles.join(", ") || assignment.serviceInterest || user.packageName || "Freelancer package",
    segment: assignment.segment || "registered-freelancer",
    tags: uniqueStrings([
      ...(assignment.tags ?? []),
      "registered-freelancer",
      `freelancer-user:${user.id}`,
      packageTag(user.packageName),
    ]),
    notes: String(assignment.notes ?? "").includes(marker)
      ? assignment.notes
      : [assignment.notes, note].map((value) => String(value ?? "").trim()).filter(Boolean).join("\n\n"),
  };
}

function assignmentChanged(assignment, next) {
  return ["customerName", "customerPhone", "customerEmail", "source", "serviceInterest", "segment", "notes"]
    .some((field) => (assignment[field] ?? null) !== (next[field] ?? null)) || JSON.stringify(assignment.tags ?? []) !== JSON.stringify(next.tags);
}

async function loadData(client) {
  const usersResult = await client.query(`
    SELECT "id", "displayName", "email", "phone", "assignedRole", "packageId", "packageName",
           "packageAudience", "packageStatus", "packageExpiresAt", "workspaceMode", "createdAt"
    FROM "AppAuthUser"
    WHERE "isSeeded" = false
      AND ("assignedRole" = 'FREELANCER' OR "packageAudience" = 'FREELANCER')
    ORDER BY "createdAt" ASC
  `);
  const userIds = usersResult.rows.map((user) => user.id);
  const servicesResult = userIds.length
    ? await client.query(`SELECT "ownerId", "payload" FROM "AppFreelancerService" WHERE "ownerId" = ANY($1::text[])`, [userIds])
    : { rows: [] };
  const agentsResult = await client.query(`
    SELECT agent."id", agent."createdAt", account."displayName", COUNT(assignment."id")::int AS "leadCount"
    FROM "SalesAgentProfile" agent
    JOIN "AppAuthUser" account ON account."id" = agent."userId"
    LEFT JOIN "SalesLeadAssignment" assignment ON assignment."assignedAgentId" = agent."id"
    WHERE agent."status" = 'ACTIVE'
    GROUP BY agent."id", agent."createdAt", account."displayName"
    ORDER BY "leadCount" ASC, agent."createdAt" ASC
  `);
  const assignmentsResult = await client.query(`
    SELECT "id", "assignedAgentId", "customerName", "customerPhone", "customerEmail", "source",
           "serviceInterest", "segment", "priority", "tags", "notes"
    FROM "SalesLeadAssignment"
  `);
  const poolResult = await client.query(`
    SELECT "id", "assignedAgentId", "customerName", "customerPhone", "customerEmail", "source",
           "serviceInterest", "segment", "priority", "notes", "status"
    FROM "SalesLeadPoolItem"
    WHERE "status" = 'OPEN'
  `);
  return {
    users: usersResult.rows,
    services: servicesResult.rows,
    agents: agentsResult.rows.map((agent) => ({ ...agent, leadCount: Number(agent.leadCount), createdAt: new Date(agent.createdAt) })),
    assignments: assignmentsResult.rows,
    poolItems: poolResult.rows.map((item) => ({ ...item, tags: [] })),
  };
}

async function writeActivity(client, assignmentId, action, note, user) {
  await client.query(`
    INSERT INTO "SalesActivityLog" ("id", "assignmentId", "action", "note", "metadata", "createdAt")
    VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
  `, [
    `sales-activity-${randomUUID()}`,
    assignmentId,
    action,
    note,
    JSON.stringify({ freelancerUserId: user.id, registeredAt: user.createdAt, packageName: user.packageName, packageStatus: user.packageStatus }),
  ]);
}

async function createAssignment(client, user, serviceTitles, agent, poolItem) {
  const id = `sales-assignment-${randomUUID()}`;
  const base = {
    customerName: user.displayName,
    customerPhone: String(user.phone ?? "").trim() || null,
    customerEmail: usableEmail(user.email) || null,
    source: "freelancer_registration_reconnect",
    serviceInterest: serviceTitles.join(", ") || user.packageName || "Freelancer package",
    segment: "registered-freelancer",
    priority: poolItem?.priority || "normal",
    tags: uniqueStrings(["registered-freelancer", `freelancer-user:${user.id}`, packageTag(user.packageName)]),
    notes: registrationNote(user, serviceTitles),
  };
  await client.query(`
    INSERT INTO "SalesLeadAssignment"
      ("id", "assignedAgentId", "customerName", "customerPhone", "customerEmail", "source",
       "serviceInterest", "segment", "priority", "tags", "stage", "notes", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], 'NEW', $11, NOW(), NOW())
  `, [id, agent.id, base.customerName, base.customerPhone, base.customerEmail, base.source, base.serviceInterest, base.segment, base.priority, base.tags, base.notes]);
  await writeActivity(client, id, poolItem ? "LEAD_CLAIMED" : "LEAD_IMPORTED", `Registered freelancer assigned to ${agent.displayName} for reconnection.`, user);
  if (poolItem) {
    await client.query(`
      UPDATE "SalesLeadPoolItem"
      SET "claimedByAgentId" = $2, "convertedAssignmentId" = $3, "status" = 'CLAIMED', "claimedAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = $1
    `, [poolItem.id, agent.id, id]);
  }
  return { id, assignedAgentId: agent.id, ...base };
}

async function updateAssignment(client, assignment, next, user) {
  await client.query(`
    UPDATE "SalesLeadAssignment"
    SET "customerName" = $2, "customerPhone" = $3, "customerEmail" = $4, "source" = $5,
        "serviceInterest" = $6, "segment" = $7, "tags" = $8::text[], "notes" = $9, "updatedAt" = NOW()
    WHERE "id" = $1
  `, [assignment.id, next.customerName, next.customerPhone, next.customerEmail, next.source, next.serviceInterest, next.segment, next.tags, next.notes]);
  if (!(assignment.tags ?? []).includes(`freelancer-user:${user.id}`)) {
    await writeActivity(client, assignment.id, "LEAD_LINKED", "Existing CRM lead linked to a registered freelancer account.", user);
  }
}

async function main() {
  loadEnvironment();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  const pool = createPool(databaseUrl);
  const client = await pool.connect();
  const stats = {
    mode: APPLY ? "apply" : "dry-run",
    eligibleFreelancers: 0,
    activeSalesAgents: 0,
    existingCrmAssignments: 0,
    created: 0,
    convertedFromQueue: 0,
    updated: 0,
    unchanged: 0,
    skippedNoContact: 0,
    assignedByAgent: {},
  };

  try {
    const { users, services, agents, assignments, poolItems } = await loadData(client);
    stats.eligibleFreelancers = users.length;
    stats.activeSalesAgents = agents.length;
    stats.existingCrmAssignments = assignments.length;
    if (!agents.length && users.length) throw new Error("No active sales agents are available for CRM assignment.");

    const servicesByOwner = new Map();
    for (const service of services) {
      const title = serviceTitle(service);
      if (!title) continue;
      servicesByOwner.set(service.ownerId, uniqueStrings([...(servicesByOwner.get(service.ownerId) ?? []), title]));
    }
    const assignmentIndexes = buildIndexes(assignments);
    const poolIndexes = buildIndexes(poolItems);

    if (APPLY) await client.query("BEGIN");
    for (const user of users) {
      const phone = phoneKey(user.phone);
      const email = usableEmail(user.email);
      if (!phone && !email) {
        stats.skippedNoContact += 1;
        continue;
      }
      const serviceTitles = servicesByOwner.get(user.id) ?? [];
      const existing = findByIdentity(assignmentIndexes, user);
      if (existing) {
        const next = mergeAssignment(existing, user, serviceTitles);
        if (!assignmentChanged(existing, next)) {
          stats.unchanged += 1;
          continue;
        }
        stats.updated += 1;
        if (APPLY) {
          await updateAssignment(client, existing, next, user);
          Object.assign(existing, next);
          indexRecord(assignmentIndexes, existing, `freelancer-user:${user.id}`);
        }
        continue;
      }

      const poolItem = findByIdentity(poolIndexes, user);
      const agent = pickAgent(agents, poolItem?.assignedAgentId);
      stats.assignedByAgent[agent.displayName] = (stats.assignedByAgent[agent.displayName] ?? 0) + 1;
      if (poolItem) stats.convertedFromQueue += 1;
      else stats.created += 1;
      if (APPLY) {
        const created = await createAssignment(client, user, serviceTitles, agent, poolItem);
        indexRecord(assignmentIndexes, created, `freelancer-user:${user.id}`);
      }
    }
    if (APPLY) await client.query("COMMIT");

    const verificationResult = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE "tags" @> ARRAY['registered-freelancer']::text[])::int AS "freelancerAssignments",
        COUNT(*) FILTER (
          WHERE "tags" @> ARRAY['registered-freelancer']::text[]
            AND (NULLIF(BTRIM("customerPhone"), '') IS NOT NULL OR NULLIF(BTRIM("customerEmail"), '') IS NOT NULL)
        )::int AS "contactableFreelancerAssignments"
      FROM "SalesLeadAssignment"
    `);
    const duplicateResult = await client.query(`
      SELECT COUNT(*)::int AS "duplicateUserTags"
      FROM (
        SELECT tag
        FROM "SalesLeadAssignment", LATERAL UNNEST("tags") AS tag
        WHERE tag LIKE 'freelancer-user:%'
        GROUP BY tag
        HAVING COUNT(*) > 1
      ) duplicates
    `);
    const distributionResult = await client.query(`
      SELECT account."displayName", COUNT(assignment."id")::int AS "freelancerAssignments"
      FROM "SalesLeadAssignment" assignment
      JOIN "SalesAgentProfile" agent ON agent."id" = assignment."assignedAgentId"
      JOIN "AppAuthUser" account ON account."id" = agent."userId"
      WHERE assignment."tags" @> ARRAY['registered-freelancer']::text[]
      GROUP BY account."displayName"
      ORDER BY account."displayName"
    `);
    stats.verification = {
      freelancerAssignments: verificationResult.rows[0].freelancerAssignments,
      contactableFreelancerAssignments: verificationResult.rows[0].contactableFreelancerAssignments,
      duplicateUserTags: duplicateResult.rows[0].duplicateUserTags,
      crmDistribution: distributionResult.rows,
    };
    console.log(JSON.stringify(stats, null, 2));
    if (!APPLY) console.log("Dry run only. Re-run with --apply to write CRM assignments.");
  } catch (error) {
    if (APPLY) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
