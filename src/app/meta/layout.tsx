import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../globals.css";

import { noIndexMetadata } from "@/lib/seo/no-index";

export const metadata: Metadata = noIndexMetadata;

export default function MetaLayout({ children }: { children: ReactNode }) {
  return children;
}
