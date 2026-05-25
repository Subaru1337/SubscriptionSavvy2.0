import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/currency";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, subscriptions, budgets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { baseCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: authUser.userId, status: "active" },
      select: { category: true, cost: true, billingCycle: true, currency: true },
    }),
    prisma.categoryBudget.findMany({
      where: { userId: authUser.userId },
    })
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const budgetMap = new Map<string, number>();
  for (const b of budgets) {
    const limitConverted = await convertAmount(Number(b.limit), b.currency, user.baseCurrency);
    budgetMap.set(b.category, limitConverted);
  }

  // Group by category and sum monthly totals
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

  const breakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => {
      const budget_limit = budgetMap.get(category) || null;
      const budget_used_percent = budget_limit ? (data.monthly_total / budget_limit) * 100 : null;
      
      return {
        category,
        count: data.count,
        monthly_total: Math.round(data.monthly_total * 100) / 100,
        budget_limit: budget_limit ? Math.round(budget_limit * 100) / 100 : null,
        budget_used_percent: budget_used_percent ? Math.round(budget_used_percent * 100) / 100 : null,
        over_budget: budget_used_percent ? budget_used_percent > 100 : false,
      };
    })
    .sort((a, b) => b.monthly_total - a.monthly_total);

  return NextResponse.json(breakdown);
}
