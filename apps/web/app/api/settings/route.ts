import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBudgetAlertEmail } from "@/lib/email";
import { convertAmount } from "@/lib/currency";
import { startOfMonth, isSameMonth } from "date-fns";

const settingsSchema = z.object({
  baseCurrency: z
    .enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"])
    .optional(),
  monthlyBudget: z.number().positive().nullable().optional(),
  emailReminders: z.boolean().optional(),
});

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      email: true,
      baseCurrency: true,
      monthlyBudget: true,
      emailReminders: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: {
      ...(data.baseCurrency && { baseCurrency: data.baseCurrency }),
      ...(data.monthlyBudget !== undefined && {
        monthlyBudget: data.monthlyBudget,
      }),
      ...(data.emailReminders !== undefined && {
        emailReminders: data.emailReminders,
      }),
    },
    select: {
      id: true,
      email: true,
      baseCurrency: true,
      monthlyBudget: true,
      emailReminders: true,
      budgetAlertSentAt: true,
      createdAt: true,
    },
  });

  // Check budget alert trigger
  if (user.monthlyBudget && user.emailReminders) {
    await checkAndSendBudgetAlert(authUser.userId, user);
  }

  return NextResponse.json({ user });
}

async function checkAndSendBudgetAlert(
  userId: string,
  user: {
    email: string;
    baseCurrency: string;
    monthlyBudget: unknown;
    emailReminders: boolean;
    budgetAlertSentAt: Date | null;
  }
) {
  try {
    const budget = Number(user.monthlyBudget);
    if (!budget || !user.emailReminders) return;

    // Rate-limit: only send once per calendar month
    if (user.budgetAlertSentAt && isSameMonth(new Date(), new Date(user.budgetAlertSentAt))) {
      return;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "active" },
    });

    let monthlyTotal = 0;
    for (const sub of subscriptions) {
      const monthly = sub.billingCycle === "yearly" ? Number(sub.cost) / 12 : Number(sub.cost);
      const converted = await convertAmount(monthly, sub.currency, user.baseCurrency);
      monthlyTotal += converted;
    }

    const percent = (monthlyTotal / budget) * 100;
    if (percent >= 90) {
      await sendBudgetAlertEmail(user.email, monthlyTotal, budget, user.baseCurrency);
      await prisma.user.update({
        where: { id: userId },
        data: { budgetAlertSentAt: new Date() },
      });
    }
  } catch (err) {
    console.error("Budget alert check failed:", err);
  }
}
