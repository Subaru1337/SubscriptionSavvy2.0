import { differenceInDays, startOfDay, isToday, isTomorrow } from "date-fns";

export type PaymentStatusLabel =
  | "Overdue"
  | "Due Today"
  | "Due Tomorrow"
  | "Due This Week"
  | "Upcoming";

export interface PaymentStatus {
  label: PaymentStatusLabel;
  color: string;
  badgeClass: string;
}

export function getPaymentStatus(nextPayment: Date | string): PaymentStatus {
  const date = typeof nextPayment === "string" ? new Date(nextPayment) : nextPayment;
  const today = startOfDay(new Date());
  const paymentDate = startOfDay(date);
  const daysUntil = differenceInDays(paymentDate, today);

  if (daysUntil < 0) {
    return {
      label: "Overdue",
      color: "#E05C5C",
      badgeClass: "badge-overdue",
    };
  }

  if (isToday(paymentDate) || daysUntil === 0) {
    return {
      label: "Due Today",
      color: "#E05C5C",
      badgeClass: "badge-due-today",
    };
  }

  if (isTomorrow(paymentDate) || daysUntil === 1) {
    return {
      label: "Due Tomorrow",
      color: "#0D7377",
      badgeClass: "badge-due-tomorrow",
    };
  }

  if (daysUntil <= 7) {
    return {
      label: "Due This Week",
      color: "#14A085",
      badgeClass: "badge-due-week",
    };
  }

  return {
    label: "Upcoming",
    color: "#2ECC7A",
    badgeClass: "badge-upcoming",
  };
}

export function getStatusDotColor(nextPayment: Date | string): string {
  const status = getPaymentStatus(nextPayment);
  return status.color;
}
