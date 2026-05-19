import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const nameQuery = searchParams.get("name");

  if (!nameQuery || nameQuery.trim().length < 2) {
    return NextResponse.json({ isDuplicate: false });
  }

  const existing = await prisma.subscription.findFirst({
    where: { 
      userId: user.userId,
      status: "active",
      name: { equals: nameQuery.trim(), mode: "insensitive" }
    },
    select: { id: true, name: true, cost: true, currency: true },
  });

  if (existing) {
    return NextResponse.json({ isDuplicate: true, existing });
  }

  return NextResponse.json({ isDuplicate: false });
}
