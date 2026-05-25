import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/currency";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const [user, allPayments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { baseCurrency: true },
    }),
    prisma.paymentHistory.findMany({
      where: {
        userId: authUser.userId,
        paidAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, currency: true, paidAt: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Build 6-month range
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

  return NextResponse.json(results);
}
