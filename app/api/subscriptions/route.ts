import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  cost: z.number().positive("Cost must be positive"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"]),
  category: z.enum([
    "Entertainment",
    "Productivity",
    "Health",
    "Education",
    "Finance",
    "Shopping",
    "Developer Tools",
    "Other",
  ]),
  billingCycle: z.enum(["monthly", "yearly"]),
  nextPayment: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  trialEndsOn: z.string().optional().nullable(),
  status: z.enum(["active", "cancelled", "paused"]).default("active"),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const where: Record<string, unknown> = { userId: authUser.userId };
  if (statusFilter !== "all") {
    where.status = "active";
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { nextPayment: "asc" },
    include: { priceHistory: { orderBy: { changedAt: "desc" } } },
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: authUser.userId,
      name: { equals: data.name, mode: "insensitive" },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Duplicate subscription", existing }, { status: 409 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: authUser.userId, // Always from JWT, never from body
      name: data.name,
      cost: data.cost,
      currency: data.currency,
      category: data.category,
      billingCycle: data.billingCycle,
      nextPayment: new Date(data.nextPayment),
      trialEndsOn: data.trialEndsOn ? new Date(data.trialEndsOn) : null,
      status: data.status,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json({ subscription }, { status: 201 });
}
