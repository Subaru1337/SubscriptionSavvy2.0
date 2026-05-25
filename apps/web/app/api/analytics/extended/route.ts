import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getRates } from "@/lib/currency";
import { startOfDay, addDays } from "date-fns";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser, allSubscriptions, paymentHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.userId },
      select: { monthlyBudget: true, baseCurrency: true },
    }),
    prisma.subscription.findMany({
      where: { userId: user.userId },
    }),
    prisma.paymentHistory.findMany({
      where: { userId: user.userId },
      include: { subscription: { select: { name: true, category: true } } },
    }),
  ]);

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rates = await getRates(dbUser.baseCurrency);

  const activeSubs = allSubscriptions.filter(s => s.status === "active");
  const pausedSubs = allSubscriptions.filter(s => s.status === "paused");
  const cancelledSubs = allSubscriptions.filter(s => s.status === "cancelled" && s.cancelledAt);

  const today = startOfDay(new Date());
  const next30Days = addDays(today, 30);
  const trialWarnDate = addDays(today, 3);

  // --- FORECAST ---
  let nextMonthTotal = 0;
  let billingCount = 0;
  let largestUpcoming: any = null;

  for (const sub of activeSubs) {
    const paymentDate = startOfDay(new Date(sub.nextPayment));
    if (paymentDate >= today && paymentDate <= next30Days) {
      billingCount++;
      const costNum = Number(sub.cost);
      const rate = rates[sub.currency] || 1;
      const converted = costNum / rate;
      nextMonthTotal += converted;

      if (!largestUpcoming || converted > largestUpcoming.convertedAmount) {
        largestUpcoming = {
          name: sub.name,
          amount: costNum,
          currency: sub.currency,
          nextPayment: sub.nextPayment.toISOString().split("T")[0],
          convertedAmount: converted,
        };
      }
    }
  }
  if (largestUpcoming) delete largestUpcoming.convertedAmount;

  // --- SAVINGS ---
  let totalSaved = 0;
  const saversList = [];
  for (const sub of cancelledSubs) {
    const diffTime = today.getTime() - new Date(sub.cancelledAt!).getTime();
    // Count the immediate upcoming month that was avoided + any subsequent months
    const monthsPassed = Math.floor(Math.max(0, diffTime) / (1000 * 60 * 60 * 24 * 30.44)) + 1;
    if (monthsPassed > 0) {
      let monthlyCost = Number(sub.cost);
      if (sub.billingCycle === "yearly") monthlyCost /= 12;
      const savedOriginal = monthlyCost * monthsPassed;
      if (savedOriginal > 0) {
        const rate = rates[sub.currency] || 1;
        const converted = savedOriginal / rate;
        totalSaved += converted;
        saversList.push({ name: sub.name, saved: converted, months: monthsPassed });
      }
    }
  }
  saversList.sort((a, b) => b.saved - a.saved);
  const topSavers = saversList.slice(0, 3);

  // --- HEALTH SCORE ---
  let score = 100;
  const deductions = [];
  let overdueCount = 0;
  let expiringTrialsCount = 0;
  let monthlyTotal = 0;
  let lowRatedCount = 0;

  for (const sub of [...activeSubs, ...pausedSubs]) {
    if (sub.status === "active") {
      const nextPayment = startOfDay(new Date(sub.nextPayment));
      if (nextPayment < today) overdueCount++;
      
      if (sub.trialEndsOn) {
        const trialEnd = startOfDay(new Date(sub.trialEndsOn));
        if (trialEnd >= today && trialEnd <= trialWarnDate) expiringTrialsCount++;
      }

      let mCost = Number(sub.cost);
      if (sub.billingCycle === "yearly") mCost /= 12;
      const rate = rates[sub.currency] || 1;
      monthlyTotal += mCost / rate;
    }
    if (sub.worthItRating && sub.worthItRating <= 2) lowRatedCount++;
  }

  if (overdueCount > 0) {
    const pts = Math.min(overdueCount * 10, 30);
    score -= pts;
    deductions.push({ reason: `${overdueCount} overdue subscription${overdueCount > 1 ? 's' : ''}`, points: -pts });
  }
  if (pausedSubs.length > 0) {
    const pts = Math.min(pausedSubs.length * 3, 9);
    score -= pts;
    deductions.push({ reason: `${pausedSubs.length} paused subscription${pausedSubs.length > 1 ? 's' : ''}`, points: -pts });
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
    const pct = (monthlyTotal / Number(dbUser.monthlyBudget)) * 100;
    if (pct > 90) { score -= 20; deductions.push({ reason: `Budget at ${pct.toFixed(0)}%`, points: -20 }); }
    else if (pct >= 75) { score -= 10; deductions.push({ reason: `Budget at ${pct.toFixed(0)}%`, points: -10 }); }
  } else {
    score -= 5; deductions.push({ reason: `No monthly budget set`, points: -5 });
  }

  score = Math.max(0, Math.min(100, score));
  let grade = "Needs Attention";
  if (score >= 90) grade = "Excellent";
  else if (score >= 75) grade = "Good";
  else if (score >= 50) grade = "Fair";

  const healthScore = { score, grade, deductions };



  // --- ANNUAL RECAP ---
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);
  
  const currentYearPayments = paymentHistory.filter(p => p.paidAt >= startOfYear && p.paidAt <= endOfYear);
  let yearTotal = 0;
  const categoryTotals: Record<string, number> = {};
  const subTotals: Record<string, number> = {};
  const subNames: Record<string, string> = {};

  for (const p of currentYearPayments) {
    const rate = rates[p.currency] || 1;
    const converted = Number(p.amount) / rate;
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
    if (val > maxCatTotal) { maxCatTotal = val; topCategory = cat; }
  }

  let mostExpensiveSub = null;
  let maxSubTotal = 0;
  for (const [subId, val] of Object.entries(subTotals)) {
    if (val > maxSubTotal) {
      maxSubTotal = val;
      mostExpensiveSub = { name: subNames[subId], total_paid: val };
    }
  }

  const monthsElapsed = today.getFullYear() > currentYear ? 12 : today.getMonth() + 1;
  const annualRecap = {
    year: currentYear,
    year_total: yearTotal,
    payment_count: currentYearPayments.length,
    top_category: topCategory,
    most_expensive_sub: mostExpensiveSub,
    avg_monthly: yearTotal / monthsElapsed,
    months_elapsed: monthsElapsed
  };

  // --- NUDGES ---
  const nudges = [];
  for (const sub of activeSubs) {
    if (sub.worthItRating && sub.worthItRating <= 2) {
      const subPayments = paymentHistory.filter(p => p.subscriptionId === sub.id);
      if (subPayments.length >= 3) {
        let totalSpent = 0;
        for (const p of subPayments) {
          const pRate = rates[p.currency] || 1;
          totalSpent += Number(p.amount) / pRate;
        }
        let mCost = Number(sub.cost);
        if (sub.billingCycle === "yearly") mCost /= 12;
        const sRate = rates[sub.currency] || 1;
        const monthlyCost = mCost / sRate;

        nudges.push({
          id: sub.id,
          name: sub.name,
          worthItRating: sub.worthItRating,
          timesRenewed: subPayments.length,
          totalSpent,
          currency: dbUser.baseCurrency,
          monthlyCost
        });
      }
    }
  }

  return NextResponse.json({
    forecast: { next_month_total: nextMonthTotal, billing_count: billingCount, largest_upcoming: largestUpcoming },
    savings: { total_saved: totalSaved, cancelled_count: cancelledSubs.length, top_savers: topSavers },
    healthScore,
    annualRecap,
    nudges,
  }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
