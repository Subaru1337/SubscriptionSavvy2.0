import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/currency";
import { addDays, startOfDay } from "date-fns";

// Helper re-export for getMonthlyAmount
function monthlyAmount(cost: number, billingCycle: string): number {
  return billingCycle === "yearly" ? cost / 12 : cost;
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { baseCurrency: true, monthlyBudget: true },
    }),
    prisma.subscription.findMany({
      where: { userId: authUser.userId, status: "active" },
      select: {
        cost: true,
        currency: true,
        billingCycle: true,
        trialEndsOn: true,
        nextPayment: true,
      },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);

  // Count trials expiring within 7 days
  const trialsExpiringSoon = subscriptions.filter((s) => {
    if (!s.trialEndsOn) return false;
    const trialEnd = startOfDay(new Date(s.trialEndsOn));
    return trialEnd >= today && trialEnd <= in7Days;
  }).length;

  // Calculate monthly total in baseCurrency
  let monthlyTotal = 0;
  for (const sub of subscriptions) {
    const monthly = monthlyAmount(Number(sub.cost), sub.billingCycle);
    const converted = await convertAmount(monthly, sub.currency, user.baseCurrency);
    monthlyTotal += converted;
  }

  const annualTotal = monthlyTotal * 12;
  const budgetUsedPercent = user.monthlyBudget
    ? (monthlyTotal / Number(user.monthlyBudget)) * 100
    : null;

  return NextResponse.json({
    monthly_total: Math.round(monthlyTotal * 100) / 100,
    annual_total: Math.round(annualTotal * 100) / 100,
    active_subscriptions: subscriptions.length,
    budget_used_percent: budgetUsedPercent !== null
      ? Math.round(budgetUsedPercent * 10) / 10
      : null,
    trials_expiring_soon: trialsExpiringSoon,
  });
}
