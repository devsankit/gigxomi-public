import { redirect } from "next/navigation";

import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo/no-index";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Editor redirect",
};

function buildRedirectPath(basePath: string, searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((entry) => params.append(key, entry));
      continue;
    }

    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(buildRedirectPath("/freelancer", await searchParams));
}
