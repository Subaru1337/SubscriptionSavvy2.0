import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRates } from '@/lib/currency';
import { addDays, startOfDay, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

function monthlyAmount(cost: number, billingCycle: string): number {
  return billingCycle === "yearly" ? cost / 12 : cost;
}

function getSummary(
  user: any,
  subscriptions: any[],
  rates: Record<string, number>
) {
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
    const rate = rates[sub.currency] || 1;
    const converted = monthly / rate;
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

function getCategoryBreakdown(
  user: any,
  subscriptions: any[],
  rates: Record<string, number>,
  budgets: any[]
) {
  const categoryMap = new Map<string, { count: number; monthly_total: number; budget_limit: number | null }>();

  for (const b of budgets) {
    categoryMap.set(b.category, { count: 0, monthly_total: 0, budget_limit: Number(b.limit) });
  }

  for (const sub of subscriptions) {
    const monthly = sub.billingCycle === "yearly"
      ? Number(sub.cost) / 12
      : Number(sub.cost);
    const rate = rates[sub.currency] || 1;
    const converted = monthly / rate;

    const existing = categoryMap.get(sub.category);
    if (existing) {
      existing.count++;
      existing.monthly_total += converted;
    } else {
      categoryMap.set(sub.category, { count: 1, monthly_total: converted, budget_limit: null });
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => {
      let budget_used_percent = null;
      let over_budget = false;
      if (data.budget_limit) {
        budget_used_percent = (data.monthly_total / data.budget_limit) * 100;
        over_budget = budget_used_percent > 100;
      }
      return {
        category,
        count: data.count,
        monthly_total: Math.round(data.monthly_total * 100) / 100,
        budget_limit: data.budget_limit,
        budget_used_percent,
        over_budget,
      };
    })
    .sort((a, b) => b.monthly_total - a.monthly_total);
}

function getTrends(
  user: any,
  allPayments: any[],
  rates: Record<string, number>
) {
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
    const payments = allPayments.filter((p: any) => p.paidAt >= month.start && p.paidAt <= month.end);

    let total = 0;
    for (const payment of payments) {
      const rate = rates[payment.currency] || 1;
      const converted = Number(payment.amount) / rate;
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
    const [user, subscriptions, paymentHistory, categoryBudgets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { baseCurrency: true, monthlyBudget: true },
      }),
      prisma.subscription.findMany({
        where: { userId: authUser.userId, status: 'active' },
        select: {
          category: true,
          cost: true,
          billingCycle: true,
          currency: true,
          trialEndsOn: true,
          nextPayment: true,
        },
      }),
      prisma.paymentHistory.findMany({
        where: { userId: authUser.userId },
        select: { amount: true, currency: true, paidAt: true },
      }),
      prisma.categoryBudget.findMany({
        where: { userId: authUser.userId },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rates = await getRates(user.baseCurrency);

    const summary = getSummary(user, subscriptions, rates);
    const breakdown = getCategoryBreakdown(user, subscriptions, rates, categoryBudgets);
    const trends = getTrends(user, paymentHistory, rates);

    return NextResponse.json(
      { summary, breakdown, trends, baseCurrency: user.baseCurrency },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error("Analytics all error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
