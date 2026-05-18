import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/currency";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { baseCurrency: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: authUser.userId, status: "active" },
  });

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
    .map(([category, data]) => ({
      category,
      count: data.count,
      monthly_total: Math.round(data.monthly_total * 100) / 100,
    }))
    .sort((a, b) => b.monthly_total - a.monthly_total);

  return NextResponse.json(breakdown);
}
