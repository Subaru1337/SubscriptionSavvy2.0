import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const where: Record<string, unknown> = { userId: authUser.userId };
  if (statusFilter !== "all") where.status = "active";

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { nextPayment: "asc" },
  });

  const rows = subscriptions.map((sub) => ({
    Name: sub.name,
    Category: sub.category,
    Cost: Number(sub.cost).toFixed(2),
    Currency: sub.currency,
    "Billing Cycle": sub.billingCycle,
    "Next Payment": format(new Date(sub.nextPayment), "yyyy-MM-dd"),
    Status: sub.status,
    Notes: sub.notes || "",
  }));

  const csv = stringify(rows, { header: true });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="subscriptions-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
