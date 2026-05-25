import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { convertAmount } from "@/lib/currency";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { baseCurrency: true },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  const payments = await prisma.paymentHistory.findMany({
    where: { 
      userId: user.userId,
      paidAt: { gte: startOfYear, lte: endOfYear }
    },
    include: { subscription: { select: { name: true, category: true } } },
  });

  let yearTotal = 0;
  const categoryTotals: Record<string, number> = {};
  const subTotals: Record<string, number> = {};
  const subNames: Record<string, string> = {};

  for (const p of payments) {
    const converted = await convertAmount(Number(p.amount), p.currency, dbUser.baseCurrency);
    yearTotal += converted;
    
    const cat = p.subscription.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + converted;
    
    const subId = p.subscriptionId;
    subTotals[subId] = (subTotals[subId] || 0) + converted;
    subNames[subId] = p.subscription.name;
  }

  let topCategory = "None";
  let maxCatTotal = 0;
  for (const [cat, val] of Object.entries(categoryTotals)) {
    if (val > maxCatTotal) {
      maxCatTotal = val;
      topCategory = cat;
    }
  }

  let mostExpensiveSub = null;
  let maxSubTotal = 0;
  for (const [subId, val] of Object.entries(subTotals)) {
    if (val > maxSubTotal) {
      maxSubTotal = val;
      mostExpensiveSub = {
        name: subNames[subId],
        total_paid: val
      };
    }
  }

  // Calculate elapsed months for average
  const now = new Date();
  const monthsElapsed = now.getFullYear() > currentYear ? 12 : now.getMonth() + 1;
  const avgMonthly = yearTotal / monthsElapsed;

  return NextResponse.json({
    year: currentYear,
    year_total: yearTotal,
    payment_count: payments.length,
    top_category: topCategory,
    most_expensive_sub: mostExpensiveSub,
    avg_monthly: avgMonthly,
    months_elapsed: monthsElapsed
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
