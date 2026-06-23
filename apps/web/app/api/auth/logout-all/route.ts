import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthUser, COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.userId },
      data: { lastLogoutAt: new Date() },
    }),
    prisma.sessionLog.deleteMany({
      where: { userId: user.userId },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ success: true });
}
