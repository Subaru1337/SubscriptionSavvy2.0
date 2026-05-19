import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { convertAmount } from '@/lib/currency';
import { addDays, startOfDay, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

function monthlyAmount(cost: number, billingCycle: string): number {
  return billingCycle === "yearly" ? cost / 12 : cost;
}

async function getSummary(userId: string) {
  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true, monthlyBudget: true },
    }),
    prisma.subscription.findMany({
      where: { userId, status: 'active' },
      select: {
        cost: true,
        currency: true,
        billingCycle: true,
        trialEndsOn: true,
        nextPayment: true,
      },
    }),
  ]);

  if (!user) throw new Error("User not found");

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);

  const trialsExpiringSoon = subscriptions.filter((s) => {
    if (!s.trialEndsOn) return false;
    const trialEnd = startOfDay(new Date(s.trialEndsOn));
    return trialEnd >= today && trialEnd <= in7Days;
  }).length;

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

  return {
    monthly_total: Math.round(monthlyTotal * 100) / 100,
    annual_total: Math.round(annualTotal * 100) / 100,
    active_subscriptions: subscriptions.length,
    budget_used_percent: budgetUsedPercent !== null
      ? Math.round(budgetUsedPercent * 10) / 10
      : null,
    trials_expiring_soon: trialsExpiringSoon,
  };
}

async function getCategoryBreakdown(userId: string) {
  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId, status: 'active' },
      select: { category: true, cost: true, billingCycle: true, currency: true },
    }),
  ]);

  if (!user) throw new Error("User not found");

  const categoryMap = new Map<string, { count: number; monthly_total: number }>();

  for (const sub of subscriptions) {
    const monthly = sub.billingCycle === "yearly"
      ? Number(sub.cost) / 12
      : Number(sub.cost);
    const converted = await convertAmount(monthly, sub.currency, user.baseCurrency);

    const existing = categoryMap.get(sub.category);
    if (existing) {
      existing.count++;
      existing.monthly_total += converted;
    } else {
      categoryMap.set(sub.category, { count: 1, monthly_total: converted });
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      monthly_total: Math.round(data.monthly_total * 100) / 100,
    }))
    .sort((a, b) => b.monthly_total - a.monthly_total);
}

async function getTrends(userId: string) {
  const [user, allPayments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    }),
    prisma.paymentHistory.findMany({
      where: { userId },
      select: { amount: true, currency: true, paidAt: true },
    }),
  ]);

  if (!user) throw new Error("User not found");

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      key: format(date, "yyyy-MM"),
      label: format(date, "MMM yyyy"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const results = [];

  for (const month of months) {
    const payments = allPayments.filter(p => p.paidAt >= month.start && p.paidAt <= month.end);

    let total = 0;
    for (const payment of payments) {
      const converted = await convertAmount(
        Number(payment.amount),
        payment.currency,
        user.baseCurrency
      );
      total += converted;
    }

    results.push({
      month: month.key,
      label: month.label,
      total: Math.round(total * 100) / 100,
    });
  }

  return results;
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [summary, breakdown, trends] = await Promise.all([
      getSummary(authUser.userId),
      getCategoryBreakdown(authUser.userId),
      getTrends(authUser.userId),
    ]);

    return NextResponse.json(
      { summary, breakdown, trends },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error("Analytics all error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
