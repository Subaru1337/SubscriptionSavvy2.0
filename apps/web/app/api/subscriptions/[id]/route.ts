import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cost: z.number().positive().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"]).optional(),
  category: z
    .enum([
      "Entertainment",
      "Productivity",
      "Health",
      "Education",
      "Finance",
      "Shopping",
      "Developer Tools",
      "Other",
    ])
    .optional(),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  nextPayment: z.string().optional(),
  trialEndsOn: z.string().nullable().optional(),
  status: z.enum(["active", "cancelled", "paused"]).optional(),
  notes: z.string().max(500).nullable().optional(),
  worthItRating: z.number().int().min(1).max(5).optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (subscription.userId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  
  // Track price history and cancellation
  const isCostChanged = data.cost !== undefined && data.cost !== Number(subscription.cost);
  const isCancelled = data.status === "cancelled" && subscription.status !== "cancelled" && !subscription.cancelledAt;

  const updateData: any = {
    ...data,
    nextPayment: data.nextPayment ? new Date(data.nextPayment) : undefined,
    trialEndsOn: data.trialEndsOn !== undefined
      ? data.trialEndsOn ? new Date(data.trialEndsOn) : null
      : undefined,
  };

  if (isCancelled) {
    updateData.cancelledAt = new Date();
  }

  let updated;

  if (isCostChanged) {
    // Wrap in transaction to record price history
    updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id: params.id },
        data: updateData,
      });

      await tx.priceHistory.create({
        data: {
          subscriptionId: sub.id,
          userId: authUser.userId,
          oldCost: subscription.cost,
          newCost: data.cost!,
          currency: subscription.currency,
        },
      });

      return sub;
    });
  } else {
    // Normal update
    updated = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
    });
  }

  return NextResponse.json({ subscription: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (subscription.userId !== authUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Hard delete — cascades PaymentHistory via Prisma schema
  await prisma.subscription.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
