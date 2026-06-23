import { NextRequest, NextResponse } from "next/server";
import { addMonths, addYears, startOfDay, isAfter } from "date-fns";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (subscription.userId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = startOfDay(new Date());
  const nextPayment = startOfDay(new Date(subscription.nextPayment));

  // Only allow marking as paid if nextPayment is today or in the past
  if (isAfter(nextPayment, today)) {
    return NextResponse.json(
      { error: "Payment is not due yet" },
      { status: 400 }
    );
  }

  // Advance nextPayment date
  const newNextPayment =
    subscription.billingCycle === "yearly"
      ? addYears(new Date(subscription.nextPayment), 1)
      : addMonths(new Date(subscription.nextPayment), 1);

  // Create payment history record
  await prisma.paymentHistory.create({
    data: {
      subscriptionId: subscription.id,
      userId: authUser.userId,
      amount: subscription.cost,
      currency: subscription.currency,
    },
  });

  // Update subscription's next payment date
  const updated = await prisma.subscription.update({
    where: { id },
    data: { nextPayment: newNextPayment },
  });

  return NextResponse.json({ subscription: updated });
}
