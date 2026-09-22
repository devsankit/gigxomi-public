import { buildKnowledgeBaseLlmText } from "@/lib/gigxomi/knowledge-base-store";
import { buildLlmText } from "@/lib/seo/knowledge-base-guides";

export const dynamic = "force-dynamic";

export async function GET() {
  const text = await buildKnowledgeBaseLlmText().catch(() => buildLlmText());

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
