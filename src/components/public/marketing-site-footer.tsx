import React from "react";
import { PublicFooter } from "@/components/public/design-system/public-footer";

export function MarketingSiteFooter({ hideCta = false }: { hideCta?: boolean } = {}) {
  return <PublicFooter hideCta={hideCta} />;
}
