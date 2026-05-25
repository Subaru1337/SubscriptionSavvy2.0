import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lowRated = await prisma.subscription.findMany({
    where: { 
      userId: user.userId, 
      status: "active",
      worthItRating: { lte: 2, not: null }
    },
    select: { id: true, name: true, cost: true, currency: true, worthItRating: true },
  });

  return NextResponse.json({
    low_rated: lowRated,
  }, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
