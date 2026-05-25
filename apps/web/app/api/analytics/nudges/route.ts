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

  const lowRatedSubs = await prisma.subscription.findMany({
    where: { 
      userId: user.userId, 
      status: "active",
      worthItRating: { lte: 2, not: null }
    },
    include: { paymentHistory: true }
  });

  const nudges = [];

  for (const sub of lowRatedSubs) {
    if (sub.paymentHistory.length >= 3) {
      let totalSpent = 0;
      for (const p of sub.paymentHistory) {
        totalSpent += await convertAmount(Number(p.amount), p.currency, dbUser.baseCurrency);
      }
      
      let mCost = Number(sub.cost);
      if (sub.billingCycle === "yearly") mCost = mCost / 12;
      const monthlyCost = await convertAmount(mCost, sub.currency, dbUser.baseCurrency);

      nudges.push({
        id: sub.id,
        name: sub.name,
        worthItRating: sub.worthItRating,
        timesRenewed: sub.paymentHistory.length,
        totalSpent,
        currency: dbUser.baseCurrency,
        monthlyCost
      });
    }
  }

  return NextResponse.json({
    nudges,
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
