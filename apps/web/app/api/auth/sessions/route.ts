import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.sessionLog.findMany({
    where: { userId: user.userId },
    orderBy: { issuedAt: "desc" },
    take: 5,
    select: { id: true, issuedAt: true, ipAddress: true, userAgent: true },
  });

  const sessionsWithCurrent = sessions.map((s: any) => ({
    ...s,
    isCurrentDevice: s.id === user.sessionId
  }));

  return NextResponse.json({ sessions: sessionsWithCurrent });
}
