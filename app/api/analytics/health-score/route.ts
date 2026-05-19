import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { convertAmount } from "@/lib/currency";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.userId },
      select: { monthlyBudget: true, baseCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: user.userId, status: { in: ["active", "paused"] } },
      select: { id: true, cost: true, currency: true, status: true, nextPayment: true, trialEndsOn: true, worthItRating: true, billingCycle: true },
    })
  ]);

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let score = 100;
  const deductions = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let overdueCount = 0;
  let pausedCount = 0;
  let lowRatedCount = 0;
  let expiringTrialsCount = 0;
  let monthlyTotal = 0;

  const trialWarnDate = new Date();
  trialWarnDate.setDate(today.getDate() + 3);

  for (const sub of subscriptions) {
    if (sub.status === "paused") {
      pausedCount++;
    } else if (sub.status === "active") {
      const nextPayment = new Date(sub.nextPayment);
      nextPayment.setHours(0, 0, 0, 0);
      if (nextPayment < today) {
        overdueCount++;
      }

      if (sub.trialEndsOn) {
        const trialEnd = new Date(sub.trialEndsOn);
        if (trialEnd >= today && trialEnd <= trialWarnDate) {
          expiringTrialsCount++;
        }
      }

      let mCost = Number(sub.cost);
      if (sub.billingCycle === "yearly") mCost = mCost / 12;
      monthlyTotal += await convertAmount(mCost, sub.currency, dbUser.baseCurrency);
    }

    if (sub.worthItRating && sub.worthItRating <= 2) {
      lowRatedCount++;
    }
  }

  // Deductions
  if (overdueCount > 0) {
    const pts = Math.min(overdueCount * 10, 30);
    score -= pts;
    deductions.push({ reason: `${overdueCount} overdue subscription${overdueCount > 1 ? 's' : ''}`, points: -pts });
  }

  if (pausedCount > 0) {
    const pts = Math.min(pausedCount * 3, 9);
    score -= pts;
    deductions.push({ reason: `${pausedCount} paused subscription${pausedCount > 1 ? 's' : ''}`, points: -pts });
  }

  if (lowRatedCount > 0) {
    const pts = Math.min(lowRatedCount * 5, 15);
    score -= pts;
    deductions.push({ reason: `${lowRatedCount} low-rated subscription${lowRatedCount > 1 ? 's' : ''}`, points: -pts });
  }

  if (expiringTrialsCount > 0) {
    const pts = Math.min(expiringTrialsCount * 5, 15);
    score -= pts;
    deductions.push({ reason: `${expiringTrialsCount} trial${expiringTrialsCount > 1 ? 's' : ''} expiring soon`, points: -pts });
  }

  if (dbUser.monthlyBudget) {
    const budgetNum = Number(dbUser.monthlyBudget);
    const pct = (monthlyTotal / budgetNum) * 100;
    if (pct > 90) {
      score -= 20;
      deductions.push({ reason: `Budget at ${pct.toFixed(0)}%`, points: -20 });
    } else if (pct >= 75) {
      score -= 10;
      deductions.push({ reason: `Budget at ${pct.toFixed(0)}%`, points: -10 });
    }
  } else {
    score -= 5;
    deductions.push({ reason: `No monthly budget set`, points: -5 });
  }

  score = Math.max(0, Math.min(100, score));

  let grade = "Needs Attention";
  if (score >= 90) grade = "Excellent";
  else if (score >= 75) grade = "Good";
  else if (score >= 50) grade = "Fair";

  return NextResponse.json({
    score,
    grade,
    deductions,
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
