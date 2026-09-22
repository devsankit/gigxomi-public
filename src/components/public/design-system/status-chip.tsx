import React from "react";

export type StatusChipVariant =
  | "new"
  | "inbound"
  | "assigned"
  | "waiting"
  | "quote_sent"
  | "payment_pending"
  | "in_progress"
  | "review"
  | "delivered"
  | "active";

type StatusChipProps = {
  children?: React.ReactNode;
  variant?: StatusChipVariant;
  className?: string;
  count?: number;
};

export function StatusChip({
  children,
  variant = "active",
  className = "",
  count,
}: StatusChipProps) {
  const variantMap: Record<StatusChipVariant, { label: string; modifierClass: string }> = {
    new: { label: "New", modifierClass: "is-new" },
    inbound: { label: "Inbound", modifierClass: "is-inbound" },
    assigned: { label: "Assigned", modifierClass: "is-assigned" },
    waiting: { label: "Waiting", modifierClass: "is-waiting" },
    quote_sent: { label: "Quote Sent", modifierClass: "is-quote-sent" },
    payment_pending: { label: "Payment Pending", modifierClass: "is-pending" },
    in_progress: { label: "In Progress", modifierClass: "is-in-progress" },
    review: { label: "Review", modifierClass: "is-review" },
    delivered: { label: "Delivered", modifierClass: "is-delivered" },
    active: { label: "Active", modifierClass: "is-active" },
  };

  const current = variantMap[variant];

  return (
    <span className={`gx-status-chip ${current.modifierClass} ${className}`.trim()}>
      <span>{children ?? current.label}</span>
      {count !== undefined && <span className="gx-status-chip-count">({count})</span>}
    </span>
  );
}
