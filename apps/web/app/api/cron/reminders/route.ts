import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminderEmail, sendTrialExpiryEmail } from "@/lib/email";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const in3Days = addDays(today, 3);
  const in3DaysEnd = endOfDay(in3Days);
  const in3DaysStart = startOfDay(in3Days);

  let paymentsSent = 0;
  let trialsSent = 0;
  const errors: string[] = [];

  try {
    // Payment reminders: subscriptions due in exactly 3 days
    const upcomingPayments = await prisma.subscription.findMany({
      where: {
        status: "active",
        nextPayment: {
          gte: in3DaysStart,
          lte: in3DaysEnd,
        },
        user: { emailReminders: true },
      },
      include: { user: { select: { email: true, emailReminders: true } } },
    });

    for (const sub of upcomingPayments) {
      try {
        await sendPaymentReminderEmail(
          sub.user.email,
          sub.name,
          Number(sub.cost),
          sub.currency,
          new Date(sub.nextPayment)
        );
        paymentsSent++;
      } catch (err) {
        errors.push(`Payment reminder for ${sub.name}: ${String(err)}`);
      }
    }

    // Trial expiry reminders: trials ending in exactly 3 days
    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: "active",
        trialEndsOn: {
          gte: in3DaysStart,
          lte: in3DaysEnd,
        },
        user: { emailReminders: true },
      },
      include: { user: { select: { email: true } } },
    });

    for (const sub of expiringTrials) {
      try {
        await sendTrialExpiryEmail(
          sub.user.email,
          sub.name,
          new Date(sub.trialEndsOn!)
        );
        trialsSent++;
      } catch (err) {
        errors.push(`Trial reminder for ${sub.name}: ${String(err)}`);
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Cron job failed", details: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    paymentsSent,
    trialsSent,
    errors,
  });
}
