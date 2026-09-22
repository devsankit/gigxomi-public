import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("Learning Studio persists playlists, chapters, lessons, and dynamic package access", async () => {
  const [schema, migration, route] = await Promise.all([
    source("prisma/schema.prisma"),
    source("prisma/migrations/20260826181500_learning_playlists_chapters_entitlements/migration.sql"),
    source("src/app/api/super-admin/lms/route.ts"),
  ]);
  assert.match(schema, /model LearningChapterPackageAccess/);
  assert.match(schema, /model LearningWatchSession/);
  assert.match(schema, /model LearningWatchEvent/);
  assert.match(migration, /LearningChapterPackageAccess/);
  assert.match(route, /saveConnectedLmsChapter/);
  assert.match(route, /packageIds: strings\(body\.packageIds\)/);
  assert.match(route, /deleteConnectedLmsEntity/);
  assert.match(route, /getConnectedLmsAnalytics/);
});

test("Locked chapter previews never expose their video identifiers or URLs", async () => {
  const service = await source("src/lib/connected-platform/lms.ts");
  assert.match(service, /youtubeVideoId: unlocked \? lesson\.youtubeVideoId : null/);
  assert.match(service, /videoUrl: unlocked \? lesson\.videoUrl : null/);
  assert.match(service, /videoEmbedUrl: unlocked \? lesson\.videoEmbedUrl : null/);
  assert.match(service, /requiredPackages/);
  assert.match(service, /activePackageForUser/);
});

test("Watch tracking is active-time based, deduplicated, clamped, and automatic", async () => {
  const [service, progressRoute] = await Promise.all([
    source("src/lib/connected-platform/lms.ts"),
    source("src/app/api/mobile/v2/lms/progress/route.ts"),
  ]);
  assert.match(service, /learningWatchEvent\.findUnique/);
  assert.match(service, /Math\.min\(15/);
  assert.match(service, /progressPercent >= lesson\.completionThreshold/);
  assert.match(service, /LEARNING_CHAPTER_LOCKED/);
  assert.match(progressRoute, /playbackSessionId/);
  assert.match(progressRoute, /availableActions: \["REFRESH_ACCESS", "VIEW_PLANS"\]/);
  assert.match(progressRoute, /status: error\.status/);
});
