/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { randomBytes, scryptSync } = require("node:crypto");

const DEFAULT_WORDPRESS_API_BASE = "https://blog.gigxomi.com/wp-json";
const REQUEST_TIMEOUT_MS = 30000;

function normalizeApiBase(value) {
  const candidate = String(value || DEFAULT_WORDPRESS_API_BASE).trim().replace(/\/+$/, "");
  if (candidate.endsWith("/gigxomi/v1")) {
    return candidate.slice(0, -"/gigxomi/v1".length);
  }
  return candidate;
}

function decodeDatabaseUrl(rawUrl) {
  if (!rawUrl.startsWith("prisma+postgres://")) {
    return rawUrl;
  }

  const parsed = new URL(rawUrl);
  const apiKey = parsed.searchParams.get("api_key")?.trim();
  if (!apiKey) {
    throw new Error("DATABASE_URL is missing the Prisma Postgres api_key query parameter.");
  }

  const encodedPayload = apiKey.includes(".") ? apiKey.split(".")[1] : apiKey;
  const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (!decoded.databaseUrl?.trim()) {
    throw new Error("DATABASE_URL api_key did not include a direct databaseUrl.");
  }
  return decoded.databaseUrl.trim();
}

function buildPool(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const isSupabasePooler = parsed.hostname.includes("pooler.supabase.com");
  return new Pool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: isSupabasePooler ? { rejectUnauthorized: false } : undefined,
  });
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Gigxomi-WordPress-Migrator/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWordPressInventory(apiBase) {
  const serviceResponse = await fetchJson(`${apiBase}/gigxomi/v1/services`);
  const users = [];
  const freelancerProfiles = [];
  let page = 1;

  while (true) {
    try {
      const batch = await fetchJson(`${apiBase}/wp/v2/users?context=view&per_page=100&page=${page}`);
      users.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    } catch (error) {
      if (page > 1 && /\(400\)/.test(String(error?.message || error))) break;
      throw error;
    }
  }

  page = 1;
  while (true) {
    try {
      const batch = await fetchJson(`${apiBase}/wp/v2/freelancer?context=view&per_page=100&page=${page}`);
      freelancerProfiles.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    } catch (error) {
      if (page > 1 && /\(400\)/.test(String(error?.message || error))) break;
      throw error;
    }
  }

  return {
    services: Array.isArray(serviceResponse.items) ? serviceResponse.items : [],
    users,
    freelancerProfiles,
  };
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeJsonString(value) {
  return Array.from(String(value || ""), (character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint === 0) return "";
    if ((codePoint >= 1 && codePoint <= 8) || codePoint === 11 || codePoint === 12 || (codePoint >= 14 && codePoint <= 31)) {
      return " ";
    }
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) return "\ufffd";
    return character;
  }).join("");
}

function serializeForPostgresJson(value) {
  return JSON.stringify(value, (_key, item) => (typeof item === "string" ? sanitizeJsonString(item) : item));
}

function list(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return value ? [cleanText(value)].filter(Boolean) : [];
}

function metaText(profile, key) {
  const value = profile?.metas?.[key];
  if (Array.isArray(value)) return cleanText(value.join(", "));
  return cleanText(value);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00") && digits.length > 2) return `+${digits.slice(2)}`;
  if (digits.length <= 10) return `+91${digits}`;
  return `+${digits}`;
}

function parseMetaList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  const text = cleanText(value);
  if (!text) return [];
  return text
    .replace(/^a:\d+:\{/, "")
    .replace(/\}$/, "")
    .split(/[,\n;|]+/)
    .map(cleanText)
    .filter((item) => item && !/^s:\d+:$/i.test(item));
}

function slugify(value, fallback) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72) || fallback;
}

function reserveUnique(base, ownerKey, used, suffix) {
  const currentOwner = used.get(base);
  if (!currentOwner || currentOwner === ownerKey) {
    used.set(base, ownerKey);
    return base;
  }

  let candidate = `${base}-${suffix}`.slice(0, 80);
  let index = 2;
  while (used.has(candidate) && used.get(candidate) !== ownerKey) {
    candidate = `${base}-${suffix}-${index}`.slice(0, 80);
    index += 1;
  }
  used.set(candidate, ownerKey);
  return candidate;
}

function ownerIdForService(service) {
  return Number(service?.freelancer?.user_id || service?.freelancer?.freelancer_post_id || service.service_id);
}

function ownerName(service) {
  const freelancer = service.freelancer || {};
  return cleanText(
    freelancer.full_name ||
      freelancer.display_name ||
      [freelancer.first_name, freelancer.last_name].filter(Boolean).join(" ") ||
      freelancer.username ||
      `WordPress editor ${ownerIdForService(service)}`,
  );
}

function normalizeCategory(service) {
  const freelancer = service.freelancer || {};
  const haystack = [
    ...list(service.category),
    ...list(freelancer.category),
    service.service_title,
    service.description,
    ...(freelancer.skills || []),
  ]
    .join(" ")
    .toLowerCase();
  return /(graphic|design|thumbnail|brand|poster|cover|logo)/i.test(haystack) ? "Graphic Design" : "Video Editing";
}

function youtubeId(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || null;
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/").filter(Boolean)[1] || null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function mediaForService(service) {
  const gallery = Array.isArray(service.gallery) ? service.gallery : Object.values(service.gallery || {});
  const items = [];
  const videoUrl = String(service.video_url || "").trim();
  const featuredImage = String(service.featured_image || "").trim();

  if (videoUrl) {
    const id = youtubeId(videoUrl);
    items.push({
      kind: id ? "YOUTUBE_VIDEO" : "FILE",
      sourceUrl: videoUrl,
      youtubeId: id,
      thumbnailUrl: featuredImage || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null),
      altText: `${cleanText(service.service_title)} sample video`,
      uploadStatus: "READY",
    });
  }
  if (featuredImage) {
    items.push({
      kind: "THUMBNAIL",
      sourceUrl: featuredImage,
      thumbnailUrl: featuredImage,
      altText: `${cleanText(service.service_title)} cover`,
      uploadStatus: "READY",
    });
  }
  for (const sourceUrl of gallery.map((item) => String(item || "").trim()).filter(Boolean)) {
    if (items.some((item) => item.sourceUrl === sourceUrl)) continue;
    items.push({
      kind: "IMAGE",
      sourceUrl,
      thumbnailUrl: sourceUrl,
      altText: `${cleanText(service.service_title)} portfolio preview`,
      uploadStatus: "READY",
    });
  }
  return items;
}

function marketplacePayload(service, ids, now) {
  const freelancer = service.freelancer || {};
  const category = normalizeCategory(service);
  const description = cleanText(service.description) || `${cleanText(service.service_title)} by ${ownerName(service)}.`;
  const tags = Array.from(
    new Set([
      ...list(service.category),
      ...list(freelancer.category),
      cleanText(freelancer.english_level),
      cleanText(freelancer.freelancer_type),
      ...(freelancer.skills || []).map(cleanText),
      category,
    ].filter(Boolean)),
  ).slice(0, 12);
  const videoUrl = String(service.video_url || "").trim();
  const videoId = youtubeId(videoUrl);
  const coverImageUrl = String(service.featured_image || "").trim() || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);
  const gallery = Array.isArray(service.gallery) ? service.gallery : Object.values(service.gallery || {});
  const media = [videoUrl, coverImageUrl, ...gallery]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 8)
    .map((sourceUrl, index) => ({
      id: `media-${service.service_id}-${index}`,
      kind: index === 0 && videoUrl ? "video" : "image",
      title: index === 0 && videoUrl ? `${cleanText(service.service_title)} sample` : `${cleanText(service.service_title)} preview ${index + 1}`,
      accent: "linear-gradient(135deg, rgba(210, 255, 31, 0.14), rgba(11, 18, 26, 0.96))",
      sourceUrl,
      embedUrl: index === 0 && videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
    }));
  const deliverables = Array.from(
    new Set([
      ...(service.addons || []).map(cleanText),
      ...(service.price_packages || []).flatMap((entry) => Object.values(entry || {}).filter((value) => typeof value === "string").map(cleanText)),
    ].filter(Boolean)),
  ).slice(0, 12);
  const faq = [...(service.faq || []), ...(freelancer.faq || [])]
    .map((entry) => ({ question: cleanText(entry?.question), answer: cleanText(entry?.answer) }))
    .filter((entry) => entry.question && entry.answer)
    .slice(0, 12);

  return {
    id: ids.serviceId,
    slug: ids.slug,
    ownerId: ids.userId,
    ownerName: ownerName(service),
    ownerAlias: cleanText(freelancer.username) || ownerName(service),
    title: cleanText(service.service_title),
    summary: description.slice(0, 170),
    category,
    specialty: cleanText(freelancer.title || service.service_title || category),
    description,
    targetAudience: cleanText(freelancer.freelancer_type || freelancer.description || `${category} clients`),
    deliveryTime: cleanText(service.delivery_time || "3 Days"),
    revisions: "2 revisions",
    basePrice: Number(service.price) > 0 ? Number(service.price) : 2500,
    currency: "INR",
    tags,
    seoTitle: cleanText(service.service_title),
    seoDescription: description.slice(0, 155),
    seoKeywords: tags.slice(0, 8),
    deliverables: deliverables.length ? deliverables : ["Edited master export", "Platform-ready deliverable", "Gigxomi review support"],
    faq: faq.length ? faq : [
      { question: "What should I share before the project starts?", answer: "Share your footage, references, brand notes, and deadline before production begins." },
    ],
    media,
    status: "Approved",
    listingEnabled: true,
    availability: "ACTIVE",
    reviewNote: "Migrated from the verified legacy Gigxomi WordPress catalog.",
    createdAt: now,
    updatedAt: now,
    publicHref: service.service_url || null,
    coverImageUrl,
    sampleVideoUrl: videoUrl || null,
    sampleThumbnailUrl: coverImageUrl,
    wordpressSource: service,
  };
}

async function migrate(prisma, inventory, pool) {
  const { services, users: publicUsers, freelancerProfiles } = inventory;
  const serviceOwners = new Map();
  for (const service of services) {
    const wpUserId = ownerIdForService(service);
    if (!serviceOwners.has(wpUserId)) serviceOwners.set(wpUserId, service.freelancer || {});
  }

  const allUsers = new Map(
    publicUsers.map((user) => [Number(user.id), { id: Number(user.id), name: user.name, slug: user.slug }]),
  );
  for (const [id, freelancer] of serviceOwners) {
    if (!allUsers.has(id)) {
      allUsers.set(id, {
        id,
        name: freelancer.full_name || freelancer.display_name || freelancer.username,
        slug: freelancer.username || `wordpress-editor-${id}`,
      });
    }
  }

  const existingUsers = await prisma.user.findMany({ select: { id: true, username: true, wordpressUserId: true } });
  const usedUsernames = new Map(existingUsers.map((user) => [user.username, String(user.wordpressUserId || user.id)]));
  const userIdByWordPressId = new Map();
  let usersCreated = 0;
  let usersUpdated = 0;

  for (const sourceUser of [...allUsers.values()].sort((left, right) => left.id - right.id)) {
    const owner = serviceOwners.get(sourceUser.id);
    const ownerKey = String(sourceUser.id);
    const existing = existingUsers.find((user) => user.wordpressUserId === sourceUser.id);
    const baseUsername = slugify(owner?.username || sourceUser.slug || sourceUser.name, `wordpress-user-${sourceUser.id}`);
    const username = existing?.username || reserveUnique(baseUsername, ownerKey, usedUsernames, `wp-${sourceUser.id}`);
    const displayName = cleanText(
      owner?.full_name || owner?.display_name || [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || sourceUser.name || username,
    );
    const record = await prisma.user.upsert({
      where: { wordpressUserId: sourceUser.id },
      create: {
        id: `wp-user-${sourceUser.id}`,
        username,
        displayName,
        authProvider: "wordpress-profile",
        wordpressUserId: sourceUser.id,
        role: "EDITOR",
        onboardingStatus: owner ? "VERIFIED" : "DRAFT",
      },
      update: {
        displayName,
        authProvider: "wordpress-profile",
        role: "EDITOR",
        onboardingStatus: owner ? "VERIFIED" : "DRAFT",
      },
    });
    userIdByWordPressId.set(sourceUser.id, record.id);
    if (existing) usersUpdated += 1;
    else usersCreated += 1;
  }

  const existingAuthUsers = await prisma.appAuthUser.findMany();
  const authById = new Map(existingAuthUsers.map((user) => [user.id, user]));
  const authByEmail = new Map(existingAuthUsers.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]));
  const authByPhone = new Map(existingAuthUsers.map((user) => [user.phone, user]));
  const appAuthIdByPostId = new Map();
  let authUsersCreated = 0;
  let authUsersReused = 0;
  let workspacesCreated = 0;
  let workspacesPreserved = 0;

  for (const profile of [...freelancerProfiles].sort((left, right) => Number(left.id) - Number(right.id))) {
    const postId = Number(profile.id);
    const email = normalizeEmail(metaText(profile, "_freelancer_email"));
    const realPhone = normalizePhone(metaText(profile, "_freelancer_phone"));
    const placeholderPhone = `wordpress-unclaimed-${postId}`;
    const deterministicId = `wp-auth-${postId}`;
    const displayName = cleanText(
      [metaText(profile, "_freelancer_firstname"), metaText(profile, "_freelancer_lastname")].filter(Boolean).join(" ") ||
        profile?.title?.rendered ||
        `WordPress freelancer ${postId}`,
    );
    let authUser =
      authById.get(deterministicId) ||
      (email ? authByEmail.get(email) : null) ||
      (realPhone ? authByPhone.get(realPhone) : null);

    if (!authUser) {
      const passwordSalt = randomBytes(16).toString("hex");
      const passwordHash = scryptSync(randomBytes(32).toString("hex"), passwordSalt, 64).toString("hex");
      authUser = await prisma.appAuthUser.create({
        data: {
          id: deterministicId,
          role: "FREELANCER",
          assignedRole: "FREELANCER",
          tenantId: "tenant-gigxomi",
          displayName,
          email,
          phone: realPhone || placeholderPhone,
          loginPhoneAliases: realPhone ? [realPhone] : [],
          packageId: null,
          packageName: null,
          packageAudience: null,
          packageStatus: null,
          packageExpiresAt: null,
          workspaceMode: "FREELANCER",
          passwordSalt,
          passwordHash,
          otpCode: String(Math.floor(100000 + Math.random() * 900000)),
          permissions: ["freelancer"],
          isSeeded: false,
        },
      });
      authUsersCreated += 1;
      authById.set(authUser.id, authUser);
      if (authUser.email) authByEmail.set(authUser.email.toLowerCase(), authUser);
      authByPhone.set(authUser.phone, authUser);
    } else {
      authUsersReused += 1;
    }
    appAuthIdByPostId.set(postId, authUser.id);

    const firstService = services.find((service) => Number(service?.freelancer?.freelancer_post_id) === postId);
    const freelancer = firstService?.freelancer || {};
    const profileImageUrl = String(freelancer.featured_image || "").trim();
    const sourcePhone = realPhone || "";
    const workspaceProfile = {
      fullName: displayName,
      displayName,
      phone: sourcePhone,
      profession: cleanText(freelancer.title || profile?.title?.rendered || "Video editor"),
      languages: [],
      englishLevel: cleanText(freelancer.english_level),
      bio: cleanText(freelancer.description || profile?.content?.rendered),
      email: email || "",
      profileImageUrl,
      skills: Array.isArray(freelancer.skills) ? freelancer.skills.map(cleanText).filter(Boolean) : parseMetaList(profile?.metas?._freelancer_skill),
      categories: list(freelancer.category),
      experience: Array.isArray(freelancer.experience)
        ? freelancer.experience.map(cleanText).filter(Boolean).join("\n")
        : parseMetaList(profile?.metas?._freelancer_experience).join("\n"),
      portfolioLinks: [],
      availability: "Available for Gigxomi projects",
      pricing: firstService?.price ? `From INR ${firstService.price}` : "",
      preferredWorkType: cleanText(freelancer.freelancer_type),
      location: cleanText(profile?.location),
      timezone: "Asia/Kolkata",
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
      wordpressSource: profile,
    };
    const existingWorkspace = await prisma.appFreelancerWorkspace.findUnique({ where: { userId: authUser.id } });
    if (!existingWorkspace) {
      await prisma.appFreelancerWorkspace.create({
        data: {
          userId: authUser.id,
          profile: workspaceProfile,
          verification: {
            documentType: "aadhaar",
            documentNumber: "",
            address: "",
            status: "NOT_SUBMITTED",
            reviewRule: "Legacy profile imported; identity verification is still required.",
            submittedAt: null,
            updatedAt: null,
          },
          paymentDetails: {
            bankAccountName: displayName,
            bankAccountNumber: "",
            bankIfsc: "",
            upiId: "",
            monetizationPlan: "STANDARD_COMMISSION",
            commissionRule: "30% commission",
            updatedAt: null,
          },
          payoutRequests: [],
        },
      });
      workspacesCreated += 1;
    } else {
      workspacesPreserved += 1;
    }
  }

  const existingServices = await prisma.service.findMany({ select: { id: true, slug: true, wordpressServiceId: true } });
  const existingAppServices = await prisma.appFreelancerService.findMany({ select: { id: true, slug: true } });
  const usedServiceSlugs = new Map(existingServices.map((service) => [service.slug, String(service.wordpressServiceId || service.id)]));
  const usedAppSlugs = new Map(existingAppServices.map((service) => [service.slug, service.id]));
  let editorProfilesCreated = 0;
  let editorProfilesUpdated = 0;
  let servicesCreated = 0;
  let servicesUpdated = 0;
  let mediaImported = 0;

  for (const [wpUserId, freelancer] of serviceOwners) {
    const userId = userIdByWordPressId.get(wpUserId);
    const firstService = services.find((service) => ownerIdForService(service) === wpUserId);
    const existingProfile = await prisma.editorProfile.findUnique({ where: { userId } });
    await prisma.editorProfile.upsert({
      where: { userId },
      create: {
        id: `wp-editor-${wpUserId}`,
        userId,
        wordpressServiceId: firstService?.service_id || null,
        title: cleanText(freelancer.title),
        bio: cleanText(freelancer.description),
        category: list(freelancer.category).join(", "),
        deliveryTime: cleanText(firstService?.delivery_time),
        startingPrice: Number(firstService?.price) > 0 ? Number(firstService.price) : null,
        avatarUrl: String(freelancer.featured_image || "").trim() || null,
        verificationStatus: "VERIFIED",
      },
      update: {
        wordpressServiceId: firstService?.service_id || null,
        title: cleanText(freelancer.title),
        bio: cleanText(freelancer.description),
        category: list(freelancer.category).join(", "),
        deliveryTime: cleanText(firstService?.delivery_time),
        startingPrice: Number(firstService?.price) > 0 ? Number(firstService.price) : null,
        avatarUrl: String(freelancer.featured_image || "").trim() || null,
        verificationStatus: "VERIFIED",
      },
    });
    if (existingProfile) editorProfilesUpdated += 1;
    else editorProfilesCreated += 1;
  }

  const profiles = await prisma.editorProfile.findMany({
    where: { userId: { in: [...userIdByWordPressId.values()] } },
    select: { id: true, userId: true },
  });
  const profileIdByUserId = new Map(profiles.map((profile) => [profile.userId, profile.id]));
  const now = new Date().toISOString();

  for (const service of services) {
    const wordpressServiceId = Number(service.service_id);
    const wpUserId = ownerIdForService(service);
    const userId = userIdByWordPressId.get(wpUserId);
    const editorProfileId = profileIdByUserId.get(userId);
    const existing = existingServices.find((item) => item.wordpressServiceId === wordpressServiceId);
    const baseSlug = slugify(service.service_slug || service.service_title, `wordpress-service-${wordpressServiceId}`);
    const slug = existing?.slug || reserveUnique(baseSlug, String(wordpressServiceId), usedServiceSlugs, `wp-${wordpressServiceId}`);
    const title = cleanText(service.service_title) || `WordPress service ${wordpressServiceId}`;
    const description = cleanText(service.description);
    const category = normalizeCategory(service);
    const media = mediaForService(service);

    const record = await prisma.service.upsert({
      where: { wordpressServiceId },
      create: {
        id: `wp-service-${wordpressServiceId}`,
        editorProfileId,
        wordpressServiceId,
        title,
        slug,
        description,
        category,
        priceType: cleanText(service.price_type),
        price: Number(service.price) > 0 ? Number(service.price) : null,
        deliveryTime: cleanText(service.delivery_time),
        sourceUrl: String(service.service_url || "").trim() || null,
        sourceSystem: "wordpress",
        isActive: true,
        status: "APPROVED",
        seoTitle: title,
        seoDescription: description.slice(0, 155),
        seoSummary: description.slice(0, 170),
      },
      update: {
        editorProfileId,
        title,
        description,
        category,
        priceType: cleanText(service.price_type),
        price: Number(service.price) > 0 ? Number(service.price) : null,
        deliveryTime: cleanText(service.delivery_time),
        sourceUrl: String(service.service_url || "").trim() || null,
        sourceSystem: "wordpress",
        isActive: true,
        status: "APPROVED",
        seoTitle: title,
        seoDescription: description.slice(0, 155),
        seoSummary: description.slice(0, 170),
      },
    });
    await prisma.mediaAsset.deleteMany({ where: { serviceId: record.id } });
    if (media.length) {
      await prisma.mediaAsset.createMany({ data: media.map((item) => ({ ...item, serviceId: record.id })) });
      mediaImported += media.length;
    }
    if (existing) servicesUpdated += 1;
    else servicesCreated += 1;

    const appId = `wp-service-${wordpressServiceId}`;
    const existingApp = existingAppServices.find((item) => item.id === appId);
    const appSlug = existingApp?.slug || reserveUnique(baseSlug, appId, usedAppSlugs, `wp-${wordpressServiceId}`);
    const appOwnerId = appAuthIdByPostId.get(Number(service?.freelancer?.freelancer_post_id)) || userId;
    const payload = JSON.parse(JSON.stringify(marketplacePayload(service, { serviceId: appId, slug: appSlug, userId: appOwnerId }, now)));
    const payloadBase64 = Buffer.from(serializeForPostgresJson(payload), "utf8").toString("base64");
    try {
      await pool.query(
        `INSERT INTO "AppFreelancerService"
          ("id", "slug", "ownerId", "ownerName", "ownerAlias", "status", "payload", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, convert_from(decode($7, 'base64'), 'UTF8')::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO UPDATE SET
           "slug" = EXCLUDED."slug",
           "ownerId" = EXCLUDED."ownerId",
           "ownerName" = EXCLUDED."ownerName",
           "ownerAlias" = EXCLUDED."ownerAlias",
           "status" = EXCLUDED."status",
           "payload" = EXCLUDED."payload",
           "updatedAt" = CURRENT_TIMESTAMP`,
        [
          appId,
          appSlug,
          appOwnerId,
          payload.ownerName,
          payload.ownerAlias,
          "Approved",
          payloadBase64,
        ],
      );
    } catch (error) {
      const detail = error && typeof error === "object" && "detail" in error ? ` (${error.detail})` : "";
      throw new Error(`Catalog mirror import failed for WordPress service ${wordpressServiceId}: ${error?.message || error}${detail}`);
    }
  }

  const incomingServiceIds = services.map((service) => Number(service.service_id));
  if (incomingServiceIds.length) {
    await prisma.service.updateMany({
      where: {
        sourceSystem: "wordpress",
        wordpressServiceId: { not: null, notIn: incomingServiceIds },
      },
      data: { isActive: false, status: "PAUSED" },
    });
  }

  return {
    wordpressUsers: allUsers.size,
    serviceOwners: serviceOwners.size,
    wordpressServices: services.length,
    usersCreated,
    usersUpdated,
    authUsersCreated,
    authUsersReused,
    workspacesCreated,
    workspacesPreserved,
    editorProfilesCreated,
    editorProfilesUpdated,
    servicesCreated,
    servicesUpdated,
    mediaImported,
    catalogMirrorUpserts: services.length,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const apiBase = normalizeApiBase(process.env.GIGXOMI_WORDPRESS_API_BASE);
  const inventory = await fetchWordPressInventory(apiBase);
  const serviceOwnerCount = new Set(inventory.services.map(ownerIdForService)).size;

  if (!apply) {
    console.log(JSON.stringify({
      mode: "dry-run",
      wordpressUsers: inventory.users.length,
      freelancerProfiles: inventory.freelancerProfiles.length,
      profilesWithEmail: inventory.freelancerProfiles.filter((profile) => normalizeEmail(metaText(profile, "_freelancer_email"))).length,
      profilesWithPhone: inventory.freelancerProfiles.filter((profile) => normalizePhone(metaText(profile, "_freelancer_phone"))).length,
      serviceOwners: serviceOwnerCount,
      services: inventory.services.length,
      servicesWithVideo: inventory.services.filter((service) => String(service.video_url || "").trim()).length,
      servicesWithFeaturedImage: inventory.services.filter((service) => String(service.featured_image || "").trim()).length,
    }, null, 2));
    return;
  }

  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) {
    throw new Error("DATABASE_URL is required when --apply is used.");
  }
  const pool = buildPool(decodeDatabaseUrl(rawDatabaseUrl));
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const result = await migrate(prisma, inventory, pool);
    console.log(JSON.stringify({ mode: "applied", ...result }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("WordPress marketplace migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
