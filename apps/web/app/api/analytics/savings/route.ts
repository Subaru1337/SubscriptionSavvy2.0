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

  const cancelledSubs = await prisma.subscription.findMany({
    where: { 
      userId: user.userId, 
      status: "cancelled",
      cancelledAt: { not: null }
    },
    select: { name: true, cost: true, currency: true, billingCycle: true, cancelledAt: true },
  });

  let totalSaved = 0;
  const saversList = [];

  const now = new Date();

  for (const sub of cancelledSubs) {
    if (!sub.cancelledAt) continue;
    
    // Calculate difference in months manually since we can't use date-fns if not installed for backend
    const diffTime = now.getTime() - new Date(sub.cancelledAt).getTime();
    const monthsPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));

    if (monthsPassed >= 0) {
      let monthlyCost = Number(sub.cost);
      if (sub.billingCycle === "yearly") {
        monthlyCost = monthlyCost / 12;
      }

      const savedOriginal = monthlyCost * monthsPassed;
      if (savedOriginal > 0) {
        const converted = await convertAmount(savedOriginal, sub.currency, dbUser.baseCurrency);
        totalSaved += converted;

        saversList.push({
          name: sub.name,
          saved: converted,
          months: monthsPassed
        });
      }
    }
  }

  // Sort and get top 3
  saversList.sort((a, b) => b.saved - a.saved);
  const topSavers = saversList.slice(0, 3);

  return NextResponse.json({
    total_saved: totalSaved,
    cancelled_count: cancelledSubs.length,
    top_savers: topSavers,
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
