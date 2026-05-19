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

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.userId, status: "active" },
    select: { name: true, cost: true, currency: true, nextPayment: true, billingCycle: true },
  });

  let nextMonthTotal = 0;
  let billingCount = 0;
  let largestUpcoming: any = null;

  const today = new Date();
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);

  for (const sub of subscriptions) {
    const paymentDate = new Date(sub.nextPayment);
    if (paymentDate >= today && paymentDate <= next30Days) {
      billingCount++;
      const costNum = Number(sub.cost);
      // For forecast, we use the exact amount being billed
      let amount = costNum;
      
      const converted = await convertAmount(amount, sub.currency, dbUser.baseCurrency);
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

  return NextResponse.json({
    next_month_total: nextMonthTotal,
    billing_count: billingCount,
    largest_upcoming: largestUpcoming,
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
