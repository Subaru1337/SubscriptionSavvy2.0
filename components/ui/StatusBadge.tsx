"use client";

import { getPaymentStatus } from "@/lib/payment-status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  nextPayment: Date | string;
  className?: string;
}

export function StatusBadge({ nextPayment, className }: StatusBadgeProps) {
  const status = getPaymentStatus(nextPayment);
  return (
    <span className={cn("badge", status.badgeClass, className)}>
      {status.label}
    </span>
  );
}

interface SubscriptionStatusBadgeProps {
  status: string;
  className?: string;
}

export function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const cls =
    status === "active"
      ? "badge-upcoming"
      : status === "paused"
      ? "badge-paused"
      : "badge-cancelled";

  return (
    <span className={cn("badge", cls, className)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface TrialBadgeProps {
  trialEndsOn: Date | string;
  className?: string;
}

export function TrialBadge({ trialEndsOn, className }: TrialBadgeProps) {
  return (
    <span className={cn("badge badge-trial", className)}>
      Trial
    </span>
  );
}
