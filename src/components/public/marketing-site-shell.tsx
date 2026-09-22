import type { ReactNode } from "react";

import { MarketingSiteFooter } from "@/components/public/marketing-site-footer";
import { IntentConversionPanel } from "@/components/public/conversion-panel";
import { DemoModal } from "@/components/public/demo-modal";

export function MarketingSiteShell({
  children,
  hideFooterCta = false,
}: {
  children: ReactNode;
  hideFooterCta?: boolean;
}) {
  return (
    <>
      {children}
      <MarketingSiteFooter hideCta={hideFooterCta} />
      <IntentConversionPanel />
      <DemoModal />
    </>
  );
}
