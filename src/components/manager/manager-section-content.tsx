"use client";

import { useState } from "react";

import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { ContactsTable, ManagerCustomerPrivacyPanel } from "@/components/crm/crm-dummy-controls";
import { DeliveryReviewWorkspace } from "@/components/delivery/delivery-review-workspace";
import { PortfolioDraftWorkspace } from "@/components/delivery/portfolio-draft-workspace";
import { ManagerServiceReviewBoard } from "@/components/manager/manager-dummy-controls";
import { StatusPill, SurfaceCard } from "@/components/ui/dashboard-primitives";
import { SectionTabs } from "@/components/ui/product-system";
import { managerDashboardSnapshots } from "@/lib/gigxomi/business-ecosystem-data";

const managerSnapshot = managerDashboardSnapshots["tenant-gigxomi"];

const verificationQueue = [
  { title: "Testing Freelancer", status: "Pending ID review", note: "Profile is strong, but identity and payout method still need approval." },
  { title: "Jayanta Kundu", status: "Awaiting invite acceptance", note: "Trusted fit for podcast lanes once team membership becomes active." },
  { title: "Umesh Nagori", status: "Verified", note: "Ready for thumbnail and poster assignments with low dispute risk." },
];

export function ManagerChatSection() {
  return (
    <ChatWorkspace
      audience="manager"
      listLabel="Assigned threads"
      listTitle="Managers can monitor and reroute every conversation."
      mode="inbox"
    />
  );
}

export function ManagerContactsSection() {
  return (
    <>
      <ManagerCustomerPrivacyPanel />
      <ContactsTable audience="manager" />
    </>
  );
}

function ManagerReviewCards({
  eyebrow,
  cards,
}: {
  eyebrow: string;
  cards: Array<{ title: string; status: string; note: string }>;
}) {
  return (
    <SurfaceCard>
      <p className="section-label">{eyebrow}</p>
      <div className="board-list">
        {cards.map((item) => (
          <article className="lead-row" key={item.title}>
            <div className="status-row">
              <StatusPill>{item.status}</StatusPill>
            </div>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}

export function ManagerReviewQueueSection() {
  const [activeTab, setActiveTab] = useState<"services" | "verification" | "quotes" | "delivery" | "portfolio">("services");

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Review queue</p>
      <h2 className="section-heading">Manager review work now lives in one queue: services, verification, quotes, delivery approvals, and portfolio publishing checks.</h2>
      <SectionTabs
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as "services" | "verification" | "quotes" | "delivery" | "portfolio")}
        tabs={[
          { id: "services", label: "Services" },
          { id: "verification", label: "Verification", count: verificationQueue.length },
          { id: "quotes", label: "Quotes", count: managerSnapshot.quoteBoard.length },
          { id: "delivery", label: "Delivery" },
          { id: "portfolio", label: "Portfolio" },
        ]}
      />
      {activeTab === "services" ? <ManagerServiceReviewBoard /> : null}
      {activeTab === "verification" ? (
        <div className="board-list">
          {verificationQueue.map((item) => (
            <article className="lead-row" key={item.title}>
              <div className="status-row">
                <StatusPill>{item.status}</StatusPill>
              </div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      ) : null}
      {activeTab === "quotes" ? <ManagerReviewCards eyebrow="Quote review" cards={managerSnapshot.quoteBoard.map((item) => ({ title: item.title, status: item.stage, note: item.note }))} /> : null}
      {activeTab === "delivery" ? <DeliveryReviewWorkspace audience="manager" detailHrefBase="/manager/delivery-review" portfolioHrefBase="/manager/portfolio-review" /> : null}
      {activeTab === "portfolio" ? <PortfolioDraftWorkspace audience="manager" /> : null}
    </div>
  );
}
