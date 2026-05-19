import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const budgetSchema = z.object({
  category: z.string().min(1),
  limit: z.number().positive(),
  currency: z.string().length(3),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budgets = await prisma.categoryBudget.findMany({
    where: { userId: user.userId },
  });

  return NextResponse.json({ budgets });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;

  const upserted = await prisma.categoryBudget.upsert({
    where: {
      userId_category: { userId: user.userId, category: data.category },
    },
    update: {
      limit: data.limit,
      currency: data.currency,
    },
    create: {
      userId: user.userId,
      category: data.category,
      limit: data.limit,
      currency: data.currency,
    },
  });

  return NextResponse.json({ budget: upserted });
}
