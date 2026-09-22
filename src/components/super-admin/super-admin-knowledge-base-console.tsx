"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BookOpen, Clock3, ExternalLink, FileText, Layers3, Plus, RefreshCcw, Save, Trash2, Video } from "lucide-react";

import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticleStatus,
  KnowledgeBaseCategory,
  KnowledgeBaseMedia,
  KnowledgeBaseRole,
} from "@/lib/gigxomi/knowledge-base-store";

import styles from "./super-admin-knowledge-base-console.module.css";

type ConsolePayload = {
  ok?: boolean;
  error?: string;
  article?: KnowledgeBaseArticle;
  category?: KnowledgeBaseCategory;
  articles?: KnowledgeBaseArticle[];
  categories?: KnowledgeBaseCategory[];
  media?: KnowledgeBaseMedia[];
};

type ArticleFormState = {
  id: string;
  role: KnowledgeBaseRole;
  categoryId: string;
  slug: string;
  title: string;
  summary: string;
  intro: string;
  bodyBlocksText: string;
  stepsText: string;
  notesText: string;
  faqsText: string;
  relatedText: string;
  tagsText: string;
  filtersText: string;
  mediaIds: string[];
  videoUrl: string;
  videoTitle: string;
  seoTitle: string;
  seoDescription: string;
  status: KnowledgeBaseArticleStatus;
  botTrainingEnabled: boolean;
  popular: boolean;
  topSearched: boolean;
};

type CategoryFormState = {
  id: string;
  role: KnowledgeBaseRole;
  slug: string;
  title: string;
  description: string;
  iconKey: string;
  sortOrder: string;
};

type StatusState = {
  tone: "success" | "error";
  message: string;
} | null;

const roleOptions: KnowledgeBaseRole[] = ["FREELANCER", "AGENCY", "PLATFORM"];
const statusOptions: KnowledgeBaseArticleStatus[] = ["DRAFT", "PUBLISHED"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function joinPairs(items: Array<{ title: string; body: string }>) {
  return items.map((item) => `${item.title} | ${item.body}`).join("\n");
}

function joinFaqs(items: Array<{ question: string; answer: string }>) {
  return items.map((item) => `${item.question} | ${item.answer}`).join("\n");
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCsv(value: string[]) {
  return value.join(", ");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePairs(value: string) {
  return splitLines(value).map((line) => {
    const [title = "", ...bodyParts] = line.split("|");
    const body = bodyParts.join("|").trim();
    return {
      title: title.trim(),
      body: body || title.trim(),
    };
  });
}

function parseFaqs(value: string) {
  return splitLines(value).map((line) => {
    const [question = "", ...answerParts] = line.split("|");
    return {
      question: question.trim(),
      answer: answerParts.join("|").trim() || question.trim(),
    };
  });
}

function getDefaultArticleForm(categories: KnowledgeBaseCategory[]): ArticleFormState {
  return {
    id: "",
    role: "FREELANCER",
    categoryId: categories.find((category) => category.role === "FREELANCER")?.id ?? "",
    slug: "",
    title: "",
    summary: "",
    intro: "",
    bodyBlocksText: "",
    stepsText: "",
    notesText: "",
    faqsText: "",
    relatedText: "",
    tagsText: "getting-started",
    filtersText: "Freelancer",
    mediaIds: [],
    videoUrl: "",
    videoTitle: "",
    seoTitle: "",
    seoDescription: "",
    status: "DRAFT",
    botTrainingEnabled: true,
    popular: false,
    topSearched: false,
  };
}

function articleToForm(article: KnowledgeBaseArticle | null, categories: KnowledgeBaseCategory[]): ArticleFormState {
  if (!article) {
    return getDefaultArticleForm(categories);
  }

  return {
    id: article.id,
    role: article.role,
    categoryId: article.categoryId ?? "",
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    intro: article.intro,
    bodyBlocksText: joinPairs(article.bodyBlocks),
    stepsText: joinPairs(article.steps),
    notesText: article.importantNotes.join("\n"),
    faqsText: joinFaqs(article.faqs),
    relatedText: joinCsv(article.relatedSlugs),
    tagsText: joinCsv(article.tags),
    filtersText: joinCsv(article.filterGroups),
    mediaIds: article.mediaIds,
    videoUrl: article.videoUrl ?? "",
    videoTitle: article.videoTitle ?? "",
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    status: article.status,
    botTrainingEnabled: article.botTrainingEnabled,
    popular: article.popular,
    topSearched: article.topSearched,
  };
}

function getDefaultCategoryForm(): CategoryFormState {
  return {
    id: "",
    role: "FREELANCER",
    slug: "",
    title: "",
    description: "",
    iconKey: "book",
    sortOrder: "100",
  };
}

function categoryToForm(category: KnowledgeBaseCategory | null): CategoryFormState {
  if (!category) {
    return getDefaultCategoryForm();
  }

  return {
    id: category.id,
    role: category.role,
    slug: category.slug,
    title: category.title,
    description: category.description,
    iconKey: category.iconKey,
    sortOrder: String(category.sortOrder),
  };
}

export function SuperAdminKnowledgeBaseConsole({
  initialArticles,
  initialCategories,
  initialMedia,
}: {
  initialArticles: KnowledgeBaseArticle[];
  initialCategories: KnowledgeBaseCategory[];
  initialMedia: KnowledgeBaseMedia[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [categories, setCategories] = useState(initialCategories);
  const [media, setMedia] = useState(initialMedia);
  const [selectedArticleId, setSelectedArticleId] = useState(initialArticles[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [articleForm, setArticleForm] = useState<ArticleFormState>(() => articleToForm(initialArticles[0] ?? null, initialCategories));
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(() => categoryToForm(initialCategories[0] ?? null));
  const [status, setStatus] = useState<StatusState>(null);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const videoCount = articles.filter((article) => article.videoUrl).length;
  const botTrainingCount = articles.filter((article) => article.botTrainingEnabled && article.status === "PUBLISHED").length;
  const roleFilteredCategories = categories.filter((category) => category.role === articleForm.role || category.role === "PLATFORM");
  const readingMinutesPreview = useMemo(() => {
    const words = [
      articleForm.title,
      articleForm.summary,
      articleForm.intro,
      articleForm.bodyBlocksText,
      articleForm.stepsText,
      articleForm.notesText,
      articleForm.faqsText,
    ]
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 190));
  }, [articleForm]);

  function updateArticleForm(patch: Partial<ArticleFormState>) {
    setArticleForm((current) => ({ ...current, ...patch }));
  }

  function updateCategoryForm(patch: Partial<CategoryFormState>) {
    setCategoryForm((current) => ({ ...current, ...patch }));
  }

  async function refreshConsole() {
    setIsRefreshing(true);
    setStatus(null);

    const response = await fetch("/api/super-admin/knowledge-base", {
      cache: "no-store",
      credentials: "include",
    });
    const payload = (await response.json().catch(() => ({}))) as ConsolePayload;

    if (!response.ok || payload.ok === false) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to refresh knowledge base content." });
      setIsRefreshing(false);
      return;
    }

    const nextArticles = payload.articles ?? [];
    const nextCategories = payload.categories ?? [];
    setArticles(nextArticles);
    setCategories(nextCategories);
    setMedia(payload.media ?? []);
    const selectedArticle = nextArticles.find((article) => article.id === selectedArticleId) ?? nextArticles[0] ?? null;
    const selectedCategory = nextCategories.find((category) => category.id === selectedCategoryId) ?? nextCategories[0] ?? null;
    setSelectedArticleId(selectedArticle?.id ?? "");
    setSelectedCategoryId(selectedCategory?.id ?? "");
    setArticleForm(articleToForm(selectedArticle, nextCategories));
    setCategoryForm(categoryToForm(selectedCategory));
    setStatus({ tone: "success", message: "Knowledge base content refreshed from Postgres." });
    setIsRefreshing(false);
  }

  function selectArticle(article: KnowledgeBaseArticle) {
    setSelectedArticleId(article.id);
    setArticleForm(articleToForm(article, categories));
    setStatus(null);
  }

  function selectCategory(category: KnowledgeBaseCategory) {
    setSelectedCategoryId(category.id);
    setCategoryForm(categoryToForm(category));
    setStatus(null);
  }

  function startNewArticle() {
    setSelectedArticleId("");
    setArticleForm(getDefaultArticleForm(categories));
    setStatus(null);
  }

  function startNewCategory() {
    setSelectedCategoryId("");
    setCategoryForm(getDefaultCategoryForm());
    setStatus(null);
  }

  async function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingArticle(true);
    setStatus(null);

    const payload = {
      id: articleForm.id || undefined,
      role: articleForm.role,
      categoryId: articleForm.categoryId || null,
      slug: articleForm.slug || slugify(articleForm.title),
      title: articleForm.title,
      summary: articleForm.summary,
      intro: articleForm.intro,
      bodyBlocks: parsePairs(articleForm.bodyBlocksText),
      steps: parsePairs(articleForm.stepsText),
      importantNotes: splitLines(articleForm.notesText),
      faqs: parseFaqs(articleForm.faqsText),
      relatedSlugs: splitCsv(articleForm.relatedText),
      tags: splitCsv(articleForm.tagsText),
      filterGroups: splitCsv(articleForm.filtersText),
      mediaIds: articleForm.mediaIds,
      videoUrl: articleForm.videoUrl.trim() || null,
      videoTitle: articleForm.videoTitle.trim() || null,
      seoTitle: articleForm.seoTitle || articleForm.title,
      seoDescription: articleForm.seoDescription || articleForm.summary,
      status: articleForm.status,
      botTrainingEnabled: articleForm.botTrainingEnabled,
      popular: articleForm.popular,
      topSearched: articleForm.topSearched,
    };

    const endpoint = articleForm.id ? `/api/super-admin/knowledge-base/${encodeURIComponent(articleForm.id)}` : "/api/super-admin/knowledge-base";
    const response = await fetch(endpoint, {
      method: articleForm.id ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => ({}))) as ConsolePayload;

    if (!response.ok || result.ok === false || !result.article) {
      setStatus({ tone: "error", message: result.error ?? "Unable to save this article." });
      setIsSavingArticle(false);
      return;
    }

    setArticles((current) => {
      const exists = current.some((article) => article.id === result.article?.id);
      return exists ? current.map((article) => (article.id === result.article?.id ? result.article : article)) : [result.article!, ...current];
    });
    setSelectedArticleId(result.article.id);
    setArticleForm(articleToForm(result.article, categories));
    setStatus({ tone: "success", message: `"${result.article.title}" saved. Public pages and the support bot will use it when published.` });
    setIsSavingArticle(false);
  }

  async function deleteArticle() {
    if (!articleForm.id || !window.confirm("Delete this knowledge base article?")) {
      return;
    }

    const response = await fetch(`/api/super-admin/knowledge-base/${encodeURIComponent(articleForm.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = (await response.json().catch(() => ({}))) as ConsolePayload;
    if (!response.ok || payload.ok === false) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to delete article." });
      return;
    }

    const nextArticles = articles.filter((article) => article.id !== articleForm.id);
    setArticles(nextArticles);
    setSelectedArticleId(nextArticles[0]?.id ?? "");
    setArticleForm(articleToForm(nextArticles[0] ?? null, categories));
    setStatus({ tone: "success", message: "Article deleted." });
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingCategory(true);
    setStatus(null);

    const payload = {
      id: categoryForm.id || undefined,
      role: categoryForm.role,
      slug: categoryForm.slug || slugify(categoryForm.title),
      title: categoryForm.title,
      description: categoryForm.description,
      iconKey: categoryForm.iconKey,
      sortOrder: Number(categoryForm.sortOrder) || 100,
    };

    const endpoint = categoryForm.id
      ? `/api/super-admin/knowledge-base/categories/${encodeURIComponent(categoryForm.id)}`
      : "/api/super-admin/knowledge-base/categories";
    const response = await fetch(endpoint, {
      method: categoryForm.id ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => ({}))) as ConsolePayload;

    if (!response.ok || result.ok === false || !result.category) {
      setStatus({ tone: "error", message: result.error ?? "Unable to save category." });
      setIsSavingCategory(false);
      return;
    }

    setCategories((current) => {
      const exists = current.some((category) => category.id === result.category?.id);
      return exists ? current.map((category) => (category.id === result.category?.id ? result.category : category)) : [...current, result.category!];
    });
    setSelectedCategoryId(result.category.id);
    setCategoryForm(categoryToForm(result.category));
    setStatus({ tone: "success", message: `"${result.category.title}" category saved.` });
    setIsSavingCategory(false);
  }

  async function deleteCategory() {
    if (!categoryForm.id || !window.confirm("Delete this category? Existing articles will keep working without a category.")) {
      return;
    }

    const response = await fetch(`/api/super-admin/knowledge-base/categories/${encodeURIComponent(categoryForm.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = (await response.json().catch(() => ({}))) as ConsolePayload;
    if (!response.ok || payload.ok === false) {
      setStatus({ tone: "error", message: payload.error ?? "Unable to delete category." });
      return;
    }

    const nextCategories = categories.filter((category) => category.id !== categoryForm.id);
    setCategories(nextCategories);
    setSelectedCategoryId(nextCategories[0]?.id ?? "");
    setCategoryForm(categoryToForm(nextCategories[0] ?? null));
    setStatus({ tone: "success", message: "Category deleted." });
  }

  return (
    <div className={`dashboard-shell compact ${styles.console}`}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Support CMS</span>
        <h2>Edit Gigxomi help articles, visual tutorials, videos, SEO fields, and bot-training content from one super-admin workspace.</h2>
        <p>
          Published articles power the public Knowledge Base, canonical article URLs, sitemap, llms.txt export, and the bottom-right support bot. Drafts stay
          private for internal editing.
        </p>
        <div className={styles.heroActions}>
          <button className={styles.primary} onClick={startNewArticle} type="button">
            <Plus size={15} />
            New article
          </button>
          <button className={styles.secondary} disabled={isRefreshing} onClick={refreshConsole} type="button">
            <RefreshCcw size={15} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <a className={styles.secondary} href="/knowledge-base" rel="noreferrer" target="_blank">
            <ExternalLink size={15} />
            Public KB
          </a>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="Knowledge base metrics">
        <article className={styles.metric}>
          <span>Total articles</span>
          <strong>{articles.length}</strong>
        </article>
        <article className={styles.metric}>
          <span>Published</span>
          <strong>{publishedCount}</strong>
        </article>
        <article className={styles.metric}>
          <span>Video guides</span>
          <strong>{videoCount}</strong>
        </article>
        <article className={styles.metric}>
          <span>Bot training</span>
          <strong>{botTrainingCount}</strong>
        </article>
      </section>

      {status ? <p className={`${styles.status} ${status.tone === "success" ? styles.statusSuccess : styles.statusError}`}>{status.message}</p> : null}

      <section className={styles.workspace}>
        <div className={styles.sideColumn}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Articles</span>
                <strong>{articles.length} docs</strong>
              </div>
              <button className={styles.secondary} onClick={startNewArticle} type="button">
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className={styles.list}>
              {articles.map((article) => (
                <button
                  className={`${styles.listButton} ${article.id === selectedArticleId ? styles.selected : ""}`}
                  key={article.id}
                  onClick={() => selectArticle(article)}
                  type="button"
                >
                  <strong>{article.title}</strong>
                  <span className={styles.muted}>{article.summary}</span>
                  <span className={styles.listMeta}>
                    <span className={`${styles.badge} ${article.status === "PUBLISHED" ? styles.badgeStrong : ""}`}>{article.status}</span>
                    <span className={styles.badge}>{article.role}</span>
                    <span className={styles.badge}>{article.readingMinutes} min</span>
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Categories</span>
                <strong>{categories.length} groups</strong>
              </div>
              <button className={styles.secondary} onClick={startNewCategory} type="button">
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className={styles.list}>
              {categories.map((category) => (
                <button
                  className={`${styles.listButton} ${category.id === selectedCategoryId ? styles.selected : ""}`}
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  type="button"
                >
                  <strong>{category.title}</strong>
                  <span className={styles.muted}>{category.description}</span>
                  <span className={styles.listMeta}>
                    <span className={styles.badge}>{category.role}</span>
                    <span className={styles.badge}>{category.iconKey}</span>
                  </span>
                </button>
              ))}
            </div>
          </article>
        </div>

        <div className={styles.mainColumn}>
          <form className={styles.card} onSubmit={saveArticle}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Article editor</span>
                <strong>{articleForm.id ? "Edit article" : "Create article"}</strong>
              </div>
              <div className={styles.pillRow}>
                <span className={styles.badge}>
                  <Clock3 size={13} />
                  {readingMinutesPreview} min read
                </span>
                <span className={styles.badge}>
                  <BookOpen size={13} />
                  {articleForm.role}
                </span>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Role</span>
                <select
                  className={styles.select}
                  value={articleForm.role}
                  onChange={(event) => {
                    const role = event.target.value as KnowledgeBaseRole;
                    const firstCategory = categories.find((category) => category.role === role || category.role === "PLATFORM");
                    updateArticleForm({ role, categoryId: firstCategory?.id ?? "" });
                  }}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Category</span>
                <select className={styles.select} value={articleForm.categoryId} onChange={(event) => updateArticleForm({ categoryId: event.target.value })}>
                  <option value="">No category</option>
                  {roleFilteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  required
                  value={articleForm.title}
                  onChange={(event) => updateArticleForm({ title: event.target.value, slug: articleForm.slug || slugify(event.target.value) })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>SEO slug</span>
                <input className={styles.input} required value={articleForm.slug} onChange={(event) => updateArticleForm({ slug: slugify(event.target.value) })} />
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Summary</span>
                <textarea className={styles.textarea} required value={articleForm.summary} onChange={(event) => updateArticleForm({ summary: event.target.value })} />
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Intro</span>
                <textarea className={styles.textarea} value={articleForm.intro} onChange={(event) => updateArticleForm({ intro: event.target.value })} />
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Body blocks, one per line as Heading | Body</span>
                <textarea
                  className={`${styles.textarea} ${styles.textareaTall}`}
                  value={articleForm.bodyBlocksText}
                  onChange={(event) => updateArticleForm({ bodyBlocksText: event.target.value })}
                />
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Steps, one per line as Step title | Instruction</span>
                <textarea
                  className={`${styles.textarea} ${styles.textareaTall}`}
                  value={articleForm.stepsText}
                  onChange={(event) => updateArticleForm({ stepsText: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Important notes, one per line</span>
                <textarea className={styles.textarea} value={articleForm.notesText} onChange={(event) => updateArticleForm({ notesText: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>FAQs, one per line as Question | Answer</span>
                <textarea className={styles.textarea} value={articleForm.faqsText} onChange={(event) => updateArticleForm({ faqsText: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Tags</span>
                <input className={styles.input} value={articleForm.tagsText} onChange={(event) => updateArticleForm({ tagsText: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Search filters</span>
                <input className={styles.input} value={articleForm.filtersText} onChange={(event) => updateArticleForm({ filtersText: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Related slugs</span>
                <input className={styles.input} value={articleForm.relatedText} onChange={(event) => updateArticleForm({ relatedText: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <select className={styles.select} value={articleForm.status} onChange={(event) => updateArticleForm({ status: event.target.value as KnowledgeBaseArticleStatus })}>
                  {statusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Video URL</span>
                <input className={styles.input} placeholder="https://youtube.com/..." value={articleForm.videoUrl} onChange={(event) => updateArticleForm({ videoUrl: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Video title</span>
                <input className={styles.input} value={articleForm.videoTitle} onChange={(event) => updateArticleForm({ videoTitle: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>SEO title</span>
                <input className={styles.input} value={articleForm.seoTitle} onChange={(event) => updateArticleForm({ seoTitle: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>SEO description</span>
                <textarea className={styles.textarea} value={articleForm.seoDescription} onChange={(event) => updateArticleForm({ seoDescription: event.target.value })} />
              </label>

              <div className={`${styles.checkRow} ${styles.fieldFull}`}>
                <label className={styles.checkField}>
                  <input checked={articleForm.botTrainingEnabled} onChange={(event) => updateArticleForm({ botTrainingEnabled: event.target.checked })} type="checkbox" />
                  Include in bot training
                </label>
                <label className={styles.checkField}>
                  <input checked={articleForm.popular} onChange={(event) => updateArticleForm({ popular: event.target.checked })} type="checkbox" />
                  Popular article
                </label>
                <label className={styles.checkField}>
                  <input checked={articleForm.topSearched} onChange={(event) => updateArticleForm({ topSearched: event.target.checked })} type="checkbox" />
                  Top searched
                </label>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Screenshots and media</span>
                <div className={styles.mediaGrid}>
                  {media.map((item) => (
                    <label className={styles.mediaOption} key={item.id}>
                      <input
                        checked={articleForm.mediaIds.includes(item.id)}
                        onChange={(event) => {
                          updateArticleForm({
                            mediaIds: event.target.checked ? [...articleForm.mediaIds, item.id] : articleForm.mediaIds.filter((mediaId) => mediaId !== item.id),
                          });
                        }}
                        type="checkbox"
                      />
                      <Image alt="" height={72} src={item.thumbnailUrl ?? item.url} width={112} />
                      <span>
                        <strong>{item.title}</strong>
                        <span className={styles.muted}>{item.kind}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.primary} disabled={isSavingArticle} type="submit">
                <Save size={15} />
                {isSavingArticle ? "Saving..." : "Save article"}
              </button>
              {articleForm.id ? (
                <>
                  <a className={styles.secondary} href={`/knowledge-base/${articleForm.role.toLowerCase()}/${articleForm.slug}`} rel="noreferrer" target="_blank">
                    <ExternalLink size={15} />
                    Preview
                  </a>
                  <button className={styles.danger} onClick={deleteArticle} type="button">
                    <Trash2 size={15} />
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </form>

          <section className={styles.previewGrid}>
            <article className={styles.previewCard}>
              <FileText size={18} />
              <strong>SEO</strong>
              <p className={styles.muted}>{articleForm.seoTitle || articleForm.title || "Title preview will appear here."}</p>
              <p className={styles.muted}>{articleForm.seoDescription || articleForm.summary || "Meta description preview will appear here."}</p>
            </article>
            <article className={styles.previewCard}>
              <Video size={18} />
              <strong>Video section</strong>
              <p className={styles.muted}>{articleForm.videoUrl ? articleForm.videoTitle || articleForm.videoUrl : "Add an embedded video URL to show a tutorial block on the article."}</p>
            </article>
            <article className={styles.previewCard}>
              <Layers3 size={18} />
              <strong>Bot context</strong>
              <p className={styles.muted}>
                {articleForm.botTrainingEnabled ? "This article can be used for support-bot answers after publishing." : "This article stays visible but excluded from bot training."}
              </p>
            </article>
          </section>

          <form className={styles.card} onSubmit={saveCategory}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Category editor</span>
                <strong>{categoryForm.id ? "Edit category" : "Create category"}</strong>
              </div>
              <button className={styles.secondary} onClick={startNewCategory} type="button">
                <Plus size={14} />
                New category
              </button>
            </div>
            <div className={styles.categoryGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Role</span>
                <select className={styles.select} value={categoryForm.role} onChange={(event) => updateCategoryForm({ role: event.target.value as KnowledgeBaseRole })}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Sort order</span>
                <input className={styles.input} inputMode="numeric" value={categoryForm.sortOrder} onChange={(event) => updateCategoryForm({ sortOrder: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  required
                  value={categoryForm.title}
                  onChange={(event) => updateCategoryForm({ title: event.target.value, slug: categoryForm.slug || slugify(event.target.value) })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Slug</span>
                <input className={styles.input} required value={categoryForm.slug} onChange={(event) => updateCategoryForm({ slug: slugify(event.target.value) })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Icon key</span>
                <input className={styles.input} value={categoryForm.iconKey} onChange={(event) => updateCategoryForm({ iconKey: event.target.value })} />
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>Description</span>
                <textarea className={styles.textarea} value={categoryForm.description} onChange={(event) => updateCategoryForm({ description: event.target.value })} />
              </label>
            </div>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={isSavingCategory} type="submit">
                <Save size={15} />
                {isSavingCategory ? "Saving..." : "Save category"}
              </button>
              {categoryForm.id ? (
                <button className={styles.danger} onClick={deleteCategory} type="button">
                  <Trash2 size={15} />
                  Delete category
                </button>
              ) : null}
            </div>
          </form>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Media library</span>
                <strong>{media.length} reusable visual assets</strong>
              </div>
            </div>
            <div className={styles.mediaGrid}>
              {media.map((item) => (
                <article className={styles.mediaOption} key={item.id}>
                  <span className={styles.badge}>{item.kind}</span>
                  <Image alt={item.alt} height={72} src={item.thumbnailUrl ?? item.url} width={112} />
                  <span>
                    <strong>{item.title}</strong>
                    <span className={styles.muted}>{item.url}</span>
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
