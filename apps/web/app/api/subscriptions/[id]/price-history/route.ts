import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.priceHistory.findMany({
    where: { 
      subscriptionId: id,
      userId: user.userId 
    },
    orderBy: { changedAt: "desc" },
  });

  return NextResponse.json({ history });
}
