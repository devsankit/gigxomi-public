import { notFound, redirect } from "next/navigation";

import { getKnowledgeBaseArticleBySlug } from "@/lib/gigxomi/knowledge-base-store";

type LegacyKnowledgeBaseRouteProps = {
  params: Promise<{
    role: string;
  }>;
};

const legacyRedirects: Record<string, string> = {
  "long-form-video-editing-services": "/knowledge-base/agency/post-work",
  "short-form-video-editing-services": "/knowledge-base/freelancer/profile-setup",
  "ugc-video-editing-services": "/knowledge-base/agency/post-work",
  "video-editor-matcher": "/knowledge-base",
  "video-editing-services-for-agencies": "/knowledge-base/agency/hire-editors",
  "video-editing-services-for-creators": "/knowledge-base/freelancer/profile-setup",
};

export default async function LegacyKnowledgeBaseGuidePage({ params }: LegacyKnowledgeBaseRouteProps) {
  const { role: slug } = await params;
  const explicitRedirect = legacyRedirects[slug];
  if (explicitRedirect) {
    redirect(explicitRedirect);
  }

  const article = await getKnowledgeBaseArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  redirect(article.href);
}
