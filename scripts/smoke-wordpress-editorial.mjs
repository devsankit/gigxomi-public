import assert from "node:assert/strict";

import { wordpressDates } from "./editorial-content-lib.mjs";

if (!process.argv.includes("--apply")) {
  console.log("Dry run only. Pass --apply with server-only WordPress credentials to run the temporary CMS state test.");
  process.exit(0);
}

const origin = (process.env.WORDPRESS_URL || "https://blog.gigxomi.com").replace(/\/$/, "");
const apiBase = `${origin}/wp-json/wp/v2`;
const username = process.env.WORDPRESS_USERNAME?.trim();
const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD?.replace(/\s+/g, "");
assert(username && applicationPassword, "Server-only WordPress credentials are required.");
const authorization = `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString("base64")}`;

async function request(endpoint, { authenticated = true, ...options } = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(authenticated ? { Authorization: authorization } : {}),
      "User-Agent": "Gigxomi-Editorial-State-Smoke/1.0",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`WordPress state test failed with HTTP ${response.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const categories = await request("/categories?slug=gigxomi-editorial&context=edit&per_page=1");
assert(categories[0]?.id, "The gigxomi-editorial category must exist before the state test.");
const categoryId = categories[0].id;
const runId = Date.now().toString(36);
const createdIds = [];

async function createStatePost(state, extra = {}) {
  const slug = `gigxomi-editorial-state-${state}-${runId}`;
  const post = await request("/posts", {
    method: "POST",
    body: JSON.stringify({
      title: `Gigxomi editorial ${state} state test`,
      content: `<p>Temporary automated ${state} state verification.</p>`,
      excerpt: "Temporary CMS state verification.",
      slug,
      status: state,
      categories: [categoryId],
      ...extra,
    }),
  });
  createdIds.push(post.id);
  return { id: post.id, slug };
}

try {
  const draft = await createStatePost("draft");
  const futureAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const future = await createStatePost("future", wordpressDates(futureAt));
  const published = await createStatePost("publish");

  const [draftPublic, futurePublic, publishedPublic] = await Promise.all([
    request(`/posts?slug=${draft.slug}&status=publish&_fields=id,slug,status`, { authenticated: false }),
    request(`/posts?slug=${future.slug}&status=publish&_fields=id,slug,status`, { authenticated: false }),
    request(`/posts?slug=${published.slug}&status=publish&_fields=id,slug,status`, { authenticated: false }),
  ]);

  assert.equal(draftPublic.length, 0, "A draft leaked through the public WordPress API.");
  assert.equal(futurePublic.length, 0, "A future post leaked through the public WordPress API.");
  assert.equal(publishedPublic[0]?.id, published.id, "A published post was not visible through the public WordPress API.");
  console.log("WordPress draft, future, and published state verification passed.");
} finally {
  const results = await Promise.allSettled(
    createdIds.map((id) => request(`/posts/${id}?force=true`, { method: "DELETE" })),
  );
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) throw new Error(`Could not remove ${failures.length} temporary WordPress state-test post(s).`);
  console.log(`Removed ${createdIds.length} temporary WordPress state-test posts.`);
}
