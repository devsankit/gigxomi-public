import { unstable_cache } from "next/cache";
import sanitizeHtml from "sanitize-html";

const WORDPRESS_ORIGIN = "https://blog.gigxomi.com";
const WORDPRESS_API_BASE = `${WORDPRESS_ORIGIN}/wp-json/wp/v2`;
const EDITORIAL_CATEGORY_SLUG = "gigxomi-editorial";
const GROWTH_GUIDE_CATEGORY_SLUG = "video-editor-client-growth";
const WORDPRESS_REVALIDATE_SECONDS = 300;
const WORDPRESS_TIMEOUT_MS = 15_000;

type WordPressRendered = {
  protected?: boolean;
  rendered?: string;
};

type WordPressCategory = {
  id: number;
  slug: string;
};

type WordPressMedia = {
  alt_text?: string;
  source_url?: string;
};

type WordPressPost = {
  _embedded?: {
    "wp:featuredmedia"?: WordPressMedia[];
  };
  categories?: number[];
  content?: WordPressRendered;
  date_gmt?: string;
  excerpt?: WordPressRendered;
  featured_media?: number;
  id: number;
  modified_gmt?: string;
  slug: string;
  status: string;
  title?: WordPressRendered;
  yoast_head_json?: {
    title?: string;
    description?: string;
    robots?: {
      index?: string;
    };
  };
};

export type WordPressEditorialPost = {
  authorName: "Gigxomi Editorial";
  contentKind: "comparison" | "growth-guide";
  contentHtml: string;
  excerpt: string;
  featuredImageAlt: string;
  featuredImageUrl: string | null;
  id: number;
  modifiedAt: string;
  publishedAt: string;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
};

function getWordPressApiBase() {
  const configured = process.env.GIGXOMI_WORDPRESS_EDITORIAL_API_BASE?.trim();
  if (!configured) return WORDPRESS_API_BASE;
  return configured.replace(/\/$/, "");
}

async function fetchJsonPage<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WORDPRESS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Gigxomi-Editorial-Bridge/1.0",
      },
      next: { revalidate: WORDPRESS_REVALIDATE_SECONDS },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`WordPress editorial request failed with HTTP ${response.status}.`);
    }

    const totalPages = Number(response.headers.get("x-wp-totalpages") || "1");
    if (!Number.isInteger(totalPages) || totalPages < 0 || totalPages > 50) throw new Error("Invalid WordPress pagination.");
    return { data: await response.json() as T, totalPages };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  return (await fetchJsonPage<T>(url)).data;
}

function plainText(value = "") {
  return sanitizeHtml(value, { allowedAttributes: {}, allowedTags: [] })
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWordPressUrls(value: string) {
  return value
    .replace(/http:\/\/blog\.gigxomi\.com\/wp-content\/uploads\//gi, `${WORDPRESS_ORIGIN}/wp-content/uploads/`)
    .replace(/https?:\/\/blog\.gigxomi\.com\/(?!wp-content\/uploads\/)([^"'\s<]*)/gi, (_match, path: string) => {
      const normalizedPath = path.replace(/^\/+|\/+$/g, "");
      return normalizedPath ? `https://www.gigxomi.com/blog/${normalizedPath}` : "https://www.gigxomi.com/blog";
    })
    .replace(/https?:\/\/(?:ankit\.gigxomi\.com|www\.gigxomi\.com\/webinar|gigxomi\.com\/webinar)[^"'\s<]*/gi, "https://app.gigxomi.com/signup")
    .replace(/https?:\/\/gigxomi\.com\//gi, "https://www.gigxomi.com/");
}

export function sanitizeWordPressEditorialHtml(value = "") {
  return sanitizeHtml(normalizeWordPressUrls(value), {
    allowedAttributes: {
      a: ["href", "rel", "target", "title"],
      blockquote: ["cite"],
      img: ["alt", "height", "loading", "src", "title", "width"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "code",
      "em",
      "figcaption",
      "figure",
      "h2",
      "h3",
      "h4",
      "hr",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "strong",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "ul",
    ],
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attributes) => {
        let href = attributes.href || "";
        if (/webinar|ankit\.gigxomi\.com/i.test(href)) {
          href = "https://app.gigxomi.com/signup";
        }
        const isSignup = /^https:\/\/app\.gigxomi\.com\/signup/i.test(href);
        const external = /^https?:\/\//i.test(href) && !/^https:\/\/www\.gigxomi\.com(?:\/|$)/i.test(href);
        const nextAttributes: Record<string, string> = { ...attributes, href };
        if (isSignup) {
          nextAttributes.rel = "nofollow";
          nextAttributes.target = "_blank";
        } else if (!external) {
          delete nextAttributes.rel;
          delete nextAttributes.target;
        } else {
          nextAttributes.rel = "noopener noreferrer";
          nextAttributes.target = "_blank";
        }
        return {
          tagName: "a",
          attribs: nextAttributes,
        };
      },
      img: (_tagName, attributes) => ({
        tagName: "img",
        attribs: {
          ...attributes,
          loading: "lazy",
        },
      }),
    },
  });
}

function isoDate(value: string | undefined) {
  const parsed = value ? new Date(`${value.replace(/Z$/, "")}Z`) : new Date(Number.NaN);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : "";
}

function mapPost(post: WordPressPost, growthGuideCategoryId: number | null): WordPressEditorialPost | null {
  const publishedAt = isoDate(post.date_gmt);
  const modifiedAt = isoDate(post.modified_gmt) || publishedAt;
  const hasContentField = post.content !== undefined;
  const rawContentHtml = hasContentField ? sanitizeWordPressEditorialHtml(post.content?.rendered) : "";
  const contentHtml = rawContentHtml
    .replace(/Reserve your webinar seat/gi, "Start Free with Google")
    .replace(/Join the (?:business )?webinar/gi, "Start Free with Google")
    .replace(/agency growth webinar/gi, "Gigxomi agency platform")
    .replace(
      /Join the Gigxomi webinar for a practical walkthrough of client acquisition, pricing, project delivery, and agency growth\./gi,
      "Create your video editing agency workspace on Gigxomi. Manage freelance editors, review workflows, protect clients with anti-poaching, and retain 100% of your earnings with 0% platform commission."
    )
    .replace(/Turn the strategy into a working client pipeline/gi, "Scale Your Video Editing Agency With Zero Chaos");

  const title = plainText(post.title?.rendered);
  const excerpt = plainText(post.excerpt?.rendered)
    .replace(/webinar/gi, "agency platform")
    .slice(0, 320);
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const mediaUrl = media?.source_url ? normalizeWordPressUrls(media.source_url) : "";
  const isGrowthGuide = Boolean(growthGuideCategoryId && post.categories?.includes(growthGuideCategoryId));

  if (
    post.status !== "publish" ||
    post.content?.protected ||
    !post.slug ||
    !title ||
    (hasContentField && !contentHtml) ||
    !publishedAt ||
    new Date(publishedAt).getTime() > Date.now() ||
    post.yoast_head_json?.robots?.index === "noindex"
  ) {
    return null;
  }

  return {
    authorName: "Gigxomi Editorial",
    contentKind: isGrowthGuide ? "growth-guide" : "comparison",
    contentHtml,
    excerpt:
      excerpt ||
      (isGrowthGuide
        ? `${title} — a practical Gigxomi guide for video editing businesses.`
        : `${title} — an independently verified Gigxomi buyer guide.`),
    featuredImageAlt:
      plainText(media?.alt_text) || (isGrowthGuide ? `${title} practical guide` : `${title} comparison guide`),
    featuredImageUrl: /^https:\/\//i.test(mediaUrl) ? mediaUrl : null,
    id: post.id,
    modifiedAt,
    publishedAt,
    slug: post.slug,
    title,
    seoTitle: plainText(post.yoast_head_json?.title) || title,
    seoDescription: plainText(post.yoast_head_json?.description) || excerpt || title,
  };
}

async function fetchWordPressEditorialPostsFresh(): Promise<WordPressEditorialPost[]> {
  try {
    const apiBase = getWordPressApiBase();
    const growthGuideCategories = await fetchJson<WordPressCategory[]>(
      `${apiBase}/categories?slug=${encodeURIComponent(GROWTH_GUIDE_CATEGORY_SLUG)}&per_page=1&_fields=id,slug`,
    ).catch(() => []);
    const growthGuideCategory = growthGuideCategories.find((item) => item.slug === GROWTH_GUIDE_CATEGORY_SLUG);

    const query = new URLSearchParams({
      _embed: "wp:featuredmedia",
      _fields: "id,slug,status,date_gmt,modified_gmt,title,excerpt,categories,featured_media,yoast_head_json,_embedded",
      order: "desc",
      orderby: "date",
      per_page: "100",
      status: "publish",
    });
    const first = await fetchJsonPage<WordPressPost[]>(`${apiBase}/posts?${query}`);
    const posts = [...first.data];
    for (let page = 2; page <= first.totalPages; page += 1) {
      query.set("page", String(page));
      posts.push(...await fetchJson<WordPressPost[]>(`${apiBase}/posts?${query}`));
    }

    return posts
      .map((post) => mapPost(post, growthGuideCategory?.id ?? null))
      .filter((post): post is WordPressEditorialPost => Boolean(post));
  } catch (error) {
    console.warn("WordPress editorial content is temporarily unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export const listWordPressEditorialPosts = unstable_cache(
  fetchWordPressEditorialPostsFresh,
  ["gigxomi-wordpress-editorial-posts-v6"],
  { revalidate: WORDPRESS_REVALIDATE_SECONDS },
);

async function fetchSingleWordPressPost(slug: string): Promise<WordPressEditorialPost | null> {
  try {
    const apiBase = getWordPressApiBase();
    const growthGuideCategories = await fetchJson<WordPressCategory[]>(
      `${apiBase}/categories?slug=${encodeURIComponent(GROWTH_GUIDE_CATEGORY_SLUG)}&per_page=1&_fields=id,slug`,
    ).catch(() => []);
    const growthGuideCategory = growthGuideCategories.find((item) => item.slug === GROWTH_GUIDE_CATEGORY_SLUG);

    const query = new URLSearchParams({
      slug: slug.trim(),
      _embed: "wp:featuredmedia",
      _fields: "id,slug,status,date_gmt,modified_gmt,title,excerpt,content,categories,featured_media,yoast_head_json,_embedded",
      status: "publish",
    });
    const posts = await fetchJson<WordPressPost[]>(`${apiBase}/posts?${query}`).catch(() => []);
    if (!posts || posts.length === 0) return null;
    return mapPost(posts[0], growthGuideCategory?.id ?? null);
  } catch (error) {
    console.warn(`WordPress post fetch failed for slug "${slug}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

const getCachedSingleWordPressPost = unstable_cache(
  fetchSingleWordPressPost,
  ["gigxomi-wp-single-post-v6"],
  { revalidate: WORDPRESS_REVALIDATE_SECONDS },
);

export async function getWordPressEditorialPost(slug: string): Promise<WordPressEditorialPost | null> {
  if (!slug?.trim()) return null;
  return getCachedSingleWordPressPost(slug.trim());
}

export const wordpressEditorialCategorySlug = EDITORIAL_CATEGORY_SLUG;
export const wordpressGrowthGuideCategorySlug = GROWTH_GUIDE_CATEGORY_SLUG;
